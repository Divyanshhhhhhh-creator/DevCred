import {
  mockUser,
  mockEcosystems,
  mockEcosystemDetails,
  mockDeveloper,
  mockStakeIssues,
} from "./mocks";

// Type definitions
export interface User {
  id: string;
  githubHandle: string;
  walletAddress: string;
  displayName: string;
  avatarUrl: string;
  overallRepScore: number;
  ecosystems: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}

export interface Ecosystem {
  id: string;
  name: string;
  description?: string;
  projectsCount: number;
  contributorsCount: number;
  totalRepPool: number;
}

export interface EcosystemDetails {
  id: string;
  name: string;
  description: string;
  projects: Array<{
    id: string;
    name: string;
    contributors: number;
    prs: number;
    topContributors: Array<{
      handle: string;
      score: number;
    }>;
    issuesCount: number;
  }>;
}

export interface Developer {
  id: string;
  displayName: string;
  githubHandle: string;
  avatarUrl: string;
  totalRepScore: number;
  tokensMinted: number;
  tokenHistory: Array<{
    date: string;
    amount: number;
    price?: number;
  }>;
  contributions: Array<{
    ecosystemId: string;
    ecosystemName: string;
    projectId: string;
    projectName: string;
    prCount: number;
    description: string;
    url: string;
    date: string;
  }>;
}

export interface StakeIssue {
  id: string;
  title: string;
  description: string;
  stakeAmountRequired: number;
  stakedBy: Array<{
    address: string;
    amount: number;
  }>;
  labels?: string[];
  html_url?: string;
  number?: number;
  repo_name?: string;
}

export interface StakeRequest {
  issueId: string;
  stakerAddress: string;
  amount: number;
}

export interface MintTokenRequest {
  developerId: string;
  amount: number;
}

// API Client
class ApiClient {
  private delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async getMe(): Promise<User> {
    await this.delay(500);
    return mockUser;
  }

  async getEcosystems(): Promise<Ecosystem[]> {
    await this.delay(500);
    return mockEcosystems;
  }

  async getEcosystem(ecosystemId: string): Promise<EcosystemDetails | null> {
    await this.delay(500);
    return mockEcosystemDetails[ecosystemId as keyof typeof mockEcosystemDetails] || null;
  }

  async getDeveloper(devId: string): Promise<Developer | null> {
    await this.delay(500);
    if (devId === "dev-1") {
      return mockDeveloper;
    }
    return null;
  }
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getStakeIssues(projectId: string): Promise<StakeIssue[]> {
    // For test-org-ethvilla, fetch real GitHub issues
    if (projectId === 'project-1' || projectId === '1') {
      try {
        const response = await fetch('/api/issues/test-org-ethvilla/test-org-ethvilla');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch real issues:', error);
      }
    }
    
    // Fallback to mock issues
    await this.delay(500);
    return mockStakeIssues;
  }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  async stake(request: StakeRequest): Promise<{ success: boolean; txHash?: string }> {
    await this.delay(1000);
    // Simulate successful staking
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };
  }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  async mintToken(request: MintTokenRequest): Promise<{
    success: boolean;
    txHash?: string;
    mintedAt?: string;
  }> {
    await this.delay(1000);
    // Simulate successful minting
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      mintedAt: new Date().toISOString(),
    };
  }
}

export const api = new ApiClient();
