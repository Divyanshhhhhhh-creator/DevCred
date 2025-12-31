"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GitPullRequest, ExternalLink, Calendar } from "lucide-react";

interface ContributionCardProps {
  contribution: {
    ecosystemName: string;
    projectName: string;
    description: string;
    url: string;
    date: string;
    prCount?: number;
  };
}

export function ContributionCard({ contribution }: ContributionCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary">{contribution.ecosystemName}</span>
              <span className="text-sm text-text-secondary dark:text-text-dark-secondary">•</span>
              <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
                {contribution.projectName}
              </span>
            </div>
            <p className="text-sm font-medium mb-2">{contribution.description}</p>
          </div>
          <a
            href={contribution.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-primary dark:text-text-dark-secondary dark:hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary dark:text-text-dark-secondary">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(contribution.date)}</span>
          </div>
          {contribution.prCount && (
            <div className="flex items-center gap-1">
              <GitPullRequest className="h-3 w-3" />
              <span>{contribution.prCount} PRs</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
