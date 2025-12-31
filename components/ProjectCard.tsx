"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GitPullRequest, Trophy } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    contributors: number;
    prs: number;
    topContributors: Array<{
      handle: string;
      score: number;
    }>;
    issuesCount: number;
  };
  onViewContributors?: () => void;
  onStakeIssues?: () => void;
}

export function ProjectCard({ project, onViewContributors, onStakeIssues }: ProjectCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
            <span className="text-sm">{project.contributors} contributors</span>
          </div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
            <span className="text-sm">{project.prs} PRs</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Top Contributors</span>
          </div>
          <div className="space-y-1">
            {project.topContributors.slice(0, 3).map((contributor, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-text-secondary dark:text-text-dark-secondary">
                  @{contributor.handle}
                </span>
                <span className="font-medium">{contributor.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewContributors}
          >
            View Contributors
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={onStakeIssues}
          >
            Stake on Issues
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
