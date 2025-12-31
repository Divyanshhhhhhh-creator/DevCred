# True Network Reputation Algorithm Setup

This guide explains how to deploy and use the on-chain reputation algorithm for TrustMyGit.

## Overview

The reputation algorithm calculates a comprehensive developer reputation score based on GitHub contributions across different organizations. It considers 6 key metrics:

- **Repository Activity (10%)**: PR count and estimated LOC
- **Tenure (15%)**: Length of contribution history
- **Language Stack (15%)**: Diversity of programming languages
- **Quality (20%)**: Merge rate and issue resolution
- **OSS Contribution (25%)**: Overall open-source contributions
- **Consistency (15%)**: Regular and sustained contributions

## Setup Process

### Step 1: Initialize ACM (Algorithm Compute Module)

Run this command to set up the ACM environment:

```bash
npm run acm:setup
```

This creates the `acm` directory with the necessary files:
- `attestations.ts` - Helper class to read attestations
- `algorithm.ts` - Reputation calculation logic

### Step 2: Prepare the ACM Environment

Generate the Attestations helper class:

```bash
npm run acm:prepare
```

This command generates helper classes to simplify reading attestations from True Network.

### Step 3: Compile the Algorithm

Compile your reputation algorithm to WebAssembly (WASM):

```bash
npm run acm:compile
```

This generates an executable `.wasm` binary that will run on-chain.

### Step 4: Test the Algorithm

Test your algorithm locally with real user data:

```bash
npm run acm:test <wallet_address>
```

Example:
```bash
npm run acm:test 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

This validates your algorithm before deploying it on-chain.

### Step 5: Deploy the Algorithm

Deploy your algorithm to True Network blockchain:

```bash
npm run acm:deploy
```

Once deployed, you'll receive an **algorithm ID** that gets automatically saved in `lib/trueNetwork/true.config.ts`.

## Using the Reputation Algorithm

### Fetching Reputation Scores

#### 1. Via API Endpoint

```typescript
// GET /api/reputation/score?address=<wallet_address>&algorithmId=<algo_id>

const response = await fetch(
  `/api/reputation/score?address=${walletAddress}&algorithmId=${algorithmId}`
);

const data = await response.json();

console.log('Overall Score:', data.overallScore);
console.log('Per-Org Scores:', data.organizations);
```

#### 2. Direct SDK Usage

```typescript
import { getTrueNetworkInstance } from '@/lib/trueNetwork/true.config';

// Initialize True Network API
const trueApi = await getTrueNetworkInstance();

// Fetch reputation score
const algorithmId = 158; // Your deployed algorithm ID
const walletAddress = 'your_wallet_address';

const score = await trueApi.getReputationScore(algorithmId, walletAddress);
console.log('Reputation Score:', score);
```

### Displaying Scores in UI

Use the `OrgReputationScores` component to show per-organization reputation:

```tsx
import { OrgReputationScores } from '@/components/OrgReputationScores';

function UserProfile({ walletAddress }) {
  return (
    <div>
      <h1>My Reputation</h1>
      <OrgReputationScores 
        walletAddress={walletAddress}
        algorithmId={158} // Optional: will use config if not provided
        showOverallScore={true}
      />
    </div>
  );
}
```

## Response Format

The API returns reputation scores in this format:

```json
{
  "success": true,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "algorithmId": 158,
  "overallScore": 782,
  "organizations": [
    {
      "orgName": "microsoft",
      "score": 87,
      "metrics": {
        "repoActivity": 15,
        "tenure": 22,
        "languageStack": 18,
        "quality": 19,
        "ossContribution": 8,
        "consistency": 5
      },
      "details": {
        "totalPRs": 45,
        "mergedPRs": 42,
        "estimatedLOC": 12500,
        "issueCount": 23,
        "repoCount": 8,
        "activeWeeks": 47,
        "tenureYears": 2.5
      }
    }
  ],
  "timestamp": 1733097600000
}
```

## Algorithm Logic

The reputation algorithm (`acm/algorithm.ts`) implements:

### `calc()` Function
Main entry point that computes overall reputation by:
1. Fetching all organization attestations
2. Weighting each org by contribution volume
3. Calculating weighted average score

### `calcOrgReputation()` Function
Returns reputation for a specific organization

### `getOrgReputationBreakdown()` Function
Provides detailed per-organization metrics

## Configuration

The algorithm is configured in `lib/trueNetwork/true.config.ts`:

```typescript
export const config: TrueConfig = {
  network: testnet,
  account: {
    address: 'your_address',
    secret: process.env.TRUE_NETWORK_SECRET_KEY
  },
  issuer: {
    name: 'attester',
    hash: '0x8153...'
  },
  algorithm: {
    id: undefined, // Set after deployment
    path: 'acm',
    schemas: [orgReputationSchema]
  },
}
```

## Troubleshooting

### "Algorithm not deployed yet" Error
- Run the deployment steps above
- Ensure `algorithm.id` is set in `true.config.ts`
- Verify your True Network account has sufficient balance

### "WebSocket is not connected" Error
- The attestation process includes automatic delays between calls
- Check your network connection
- Verify True Network testnet is accessible

### "Cannot create attestation" Error
- Ensure your account is registered as a controller
- Run the setup script: `npm run setup:truenetwork`
- Check that your schema is properly registered

## Next Steps

1. **Deploy the algorithm** using `npm run acm:deploy`
2. **Test it** with a real wallet address
3. **Integrate** the `OrgReputationScores` component in your user profiles
4. **Monitor** reputation scores as users contribute to organizations

## Verification

All reputation scores are:
- ✅ **Verifiable**: Calculated on-chain with transparent logic
- ✅ **Decentralized**: No single point of control
- ✅ **Trustworthy**: Based on immutable attestations
- ✅ **Transparent**: Open-source algorithm anyone can audit

Visit [Prism Explorer](https://prism.truenetwork.io/) to view your attestations and verify calculations.

## Support

For issues or questions:
- Check the [True Network Documentation](https://docs.truenetwork.io)
- Review the algorithm code in `acm/algorithm.ts`
- Verify attestations on [Prism](https://prism.truenetwork.io/)
