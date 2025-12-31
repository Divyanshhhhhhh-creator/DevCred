"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GitFork, 
  Star, 
  Activity,
  ArrowLeft,
  ExternalLink,
  TrendingUp
} from "lucide-react";

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface Repository {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  updated_at: string;
}

interface OrgData {
  login: string;
  name: string;
  description: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const orgName = params.orgName as string;

  const [orgData, setOrgData] = React.useState<OrgData | null>(null);
  const [contributors, setContributors] = React.useState<Contributor[]>([]);
  const [repositories, setRepositories] = React.useState<Repository[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchOrgData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch organization data
        const orgResponse = await fetch(`https://api.github.com/orgs/${orgName}`);
        if (!orgResponse.ok) throw new Error("Failed to fetch organization");
        const org = await orgResponse.json();
        setOrgData(org);

        // Fetch repositories
        const reposResponse = await fetch(
          `https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=10`
        );
        if (!reposResponse.ok) throw new Error("Failed to fetch repositories");
        const repos = await reposResponse.json();
        setRepositories(repos);

        // Fetch contributors from top repositories
        const contributorsMap = new Map<string, Contributor>();
        
        for (const repo of repos.slice(0, 5)) {
          try {
            const contribResponse = await fetch(
              `https://api.github.com/repos/${repo.full_name}/contributors?per_page=20`
            );
            if (contribResponse.ok) {
              const contribs = await contribResponse.json();
              contribs.forEach((contrib: Contributor) => {
                if (contributorsMap.has(contrib.login)) {
                  const existing = contributorsMap.get(contrib.login)!;
                  existing.contributions += contrib.contributions;
                } else {
                  contributorsMap.set(contrib.login, { ...contrib });
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching contributors for ${repo.name}:`, err);
          }
        }

        const allContributors = Array.from(contributorsMap.values())
          .sort((a, b) => b.contributions - a.contributions)
          .slice(0, 50);
        
        setContributors(allContributors);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organization");
      } finally {
        setLoading(false);
      }
    }

    if (orgName) {
      fetchOrgData();
    }
  }, [orgName]);

  // Calculate bubble size based on contributions
  const getContributorSize = (contributions: number, maxContributions: number) => {
    const minSize = 40;
    const maxSize = 120;
    const ratio = contributions / maxContributions;
    return minSize + ratio * (maxSize - minSize);
  };

  const maxContributions = contributors.length > 0 
    ? Math.max(...contributors.map(c => c.contributions))
    : 1;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
              Loading organization data...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !orgData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Organization not found"}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Organization Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={orgData.avatar_url} alt={orgData.login} />
                <AvatarFallback>{orgData.login.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {orgData.name || orgData.login}
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-3">
                      @{orgData.login}
                    </p>
                  </div>
                  <a
                    href={orgData.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    View on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                {orgData.description && (
                  <p className="text-sm mb-4 max-w-3xl">{orgData.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
                    <span>{orgData.followers} followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
                    <span>{orgData.public_repos} public repositories</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contributors Bubble Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Contributors
              </CardTitle>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Bubble size represents contribution count
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex flex-wrap justify-center items-center p-8 gap-4">
                  {contributors.slice(0, 30).map((contributor, index) => {
                    const size = getContributorSize(contributor.contributions, maxContributions);
                    const isTop3 = index < 3;
                    
                    return (
                      <a
                        key={contributor.login}
                        href={contributor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center transition-transform hover:scale-110 hover:z-10"
                        style={{
                          width: size,
                          height: size,
                        }}
                        title={`${contributor.login} - ${contributor.contributions} contributions`}
                      >
                        <div
                          className={`absolute inset-0 rounded-full ${
                            isTop3
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-br from-blue-400 to-purple-500'
                          } opacity-20 group-hover:opacity-30 transition-opacity`}
                        />
                        <Avatar
                          className="relative z-10 border-2 border-white dark:border-gray-800 shadow-lg"
                          style={{
                            width: size * 0.6,
                            height: size * 0.6,
                          }}
                        >
                          <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                          <AvatarFallback>
                            {contributor.login.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-20">
                          <div className="font-semibold">{contributor.login}</div>
                          <div className="text-xs">{contributor.contributions} commits</div>
                        </div>
                        {isTop3 && (
                          <Badge
                            className="absolute -top-2 -right-2 z-10 bg-yellow-500 text-white"
                          >
                            #{index + 1}
                          </Badge>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
              
              {/* Top 10 List */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {contributors.slice(0, 10).map((contributor, index) => (
                  <a
                    key={contributor.login}
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                      <AvatarFallback>{contributor.login.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contributor.login}</p>
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        {contributor.contributions} contributions
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Active Repositories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Active Repos
              </CardTitle>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Recently updated repositories
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <a
                    key={repo.full_name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {repo.name}
                      </p>
                      <ExternalLink className="h-3 w-3 text-text-secondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {repo.description && (
                      <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-3 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs">
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-text-secondary dark:text-text-dark-secondary">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center gap-1 text-text-secondary dark:text-text-dark-secondary">
                        <GitFork className="h-3 w-3" />
                        {repo.forks_count}
                      </div>
                    </div>
                    
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
