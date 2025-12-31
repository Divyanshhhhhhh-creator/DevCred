import { NextRequest, NextResponse } from 'next/server';
import { exchangeGitHubCode, fetchGitHubUserStats } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  // ----- PREVENT DOUBLE CALLBACK -----
  const usedCode = request.cookies.get("github_code_used")?.value;
  if (usedCode === code) {
    // Prevent second attempt (HEAD or duplicate GET)
    return NextResponse.redirect(new URL('/', request.url));
  }
  // ------------------------------------

  try {
    const accessToken = await exchangeGitHubCode(code);
    
    console.log('✅ Got access token, fetching user stats...');
    const userStats = await fetchGitHubUserStats(accessToken);
    
    console.log('✅ Got user stats:', {
      username: userStats.user.login,
      repos: userStats.repos.length,
      orgs: userStats.organizations.length,
      prs: userStats.pullRequests.length,
    });

    // Create compact data for cookies (under 4KB)
    const compactUserData = {
      user: {
        login: userStats.user.login,
        name: userStats.user.name,
        avatar_url: userStats.user.avatar_url,
        bio: userStats.user.bio,
        email: userStats.user.email,
        public_repos: userStats.user.public_repos,
        followers: userStats.user.followers,
        following: userStats.user.following,
      },
      stats: {
        totalRepos: userStats.repos.length,
        totalStars: userStats.totalStars,
        totalPRsMerged: userStats.totalPRsMerged,
        organizationsCount: userStats.organizations.length,
      },
      organizations: userStats.organizations.map(org => ({
        login: org.login,
        avatar_url: org.avatar_url,
      })),
      recentPRs: userStats.pullRequests
        .filter(pr => pr.merged_at)
        .sort((a, b) => new Date(b.merged_at!).getTime() - new Date(a.merged_at!).getTime())
        .slice(0, 10)
        .map(pr => ({
          id: pr.id,
          title: pr.title,
          repo: pr.repository.full_name,
          org: pr.repository.full_name.split('/')[0],
          merged_at: pr.merged_at,
          html_url: pr.html_url,
        })),
      topRepos: userStats.repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          stargazers_count: repo.stargazers_count,
          language: repo.language,
          html_url: repo.html_url,
        })),
      prsByOrganization: userStats.prsByOrganization,
    };

    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('trigger_rep', userStats.user.login);
    
    const response = NextResponse.redirect(redirectUrl);

    // Mark code as used FIRST
    response.cookies.set("github_code_used", code, {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: 'lax',
    });

    // Set access token
    response.cookies.set('github_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    // Set user data - this MUST be accessible to client
    const userDataString = JSON.stringify(compactUserData);
    console.log('Setting github_user_data cookie, length:', userDataString.length);
    
    response.cookies.set('github_user_data', userDataString, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    console.log('✅ All cookies set, redirecting...');
    return response;

  } catch (err) {
    console.error('GitHub OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('Failed to authenticate with GitHub')}`, request.url)
    );
  }
}
