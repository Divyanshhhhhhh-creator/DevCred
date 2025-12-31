import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubUserStats } from '@/lib/github';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('github_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const userStats = await fetchGitHubUserStats(accessToken);
    
    // Return the full stats with proper structure
    const response = {
      user: userStats.user,
      repos: userStats.repos,
      organizations: userStats.organizations,
      pullRequests: userStats.pullRequests,
      stats: {
        totalStars: userStats.totalStars,
        totalPRsMerged: userStats.totalPRsMerged,
        totalRepos: userStats.repos.length,
        organizationsCount: userStats.organizations.length,
      },
      totalStars: userStats.totalStars,
      totalPRsMerged: userStats.totalPRsMerged,
      prsByOrganization: userStats.prsByOrganization,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching GitHub user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
