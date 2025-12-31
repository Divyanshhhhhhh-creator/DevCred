"use client";

import { useState, useEffect } from 'react';
import { GitHubUserStats } from './github';

export function useGitHubAuth() {
  const [user, setUser] = useState<GitHubUserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user data in cookies
    const checkAuth = () => {
      try {
        const userDataCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('github_user_data='));
        
        if (userDataCookie) {
          const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'read:user user:email read:org repo';
    
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

  return {
    user,
    loading,
    signIn,
    signOut,
    refreshUserData,
    isAuthenticated: !!user,
  };
}
