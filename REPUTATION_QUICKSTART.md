# 🚀 Quick Start: Deploy Reputation Algorithm

## Prerequisites
- ✅ Attestations already created (8+ organizations)
- ✅ True Network account configured
- ✅ Wallet connected and GitHub authenticated

## Deployment Commands (Run in Order)

```bash
# Step 1: Setup ACM environment
npm run acm:setup

# Step 2: Prepare attestation helpers
npm run acm:prepare

# Step 3: Compile algorithm to WebAssembly
npm run acm:compile

# Step 4: Test with your wallet address
npm run acm:test jvkXtXF15aZe3fEeRMh3n8oqTGcyEmxfpuojVSqk8bJhsoo

# Step 5: Deploy to True Network blockchain
npm run acm:deploy
```

## After Deployment

Your algorithm ID will be automatically saved to:
`lib/trueNetwork/true.config.ts`

## View Your Reputation

1. Go to: `/dev/<your-github-username>`
2. Click the "On-Chain Reputation" tab
3. See your reputation scores calculated on-chain!

## API Usage

```typescript
// Fetch reputation score
const response = await fetch(
  `/api/reputation/score?address=${walletAddress}&algorithmId=${algoId}`
);
const data = await response.json();

console.log('Overall Score:', data.overallScore);
data.organizations.forEach(org => {
  console.log(`${org.orgName}: ${org.score}`);
});
```

## Component Usage

```tsx
import { OrgReputationScores } from '@/components/OrgReputationScores';

<OrgReputationScores 
  walletAddress={walletAddress}
  algorithmId={158} // optional
  showOverallScore={true}
/>
```

## Files Created

- `acm/attestations.ts` - Attestation reader helper
- `acm/algorithm.ts` - Reputation calculation logic
- `app/api/reputation/score/route.ts` - API endpoint
- `components/OrgReputationScores.tsx` - UI component
- `REPUTATION_ALGORITHM.md` - Full documentation
- `REPUTATION_IMPLEMENTATION.md` - Implementation summary

## What Gets Calculated

Your reputation score (0-1000) is based on:
- **Repository Activity** (10%): PRs and LOC
- **Tenure** (15%): Contribution history
- **Language Stack** (15%): Language diversity
- **Quality** (20%): Merge rate and issues
- **OSS Contribution** (25%): Open-source impact
- **Consistency** (15%): Regular contributions

Weighted across all organizations you contribute to!

## Verification

View your attestations on Prism:
https://prism.truenetwork.io/

Example:
- FilOzone: https://prism.truenetwork.io/query/0x9d5142c07e1b62920caced32bcffc13a5d0970244a600abc434e11cd4c306471
- 0xV0YD: https://prism.truenetwork.io/query/0x6d96824094323d560f8b46a239cdf2a484c44e8e995fd86c78bc85dace57492c

## Need Help?

See full documentation: `REPUTATION_ALGORITHM.md`
