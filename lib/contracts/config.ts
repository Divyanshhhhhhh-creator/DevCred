// Base Sepolia Chain Configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC =
  "https://base-sepolia.g.alchemy.com/v2/wfsazGh03O8q-EFdgA7j3";
export const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

// Contract Addresses on Base Sepolia
export const CONTRACT_ADDRESSES = {
  developerTokenFactory: "0x4D95e4Edf97aDb12B61B5A117c2cA72e31b8A61c" as const,
  // DevWorkFactory deploys IssueStaking + ReputationToken per ecosystem
  // Add your deployed DevWorkFactory address here after deployment
  devWorkFactory: "0x7BE18dEe46C130102aa44572B2a4B8788DB0C40B" as const, // TODO: Deploy and add address
} as const;

// Ecosystem structure matching the factory contract
export interface EcosystemInfo {
  name: string;
  token: string; // ReputationToken address
  staking: string; // IssueStaking address
  deployer: string;
  deployedAt: number;
}

// Issue Status enum matching the contract
export enum IssueStatus {
  Open = 0,
  Assigned = 1,
  Submitted = 2,
  Accepted = 3,
  Rejected = 4,
  Disputed = 5,
  Closed = 6,
}

// Status labels for display
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.Open]: "Open",
  [IssueStatus.Assigned]: "In Progress",
  [IssueStatus.Submitted]: "Work Submitted",
  [IssueStatus.Accepted]: "Verified",
  [IssueStatus.Rejected]: "Rejected",
  [IssueStatus.Disputed]: "Disputed",
  [IssueStatus.Closed]: "Closed",
};

// Status colors for UI
export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  [IssueStatus.Open]: "bg-blue-500",
  [IssueStatus.Assigned]: "bg-yellow-500",
  [IssueStatus.Submitted]: "bg-purple-500",
  [IssueStatus.Accepted]: "bg-green-500",
  [IssueStatus.Rejected]: "bg-red-500",
  [IssueStatus.Disputed]: "bg-orange-500",
  [IssueStatus.Closed]: "bg-gray-500",
};

// Check if user is on correct network
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.log("[Network] No ethereum provider found");
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId as string, 16);
    console.log(
      "[Network] Current chain ID:",
      currentChainId,
      "Expected:",
      BASE_SEPOLIA_CHAIN_ID
    );
    return currentChainId === BASE_SEPOLIA_CHAIN_ID;
  } catch (error) {
    console.error("[Network] Error checking network:", error);
    return false;
  }
}

// Switch to Base Sepolia
export async function switchToBaseSepolia(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.log("[Network] No ethereum provider found");
    return false;
  }

  try {
    console.log("[Network] Attempting to switch to Base Sepolia...");
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
    console.log("[Network] Successfully switched to Base Sepolia");
    return true;
  } catch (switchError: unknown) {
    // Chain not added, try to add it
    if ((switchError as { code?: number })?.code === 4902) {
      console.log("[Network] Base Sepolia not found, adding network...");
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: "Base Sepolia",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [BASE_SEPOLIA_RPC],
              blockExplorerUrls: [BASE_SEPOLIA_EXPLORER],
            },
          ],
        });
        console.log("[Network] Successfully added Base Sepolia");
        return true;
      } catch (addError) {
        console.error("[Network] Error adding Base Sepolia:", addError);
        return false;
      }
    }
    console.error("[Network] Error switching network:", switchError);
    return false;
  }
}

// DevWorkFactory ABI (minimal for reading ecosystems)
const DEV_WORK_FACTORY_ABI = [
  "function ecosystems(uint256) view returns (string name, address token, address staking, address deployer, uint256 deployedAt)",
  "function getEcosystemsCount() view returns (uint256)",
] as const;

// Fetch all ecosystems from the DevWorkFactory contract
export async function fetchEcosystemsFromFactory(): Promise<EcosystemInfo[]> {
  if (!CONTRACT_ADDRESSES.devWorkFactory) {
    console.log("[Factory] DevWorkFactory address not configured");
    return [];
  }

  if (typeof window === "undefined" || !window.ethereum) {
    console.log("[Factory] No ethereum provider found");
    return [];
  }

  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const factory = new ethers.Contract(
      CONTRACT_ADDRESSES.devWorkFactory,
      DEV_WORK_FACTORY_ABI,
      provider
    );

    const count = await factory.getEcosystemsCount();
    const ecosystems: EcosystemInfo[] = [];

    for (let i = 0; i < count; i++) {
      const eco = await factory.ecosystems(i);
      ecosystems.push({
        name: eco.name,
        token: eco.token,
        staking: eco.staking,
        deployer: eco.deployer,
        deployedAt: Number(eco.deployedAt),
      });
    }

    console.log(`[Factory] Fetched ${ecosystems.length} ecosystems`);
    return ecosystems;
  } catch (error) {
    console.error("[Factory] Error fetching ecosystems:", error);
    return [];
  }
}

// Get ecosystem by name (case-insensitive)
export async function getEcosystemByName(
  name: string
): Promise<EcosystemInfo | null> {
  const ecosystems = await fetchEcosystemsFromFactory();
  return (
    ecosystems.find((e) => e.name.toLowerCase() === name.toLowerCase()) || null
  );
}

// Local storage key for ecosystem cache
const ECOSYSTEM_CACHE_KEY = "trustmygit_ecosystems";

// Cache ecosystems locally for faster access
export function cacheEcosystems(ecosystems: EcosystemInfo[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ECOSYSTEM_CACHE_KEY, JSON.stringify(ecosystems));
  }
}

// Get cached ecosystems
export function getCachedEcosystems(): EcosystemInfo[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(ECOSYSTEM_CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
}

// Get staking address for an ecosystem (from cache or fetch)
export async function getStakingAddress(
  ecosystemName: string
): Promise<string | null> {
  // First check cache
  const cached = getCachedEcosystems();
  const cachedEco = cached.find(
    (e) => e.name.toLowerCase() === ecosystemName.toLowerCase()
  );
  if (cachedEco) {
    return cachedEco.staking;
  }

  // Fetch from contract
  const eco = await getEcosystemByName(ecosystemName);
  return eco?.staking || null;
}
