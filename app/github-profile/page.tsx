"use client";

import React from 'react';
import { useGitHubAuth } from '@/lib/GitHubAuthContext';
import { GitHubUserProfile } from '@/components/GitHubUserProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Github, LogOut } from 'lucide-react';

export default function GitHubProfilePage() {
  const { user, isAuthenticated, signIn, signOut, loading } = useGitHubAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-8 text-center">
          <Github className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">GitHub Profile</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
            Sign in with GitHub to view your comprehensive developer profile including repos, stars, PRs, and organizations.
          </p>
          <Button onClick={signIn} className="w-full">
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">GitHub Profile</h1>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <GitHubUserProfile userStats={user} />
    </div>
  );
}
