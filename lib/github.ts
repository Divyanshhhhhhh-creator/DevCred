// GitHub API Integration

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  repository: {
    full_name: string;
  };
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubOrganization {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
}

export interface GitHubUserStats {
  user: GitHubUser;
  repos: GitHubRepo[];
  organizations: GitHubOrganization[];
  pullRequests: GitHubPullRequest[]; // Add full PR array
  totalStars: number;
  totalPRsMerged: number;
  prsByOrganization: {
    [orgName: string]: number;
  };
  stats: {
    totalStars: number;
    totalPRsMerged: number;
    totalRepos: number;
    organizationsCount: number;
  };
}

/**
 * Fetch GitHub user data using access token
 */
export async function fetchGitHubUser(
  accessToken: string
): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch user's repositories
 */
export async function fetchGitHubRepos(
  accessToken: string,
  username: string
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.length === 0) break;

    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Fetch user's organizations
 */
export async function fetchGitHubOrganizations(
  accessToken: string
): Promise<GitHubOrganization[]> {
  const response = await fetch("https://api.github.com/user/orgs", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch pull requests for a user across all repositories
 */
export async function fetchUserPullRequests(
  accessToken: string,
  username: string
): Promise<GitHubPullRequest[]> {
  const query = `is:pr author:${username} is:merged`;
  const prs: GitHubPullRequest[] = [];
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    // Limit to 10 pages (1000 PRs) to avoid rate limits
    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(
        query
      )}&per_page=${perPage}&page=${page}&sort=created&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    // Transform search results to include repository info
    const transformedPRs = data.items.map(
      (item: {
        id: number;
        number: number;
        title: string;
        state: string;
        created_at: string;
        closed_at: string | null;
        pull_request?: { merged_at: string | null };
        html_url: string;
        repository_url: string;
        user: { login: string; avatar_url: string };
      }) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        state: item.state,
        created_at: item.created_at,
        closed_at: item.closed_at,
        merged_at: item.pull_request?.merged_at,
        html_url: item.html_url,
        repository: {
          full_name: item.repository_url.split("/repos/")[1],
        },
        user: item.user,
      })
    );

    prs.push(...transformedPRs);
    if (data.items.length < perPage) break;
    page++;
  }

  return prs;
}

/**
 * Calculate PRs merged by organization
 */
export function calculatePRsByOrganization(prs: GitHubPullRequest[]): {
  [orgName: string]: number;
} {
  const prsByOrg: { [orgName: string]: number } = {};

  prs.forEach((pr) => {
    if (pr.repository?.full_name) {
      const orgName = pr.repository.full_name.split("/")[0];
      prsByOrg[orgName] = (prsByOrg[orgName] || 0) + 1;
    }
  });

  return prsByOrg;
}

/**
 * Fetch comprehensive GitHub user statistics
 */
export async function fetchGitHubUserStats(
  accessToken: string
): Promise<GitHubUserStats> {
  // Fetch all data in parallel
  const [user, organizations] = await Promise.all([
    fetchGitHubUser(accessToken),
    fetchGitHubOrganizations(accessToken),
  ]);

  // Fetch repos and PRs (these might take longer)
  const [repos, pullRequests] = await Promise.all([
    fetchGitHubRepos(accessToken, user.login),
    fetchUserPullRequests(accessToken, user.login),
  ]);

  // Calculate total stars
  const totalStars = repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );

  // Calculate PRs by organization
  const prsByOrganization = calculatePRsByOrganization(pullRequests);

  return {
    user,
    repos,
    organizations,
    pullRequests, // Include full PR array
    totalStars,
    totalPRsMerged: pullRequests.length,
    prsByOrganization,
    stats: {
      totalStars,
      totalPRsMerged: pullRequests.length,
      totalRepos: repos.length,
      organizationsCount: organizations.length,
    },
  };
}

/**
 * Fetch all repositories from a GitHub organization
 */
export interface GitHubOrgRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  open_issues_count: number;
}

export async function fetchGitHubOrgRepos(
  org: string,
  accessToken?: string
): Promise<GitHubOrgRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `https://api.github.com/orgs/${org}/repos?per_page=100`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch org repos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch issues from a GitHub repository
 */
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export async function fetchGitHubRepoIssues(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch issues: ${response.statusText}`);
  }

  const issues = await response.json();

  // Filter out pull requests (they come in the issues endpoint too)
  return issues.filter(
    (issue: { pull_request?: unknown }) => !issue.pull_request
  );
}

/**
 * Fetch all issues from all repositories in a GitHub organization
 */
export async function fetchGitHubOrgIssues(
  org: string,
  accessToken?: string
): Promise<Array<GitHubIssue & { repo_name: string }>> {
  try {
    // First, fetch all repos in the org
    const repos = await fetchGitHubOrgRepos(org, accessToken);

    console.log(`Found ${repos.length} repos in ${org}`);

    // Fetch issues from each repo
    const allIssues: Array<GitHubIssue & { repo_name: string }> = [];

    for (const repo of repos) {
      if (repo.open_issues_count > 0) {
        try {
          const issues = await fetchGitHubRepoIssues(
            org,
            repo.name,
            accessToken
          );
          console.log(`Found ${issues.length} issues in ${repo.name}`);

          // Add repo name to each issue
          const issuesWithRepo = issues.map((issue) => ({
            ...issue,
            repo_name: repo.name,
          }));

          allIssues.push(...issuesWithRepo);
        } catch (error) {
          console.error(`Failed to fetch issues from ${repo.name}:`, error);
          // Continue with other repos
        }
      }
    }

    console.log(`Total issues found: ${allIssues.length}`);
    return allIssues;
  } catch (error) {
    console.error(`Error fetching org issues:`, error);
    throw error;
  }
}

/**
 * Determine stake amount based on issue labels
 */
export function getStakeAmountFromLabels(
  labels: Array<{ name: string }>
): number {
  const labelNames = labels.map((l) => l.name.toLowerCase());

  if (
    labelNames.some(
      (name) =>
        name.includes("good first issue") || name.includes("good-first-issue")
    )
  ) {
    return 10;
  }
  if (
    labelNames.some(
      (name) => name.includes("medium") || name.includes("intermediate")
    )
  ) {
    return 50;
  }
  if (
    labelNames.some(
      (name) =>
        name.includes("hard") ||
        name.includes("difficult") ||
        name.includes("advanced")
    )
  ) {
    return 100;
  }

  // Default for unlabeled or other labels
  return 25;
}

/**
 * Exchange GitHub OAuth code for access token
 */
export async function exchangeGitHubCode(code: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  console.log("OAuth Exchange Debug:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length,
    clientSecretLength: clientSecret?.length,
    codeLength: code?.length,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.statusText}`);
  }

  const data = await response.json();

  console.log("GitHub OAuth Response:", data);

  if (data.error) {
    throw new Error(
      `GitHub OAuth error: ${data.error_description || data.error}`
    );
  }

  return data.access_token;
}
