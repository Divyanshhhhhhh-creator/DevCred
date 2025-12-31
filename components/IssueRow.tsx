"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  ExternalLink,
  GitPullRequest,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { IssueStatus } from "@/lib/contracts/config";
import {
  VerificationBadge,
  VerificationStatus,
} from "@/components/VerificationBadge";

// Helper to convert IssueStatus to VerificationStatus
const getVerificationStatus = (
  status: IssueStatus,
  verified?: boolean
): VerificationStatus => {
  if (
    verified ||
    status === IssueStatus.Accepted ||
    status === IssueStatus.Closed
  ) {
    return "verified";
  }
  if (status === IssueStatus.Submitted) {
    return "pending";
  }
  return "unverified";
};

interface IssueRowProps {
  issue: {
    id: string;
    title: string;
    description: string;
    stakeAmountRequired: number;
    stakedBy: Array<{
      address: string;
      amount: number;
    }>;
    // New fields for contract integration
    status?: IssueStatus;
    assignee?: string;
    prUrl?: string;
    prMerged?: boolean;
    verified?: boolean;
    reward?: string;
    deadline?: number;
    githubUrl?: string;
  };
  currentUserAddress?: string;
  onStake: () => void;
  onSubmitWork?: () => void;
  onVerify?: () => void;
}

export function IssueRow({
  issue,
  currentUserAddress,
  onStake,
  onSubmitWork,
  onVerify,
}: IssueRowProps) {
  const totalStaked = issue.stakedBy.reduce(
    (sum, stake) => sum + stake.amount,
    0
  );
  const percentageStaked = (totalStaked / issue.stakeAmountRequired) * 100;
  const status = issue.status ?? IssueStatus.Open;
  const isAssignedToUser =
    issue.assignee?.toLowerCase() === currentUserAddress?.toLowerCase();
  const hasUserStaked = issue.stakedBy.some(
    (s) => s.address.toLowerCase() === currentUserAddress?.toLowerCase()
  );

  // Determine what action button to show
  const renderActionButton = () => {
    if (status === IssueStatus.Open && !hasUserStaked) {
      return (
        <Button onClick={onStake} size="sm" className="whitespace-nowrap">
          <Coins className="h-4 w-4 mr-1" />
          Stake
        </Button>
      );
    }

    if (status === IssueStatus.Assigned && isAssignedToUser && onSubmitWork) {
      return (
        <Button
          onClick={onSubmitWork}
          size="sm"
          variant="secondary"
          className="whitespace-nowrap"
        >
          <GitPullRequest className="h-4 w-4 mr-1" />
          Submit Work
        </Button>
      );
    }

    if (
      status === IssueStatus.Submitted &&
      issue.prMerged &&
      isAssignedToUser &&
      onVerify
    ) {
      return (
        <Button
          onClick={onVerify}
          size="sm"
          className="whitespace-nowrap bg-purple-600 hover:bg-purple-700"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Post & Verify
        </Button>
      );
    }

    if (status === IssueStatus.Accepted || issue.verified) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Verified ✓</span>
        </div>
      );
    }

    if (hasUserStaked) {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border dark:border-border-dark rounded-lg hover:bg-surface dark:hover:bg-surface-dark transition-colors">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium">{issue.title}</h3>
          <VerificationBadge
            status={getVerificationStatus(status, issue.verified)}
            size="sm"
          />
          {issue.reward && parseFloat(issue.reward) > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{issue.reward} ETH
            </Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-2 line-clamp-1">
          {issue.description}
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Stake Progress */}
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {totalStaked} / {issue.stakeAmountRequired}
            </span>
            <div className="w-20 h-2 bg-surface dark:bg-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(percentageStaked, 100)}%` }}
              />
            </div>
          </div>

          {/* PR Link if submitted */}
          {issue.prUrl && (
            <a
              href={issue.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <GitPullRequest className="h-3 w-3" />
              <span>PR #{issue.prUrl.split("/").pop()}</span>
              {issue.prMerged && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* GitHub Issue Link */}
          {issue.githubUrl && (
            <a
              href={issue.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              View Issue
            </a>
          )}

          {/* Deadline if present */}
          {issue.deadline && (
            <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-secondary">
              <Clock className="h-3 w-3" />
              <span>
                Due: {new Date(issue.deadline * 1000).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">{renderActionButton()}</div>
    </div>
  );
}
