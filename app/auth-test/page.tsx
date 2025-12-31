"use client";

import React, { useEffect, useState } from 'react';
import { useGitHubAuth } from '@/lib/GitHubAuthContext';

export default function AuthTestPage() {
  const { user, isAuthenticated, loading } = useGitHubAuth();
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Check all cookies
    setCookies(document.cookie);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Loading State:</h2>
          <p>{loading ? 'Loading...' : 'Not loading'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">Is Authenticated:</h2>
          <p>{isAuthenticated ? 'YES ✅' : 'NO ❌'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">User Data:</h2>
          <pre className="text-xs overflow-auto">
            {user ? JSON.stringify(user, null, 2) : 'No user data'}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-bold mb-2">All Cookies:</h2>
          <pre className="text-xs overflow-auto break-all">
            {cookies || 'No cookies found'}
          </pre>
        </div>
      </div>
    </div>
  );
}
