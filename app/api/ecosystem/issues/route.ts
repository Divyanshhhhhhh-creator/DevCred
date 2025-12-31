import { NextRequest, NextResponse } from "next/server";

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("github_access_token")?.value;
  const { searchParams } = new URL(request.url);
  const org = searchParams.get("org");
  const repo = searchParams.get("repo");

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!org) {
    return NextResponse.json(
      { error: "Organization name required" },
      { status: 400 }
    );
  }

  try {
    let issues: GitHubIssue[] = [];

    if (repo) {
      // Fetch issues from specific repo
      const response = await fetch(
        `https://api.github.com/repos/${org}/${repo}/issues?state=open&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API error:", errorText);
        throw new Error(`GitHub API error: ${response.status}`);
      }

      issues = await response.json();
    } else {
      // Fetch issues from all repos in org
      const reposResponse = await fetch(
        `https://api.github.com/orgs/${org}/repos?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!reposResponse.ok) {
        // Try as user repos if org fails
        const userReposResponse = await fetch(
          `https://api.github.com/users/${org}/repos?per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!userReposResponse.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const repos = await userReposResponse.json();
        for (const repo of repos.slice(0, 10)) {
          const issuesResponse = await fetch(
            `https://api.github.com/repos/${org}/${repo.name}/issues?state=open&per_page=20`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
          if (issuesResponse.ok) {
            const repoIssues = await issuesResponse.json();
            issues.push(...repoIssues);
          }
        }
      } else {
        const repos = await reposResponse.json();
        for (const repoItem of repos.slice(0, 10)) {
          const issuesResponse = await fetch(
            `https://api.github.com/repos/${org}/${repoItem.name}/issues?state=open&per_page=20`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
          if (issuesResponse.ok) {
            const repoIssues = await issuesResponse.json();
            issues.push(...repoIssues);
          }
        }
      }
    }

    // Filter out pull requests (GitHub API includes PRs as issues)
    issues = issues.filter((issue) => !issue.html_url.includes("/pull/"));

    // Transform and return issues
    const transformedIssues = issues.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      html_url: issue.html_url,
      state: issue.state,
      labels: issue.labels,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      author: issue.user?.login || "unknown",
    }));

    return NextResponse.json({
      issues: transformedIssues,
      count: transformedIssues.length,
    });
  } catch (error) {
    console.error("Error fetching ecosystem issues:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch issues",
      },
      { status: 500 }
    );
  }
}
