"use client";

import React from 'react';
import { GitHubUserStats } from '@/lib/github';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, GitPullRequest, Users, BookOpen } from 'lucide-react';

interface GitHubUserProfileProps {
  userStats: GitHubUserStats;
}

export function GitHubUserProfile({ userStats }: GitHubUserProfileProps) {
  const { user, repos, organizations, totalStars, totalPRsMerged, prsByOrganization } = userStats;

  const topOrgs = Object.entries(prsByOrganization)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
            <AvatarFallback>{user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name || user.login}</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">@{user.login}</p>
            {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
            <div className="flex gap-4 mt-3 text-sm">
              <span><strong>{user.followers}</strong> followers</span>
              <span><strong>{user.following}</strong> following</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{repos.length}</p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">Repositories</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStars}</p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">Total Stars</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <GitPullRequest className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPRsMerged}</p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">PRs Merged</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{organizations.length}</p>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">Organizations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Organizations */}
      {organizations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Organizations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={org.avatar_url} alt={org.login} />
                  <AvatarFallback>{org.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{org.login}</p>
                  {org.description && (
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                      {org.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Contributions by Organization */}
      {topOrgs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Contributions by Organization</h3>
          <div className="space-y-3">
            {topOrgs.map(([orgName, count]) => (
              <div key={orgName} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{orgName}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold">{count} PRs</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Repositories */}
      {repos.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Repositories by Stars</h3>
          <div className="space-y-3">
            {repos
              .sort((a, b) => b.stargazers_count - a.stargazers_count)
              .slice(0, 5)
              .map((repo) => (
                <div key={repo.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {repo.full_name}
                    </a>
                    {repo.description && (
                      <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
