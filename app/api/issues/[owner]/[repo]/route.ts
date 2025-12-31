import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubOrgIssues, getStakeAmountFromLabels } from '@/lib/github';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner } = await context.params;
    const accessToken = request.cookies.get('github_access_token')?.value;

    console.log(`Fetching all issues from organization: ${owner}`);
    
    // Fetch all issues from all repos in the organization
    const issues = await fetchGitHubOrgIssues(owner, accessToken);
    
    // Transform issues to match StakeIssue format
    const stakeIssues = issues.map(issue => ({
      id: `github-${issue.id}`,
      title: issue.title,
      description: issue.body || 'No description provided',
      stakeAmountRequired: getStakeAmountFromLabels(issue.labels),
      stakedBy: [],
      labels: issue.labels.map(l => l.name),
      html_url: issue.html_url,
      number: issue.number,
      repo_name: issue.repo_name,
    }));

    console.log(`Returning ${stakeIssues.length} issues`);
    return NextResponse.json(stakeIssues);
  } catch (error) {
    console.error('Error fetching GitHub issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
