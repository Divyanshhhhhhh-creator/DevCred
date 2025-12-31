# Quick Reference: Using GitHub Authentication

## Import the Hook
```tsx
import { useGitHubAuth } from '@/lib/GitHubAuthContext';
```

## Access Auth State
```tsx
const { user, isAuthenticated, signIn, signOut, loading, refreshUserData } = useGitHubAuth();
```

## Available Data

### user.user (GitHub Profile)
```tsx
user.user.login           // Username (e.g., "octocat")
user.user.name            // Display name
user.user.avatar_url      // Profile picture URL
user.user.bio             // User bio
user.user.email           // Email address
user.user.public_repos    // Number of public repos
user.user.followers       // Follower count
user.user.following       // Following count
```

### user.repos (All Repositories)
```tsx
user.repos.length         // Total number of repos
user.repos[0].name        // Repo name
user.repos[0].full_name   // owner/repo
user.repos[0].description // Repo description
user.repos[0].stargazers_count  // Stars
user.repos[0].language    // Primary language
user.repos[0].html_url    // GitHub URL
```

### user.organizations (Organizations)
```tsx
user.organizations.length           // Number of orgs
user.organizations[0].login         // Org name
user.organizations[0].avatar_url    // Org logo
user.organizations[0].description   // Org description
```

### Stats
```tsx
user.totalStars           // Total stars across all repos
user.totalPRsMerged       // Total merged pull requests
user.prsByOrganization    // { "org-name": count, ... }
```

## Common Patterns

### Sign In Button
```tsx
{!isAuthenticated && (
  <button onClick={signIn}>Sign in with GitHub</button>
)}
```

### Sign Out Button
```tsx
{isAuthenticated && (
  <button onClick={signOut}>Sign out</button>
)}
```

### Loading State
```tsx
{loading && <div>Loading...</div>}
```

### User Avatar
```tsx
{isAuthenticated && (
  <img src={user.user.avatar_url} alt={user.user.name} />
)}
```

### Display Stats
```tsx
{isAuthenticated && (
  <div>
    <p>{user.totalStars} ⭐</p>
    <p>{user.totalPRsMerged} PRs merged</p>
    <p>{user.repos.length} repositories</p>
    <p>{user.organizations.length} organizations</p>
  </div>
)}
```

### Full Profile Component
```tsx
import { GitHubUserProfile } from '@/components/GitHubUserProfile';

{isAuthenticated && <GitHubUserProfile userStats={user} />}
```

### Refresh Data
```tsx
<button onClick={refreshUserData}>
  Refresh Stats
</button>
```

## Example: Complete Component
```tsx
"use client";

import { useGitHubAuth } from '@/lib/GitHubAuthContext';
import { GitHubUserProfile } from '@/components/GitHubUserProfile';

export default function MyPage() {
  const { user, isAuthenticated, signIn, signOut, loading } = useGitHubAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Welcome!</h1>
        <button onClick={signIn}>Sign in with GitHub</button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <img src={user.user.avatar_url} alt={user.user.name} />
        <h1>{user.user.name || user.user.login}</h1>
        <button onClick={signOut}>Sign out</button>
      </div>
      <GitHubUserProfile userStats={user} />
    </div>
  );
}
```

## TypeScript Types

All types are exported from `lib/github.ts`:
- `GitHubUser`
- `GitHubRepo`
- `GitHubPullRequest`
- `GitHubOrganization`
- `GitHubUserStats` (the complete user object)
