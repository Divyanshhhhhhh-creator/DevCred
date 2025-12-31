"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProjectCard } from "@/components/ProjectCard";
import { useEcosystem, useUser } from "@/lib/hooks";

export default function EcosystemDashboard() {
  const params = useParams();
  const router = useRouter();
  const ecosystemId = params.id as string;
  const { ecosystem, isLoading } = useEcosystem(ecosystemId);
  const { user } = useUser();
  const [contributorsPanelOpen, setContributorsPanelOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<string | null>(null);

  const handleViewContributors = (projectId: string) => {
    setSelectedProject(projectId);
    setContributorsPanelOpen(true);
  };

  const handleStakeIssues = (projectId: string) => {
    router.push(`/ecosystem/${ecosystemId}/project/${projectId}/staking`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">Loading ecosystem...</p>
        </div>
      </div>
    );
  }

  if (!ecosystem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-text-secondary dark:text-text-dark-secondary">Ecosystem not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full">
            <span className="font-semibold">{ecosystem.name}</span>
          </div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
            {ecosystem.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ecosystem.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewContributors={() => handleViewContributors(project.id)}
              onStakeIssues={() => handleStakeIssues(project.id)}
            />
          ))}
        </div>

        {/* Contributors Panel - Simplified version */}
        {contributorsPanelOpen && (
          <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-surface-dark border-l border-border dark:border-border-dark shadow-lg z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Contributors</h2>
                <button
                  onClick={() => setContributorsPanelOpen(false)}
                  className="text-text-secondary hover:text-text dark:text-text-dark-secondary dark:hover:text-text-dark"
                >
                  ✕
                </button>
              </div>
              {selectedProject && (
                <div className="space-y-3">
                  {ecosystem.projects
                    .find((p) => p.id === selectedProject)
                    ?.topContributors.map((contributor, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-surface dark:bg-background-dark rounded-lg"
                      >
                        <span className="font-medium">@{contributor.handle}</span>
                        <span className="text-primary font-semibold">{contributor.score}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
