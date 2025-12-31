import {
  CONTRACT_ADDRESSES,
  checkNetwork,
  switchToBaseSepolia,
  IssueStatus,
} from "./config";
import {
  DEVELOPER_TOKEN_FACTORY_ABI,
  SIMPLE_BONDING_CURVE_ABI,
  ISSUE_STAKING_ABI,
} from "./abis";
import { ethers } from "ethers";

// Create contract interfaces for proper ABI encoding
const factoryInterface = new ethers.Interface(DEVELOPER_TOKEN_FACTORY_ABI);
const bondingCurveInterface = new ethers.Interface(SIMPLE_BONDING_CURVE_ABI);

// Parse transaction receipt logs
function parseTokenLaunchedEvent(logs: { topics: string[]; data: string }[]): {
  tokenAddress: string;
  bondingCurveAddress: string;
} | null {
  // TokenLaunched has 3 indexed params: developer, token, bondingCurve
  for (const log of logs) {
    if (log.topics.length === 4) {
      const tokenAddress = "0x" + log.topics[2].slice(26);
      const bondingCurveAddress = "0x" + log.topics[3].slice(26);
      console.log("[Contract] Parsed TokenLaunched event:", {
        tokenAddress,
        bondingCurveAddress,
      });
      return { tokenAddress, bondingCurveAddress };
    }
  }
  return null;
}

// ============ Token Factory Functions ============

export interface LaunchTokenResult {
  success: boolean;
  tokenAddress?: string;
  bondingCurveAddress?: string;
  txHash?: string;
  error?: string;
}

export async function launchToken(
  name: string,
  symbol: string
): Promise<LaunchTokenResult> {
  console.log("[Contract] launchToken called with:", { name, symbol });

  try {
    // Check network
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.log("[Contract] Wrong network, switching to Base Sepolia...");
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    // Get connected account
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];
    console.log("[Contract] Using account:", from);

    // Encode function call using ethers.js
    const data = factoryInterface.encodeFunctionData(
      "launchTokenWithDefaults",
      [name, symbol]
    );
    console.log("[Contract] Encoded data:", data);

    // Send transaction
    console.log(
      "[Contract] Sending transaction to factory:",
      CONTRACT_ADDRESSES.developerTokenFactory
    );
    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: CONTRACT_ADDRESSES.developerTokenFactory,
          data,
          gas: "0x4C4B40", // 5,000,000 gas
        },
      ],
    })) as string;

    console.log("[Contract] Transaction sent:", txHash);

    // Wait for receipt
    console.log("[Contract] Waiting for transaction receipt...");
    const receipt = await waitForReceipt(txHash);
    console.log("[Contract] Receipt received:", receipt);

    if (receipt.status === "0x0") {
      return { success: false, txHash, error: "Transaction failed" };
    }

    // Parse event logs to get token and bonding curve addresses
    const parsed = parseTokenLaunchedEvent(receipt.logs);
    if (!parsed) {
      console.log("[Contract] Could not parse event, returning txHash only");
      return {
        success: true,
        txHash,
        error: "Token created but addresses not parsed",
      };
    }

    console.log("[Contract] Token launch successful:", parsed);
    return {
      success: true,
      tokenAddress: parsed.tokenAddress,
      bondingCurveAddress: parsed.bondingCurveAddress,
      txHash,
    };
  } catch (error) {
    console.error("[Contract] launchToken error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Wait for transaction receipt
async function waitForReceipt(
  txHash: string,
  maxAttempts = 60
): Promise<{
  status: string;
  logs: { topics: string[]; data: string }[];
}> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`[Contract] Checking receipt attempt ${i + 1}/${maxAttempts}`);
    const receipt = (await window.ethereum!.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as {
      status: string;
      logs: { topics: string[]; data: string }[];
    } | null;

    if (receipt) {
      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Transaction receipt timeout");
}

// ============ Bonding Curve Functions ============

export interface BuyQuoteResult {
  tokensOut: string;
  pricePerToken: string;
  success: boolean;
  error?: string;
}

export async function getBuyQuote(
  bondingCurveAddress: string,
  ethAmount: string
): Promise<BuyQuoteResult> {
  console.log("[Contract] getBuyQuote called:", {
    bondingCurveAddress,
    ethAmount,
  });

  try {
    if (!window.ethereum) {
      return {
        success: false,
        tokensOut: "0",
        pricePerToken: "0",
        error: "MetaMask not installed",
      };
    }

    // Encode call using ethers.js
    const data = bondingCurveInterface.encodeFunctionData("getBuyQuote", [
      ethers.parseEther(ethAmount),
    ]);

    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: bondingCurveAddress,
          data,
        },
        "latest",
      ],
    })) as string;

    console.log("[Contract] getBuyQuote result:", result);

    // Decode result (two uint256 values)
    const tokensOut = BigInt("0x" + result.slice(2, 66)).toString();
    const pricePerToken = BigInt("0x" + result.slice(66, 130)).toString();

    return {
      success: true,
      tokensOut,
      pricePerToken,
    };
  } catch (error) {
    console.error("[Contract] getBuyQuote error:", error);
    return {
      success: false,
      tokensOut: "0",
      pricePerToken: "0",
      error: (error as Error).message,
    };
  }
}

export async function getCurrentPrice(
  bondingCurveAddress: string
): Promise<string> {
  console.log("[Contract] getCurrentPrice called:", bondingCurveAddress);

  try {
    if (!window.ethereum) {
      return "0";
    }

    // Call getCurrentPrice on the bonding curve
    const data = bondingCurveInterface.encodeFunctionData(
      "getCurrentPrice",
      []
    );

    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: bondingCurveAddress,
          data,
        },
        "latest",
      ],
    })) as string;

    console.log("[Contract] getCurrentPrice result:", result);

    const price = BigInt(result).toString();
    return price;
  } catch (error) {
    console.error("[Contract] getCurrentPrice error:", error);
    return "0";
  }
}

// Helper to check current phase of bonding curve (0 = GDA, 1 = BondingCurve, 2 = Graduated)
export async function getCurrentPhase(
  bondingCurveAddress: string
): Promise<number> {
  console.log("[Contract] getCurrentPhase called:", bondingCurveAddress);

  try {
    if (!window.ethereum) {
      return -1;
    }

    const data = bondingCurveInterface.encodeFunctionData("currentPhase", []);

    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: bondingCurveAddress,
          data,
        },
        "latest",
      ],
    })) as string;

    console.log("[Contract] getCurrentPhase result:", result);
    return parseInt(result, 16);
  } catch (error) {
    console.error("[Contract] getCurrentPhase error:", error);
    return -1;
  }
}

export interface BuyTokenResult {
  success: boolean;
  tokensReceived?: string;
  txHash?: string;
  error?: string;
}

export async function buyTokens(
  bondingCurveAddress: string,
  ethAmount: string
): Promise<BuyTokenResult> {
  console.log("[Contract] buyTokens called:", {
    bondingCurveAddress,
    ethAmount,
  });

  try {
    // Check network
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      console.log("[Contract] Wrong network, switching to Base Sepolia...");
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    // Get connected account
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];
    console.log("[Contract] Buying from account:", from);

    // Convert ETH to wei using ethers.js for precision
    const ethInWei = ethers.parseEther(ethAmount);
    const ethHex = "0x" + ethInWei.toString(16);

    // Encode function call - buy(0) means no minimum tokens (accept any slippage for simplicity)
    const data = bondingCurveInterface.encodeFunctionData("buy", [0]);
    console.log("[Contract] Buy data:", data);
    console.log("[Contract] Bonding curve address:", bondingCurveAddress);

    // First, try to estimate gas to catch any revert reasons
    try {
      const gasEstimate = await window.ethereum.request({
        method: "eth_estimateGas",
        params: [
          {
            from,
            to: bondingCurveAddress,
            data,
            value: ethHex,
          },
        ],
      });
      console.log("[Contract] Gas estimate:", gasEstimate);
    } catch (estimateError: unknown) {
      console.error("[Contract] Gas estimation failed:", estimateError);
      // Try to extract revert reason
      const errMsg = (estimateError as Error).message || String(estimateError);
      if (errMsg.includes("execution reverted")) {
        return { success: false, error: `Contract reverted: ${errMsg}` };
      }
      // Continue anyway, might work with manual gas
    }

    // Send transaction with ETH value - use higher gas limit
    console.log("[Contract] Sending buy transaction with value:", ethHex);
    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: bondingCurveAddress,
          data,
          value: ethHex,
          gas: "0x493E0", // 300,000 gas (increased from 100,000)
        },
      ],
    })) as string;

    console.log("[Contract] Buy transaction sent:", txHash);

    // Wait for receipt
    console.log("[Contract] Waiting for buy receipt...");
    const receipt = await waitForReceipt(txHash);
    console.log("[Contract] Buy receipt:", receipt);

    if (receipt.status === "0x0") {
      return { success: false, txHash, error: "Transaction failed" };
    }

    // Parse TokensPurchased event to get tokens received
    let tokensReceived = "0";
    for (const log of receipt.logs) {
      // TokensPurchased event has buyer as indexed, then tokenAmount, ethAmount, price
      if (log.topics.length === 2) {
        tokensReceived = BigInt("0x" + log.data.slice(2, 66)).toString();
        console.log("[Contract] Tokens received:", tokensReceived);
        break;
      }
    }

    return {
      success: true,
      tokensReceived,
      txHash,
    };
  } catch (error) {
    console.error("[Contract] buyTokens error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// ============ Utility Functions ============

export function formatTokenAmount(amount: string, decimals = 18): string {
  try {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const fraction = num % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole}.${fractionStr}`;
  } catch {
    return "0.0000";
  }
}

export function formatEthPrice(weiPrice: string): string {
  try {
    const price = BigInt(weiPrice);

    // Handle zero
    if (price === BigInt(0)) {
      return "0.000000";
    }

    // Use ethers for precise formatting
    return ethers.formatEther(price);
  } catch {
    return "0.000000";
  }
}

export function parseEthToWei(eth: string): string {
  return BigInt(Math.floor(parseFloat(eth) * 1e18)).toString();
}

// ============ IssueStaking Contract Functions ============

const issueStakingInterface = new ethers.Interface(ISSUE_STAKING_ABI);

export interface IssueStakingResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface ReputationInfo {
  total: bigint;
  locked: bigint;
  available: bigint;
  isRegistered: boolean;
}

export interface OnChainIssue {
  id: number;
  owner: string;
  assignee: string;
  ownerStake: bigint;
  assigneeStake: bigint;
  reward: bigint;
  deadline: bigint;
  status: IssueStatus;
  evidenceURI: string;
}

/**
 * Get reputation info for a user from the IssueStaking contract
 */
export async function getReputationInfo(
  stakingAddress: string,
  userAddress: string
): Promise<ReputationInfo | null> {
  console.log("[IssueStaking] getReputationInfo called:", {
    stakingAddress,
    userAddress,
  });

  try {
    if (!window.ethereum) {
      console.error("[IssueStaking] No ethereum provider");
      return null;
    }

    // Get total reputation points
    const totalData = issueStakingInterface.encodeFunctionData(
      "reputationPoints",
      [userAddress]
    );
    const totalResult = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to: stakingAddress, data: totalData }, "latest"],
    })) as string;
    const total = BigInt(totalResult);

    // Get locked reputation
    const lockedData = issueStakingInterface.encodeFunctionData(
      "lockedReputation",
      [userAddress]
    );
    const lockedResult = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to: stakingAddress, data: lockedData }, "latest"],
    })) as string;
    const locked = BigInt(lockedResult);

    // Check if registered
    const registeredData = issueStakingInterface.encodeFunctionData(
      "isRegistered",
      [userAddress]
    );
    const registeredResult = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to: stakingAddress, data: registeredData }, "latest"],
    })) as string;
    const isRegistered = BigInt(registeredResult) === BigInt(1);

    return {
      total,
      locked,
      available: total - locked,
      isRegistered,
    };
  } catch (error) {
    console.error("[IssueStaking] getReputationInfo error:", error);
    return null;
  }
}

/**
 * Register as a developer to receive initial reputation (50 points)
 */
export async function registerDeveloper(
  stakingAddress: string
): Promise<IssueStakingResult> {
  console.log("[IssueStaking] registerDeveloper called:", stakingAddress);

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData(
      "registerDeveloper",
      []
    );

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, gas: "0x30D40" }], // 200,000 gas
    })) as string;

    console.log("[IssueStaking] registerDeveloper tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] registerDeveloper error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Accept assignment on an issue and stake reputation
 */
export async function acceptAssignment(
  stakingAddress: string,
  issueId: number,
  stakeAmount: bigint
): Promise<IssueStakingResult> {
  console.log("[IssueStaking] acceptAssignment called:", {
    stakingAddress,
    issueId,
    stakeAmount: stakeAmount.toString(),
  });

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData("acceptAssignment", [
      issueId,
      stakeAmount,
    ]);

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, gas: "0x493E0" }], // 300,000 gas
    })) as string;

    console.log("[IssueStaking] acceptAssignment tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] acceptAssignment error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Submit work evidence for an issue
 */
export async function submitWork(
  stakingAddress: string,
  issueId: number,
  evidenceURI: string
): Promise<IssueStakingResult> {
  console.log("[IssueStaking] submitWork called:", {
    stakingAddress,
    issueId,
    evidenceURI,
  });

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData("submitWork", [
      issueId,
      evidenceURI,
    ]);

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, gas: "0x493E0" }],
    })) as string;

    console.log("[IssueStaking] submitWork tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] submitWork error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get issue details from the contract
 */
export async function getIssue(
  stakingAddress: string,
  issueId: number
): Promise<OnChainIssue | null> {
  console.log("[IssueStaking] getIssue called:", { stakingAddress, issueId });

  try {
    if (!window.ethereum) {
      return null;
    }

    const data = issueStakingInterface.encodeFunctionData("issues", [issueId]);
    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to: stakingAddress, data }, "latest"],
    })) as string;

    // Decode the result - issues returns a tuple
    const decoded = issueStakingInterface.decodeFunctionResult(
      "issues",
      result
    );

    return {
      id: issueId,
      owner: decoded[0],
      assignee: decoded[1],
      ownerStake: decoded[2],
      assigneeStake: decoded[3],
      reward: decoded[4],
      deadline: decoded[5],
      status: Number(decoded[6]) as IssueStatus,
      evidenceURI: decoded[7],
    };
  } catch (error) {
    console.error("[IssueStaking] getIssue error:", error);
    return null;
  }
}

/**
 * Get the next issue ID (total number of issues created)
 */
export async function getNextIssueId(stakingAddress: string): Promise<number> {
  try {
    if (!window.ethereum) return 0;

    const data = issueStakingInterface.encodeFunctionData("nextIssueId", []);
    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to: stakingAddress, data }, "latest"],
    })) as string;

    return Number(BigInt(result));
  } catch (error) {
    console.error("[IssueStaking] getNextIssueId error:", error);
    return 0;
  }
}

/**
 * Create a new issue with stake and optional ETH reward
 */
export async function createIssue(
  stakingAddress: string,
  ownerStake: bigint,
  deadlineTimestamp: bigint,
  ethReward: string = "0"
): Promise<IssueStakingResult & { issueId?: number }> {
  console.log("[IssueStaking] createIssue called:", {
    stakingAddress,
    ownerStake: ownerStake.toString(),
    deadlineTimestamp: deadlineTimestamp.toString(),
    ethReward,
  });

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData("createIssue", [
      ownerStake,
      deadlineTimestamp,
    ]);
    const value =
      ethReward !== "0"
        ? "0x" + ethers.parseEther(ethReward).toString(16)
        : "0x0";

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, value, gas: "0x493E0" }],
    })) as string;

    console.log("[IssueStaking] createIssue tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] createIssue error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Complete an issue by verifier with proof
 */
export async function completeByProof(
  stakingAddress: string,
  issueId: number,
  evidenceURI: string
): Promise<IssueStakingResult> {
  console.log("[IssueStaking] completeByProof called:", {
    stakingAddress,
    issueId,
    evidenceURI,
  });

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData("completeByProof", [
      issueId,
      evidenceURI,
    ]);

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, gas: "0x493E0" }],
    })) as string;

    console.log("[IssueStaking] completeByProof tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] completeByProof error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Finalize an issue after challenge window
 */
export async function finalizeIssue(
  stakingAddress: string,
  issueId: number
): Promise<IssueStakingResult> {
  console.log("[IssueStaking] finalize called:", { stakingAddress, issueId });

  try {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return {
          success: false,
          error: "Please switch to Base Sepolia network",
        };
      }
    }

    if (!window.ethereum) {
      return { success: false, error: "MetaMask not installed" };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Please connect your wallet first" };
    }
    const from = accounts[0];

    const data = issueStakingInterface.encodeFunctionData("finalize", [
      issueId,
    ]);

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: stakingAddress, data, gas: "0x493E0" }],
    })) as string;

    console.log("[IssueStaking] finalize tx:", txHash);
    return { success: true, txHash };
  } catch (error) {
    console.error("[IssueStaking] finalize error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get connected wallet address
 */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    if (!window.ethereum) return null;
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    return accounts?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Connect wallet and get address
 */
export async function connectWallet(): Promise<string | null> {
  try {
    if (!window.ethereum) return null;
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    return accounts?.[0] || null;
  } catch {
    return null;
  }
}
