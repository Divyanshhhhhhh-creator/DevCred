"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface EcosystemCardProps {
  ecosystem: {
    id: string;
    name: string;
    score: number;
  };
  projects?: Array<{
    id: string;
    name: string;
    prs: number;
  }>;
  contributions?: Array<{
    description: string;
    url: string;
  }>;
  onProjectSelect?: (projectId: string) => void;
  onContributionClick?: (contribution: { description: string; url: string }) => void;
}

export function EcosystemCard({
  ecosystem,
  projects = [],
  contributions = [],
  onProjectSelect,
  onContributionClick,
}: EcosystemCardProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<string | null>(null);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setDropdownOpen(false);
    if (onProjectSelect) onProjectSelect(projectId);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">{ecosystem.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <span className="font-semibold">{ecosystem.score} coins earned</span>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="text-sm">
              {selectedProject
                ? projects.find((p) => p.id === selectedProject)?.name
                : "Select project"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                dropdownOpen && "rotate-180"
              )}
            />
          </Button>
          {dropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-lg z-10">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  {project.name} ({project.prs} PRs)
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">PR Contributions:</p>
          {contributions.slice(0, 3).map((contribution, index) => (
            <button
              key={index}
              className="w-full text-left p-2 text-sm bg-surface dark:bg-surface-dark rounded-lg hover:bg-surface/80 dark:hover:bg-surface-dark/80 transition-colors"
              onClick={() => onContributionClick && onContributionClick(contribution)}
            >
              {contribution.description}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
