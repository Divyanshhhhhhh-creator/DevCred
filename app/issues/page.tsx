"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  Search,
  Loader2,
  Coins,
  ExternalLink,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import { StakeModal } from "@/components/StakeModal";
import { IssueStatus } from "@/lib/contracts/config";

interface DisplayIssue {
  id: string;
  number: number;
  title: string;
  description: string;
  stakeAmountRequired: number;
  status: IssueStatus;
  labels: Array<{ name: string; color: string }>;
  html_url: string;
  ecosystemName: string;
  repoName: string;
  stakedBy?: string;
}

interface Ecosystem {
  name: string;
  staking: string;
  token: string;
  deployer: string;
}

export default function IssuesPage() {
  const router = useRouter();
  const { user, isAuthenticated, signIn } = useGitHubAuth();

  const [issues, setIssues] = useState<DisplayIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>("all");
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DisplayIssue | null>(null);
  const [stakedIssueIds, setStakedIssueIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Load ecosystems from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("ecosystems_cache");
    if (cached) {
      setEcosystems(JSON.parse(cached));
    }
  }, []);

  // Load user's staked issues
  useEffect(() => {
    if (user?.user?.login) {
      const staked = localStorage.getItem(`staked_issues_${user.user.login}`);
      if (staked) {
        const stakedList = JSON.parse(staked);
        setStakedIssueIds(
          stakedList.map(
            (i: { id: string; issueId: string }) => i.id || i.issueId
          )
        );
      }
    }
  }, [user?.user?.login]);

  // Fetch issues from ecosystems
  const fetchIssues = useCallback(async () => {
    if (!isAuthenticated || ecosystems.length === 0) {
      setLoading(false);
      return;
    }

    setError("");
    const allIssues: DisplayIssue[] = [];

    for (const eco of ecosystems) {
      try {
        const response = await fetch(`/api/ecosystem/issues?org=${eco.name}`);
        if (response.ok) {
          const data = await response.json();
          const ecoIssues = data.issues.map(
            (issue: {
              id: number;
              number: number;
              title: string;
              body: string;
              html_url: string;
              labels: Array<{ name: string; color: string }>;
            }) => ({
              id: `${eco.name}-${issue.number}`,
              number: issue.number,
              title: issue.title,
              description: issue.body || "",
              stakeAmountRequired: getStakeAmount(issue.labels),
              status: IssueStatus.Open,
              labels: issue.labels,
              html_url: issue.html_url,
              ecosystemName: eco.name,
              repoName: eco.name,
            })
          );
          allIssues.push(...ecoIssues);
        }
      } catch (err) {
        console.error(`Failed to fetch issues for ${eco.name}:`, err);
      }
    }

    setIssues(allIssues);
    setLoading(false);
  }, [isAuthenticated, ecosystems]);

  // Get stake amount from labels
  const getStakeAmount = (labels: Array<{ name: string }>) => {
    for (const label of labels) {
      const match = label.name.match(/stake[:\s-]*(\d+)/i);
      if (match) return parseInt(match[1], 10);
    }
    return 50; // Default stake
  };

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  };

  const handleStake = (issue: DisplayIssue) => {
    setSelectedIssue(issue);
    setStakeModalOpen(true);
  };

  const handleStakeSuccess = () => {
    if (selectedIssue && user?.user?.login) {
      // Add to staked issues
      setStakedIssueIds((prev) => [...prev, selectedIssue.id]);

      // Update localStorage
      const existing = localStorage.getItem(`staked_issues_${user.user.login}`);
      const stakedList = existing ? JSON.parse(existing) : [];
      stakedList.push({
        id: selectedIssue.id,
        issueId: selectedIssue.id,
        title: selectedIssue.title,
        description: selectedIssue.description,
        amount: selectedIssue.stakeAmountRequired,
        timestamp: new Date().toISOString(),
        status: "staked",
        githubUrl: selectedIssue.html_url,
        ecosystemName: selectedIssue.ecosystemName,
      });
      localStorage.setItem(
        `staked_issues_${user.user.login}`,
        JSON.stringify(stakedList)
      );

      setIssues((prev) =>
        prev.map((i) =>
          i.id === selectedIssue.id
            ? { ...i, status: IssueStatus.Assigned, stakedBy: user.user.login }
            : i
        )
      );
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEcosystem =
      selectedEcosystem === "all" || issue.ecosystemName === selectedEcosystem;
    return matchesSearch && matchesEcosystem;
  });

  const openIssues = filteredIssues.filter(
    (i) => i.status === IssueStatus.Open && !stakedIssueIds.includes(i.id)
  );
  const myStakedIssues = filteredIssues.filter((i) =>
    stakedIssueIds.includes(i.id)
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={signIn} />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <GitPullRequest className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Browse Issues</h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                Sign in with GitHub to browse and stake on issues.
              </p>
              <Button onClick={signIn}>Sign in with GitHub</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Available Issues</h1>
            <p className="text-text-secondary dark:text-text-dark-secondary">
              Browse and stake on open issues from ecosystems
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedEcosystem}
              onChange={(e) => setSelectedEcosystem(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white dark:bg-gray-800"
            >
              <option value="all">All Ecosystems</option>
              {ecosystems.map((eco) => (
                <option key={eco.name} value={eco.name}>
                  {eco.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Staked Issues */}
            {myStakedIssues.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  My Staked Issues ({myStakedIssues.length})
                </h2>
                <div className="grid gap-4">
                  {myStakedIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isStaked={true}
                      onAction={() => router.push(`/issues/${issue.id}/submit`)}
                      actionLabel="Submit Work"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Open Issues */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Open Issues ({openIssues.length})
              </h2>
              {openIssues.length === 0 ? (
                <Card className="p-8 text-center">
                  <GitPullRequest className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Open Issues</h3>
                  <p className="text-text-secondary dark:text-text-dark-secondary">
                    {ecosystems.length === 0
                      ? "No ecosystems found. Create one first!"
                      : "No open issues available at the moment."}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {openIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isStaked={false}
                      onAction={() => handleStake(issue)}
                      actionLabel="Stake"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Stake Modal */}
      <StakeModal
        open={stakeModalOpen}
        onOpenChange={setStakeModalOpen}
        issue={
          selectedIssue
            ? {
                id: selectedIssue.id,
                title: selectedIssue.title,
                stakeAmountRequired: selectedIssue.stakeAmountRequired,
              }
            : null
        }
        ecosystemName={selectedIssue?.ecosystemName}
        onSuccess={handleStakeSuccess}
      />
    </div>
  );
}

// Issue Card Component
function IssueCard({
  issue,
  isStaked,
  onAction,
  actionLabel,
}: {
  issue: DisplayIssue;
  isStaked: boolean;
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{issue.ecosystemName}</Badge>
              <span className="text-sm text-text-secondary">
                #{issue.number}
              </span>
              {isStaked && (
                <Badge className="bg-amber-500 text-white">Staked</Badge>
              )}
            </div>

            <h3 className="font-semibold text-base mb-1 truncate">
              {issue.title}
            </h3>

            {issue.description && (
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3">
                {issue.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4" />
                {issue.stakeAmountRequired} required
              </span>

              {issue.html_url && (
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </a>
              )}
            </div>
          </div>

          <Button onClick={onAction} className="gap-2">
            {isStaked ? (
              <GitPullRequest className="h-4 w-4" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
