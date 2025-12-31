"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  ExternalLink,
  CheckCircle2,
  Clock,
  Shield,
  Coins,
  AlertCircle,
  Upload,
} from "lucide-react";
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

interface StakedIssueCardProps {
  issue: StakedIssue;
  onSubmitWork: () => void;
  onVerify: () => void;
}

export function StakedIssueCard({
  issue,
  onSubmitWork,
  onVerify,
}: StakedIssueCardProps) {
  const getStatusBadge = () => {
    if (issue.verified || issue.status === "verified") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    if (issue.prMerged) {
      return (
        <Badge className="bg-purple-500 text-white">
          <GitPullRequest className="h-3 w-3 mr-1" />
          PR Merged - Ready to Verify
        </Badge>
      );
    }
    if (issue.prUrl) {
      return (
        <Badge className="bg-blue-500 text-white">
          <GitPullRequest className="h-3 w-3 mr-1" />
          PR Submitted
        </Badge>
      );
    }
    if (
      issue.status === IssueStatus.Assigned ||
      issue.status === "assigned" ||
      issue.status === "staked"
    ) {
      return (
        <Badge className="bg-amber-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <AlertCircle className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  };

  const getActionButton = () => {
    if (issue.verified || issue.status === "verified") {
      return (
        <Button variant="outline" disabled className="gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Completed
        </Button>
      );
    }
    if (issue.prMerged) {
      return (
        <Button onClick={onVerify} className="gap-2">
          <Shield className="h-4 w-4" />
          Verify with TLSNotary
        </Button>
      );
    }
    if (issue.prUrl) {
      return (
        <Button variant="outline" onClick={onVerify} className="gap-2">
          <Clock className="h-4 w-4" />
          Check Merge Status
        </Button>
      );
    }
    return (
      <Button onClick={onSubmitWork} className="gap-2">
        <Upload className="h-4 w-4" />
        Submit Work
      </Button>
    );
  };

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge()}
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
                Staked {formatDate(issue.timestamp)}
              </span>
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
                {issue.amount} staked
              </span>

              {issue.reward && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Coins className="h-4 w-4" />
                  {issue.reward} reward
                </span>
              )}

              {issue.githubUrl && (
                <a
                  href={issue.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Issue
                </a>
              )}

              {issue.prUrl && (
                <a
                  href={issue.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <GitPullRequest className="h-4 w-4" />
                  View PR
                </a>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">{getActionButton()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
