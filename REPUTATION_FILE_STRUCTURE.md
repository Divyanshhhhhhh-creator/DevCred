# Reputation Algorithm - Complete File Structure

## New Files Created

```
TrustMyGit/
├── acm/                                    # Algorithm Compute Module
│   ├── attestations.ts                     # Helper to read attestations from blockchain
│   └── algorithm.ts                        # Core reputation calculation logic
│
├── app/
│   └── api/
│       └── reputation/
│           └── score/
│               └── route.ts                # NEW: Fetch on-chain reputation scores
│
├── components/
│   └── OrgReputationScores.tsx            # NEW: Display per-org reputation UI
│
├── REPUTATION_ALGORITHM.md                # Complete algorithm documentation
├── REPUTATION_IMPLEMENTATION.md           # Implementation summary
└── REPUTATION_QUICKSTART.md              # Quick start guide
```

## Modified Files

```
TrustMyGit/
├── lib/
│   └── trueNetwork/
│       └── true.config.ts                 # UPDATED: Added algorithm config
│
├── app/
│   └── dev/
│       └── [username]/
│           └── page.tsx                   # UPDATED: Added on-chain reputation tab
│
└── package.json                           # UPDATED: Added ACM scripts
```

## Algorithm Structure

### `acm/attestations.ts`
```typescript
export class Attestations {
  static async getOrgReputationAttestations()
  static async getOrgAttestation(orgName: string)
}
```

### `acm/algorithm.ts`
```typescript
export function calc(): number                    // Main entry point
export function calcOrgReputation(org): number    // Per-org calculation
export function getOrgReputationBreakdown()       // Detailed breakdown
```

### `app/api/reputation/score/route.ts`
```typescript
GET /api/reputation/score?address=<wallet>&algorithmId=<id>

Returns:
{
  overallScore: number,
  organizations: Array<{
    orgName: string,
    score: number,
    metrics: {...},
    details: {...}
  }>
}
```

### `components/OrgReputationScores.tsx`
```tsx
<OrgReputationScores 
  walletAddress={string}
  algorithmId={number}
  showOverallScore={boolean}
/>
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Contributions (GitHub)                              │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Calculate Metrics (lib/orgReputation.ts)                 │
│    • Repository Activity                                     │
│    • Tenure                                                  │
│    • Language Stack                                          │
│    • Quality                                                 │
│    • OSS Contribution                                        │
│    • Consistency                                             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create Attestations (app/api/reputation/attest/route.ts) │
│    • Store metrics on True Network blockchain               │
│    • Get attestation IDs and Prism URLs                     │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Compile & Deploy Algorithm (acm/algorithm.ts)            │
│    • Compile TypeScript to WebAssembly                      │
│    • Deploy to True Network                                 │
│    • Get algorithm ID                                        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Fetch Reputation (app/api/reputation/score/route.ts)     │
│    • Query True Network with algorithm ID                   │
│    • Retrieve on-chain reputation score                     │
│    • Fetch per-org breakdown                                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Display in UI (components/OrgReputationScores.tsx)       │
│    • Show overall score                                      │
│    • Display per-organization cards                         │
│    • Present detailed metrics                               │
└─────────────────────────────────────────────────────────────┘
```

## CLI Commands Added

```json
{
  "scripts": {
    "acm:setup": "npx reputation-cli setup acm",
    "acm:prepare": "npx reputation-cli acm-prepare",
    "acm:compile": "npx reputation-cli compile",
    "acm:test": "npx reputation-cli test",
    "acm:deploy": "npx reputation-cli deploy"
  }
}
```

## Configuration Updates

### `lib/trueNetwork/true.config.ts`

```typescript
export const config: TrueConfig = {
  // ... existing config
  algorithm: {
    id: undefined,              // Will be set after deployment
    path: 'acm',               // Path to algorithm directory
    schemas: [orgReputationSchema]  // Schemas used by algorithm
  },
}
```

## Integration Points

### Developer Profile Page
```typescript
// app/dev/[username]/page.tsx

<Tabs>
  <TabsTrigger value="local">Local Calculations</TabsTrigger>
  <TabsTrigger value="onchain">On-Chain Reputation</TabsTrigger>
  
  <TabsContent value="onchain">
    <OrgReputationScores 
      walletAddress={walletAddress}
      showOverallScore={true}
    />
  </TabsContent>
</Tabs>
```

## Key Features Implemented

✅ **Algorithm Calculation**
- Weighted averaging across organizations
- 6-metric scoring system
- Organization weighting by contribution volume

✅ **API Endpoint**
- Fetch overall reputation score
- Get per-organization breakdown
- Query True Network blockchain

✅ **UI Component**
- Overall score display
- Per-organization cards
- Metric breakdowns
- Detailed statistics
- Loading and error states
- Responsive design

✅ **Documentation**
- Complete setup guide
- Usage examples
- API reference
- Troubleshooting
- Quick start guide

## Dependencies

All dependencies already installed:
- `@truenetworkio/sdk` - True Network SDK
- `@radix-ui/*` - UI components
- `next` - Next.js framework
- `typescript` - Type safety

## Next Steps

1. Run: `npm run acm:setup`
2. Run: `npm run acm:prepare`
3. Run: `npm run acm:compile`
4. Run: `npm run acm:test <your_wallet>`
5. Run: `npm run acm:deploy`
6. Visit: `/dev/<your-username>` → "On-Chain Reputation" tab

## Verification

- Algorithm code: `acm/algorithm.ts`
- Attestations: https://prism.truenetwork.io/
- API test: `/api/reputation/score?address=<wallet>&algorithmId=<id>`
- UI test: `/dev/<username>` → On-Chain Reputation tab

---

**Total Lines of Code Added:** ~1,200 lines
**Files Created:** 7 new files
**Files Modified:** 3 existing files
**Components:** 1 new React component
**API Routes:** 1 new endpoint
**CLI Scripts:** 5 new commands
