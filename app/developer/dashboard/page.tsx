"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitPullRequest,
  Star,
  Users,
  TrendingUp,
  BookOpen,
  Calendar,
  ExternalLink,
  Activity,
  Award,
  BarChart3,
  Coins,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import { StakedIssueCard } from "@/components/StakedIssueCard";
import { WorkSubmissionModal } from "@/components/WorkSubmissionModal";
import { TLSNotaryVerificationModal } from "@/components/TLSNotaryVerificationModal";
import { IssueStatus } from "@/lib/contracts/config";

interface StakedIssue {
  id: string;
  issueId: string;
  title: string;
  description?: string;
  amount: number;
  timestamp: string;
  status: IssueStatus | string;
  prUrl?: string;
  prMerged?: boolean;
  verified?: boolean;
  reward?: string;
  githubUrl?: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut } = useGitHubAuth();

  // Staked issues state
  const [stakedIssues, setStakedIssues] = React.useState<StakedIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = React.useState<StakedIssue | null>(
    null
  );
  const [showWorkModal, setShowWorkModal] = React.useState(false);
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);

  // Load staked issues from localStorage
  React.useEffect(() => {
    if (user?.user?.login) {
      const stored = localStorage.getItem(`staked_issues_${user.user.login}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Enhance with mock data for demo
          const enhanced = parsed.map((issue: StakedIssue, index: number) => ({
            ...issue,
            title: issue.title || `Issue #${index + 1}`,
            description: issue.description || "Staked issue from ecosystem",
            status: issue.status || "assigned",
          }));
          setStakedIssues(enhanced);
        } catch {
          setStakedIssues([]);
        }
      }
    }
  }, [user?.user?.login]);

  // Get reputation balance from localStorage
  const getReputationBalance = () => {
    if (!user?.user?.login) return { total: 0, available: 0, locked: 0 };
    const stored = localStorage.getItem(`reputation_${user.user.login}`);
    const balance = stored ? parseInt(stored) : 1000;
    const locked = stakedIssues.reduce((sum, issue) => {
      if (
        issue.status !== "verified" &&
        issue.status !== IssueStatus.Accepted
      ) {
        return sum + (issue.amount || 0);
      }
      return sum;
    }, 0);
    return {
      total: balance + locked,
      available: balance,
      locked,
    };
  };

  const reputation = getReputationBalance();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const reputationScore = Math.min(
    Math.floor(
      (user.stats.totalStars * 2 +
        user.stats.totalPRsMerged * 10 +
        user.stats.totalRepos * 5 +
        user.stats.organizationsCount * 15) /
        10
    ),
    10000
  );

  const recentPRs =
    (
      user as {
        recentPRs?: Array<{
          id: string;
          html_url: string;
          org: string;
          repo: string;
          title: string;
          merged_at: string;
        }>;
      }
    )?.recentPRs || [];
  const topRepos =
    (
      user as {
        topRepos?: Array<{
          full_name: string;
          html_url: string;
          description?: string;
          stargazers_count: number;
          language?: string;
        }>;
      }
    )?.topRepos || [];
  const prsByOrg =
    (user as { prsByOrganization?: Record<string, number> })
      ?.prsByOrganization || {};

  const orgEntries = Object.entries(prsByOrg).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user.user.avatar_url}
                    alt={user.user.name || user.user.login}
                  />
                  <AvatarFallback>
                    {user.user.login.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">
                    {user.user.name || user.user.login}
                  </h1>
                  <p className="text-text-secondary dark:text-text-dark-secondary">
                    @{user.user.login}
                  </p>
                  {user.user.bio && (
                    <p className="mt-2 text-sm max-w-2xl">{user.user.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dev/${user.user.login}`)}
                >
                  View Public Profile
                </Button>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Reputation Score */}
        <div className="mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Developer Reputation Score
                </h2>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Based on contributions, PRs, stars, and community impact
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-primary">
                  {reputationScore}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  Active Contributor
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <GitPullRequest className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {user.stats.totalPRsMerged}
                </p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  PRs Merged
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user.stats.totalStars}</p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Total Stars
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user.stats.totalRepos}</p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Repositories
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {user.stats.organizationsCount}
                </p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Organizations
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="staked">
              <Coins className="h-4 w-4 mr-2" />
              Staked Issues
              {stakedIssues.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {stakedIssues.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Users className="h-4 w-4 mr-2" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="repositories">
              <BookOpen className="h-4 w-4 mr-2" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pull Requests</CardTitle>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Your latest merged contributions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPRs.length > 0 ? (
                    recentPRs.map((pr) => (
                      <a
                        key={pr.id}
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <GitPullRequest className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <Badge variant="outline" className="text-xs">
                                {pr.org}
                              </Badge>
                              <span className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                                {pr.repo.split("/")[1]}
                              </span>
                            </div>
                            <p className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {pr.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                              <Calendar className="h-3 w-3" />
                              Merged{" "}
                              {new Date(pr.merged_at).toLocaleDateString()}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-text-secondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-center text-text-secondary py-8">
                      No recent PRs found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staked Issues Tab */}
          <TabsContent value="staked" className="space-y-6">
            {/* Reputation Balance Card */}
            <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-600" />
                    Reputation Token Balance
                  </h2>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Stake tokens on issues to earn rewards
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {reputation.total.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {reputation.available.toLocaleString()} available
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <Clock className="h-4 w-4" />
                      {reputation.locked.toLocaleString()} staked
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Staked Issues List */}
            {stakedIssues.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Your Staked Issues ({stakedIssues.length})
                </h3>
                <div className="grid gap-4">
                  {stakedIssues.map((issue) => (
                    <StakedIssueCard
                      key={issue.id || issue.issueId}
                      issue={issue}
                      onSubmitWork={() => {
                        setSelectedIssue(issue);
                        setShowWorkModal(true);
                      }}
                      onVerify={() => {
                        setSelectedIssue(issue);
                        setShowVerifyModal(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Coins className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      No Staked Issues Yet
                    </h3>
                    <p className="text-text-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                      Browse ecosystems to find issues and stake your reputation
                      tokens to start contributing and earning rewards.
                    </p>
                  </div>
                  <Button onClick={() => router.push("/")}>
                    Browse Ecosystems
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Organizations List */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Organizations</CardTitle>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Organizations you&apos;re part of
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.organizations && user.organizations.length > 0 ? (
                      user.organizations.map((org) => (
                        <div
                          key={org.login}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={org.avatar_url} alt={org.login} />
                            <AvatarFallback>
                              {org.login.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{org.login}</p>
                            {prsByOrg[org.login] && (
                              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                {prsByOrg[org.login]} PRs merged
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-text-secondary py-8">
                        No organizations found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contribution Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Contribution Breakdown</CardTitle>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    PRs by organization
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orgEntries.length > 0 ? (
                      orgEntries.slice(0, 10).map(([org, count]) => (
                        <div
                          key={org}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <span className="font-medium text-sm">{org}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((count as number) /
                                      Math.max(
                                        ...orgEntries.map(
                                          ([, c]) => c as number
                                        )
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-text-secondary py-8">
                        No contributions found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Repositories by Stars</CardTitle>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Your most popular projects
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRepos.length > 0 ? (
                    topRepos.map((repo) => (
                      <a
                        key={repo.full_name}
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium mb-1 group-hover:text-primary transition-colors">
                              {repo.full_name}
                            </p>
                            <div className="flex items-center gap-3 text-sm">
                              {repo.language && (
                                <Badge variant="outline" className="text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-text-secondary dark:text-text-dark-secondary">
                                <Star className="h-3 w-3 text-yellow-600" />
                                <span>{repo.stargazers_count}</span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-text-secondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-center text-text-secondary py-8">
                      No repositories found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contribution Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Pull Requests</span>
                      <span className="font-semibold">
                        {user.stats.totalPRsMerged}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: "85%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Repositories</span>
                      <span className="font-semibold">
                        {user.stats.totalRepos}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Total Stars</span>
                      <span className="font-semibold">
                        {user.stats.totalStars}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Organizations</span>
                      <span className="font-semibold">
                        {user.stats.organizationsCount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: "50%" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm">Avg PRs per Org</span>
                    <span className="font-semibold">
                      {orgEntries.length > 0
                        ? Math.round(
                            user.stats.totalPRsMerged / orgEntries.length
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm">Avg Stars per Repo</span>
                    <span className="font-semibold">
                      {user.stats.totalRepos > 0
                        ? Math.round(
                            user.stats.totalStars / user.stats.totalRepos
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm">Most Active Org</span>
                    <span className="font-semibold">
                      {orgEntries.length > 0 ? orgEntries[0][0] : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm">Reputation Rank</span>
                    <Badge variant="secondary">Top 5%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Work Submission Modal */}
      {selectedIssue && (
        <WorkSubmissionModal
          open={showWorkModal}
          onOpenChange={setShowWorkModal}
          issue={{
            id: selectedIssue.issueId,
            title: selectedIssue.title,
            githubUrl: selectedIssue.githubUrl,
          }}
          onSuccess={async (prUrl) => {
            // Update the staked issue with PR URL
            const updated = stakedIssues.map((i) =>
              (i.id || i.issueId) ===
              (selectedIssue.id || selectedIssue.issueId)
                ? { ...i, prUrl, status: "work_submitted" }
                : i
            );
            setStakedIssues(updated);
            if (user?.user?.login) {
              localStorage.setItem(
                `staked_issues_${user.user.login}`,
                JSON.stringify(updated)
              );
            }
            setShowWorkModal(false);
          }}
        />
      )}

      {/* TLSNotary Verification Modal */}
      {selectedIssue && (
        <TLSNotaryVerificationModal
          open={showVerifyModal}
          onOpenChange={setShowVerifyModal}
          issue={{
            id: selectedIssue.issueId,
            title: selectedIssue.title,
            prUrl: selectedIssue.prUrl || "",
          }}
          onVerified={(reputationGained) => {
            // Update the staked issue as verified
            const updated = stakedIssues.map((i) =>
              (i.id || i.issueId) ===
              (selectedIssue.id || selectedIssue.issueId)
                ? { ...i, status: "verified", verified: true }
                : i
            );
            setStakedIssues(updated);
            if (user?.user?.login) {
              localStorage.setItem(
                `staked_issues_${user.user.login}`,
                JSON.stringify(updated)
              );
              // Also update reputation balance
              const currentRep = localStorage.getItem(
                `reputation_${user.user.login}`
              );
              const newRep =
                (currentRep ? parseInt(currentRep) : 1000) +
                reputationGained +
                (selectedIssue.amount || 0);
              localStorage.setItem(
                `reputation_${user.user.login}`,
                newRep.toString()
              );
            }
            setShowVerifyModal(false);
          }}
        />
      )}
    </div>
  );
}
