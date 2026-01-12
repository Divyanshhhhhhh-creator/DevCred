<div align="center">
  
  <!-- Add your logo to assets/logo.png -->
  <img src="./assets/image.png" alt="TrustMyGit Logo" width="180" />
  
  # DevCred
  
  ### *Decentralized Developer Reputation & Staking Protocol*

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?style=for-the-badge&logo=coinbase)](https://base.org/)
[![True Network](https://img.shields.io/badge/Powered%20by-True%20Network-00D4AA?style=for-the-badge)](https://truenetwork.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p align="center">
    <strong>Transforming GitHub contributions into verifiable on-chain reputation</strong>
  </p>

[Live Demo](https://trustmygit.vercel.app) | [Documentation](#documentation) | [Quick Start](#quick-start) | [How It Works](#how-it-works)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Smart Contracts](#smart-contracts)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**DevCred** is a decentralized protocol that bridges the gap between GitHub contributions and blockchain-based reputation systems. It enables developers to:

- Build **verifiable, on-chain reputation** from real GitHub activity
- **Stake reputation** on issues and earn rewards for completed work
- **Tokenize developer reputation** with bonding curve economics
- **Verify contributions** using TLSNotary cryptographic proofs

```mermaid
flowchart LR
    subgraph GitHub["GitHub Activity"]
        A[Commits]
        B[Pull Requests]
        C[Issues]
        D[Code Reviews]
    end

    subgraph Verify["TLSNotary"]
        E[ZK Proof Generation]
    end

    subgraph OnChain["On-Chain"]
        F[Reputation Score]
        G[Developer Token]
        H[NFT Badge]
    end

    GitHub --> Verify
    Verify --> OnChain

    style GitHub fill:#24292e,stroke:#fff,color:#fff
    style Verify fill:#6366f1,stroke:#fff,color:#fff
    style OnChain fill:#10b981,stroke:#fff,color:#fff
```

---

## Key Features

<table>
<tr>
<td width="50%">

### _Reputation System_

- **6 Key Metrics**: Repository activity, tenure, language diversity, code quality, OSS contributions, consistency
- **Per-Organization Scores**: Track reputation across multiple ecosystems
- **On-Chain Attestations**: True Network powered verifiable credentials

</td>
<td width="50%">

### _Issue Staking_

- **Skin-in-the-Game**: Stake reputation to claim issues
- **Automated Rewards**: ETH + reputation on successful completion
- **Slashing Mechanism**: Incentivize quality and timely delivery

</td>
</tr>
<tr>
<td width="50%">

### _Developer Tokens_

- **Personal Tokens**: Launch tokens backed by your reputation
- **Bonding Curves**: Fair price discovery with GDA mechanics
- **Liquidity Mining**: Trade developer tokens on-chain

</td>
<td width="50%">

### _TLSNotary Verification_

- **Cryptographic Proofs**: Verify PR merges without trusting a server
- **Zero-Knowledge Ready**: Privacy-preserving contribution proofs
- **Tamper-Proof**: Immutable verification records

</td>
</tr>
</table>

---

## Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Frontend["Frontend Layer"]
        GH[GitHub OAuth] --> NextJS[Next.js 14 App]
        NextJS --> TN[True Network SDK]
    end

    subgraph Verification["Verification Layer"]
        TLSN[TLSNotary Verifier]
    end

    subgraph Blockchain["Blockchain Layer"]
        NextJS --> SC[Smart Contracts]
        TLSN --> SC
        SC <--> BASE[(Base Sepolia L2)]
    end

    subgraph Contracts["Smart Contract Suite"]
        IS[IssueStaking]
        DT[DeveloperToken]
        TF[TokenFactory]
        BC[BondingCurve]
    end

    SC --- IS
    SC --- DT
    SC --- TF
    SC --- BC

    style Frontend fill:#1e293b,stroke:#3b82f6,color:#fff
    style Verification fill:#7c3aed,stroke:#a78bfa,color:#fff
    style Blockchain fill:#065f46,stroke:#10b981,color:#fff
    style Contracts fill:#78350f,stroke:#f59e0b,color:#fff
```

### Data Flow

```mermaid
flowchart LR
    A["GitHub API"] -->|Fetch| B["Activity Data"]
    B -->|Process| C["Calculate Metrics"]
    C -->|Submit| D["Attest On-Chain"]

    subgraph Metrics["Reputation Metrics"]
        direction TB
        M1["PRs & Commits"]
        M2["Lines of Code"]
        M3["Languages"]
        M4["Merge Rate"]
    end

    B --> Metrics
    Metrics --> C
```

#### Reputation Score Formula

```mermaid
pie title Reputation Score Weights (Total: 1000 points)
    "OSS Contribution" : 25
    "Code Quality" : 20
    "Language Diversity" : 15
    "Tenure" : 15
    "Consistency" : 15
    "Repository Activity" : 10
```

---

## How It Works

### Issue Staking Flow

```mermaid
flowchart TB
    subgraph Phase1["Phase 1: Onboarding"]
        A[Developer Registers] --> B[Receives 50 Initial Reputation]
    end

    subgraph Phase2["Phase 2: Issue Creation"]
        C[Ecosystem Owner] --> D[Creates GitHub Issue]
        D --> E[Locks Reputation Stake]
        E --> F[Sets ETH Reward + Deadline]
    end

    subgraph Phase3["Phase 3: Assignment"]
        G[Developer Browses Issues] --> H[Stakes Reputation]
        H --> I[Gets Assigned]
    end

    subgraph Phase4["Phase 4: Work"]
        J[Creates Pull Request] --> K[PR Gets Merged]
        K --> L[Submits Evidence]
    end

    subgraph Phase5["Phase 5: Verification"]
        M[TLSNotary Verifies] --> N[completeByProof Called]
        N --> O{"Rewards"}
        O --> P["Stake Returned"]
        O --> Q["ETH Transferred"]
        O --> R["Reputation Increased"]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5

    style Phase1 fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style Phase2 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style Phase3 fill:#f59e0b,stroke:#d97706,color:#fff
    style Phase4 fill:#10b981,stroke:#059669,color:#fff
    style Phase5 fill:#06b6d4,stroke:#0891b2,color:#fff
```

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub
    participant App as TrustMyGit
    participant SC as Smart Contracts
    participant TN as True Network

    Note over Dev,TN: Authentication & Reputation Setup
    Dev->>GH: OAuth Login
    GH-->>App: Access Token
    App->>GH: Fetch Contributions (PRs, Commits)
    GH-->>App: Activity Data
    App->>App: Calculate Reputation Score
    App->>TN: Create Attestation
    TN-->>App: Attestation ID

    Note over Dev,SC: Issue Staking Flow
    Dev->>App: Browse Available Issues
    Dev->>App: Select Issue & Stake
    App->>SC: acceptAssignment(issueId, stake)
    SC-->>App: Reputation Locked

    Note over Dev,GH: Work & Submission
    Dev->>GH: Create Pull Request
    GH-->>Dev: PR Merged
    Dev->>App: Submit Work Evidence
    App->>SC: submitWork(issueId, prLink)

    Note over App,SC: Verification & Rewards
    App->>App: TLSNotary Verification
    App->>SC: completeByProof(issueId)
    SC-->>Dev: ETH Reward + Reputation
```

### Slashing Mechanics

```mermaid
flowchart TB
    subgraph ScenarioA["Scenario A: Missed Deadline"]
        A1[Deadline Passed] --> A2{Submission?}
        A2 -->|No| A3["Assignee Stake SLASHED"]
        A3 --> A4["Transferred to Issue Owner"]
    end

    subgraph ScenarioB["Scenario B: Disputed Work"]
        B1[Work Submitted] --> B2[Owner Disputes]
        B2 --> B3["Arbiter Reviews"]
        B3 --> B4{Verdict?}
        B4 -->|Owner Wins| B5["Assignee Slashed"]
        B4 -->|Assignee Wins| B6["Owner Slashed"]
    end

    style ScenarioA fill:#dc2626,stroke:#991b1b,color:#fff
    style ScenarioB fill:#ea580c,stroke:#c2410c,color:#fff
```

---

## Smart Contracts

### Contract Addresses (Base Sepolia)

| Contract           | Address                                      | Description                  |
| ------------------ | -------------------------------------------- | ---------------------------- |
| **DevWorkFactory** | `0x7BE18dEe46C130102aa44572B2a4B8788DB0C40B` | Factory for developer tokens |
| **IssueStaking**   | _Deployed per ecosystem_                     | Issue staking and rewards    |

### Contract Architecture

```mermaid
flowchart TB
    subgraph Factory["DeveloperTokenFactory"]
        F1["launchToken()"]
        F1 --> DT["DeveloperToken"]
        F1 --> BC["SimpleBondingCurve"]
    end

    subgraph Staking["IssueStaking Contract"]
        direction TB
        S1["registerDeveloper()"] --> S2["50 Initial Rep"]
        S3["createIssue(stake, deadline)"]
        S4["acceptAssignment(id, stake)"]
        S5["submitWork(id, evidenceURI)"]
        S6["completeByProof(id, evidence)"]
        S7["finalize(id)"]
    end

    subgraph States["Issue State Machine"]
        ST1([Open]) --> ST2([Assigned])
        ST2 --> ST3([Submitted])
        ST3 --> ST4([Accepted])
        ST4 --> ST5([Closed])
        ST2 -.-> ST6([Rejected])
        ST3 -.-> ST7([Disputed])
    end

    DT <--> BC
    Staking --> States

    style Factory fill:#1e40af,stroke:#3b82f6,color:#fff
    style Staking fill:#065f46,stroke:#10b981,color:#fff
    style States fill:#7c3aed,stroke:#a78bfa,color:#fff
```

### Reputation Scoring Algorithm

> **Formula:** `Final Score = Σ (Metric × Weight)` → Range: **0-1000**

```mermaid
flowchart LR
    subgraph Inputs["Input Metrics"]
        I1["Repository Activity"]
        I2["Tenure"]
        I3["Language Stack"]
        I4["Quality"]
        I5["OSS Contribution"]
        I6["Consistency"]
    end

    subgraph Weights["Weights"]
        W1["10%"]
        W2["15%"]
        W3["15%"]
        W4["20%"]
        W5["25%"]
        W6["15%"]
    end

    subgraph Output["Output"]
        O1["Reputation Score 0-1000"]
    end

    I1 --> W1
    I2 --> W2
    I3 --> W3
    I4 --> W4
    I5 --> W5
    I6 --> W6

    W1 & W2 & W3 & W4 & W5 & W6 --> O1

    style Inputs fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Weights fill:#065f46,stroke:#10b981,color:#fff
    style Output fill:#7c3aed,stroke:#a78bfa,color:#fff
```

---

## Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br>Next.js 14
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind CSS
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=solidity" width="48" height="48" alt="Solidity" />
<br>Solidity
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=github" width="48" height="48" alt="GitHub" />
<br>GitHub API
</td>
</tr>
</table>

| Category            | Technology                   |
| ------------------- | ---------------------------- |
| **Framework**       | Next.js 14 (App Router)      |
| **Language**        | TypeScript 5.x               |
| **Styling**         | Tailwind CSS + shadcn/ui     |
| **Web3**            | wagmi + viem + RainbowKit    |
| **Smart Contracts** | Solidity 0.8.20 + Foundry    |
| **Blockchain**      | Base Sepolia (L2)            |
| **Reputation**      | True Network SDK             |
| **Charts**          | Recharts                     |
| **Testing**         | Jest + React Testing Library |

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **MetaMask** or any EVM wallet
- **Base Sepolia ETH** ([Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Divyanshhhhhhh-creator/DevCred.git
cd DevCred

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Configure your .env.local
# GITHUB_CLIENT_ID=your_github_oauth_client_id
# GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
# NEXT_PUBLIC_TRUE_NETWORK_API_KEY=your_true_network_key

# 5. Run the development server
npm run dev

# 6. Open http://localhost:3000
```

### Deploy Reputation Algorithm (Optional)

```bash
# Set up ACM (Algorithm Compute Module)
npm run acm:setup

# Prepare attestation helpers
npm run acm:prepare

# Compile to WebAssembly
npm run acm:compile

# Test with your wallet address
npm run acm:test <your_wallet_address>

# Deploy to True Network
npm run acm:deploy
```

### Build Smart Contracts (Optional)

```bash
cd contracts

# Install Foundry dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy (requires private key)
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast
```

---

## Project Structure

```
DevCred/
├── app/                             # Next.js App Router
│   ├── api/                         # API Routes
│   │   ├── auth/github/             # GitHub OAuth endpoints
│   │   ├── ecosystem/issues/        # Ecosystem issues API
│   │   └── reputation/              # Reputation score APIs
│   ├── dev/[username]/              # Developer profile pages
│   ├── developer/                   # Developer dashboard & tokens
│   ├── ecosystem/                   # Ecosystem pages
│   ├── issues/                      # Issue browsing & staking
│   │   └── [issueId]/submit/        # PR submission flow
│   └── org/[orgName]/               # Organization pages
│
├── components/                      # React Components
│   ├── ui/                          # shadcn/ui base components
│   ├── AuthModal.tsx                # GitHub authentication
│   ├── StakeModal.tsx               # Issue staking modal
│   ├── StakedIssueCard.tsx          # Staked issue display
│   ├── TLSNotaryVerificationModal/  # TLSNotary verification
│   └── OrgReputationScores.tsx      # Reputation display
│
├── contracts/                       # Solidity Smart Contracts
│   └── src/
│       ├── IssueStaking.sol         # Core staking contract
│       ├── DeveloperToken.sol       # ERC20 dev tokens
│       ├── DeveloperTokenFactory.sol # Token factory
│       └── SimpleBondingCurve.sol   # GDA bonding curve
│
├── lib/                             # Utilities & Services
│   ├── contracts/                   # Contract ABIs & interactions
│   │   ├── abis.ts                  # Contract ABIs
│   │   ├── config.ts                # Network config
│   │   └── interactions.ts          # Contract functions
│   ├── trueNetwork/                 # True Network integration
│   │   ├── schemas.ts               # Attestation schemas
│   │   └── true.config.ts           # SDK configuration
│   ├── github.ts                    # GitHub API client
│   └── orgReputation.ts             # Reputation calculations
│
├── acm/                             # Algorithm Compute Module
│   ├── algorithm.ts                 # Reputation algorithm
│   ├── attestations.ts              # Attestation helpers
│   └── assembly/                    # AssemblyScript for WASM
│
└── Documentation
    ├── REPUTATION_ALGORITHM.md      # Algorithm setup guide
    ├── REPUTATION_IMPLEMENTATION.md # Implementation details
    └── QUICK_REFERENCE.md           # Quick reference
```

│ └── orgReputation.ts # Reputation calculations
│
├── 🧪 acm/ # Algorithm Compute Module
│ ├── algorithm.ts # Reputation algorithm
│ ├── attestations.ts # Attestation helpers
│ └── assembly/ # AssemblyScript for WASM
│
└── 📄 Documentation
├── REPUTATION_ALGORITHM.md # Algorithm setup guide
├── REPUTATION_IMPLEMENTATION.md # Implementation details
└── QUICK_REFERENCE.md # Quick reference

````

---

## API Reference

### Reputation Endpoints

#### Get Reputation Score

```http
GET /api/reputation/score?address={wallet}&algorithmId={id}
````

**Response:**

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
      }
    }
  ]
}
```

#### Create Attestation

```http
POST /api/reputation/attest
Content-Type: application/json

{
  "walletAddress": "0x...",
  "githubUsername": "developer",
  "orgName": "organization"
}
```

### Issue Endpoints

#### Get Ecosystem Issues

```http
GET /api/ecosystem/issues?ecosystemId={id}
```

#### Check PR Status

```http
GET /api/github/pr/status?owner={owner}&repo={repo}&prNumber={number}
```

---

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run contract tests
cd contracts && forge test -vvv
```

---

## Roadmap

- [x] GitHub OAuth Integration
- [x] On-Chain Reputation Attestations (True Network)
- [x] Issue Staking Smart Contracts
- [x] Developer Token Factory
- [x] Bonding Curve Mechanics
- [ ] TLSNotary Integration (Production)
- [ ] zkProofs for Contribution Verification
- [ ] Multi-chain Deployment
- [ ] DAO Governance for Disputes
- [ ] Mobile App

---

## 👥 Contributors

### **Arjun Madhav**
**1️⃣ System Design & Architecture**
* Define problem statement & scope
* Design overall system architecture
* Decide reputation metrics & weights
* Choose blockchain + wallet stack
* Design GitHub → on-chain data flow
* Security & trust assumptions
* Documentation of architecture

### **Ishan Aditya**
**2️⃣ Frontend (Next.js / React)**
* Project setup (Next.js, Tailwind, UI lib)
* GitHub OAuth integration
* Wallet connection (MetaMask / Wagmi)
* User profile page
* Reputation visualization UI
* Issue staking UI
* Token balance display
* Transaction status handling
* Error & loading states
* Responsive layout
* UI polish & UX improvements
* Frontend env & config handling

### **Divyansh Shukla**
**3️⃣ Smart Contracts**
* Contract architecture design
* Developer token contract
* Token factory contract
* Issue staking contract
* Bonding curve logic
* Reward distribution logic
* Access control & modifiers
* Contract testing
* Gas optimization
* Deployment scripts
* Contract documentation

### **Tarun Kumar**
**4️⃣ Backend & Reputation Engine**
* GitHub API integration
* Fetch PRs, commits, issues
* Reputation scoring algorithm
* Data normalization & weighting
* TLSNotary / verification logic
* Backend API routes
* Blockchain interaction layer
* Attestation generation
* Error handling & retries
* Backend configuration
* Backend documentation

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [True Network](https://truenetwork.io/) - On-chain reputation infrastructure
- [Base](https://base.org/) - L2 blockchain
- [TLSNotary](https://tlsnotary.org/) - Cryptographic verification
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Foundry](https://book.getfoundry.sh/) - Smart contract development

---

<div align="center">

### Built with love for the developer community

<a href="https://github.com/Rishikpulhani/TrustMyGit/stargazers">
  <img src="https://img.shields.io/github/stars/Rishikpulhani/TrustMyGit?style=social" alt="Stars" />
</a>
<a href="https://github.com/Rishikpulhani/TrustMyGit/network/members">
  <img src="https://img.shields.io/github/forks/Rishikpulhani/TrustMyGit?style=social" alt="Forks" />
</a>

**[Back to Top](#trustmygit)**

</div>
