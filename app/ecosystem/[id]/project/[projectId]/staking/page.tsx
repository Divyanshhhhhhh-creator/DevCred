"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StakeModal } from "@/components/StakeModal";
import { useUser, useStakeIssues } from "@/lib/hooks";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import { mockEcosystemDetails } from "@/lib/mocks";
import { ExternalLink } from "lucide-react";

export default function StakingPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const ecosystemId = params.id as string;
  const { user } = useUser();
  const { user: githubUser } = useGitHubAuth();
  const { issues, isLoading } = useStakeIssues(projectId);
  const [stakeModalOpen, setStakeModalOpen] = React.useState(false);
  const [stakedIssues, setStakedIssues] = React.useState<string[]>([]);

  // Load staked issues from localStorage
  React.useEffect(() => {
    if (githubUser?.user?.login) {
      const stored = localStorage.getItem(
        `staked_issues_${githubUser.user.login}`
      );
      if (stored) {
        const staked = JSON.parse(stored) as Array<{ issueId: string }>;
        setStakedIssues(staked.map((s) => s.issueId));
      }
    }
  }, [githubUser]);

  const isIssueStaked = (issueId: string) => stakedIssues.includes(issueId);
  const [selectedIssue, setSelectedIssue] = React.useState<{
    id: string;
    title: string;
    stakeAmountRequired: number;
  } | null>(null);

  const ecosystem =
    mockEcosystemDetails[ecosystemId as keyof typeof mockEcosystemDetails];
  // Project data available in ecosystem.projects if needed

  const handleStake = (issue: {
    id: string;
    title: string;
    stakeAmountRequired: number;
  }) => {
    setSelectedIssue(issue);
    setStakeModalOpen(true);
  };

  const handleStakeSuccess = () => {
    // Refresh staked issues list
    if (githubUser?.user?.login) {
      const stored = localStorage.getItem(
        `staked_issues_${githubUser.user.login}`
      );
      if (stored) {
        const staked = JSON.parse(stored) as Array<{ issueId: string }>;
        setStakedIssues(staked.map((s) => s.issueId));
      }
    }
    console.log("Stake successful!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
            Loading issues...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="inline-block px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600">
                <h2 className="text-xl font-medium">
                  {ecosystem?.name || "test-org-ethvilla"}
                </h2>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="inline-block px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600">
                <h2 className="text-xl font-medium">
                  {githubUser?.user?.name ||
                    githubUser?.user?.login ||
                    "Developer Name"}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {issues?.map((issue) => {
            const isStaked = isIssueStaked(issue.id);
            return (
              <div
                key={issue.id}
                className={`flex items-center rounded-2xl border p-6 transition-all ${
                  isStaked
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Issue Info */}
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-medium">{issue.title}</h3>
                    {isStaked && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        Staked
                      </span>
                    )}
                    {issue.html_url && (
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {issue.repo_name && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        📦 {issue.repo_name}
                      </Badge>
                    </div>
                  )}
                  {issue.labels && issue.labels.length > 0 && (
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {issue.labels.slice(0, 3).map((label, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {issue.description}
                  </p>
                </div>

                {/* Stake Amount */}
                <div
                  className={`px-8 py-3 border-l border-r ${
                    isStaked
                      ? "border-green-300 dark:border-green-700"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Stake Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {issue.stakeAmountRequired} tokens
                  </p>
                </div>

                {/* Stake Button */}
                <div className="pl-6">
                  {isStaked ? (
                    <Button
                      size="lg"
                      className="px-8 rounded-full bg-green-600 hover:bg-green-700"
                      disabled
                    >
                      ✓ Picked Up
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStake(issue)}
                      size="lg"
                      className="px-8 rounded-full"
                    >
                      Stake
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(!issues || issues.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <p className="text-text-secondary dark:text-text-dark-secondary">
              No issues available for staking at the moment
            </p>
          </div>
        )}
      </main>

      <Footer />

      <StakeModal
        open={stakeModalOpen}
        onOpenChange={setStakeModalOpen}
        issue={selectedIssue}
        onSuccess={handleStakeSuccess}
      />
    </div>
  );
}
