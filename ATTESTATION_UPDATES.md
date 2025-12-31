# Automatic Attestation Updates

## Overview

Your TrustMyGit platform now automatically updates on-chain attestations whenever you create a new post! This ensures your reputation scores always reflect your latest GitHub contributions.

## How It Works

### 1. Initial Attestation Creation

When you first connect your wallet and GitHub account:
1. System fetches your GitHub contribution data
2. Calculates reputation scores per organization
3. Creates on-chain attestations on True Network
4. Stores attestation indices in localStorage

### 2. Automatic Updates on Post Creation

Every time you click the "Post" button on localhost:3000:

```
User Creates Post
    ↓
Post is Added to Feed
    ↓
Background Process Triggers
    ↓
Fetch Fresh GitHub Data
    ↓
Calculate New Reputation Scores
    ↓
Update Existing Attestations on True Network
    ↓
Create New Attestations for New Organizations
    ↓
Update localStorage with New Data
```

### 3. What Gets Updated

- **Existing Attestations**: Uses `updateAttestation()` to update:
  - Total score
  - All 6 metric scores (repo activity, tenure, language, quality, OSS, consistency)
  - Detailed metrics (PRs, LOC, issues, repos, active weeks, tenure)
  - Timestamp

- **New Organizations**: Creates fresh attestations for any organizations you've started contributing to

## Implementation Details

### API Endpoint: `/api/reputation/update`

**POST Request:**
```typescript
{
  walletAddress: string,
  username: string,
  existingAttestations: {
    [orgName: string]: {
      attestationIndex: number,
      attestationId: string,
      score: number,
      prismUrl: string
    }
  }
}
```

**Response:**
```typescript
{
  success: true,
  message: "Attestations updated successfully",
  updated: [
    {
      orgName: "microsoft",
      success: true,
      attestationId: "123",
      attestationHash: "0x...",
      prismUrl: "https://prism.truenetwork.io/...",
      oldScore: 75,
      newScore: 82
    }
  ],
  created: [
    {
      orgName: "vercel",
      success: true,
      attestationId: "124",
      attestationIndex: 124,
      prismUrl: "https://prism.truenetwork.io/..."
    }
  ],
  totalOrganizations: 12
}
```

### Frontend Integration

**In `app/page.tsx`:**

```typescript
const handleCreatePost = async () => {
  // ... create post logic ...
  
  // Trigger background update if wallet + GitHub connected
  if (isWalletConnected && isAuthenticated && walletAddress) {
    updateAttestationsInBackground();
  }
};

const updateAttestationsInBackground = async () => {
  // Get existing attestations from localStorage
  const existingAttestations = JSON.parse(
    localStorage.getItem(`attestations_${username}`) || '{}'
  );
  
  // Call update API
  const response = await fetch('/api/reputation/update', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      username,
      existingAttestations
    })
  });
  
  // Update localStorage with new data
  // ...
};
```

### True Network Schema Method

The update uses True Network's `updateAttestation()` method:

```typescript
const output = await orgReputationSchema.updateAttestation(
  api,                                    // TrueApi instance
  walletAddress,                          // User's wallet
  existingAttestation.attestationIndex,   // Index from initial attestation
  updatedData                             // New reputation data
);
```

## Features

✅ **Automatic Updates**: No manual action needed, happens in background
✅ **Smart Detection**: Only updates existing attestations, creates new ones for new orgs
✅ **Rate Limiting**: 2-second delay between operations to prevent connection issues
✅ **Error Handling**: Gracefully handles failures, continues with other organizations
✅ **Client-Side Storage**: Keeps track of attestation indices in localStorage
✅ **Transparent Logging**: Console logs show what's being updated in real-time

## Console Output Example

When you create a post, you'll see:

```
🔄 Triggering attestation updates after post creation...
Fetching fresh GitHub data and updating attestations...
🔄 Updating attestations for: DarkLord017 with wallet: 0x742...
Initializing TrueNetwork connection...
🔄 Updating attestation for microsoft (index: 15)
✅ Updated attestation for microsoft
⏳ Waiting 2 seconds before next operation...
🆕 Creating new attestation for vercel
✅ Created new attestation for vercel
✅ Attestations updated: { updated: [...], created: [...] }
🎉 Successfully updated/created 12 attestations
```

## Benefits

### For Users
- Always have up-to-date reputation scores
- Automatic tracking of new contributions
- Verifiable on-chain proof of work
- No manual refresh needed

### For the Platform
- Real-time reputation accuracy
- Increased engagement (every post updates reputation)
- Blockchain-backed credibility
- Transparent and auditable

## Verification

### Check Updated Attestations on Prism

1. Create a post on localhost:3000
2. Check console for update confirmation
3. Visit Prism URLs in the response:
   ```
   https://prism.truenetwork.io/query/0x...
   ```
4. Verify timestamp and score changes

### LocalStorage Structure

```javascript
// Check in browser console
localStorage.getItem('attestations_DarkLord017')

// Returns:
{
  "microsoft": {
    "attestationIndex": 15,
    "attestationId": "15",
    "score": 8200,
    "prismUrl": "https://prism.truenetwork.io/..."
  },
  "vercel": {
    "attestationIndex": 124,
    "attestationId": "124",
    "score": 7500,
    "prismUrl": "https://prism.truenetwork.io/..."
  }
}
```

## Error Handling

### If Update Fails
- Error is logged to console
- Other organizations still get updated
- User can manually trigger by posting again

### If GitHub Data Fetch Fails
- Update process stops gracefully
- Original attestations remain unchanged
- Error message returned in response

### If Network Connection Issues
- 2-second delays prevent WebSocket exhaustion
- Each operation is independent
- Partial success is still recorded

## Performance

- **Background Processing**: Doesn't block UI
- **Batched Operations**: All orgs updated in one request
- **Efficient**: Only fetches data once, updates all
- **Optimized**: Rate-limited to prevent API throttling

## Future Enhancements

Potential improvements:
- Show toast notification when updates complete
- Display update progress indicator
- Add manual "Refresh Reputation" button
- Batch updates across multiple posts
- Webhook-based updates from GitHub

## Testing

### Manual Test Flow

1. **Setup**:
   ```bash
   npm run dev
   ```

2. **Create Initial Attestations**:
   - Connect wallet
   - Connect GitHub
   - Let initial attestations complete

3. **Make Some GitHub Contributions**:
   - Create a PR
   - Close an issue
   - Contribute to a new organization

4. **Test Update**:
   - Go to localhost:3000
   - Create a new post
   - Check console for update logs
   - Verify Prism URLs show updated data

5. **Verify**:
   - Check localStorage for updated scores
   - Visit Prism explorer
   - Confirm timestamp is recent

## Troubleshooting

### "Not authenticated" Error
- Ensure GitHub token is valid
- Check cookies are not blocked
- Try logging out and back in

### "Wallet address required" Error
- Reconnect your wallet
- Check localStorage has wallet_address

### Attestation Index Not Found
- May need to regenerate initial attestations
- Clear localStorage and start fresh
- Ensure initial attestation completed successfully

### Updates Not Triggering
- Check browser console for errors
- Verify wallet and GitHub both connected
- Ensure hasCoin is true

## Summary

Your reputation system is now **fully dynamic**! Every post you make automatically:
- ✅ Fetches your latest GitHub contributions
- ✅ Recalculates your reputation scores
- ✅ Updates existing on-chain attestations
- ✅ Creates new attestations for new organizations
- ✅ Keeps everything in sync

This creates a **living, breathing reputation system** that grows with your contributions! 🚀
