"use client";

import React from "react";
import { Github, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const handleGitHubSignIn = () => {
    // Initiate real GitHub OAuth flow
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'read:user user:email read:org repo';
    
    if (!clientId) {
      console.error('GitHub Client ID is not configured');
      alert('GitHub authentication is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID in your .env file.');
      return;
    }
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    // Close modal and redirect to GitHub
    onOpenChange(false);
    window.location.href = githubAuthUrl;
  };

  const handleWalletConnect = () => {
    // Simulate wallet connection
    console.log("Wallet connection initiated");
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to TrustMyGit</DialogTitle>
          <DialogDescription>
            Sign in with GitHub and connect your wallet to start earning reputation tokens
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="github" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>
          <TabsContent value="github" className="space-y-4">
            <div className="text-center py-4">
              <Github className="h-12 w-12 mx-auto mb-4 text-text-secondary dark:text-text-dark-secondary" />
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                Connect your GitHub account to track your contributions and earn reputation points
              </p>
              <Button onClick={handleGitHubSignIn} className="w-full">
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="wallet" className="space-y-4">
            <div className="text-center py-4">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-text-secondary dark:text-text-dark-secondary" />
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                Connect your wallet to mint and trade developer tokens
              </p>
              <Button onClick={handleWalletConnect} className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
