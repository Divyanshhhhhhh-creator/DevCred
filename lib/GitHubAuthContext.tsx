"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { GitHubUserStats } from '@/lib/github';

interface GitHubAuthContextType {
  user: GitHubUserStats | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAuthenticated: boolean;
}

const GitHubAuthContext = createContext<GitHubAuthContextType | undefined>(undefined);

export function GitHubAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GitHubUserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user data via API
    const checkAuth = async () => {
      console.log('🔍 Checking auth via API...');
      try {
        const response = await fetch('/api/auth/github/user');
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Got user data from API:', userData.user?.login);
          setUser(userData);
        } else {
          console.log('❌ Not authenticated (API returned', response.status, ')');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_auth') === 'success') {
      console.log('🎉 OAuth callback detected, fetching user data...');
      
      // DON'T clean up URL yet - let page.tsx read the params first
      // The reputation generation flow will clean it up after
      
      // Wait a bit for cookies to be set, then fetch user data
      setTimeout(() => {
        checkAuth();
      }, 500);
    } else {
      // Normal auth check
      checkAuth();
    }
  }, []);

  const signIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'read:user user:email read:org repo';
    
    if (!clientId) {
      console.error('GitHub Client ID is not configured');
      alert('GitHub authentication is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID in your .env file.');
      return;
    }
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = githubAuthUrl;
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/github/logout', { method: 'POST' });
      setUser(null);
      
      // Clear cookies
      document.cookie = 'github_user_data=; Max-Age=0; path=/';
      document.cookie = 'github_access_token=; Max-Age=0; path=/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch('/api/auth/github/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Update cookie
        document.cookie = `github_user_data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${60 * 60 * 24 * 30}`;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <GitHubAuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        refreshUserData,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </GitHubAuthContext.Provider>
  );
}

export function useGitHubAuth() {
  const context = useContext(GitHubAuthContext);
  if (context === undefined) {
    throw new Error('useGitHubAuth must be used within a GitHubAuthProvider');
  }
  return context;
}
