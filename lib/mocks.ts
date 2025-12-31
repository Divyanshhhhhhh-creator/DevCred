export const mockUser = {
  id: "dev-1",
  githubHandle: "rishikpulhani",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
  displayName: "Rishik Pulhani",
  avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
  overallRepScore: 8750,
  ecosystems: [
    { id: "eco-1", name: "DeFi Protocol", score: 3200 },
    { id: "eco-2", name: "NFT Marketplace", score: 2850 },
    { id: "eco-3", name: "DAO Tools", score: 2700 },
  ],
};

export const mockEcosystems = [
  {
    id: "eco-1",
    name: "test-org-ethvilla",
    description: "ETHVilla hackathon organization and projects",
    projectsCount: 1,
    contributorsCount: 15,
    totalRepPool: 5000,
  },
  {
    id: "eco-2",
    name: "NFT Marketplace",
    description: "Open marketplace for digital collectibles",
    projectsCount: 8,
    contributorsCount: 156,
    totalRepPool: 35000,
  },
  {
    id: "eco-3",
    name: "DAO Tools",
    description: "Governance and collaboration tools for DAOs",
    projectsCount: 15,
    contributorsCount: 189,
    totalRepPool: 42000,
  },
  {
    id: "eco-4",
    name: "Web3 Gaming",
    description: "Blockchain gaming infrastructure",
    projectsCount: 20,
    contributorsCount: 312,
    totalRepPool: 65000,
  },
];

export const mockEcosystemDetails = {
  "eco-1": {
    id: "eco-1",
    name: "DeFi Protocol",
    description: "Decentralized finance protocol for lending and borrowing",
    projects: [
      {
        id: "proj-1",
        name: "Core Lending",
        contributors: 45,
        prs: 234,
        topContributors: [
          { handle: "rishikpulhani", score: 3200 },
          { handle: "alice.eth", score: 2800 },
          { handle: "bob_dev", score: 2500 },
        ],
        issuesCount: 18,
      },
      {
        id: "proj-2",
        name: "Yield Aggregator",
        contributors: 32,
        prs: 156,
        topContributors: [
          { handle: "charlie_code", score: 2100 },
          { handle: "rishikpulhani", score: 1900 },
          { handle: "dave_builder", score: 1700 },
        ],
        issuesCount: 12,
      },
      {
        id: "proj-3",
        name: "Governance Module",
        contributors: 28,
        prs: 98,
        topContributors: [
          { handle: "eve_dev", score: 1500 },
          { handle: "frank_eth", score: 1300 },
          { handle: "rishikpulhani", score: 1100 },
        ],
        issuesCount: 8,
      },
    ],
  },
  "eco-2": {
    id: "eco-2",
    name: "NFT Marketplace",
    description: "Open marketplace for digital collectibles",
    projects: [
      {
        id: "proj-4",
        name: "Marketplace Core",
        contributors: 38,
        prs: 189,
        topContributors: [
          { handle: "rishikpulhani", score: 2850 },
          { handle: "nft_builder", score: 2400 },
          { handle: "art_coder", score: 2200 },
        ],
        issuesCount: 15,
      },
      {
        id: "proj-5",
        name: "Creator Tools",
        contributors: 25,
        prs: 112,
        topContributors: [
          { handle: "creator_dev", score: 1800 },
          { handle: "rishikpulhani", score: 1600 },
          { handle: "tools_master", score: 1400 },
        ],
        issuesCount: 10,
      },
    ],
  },
  "eco-3": {
    id: "eco-3",
    name: "DAO Tools",
    description: "Governance and collaboration tools for DAOs",
    projects: [
      {
        id: "proj-6",
        name: "Voting System",
        contributors: 42,
        prs: 201,
        topContributors: [
          { handle: "rishikpulhani", score: 2700 },
          { handle: "dao_expert", score: 2300 },
          { handle: "vote_builder", score: 2000 },
        ],
        issuesCount: 14,
      },
    ],
  },
};

export const mockDeveloper = {
  id: "dev-1",
  displayName: "Rishik Pulhani",
  githubHandle: "rishikpulhani",
  avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
  totalRepScore: 8750,
  tokensMinted: 5000,
  tokenHistory: [
    { date: "2024-01-01", amount: 1000, price: 0.5 },
    { date: "2024-02-01", amount: 1500, price: 0.75 },
    { date: "2024-03-01", amount: 2000, price: 1.2 },
    { date: "2024-04-01", amount: 2500, price: 1.5 },
    { date: "2024-05-01", amount: 3000, price: 1.8 },
    { date: "2024-06-01", amount: 3500, price: 2.1 },
    { date: "2024-07-01", amount: 4000, price: 2.3 },
    { date: "2024-08-01", amount: 4500, price: 2.5 },
    { date: "2024-09-01", amount: 5000, price: 2.8 },
  ],
  contributions: [
    {
      ecosystemId: "eco-1",
      ecosystemName: "DeFi Protocol",
      projectId: "proj-1",
      projectName: "Core Lending",
      prCount: 45,
      description: "Implemented flash loan protection mechanism",
      url: "https://github.com/defi-protocol/core-lending/pull/234",
      date: "2024-09-15",
    },
    {
      ecosystemId: "eco-1",
      ecosystemName: "DeFi Protocol",
      projectId: "proj-2",
      projectName: "Yield Aggregator",
      prCount: 32,
      description: "Optimized yield calculation algorithm",
      url: "https://github.com/defi-protocol/yield-aggregator/pull/156",
      date: "2024-09-10",
    },
    {
      ecosystemId: "eco-2",
      ecosystemName: "NFT Marketplace",
      projectId: "proj-4",
      projectName: "Marketplace Core",
      prCount: 38,
      description: "Added batch NFT listing feature",
      url: "https://github.com/nft-marketplace/core/pull/189",
      date: "2024-09-05",
    },
    {
      ecosystemId: "eco-3",
      ecosystemName: "DAO Tools",
      projectId: "proj-6",
      projectName: "Voting System",
      prCount: 28,
      description: "Implemented quadratic voting mechanism",
      url: "https://github.com/dao-tools/voting/pull/201",
      date: "2024-08-28",
    },
  ],
};

export const mockStakeIssues = [
  {
    id: "issue-1",
    title: "Implement Multi-Sig Wallet Integration",
    description: "Add support for Gnosis Safe and other multi-sig wallets for enhanced security in DeFi operations",
    stakeAmountRequired: 500,
    stakedBy: [
      { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7", amount: 200 },
      { address: "0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb8", amount: 150 },
    ],
  },
  {
    id: "issue-2",
    title: "Gas Optimization for Batch Transactions",
    description: "Optimize smart contract to reduce gas costs for batch token transfers by at least 30%",
    stakeAmountRequired: 750,
    stakedBy: [
      { address: "0x456d35Cc6634C0532925a3b844Bc9e7595f0bEb9", amount: 300 },
    ],
  },
  {
    id: "issue-3",
    title: "Cross-Chain Bridge Implementation",
    description: "Build a secure bridge for token transfers between Ethereum and Polygon networks",
    stakeAmountRequired: 1000,
    stakedBy: [],
  },
  {
    id: "issue-4",
    title: "Advanced Analytics Dashboard",
    description: "Create comprehensive analytics dashboard with real-time TVL, APY, and user metrics",
    stakeAmountRequired: 600,
    stakedBy: [
      { address: "0x789d35Cc6634C0532925a3b844Bc9e7595f0bEb0", amount: 400 },
      { address: "0xabcd35Cc6634C0532925a3b844Bc9e7595f0bEb1", amount: 100 },
    ],
  },
  {
    id: "issue-5",
    title: "Implement Slashing Mechanism",
    description: "Design and implement a fair slashing mechanism for validator misbehavior",
    stakeAmountRequired: 800,
    stakedBy: [],
  },
];
