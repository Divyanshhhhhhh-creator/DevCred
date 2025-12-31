sequenceDiagram
    participant Dev as Developer
    participant Zora as Zora Protocol (NFTs)
    participant Minter as StakedMinter (Module)
    participant RP as Reputation Token (ERC20)
    participant Verifier as ZK Proof Verifier

    Note over Dev, RP: Phase 1: Onboarding
    RP->>Dev: Airdrop 100 RP (Initial Trust)

    Note over Dev, Zora: Phase 2: Claiming an Issue
    Dev->>Zora: Call mint(Issue #101)
    Zora->>Minter: Check Requirements
    Minter->>RP: Transfer 50 RP from Dev to Vault
    RP-->>Minter: Success
    Minter-->>Zora: Approved
    Zora->>Dev: Mint Issue #101 NFT (Task Assigned)

    Note over Dev, Verifier: Phase 3: Doing the Work
    Dev->>Verifier: Submit Proof (Merged PR)
    Verifier->>Minter: verifySuccess(Dev, Issue #101)

    Note over Minter, RP: Phase 4: Rewards
    Minter->>RP: Return 50 RP (Unstake)
    Minter->>RP: Mint +10 RP (Bonus)
    Minter->>Dev: Grant "Base Perk" (Access NFT)
    
    Note over Dev: Dev now has 110 RP. Can take bigger tasks.