"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReputationGenerationModal } from "@/components/ReputationGenerationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import { BuyTokenModal } from "@/components/BuyTokenModal";
import {
  Github,
  Wallet,
  Coffee,
  TrendingUp,
  ExternalLink,
  Plus,
  Send,
  DollarSign,
  ArrowUp,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Contract imports
import {
  launchToken,
  getCurrentPrice,
  formatEthPrice,
} from "@/lib/contracts/interactions";
import {
  saveUserToken,
  getUserToken,
  savePost,
  getAllPosts,
  StoredPost,
  UserToken,
} from "@/lib/contracts/tokenStorage";
import {
  checkNetwork,
  switchToBaseSepolia,
  BASE_SEPOLIA_EXPLORER,
} from "@/lib/contracts/config";

interface Post {
  id: string;
  author: {
    login: string;
    name: string;
    avatar_url: string;
  };
  content: string;
  prLink?: string;
  orgName?: string;
  repoName?: string;
  tokenPrice: number;
  priceChange: number;
  timestamp: string;
  tokenAddress?: string;
  bondingCurveAddress?: string;
}

interface AttestationProgress {
  orgName: string;
  status: "pending" | "generating" | "attesting" | "completed";
  attestationId?: string;
  prismUrl?: string;
  score?: number;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, signIn, loading } = useGitHubAuth();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isGeneratingReputation, setIsGeneratingReputation] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [attestationProgress, setAttestationProgress] = useState<
    AttestationProgress[]
  >([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [hasCoin, setHasCoin] = useState(false);
  const [userToken, setUserToken] = useState<UserToken | null>(null);
  const [isCreatingCoin, setIsCreatingCoin] = useState(false);
  const [createCoinStatus, setCreateCoinStatus] = useState("");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [prLink, setPrLink] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [myTokenPrice, setMyTokenPrice] = useState<string>("0");

  useEffect(() => {
    // Load mock posts on mount
    loadPosts();

    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem("wallet_address");
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsWalletConnected(true);
    }

    // Check for coin creation status
    const hasCoinCreated = localStorage.getItem("coin_created") === "true";
    if (hasCoinCreated) {
      setHasCoin(true);
    }

    // Check if we need to generate reputation after GitHub login
    // Trigger reputation generation if user is authenticated and we haven't done it yet
    if (savedWallet) {
      // Wait for auth to complete, then check
      setTimeout(async () => {
        try {
          const userRes = await fetch("/api/auth/github/user");
          if (userRes.ok) {
            const userData = await userRes.json();
            const username = userData.user.login;

            // Check if reputation was already generated
            const reputationGenerated = localStorage.getItem(
              `reputation_generated_${username}`
            );

            if (reputationGenerated === "true") {
              console.log("✅ Reputation already generated, skipping");
            } else {
              console.log("🚀 GENERATING REPUTATION FOR:", username);
              setWalletAddress(savedWallet);
              setIsWalletConnected(true);
              generateReputationScores(username, savedWallet);
            }
          }
        } catch {
          console.log("No user authenticated yet");
        }
      }, 1000); // Wait 1 second for auth to complete
    }
  }, []);
  // Buy modal state
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Post["author"] | null>(
    null
  );

  // Load posts and check token status
  const loadPosts = useCallback(() => {
    console.log("[Home] Loading posts from storage...");
    const storedPosts = getAllPosts();

    // Add mock posts if no real posts exist
    const mockPosts: StoredPost[] = [
      {
        id: "mock-1",
        author: {
          login: "sarahdev",
          name: "Sarah Wilson",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        },
        content:
          "Just merged a major performance optimization PR for React Router! Reduced bundle size by 40% 🚀",
        prLink: "https://github.com/remix-run/react-router/pull/12345",
        orgName: "remix-run",
        repoName: "react-router",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-2",
        author: {
          login: "alexcoder",
          name: "Alex Chen",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        },
        content:
          "Contributed to TypeScript 5.4 type inference improvements. Working with the Microsoft team has been amazing!",
        prLink: "https://github.com/microsoft/TypeScript/pull/56789",
        orgName: "microsoft",
        repoName: "TypeScript",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Combine stored posts with mock posts (stored first)
    const allPosts: Post[] = [...storedPosts, ...mockPosts].map((post) => ({
      ...post,
      tokenPrice: 0.001, // Will be updated with real price
      priceChange: 0,
    }));

    setPosts(allPosts);
    console.log("[Home] Loaded", allPosts.length, "posts");
  }, []);

  // Check if user has created a token
  const checkUserToken = useCallback(async () => {
    if (!user?.user.login) return;

    console.log("[Home] Checking token for user:", user.user.login);
    const token = getUserToken(user.user.login);

    if (token) {
      console.log("[Home] Found existing token:", token);
      setHasCoin(true);
      setUserToken(token);

      // Get current price from contract
      if (token.bondingCurveAddress) {
        const price = await getCurrentPrice(token.bondingCurveAddress);
        setMyTokenPrice(formatEthPrice(price));
        console.log("[Home] Current token price:", formatEthPrice(price));
      }
    } else {
      console.log("[Home] No token found for user");
      setHasCoin(false);
      setUserToken(null);
    }
  }, [user?.user.login]);

  useEffect(() => {
    loadPosts();

    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem("wallet_address");
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsWalletConnected(true);
      console.log("[Home] Restored wallet connection:", savedWallet);
    }
  }, [loadPosts]);

  // Check user token when auth changes
  useEffect(() => {
    if (isAuthenticated && !loading) {
      checkUserToken();
    }
  }, [isAuthenticated, loading, checkUserToken]);

  const generateReputationScores = async (username: string, wallet: string) => {
    console.log(
      "📊 generateReputationScores called for:",
      username,
      "with wallet:",
      wallet
    );
    setIsGeneratingReputation(true);
    setIsGeneratingProof(true);

    try {
      // Fetch user's GitHub stats including merged PRs
      const userStatsRes = await fetch("/api/auth/github/user");
      if (!userStatsRes.ok) {
        throw new Error("Failed to fetch user stats");
      }
      const userStats = await userStatsRes.json();

      // Extract organizations where user has merged PRs
      const orgsWithMergedPRs = Object.keys(
        userStats.prsByOrganization || {}
      ).filter((org) => userStats.prsByOrganization[org] > 0);

      if (orgsWithMergedPRs.length === 0) {
        console.log("No organizations with merged PRs found");
        setIsGeneratingReputation(false);
        setIsGeneratingProof(false);
        return;
      }

      // Initialize progress tracking only for orgs with merged PRs
      setAttestationProgress(
        orgsWithMergedPRs.map((orgName: string) => ({
          orgName,
          status: "pending" as const,
        }))
      );

      // Simulate zkTLS proof generation (4-5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 4500));
      setIsGeneratingProof(false);

      // Fetch ALL organization reputations once
      const reputationRes = await fetch("/api/reputation/org");
      if (!reputationRes.ok) {
        throw new Error("Failed to fetch reputation data");
      }
      const allReputationData = await reputationRes.json();

      // Create a map of org reputations for easy lookup
      const reputationMap = new Map(
        allReputationData.organizations.map((org: { orgName: string }) => [
          org.orgName,
          org,
        ])
      );

      // Process each organization with merged PRs
      for (let i = 0; i < orgsWithMergedPRs.length; i++) {
        const orgName = orgsWithMergedPRs[i];
        const reputationData = reputationMap.get(orgName);

        if (!reputationData) {
          console.log(`No reputation data for ${orgName}, skipping...`);
          continue;
        }

        // Update status to generating
        setAttestationProgress((prev) =>
          prev.map((p) =>
            p.orgName === orgName ? { ...p, status: "generating" as const } : p
          )
        );

        // Update status to attesting
        setAttestationProgress((prev) =>
          prev.map((p) =>
            p.orgName === orgName
              ? {
                  ...p,
                  status: "attesting" as const,
                  score:
                    (reputationData as { totalScore?: number })?.totalScore ||
                    0,
                }
              : p
          )
        );

        // Create attestation with wallet address
        console.log(
          "Creating attestation for",
          orgName,
          "with wallet:",
          wallet
        );

        const attestationRes = await fetch("/api/reputation/attest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: wallet,
            username,
            organization: orgName,
          }),
        });

        const attestationData = await attestationRes.json();
        console.log("Attestation response:", attestationData);

        // Check if attestation was successful
        if (attestationData.success) {
          // Store attestation index for future updates
          const attestations = JSON.parse(
            localStorage.getItem(`attestations_${username}`) || "{}"
          );
          attestations[orgName] = {
            attestationIndex: attestationData.attestationIndex,
            attestationId: attestationData.attestationId,
            score: attestationData.attestationData.totalScore,
            prismUrl: attestationData.prismUrl,
          };
          localStorage.setItem(
            `attestations_${username}`,
            JSON.stringify(attestations)
          );

          // Update status to completed
          setAttestationProgress((prev) =>
            prev.map((p) =>
              p.orgName === orgName
                ? {
                    ...p,
                    status: "completed" as const,
                    attestationId: attestationData.attestationHash,
                    prismUrl: attestationData.prismUrl,
                  }
                : p
            )
          );
        } else {
          console.error(
            "Attestation failed for",
            orgName,
            ":",
            attestationData.error
          );
          // Mark as completed even on error to continue with other orgs
          setAttestationProgress((prev) =>
            prev.map((p) =>
              p.orgName === orgName
                ? {
                    ...p,
                    status: "completed" as const,
                    attestationId: "failed",
                    prismUrl: undefined,
                  }
                : p
            )
          );
        }

        // Add delay between attestations to allow WebSocket connections to properly close
        // This prevents "WebSocket is not connected" errors
        if (i < orgsWithMergedPRs.length - 1) {
          console.log("Waiting 2 seconds before next attestation...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Wait 2 seconds to show all completed, then close modal
      setTimeout(() => {
        setIsGeneratingReputation(false);

        // Mark reputation as generated in localStorage
        localStorage.setItem(`reputation_generated_${username}`, "true");

        // Clean up URL params
        router.replace("/");
      }, 2000);
    } catch (error) {
      console.error("Error generating reputation:", error);
      setIsGeneratingReputation(false);
      setIsGeneratingProof(false);
    }
  };

  const handleWalletConnect = async () => {
    console.log("[Home] Connecting wallet...");
    try {
      if (typeof window.ethereum !== "undefined") {
        // First check/switch network
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
          console.log("[Home] Switching to Base Sepolia...");
          const switched = await switchToBaseSepolia();
          if (!switched) {
            alert("Please switch to Base Sepolia network in MetaMask");
            return;
          }
        }

        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          localStorage.setItem("wallet_address", accounts[0]);
          console.log("[Home] Wallet connected:", accounts[0]);
        }
      } else {
        alert("Please install MetaMask to connect your wallet!");
      }
    } catch (error) {
      console.error("[Home] Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const handleGitHubConnect = () => {
    console.log("[Home] Initiating GitHub sign in...");
    signIn();
  };

  const handleCreateCoin = async () => {
    if (!user?.user.login || !walletAddress) {
      console.error("[Home] Missing user or wallet");
      return;
    }

    setIsCreatingCoin(true);
    setCreateCoinStatus("Preparing transaction...");
    console.log("[Home] Creating coin for:", user.user.login);

    try {
      // Generate token name and symbol from GitHub username
      const tokenName = `${user.user.name || user.user.login} Token`;
      const tokenSymbol = user.user.login.toUpperCase().slice(0, 6);

      setCreateCoinStatus("Please confirm in MetaMask...");
      console.log("[Home] Launching token:", { tokenName, tokenSymbol });

      const result = await launchToken(tokenName, tokenSymbol);

      if (result.success && result.tokenAddress && result.bondingCurveAddress) {
        console.log("[Home] Token launched successfully:", result);
        setCreateCoinStatus("Token created! Saving...");

        // Save to localStorage
        const newToken: UserToken = {
          githubLogin: user.user.login,
          tokenAddress: result.tokenAddress,
          bondingCurveAddress: result.bondingCurveAddress,
          tokenName,
          tokenSymbol,
          walletAddress,
          createdAt: new Date().toISOString(),
          txHash: result.txHash,
        };
        saveUserToken(newToken);

        setHasCoin(true);
        setUserToken(newToken);

        // Get initial price
        const price = await getCurrentPrice(result.bondingCurveAddress);
        setMyTokenPrice(formatEthPrice(price));

        alert(
          `🎉 Token created successfully!\n\nToken: ${result.tokenAddress}\nBonding Curve: ${result.bondingCurveAddress}\n\nView on explorer: ${BASE_SEPOLIA_EXPLORER}/address/${result.tokenAddress}`
        );
      } else {
        console.error("[Home] Token launch failed:", result.error);
        alert(`Failed to create token: ${result.error}`);
      }
    } catch (error) {
      console.error("[Home] Error creating coin:", error);
      alert("Failed to create coin. Check console for details.");
    } finally {
      setIsCreatingCoin(false);
      setCreateCoinStatus("");
    }
  };

  const handleCreatePost = () => {
    if (!postContent.trim() || !user) return;

    console.log("[Home] Creating new post...");
    const newPost: StoredPost = {
      id: Date.now().toString(),
      author: {
        login: user.user.login,
        name: user.user.name || user.user.login,
        avatar_url: user.user.avatar_url,
      },
      content: postContent,
      prLink: prLink || undefined,
      orgName: prLink ? extractOrgFromUrl(prLink) : undefined,
      repoName: prLink ? extractRepoFromUrl(prLink) : undefined,
      timestamp: new Date().toISOString(),
      tokenAddress: userToken?.tokenAddress,
      bondingCurveAddress: userToken?.bondingCurveAddress,
    };

    // Save to localStorage
    savePost(newPost);
    console.log("[Home] Post saved:", newPost.id);

    // Update local state
    const postWithPrice: Post = {
      ...newPost,
      tokenPrice: parseFloat(myTokenPrice) || 0.001,
      priceChange: 0,
    };
    setPosts([postWithPrice, ...posts]);

    setPostContent("");
    setPrLink("");
    setIsPostDialogOpen(false);

    // Update attestations in the background after posting
    if (
      isWalletConnected &&
      isAuthenticated &&
      walletAddress &&
      user?.user?.login
    ) {
      console.log("🔄 Triggering attestation updates after post creation...");
      updateAttestationsInBackground();
    }
  };

  const updateAttestationsInBackground = async () => {
    try {
      const username = user?.user?.login;
      if (!username || !walletAddress) return;

      console.log("🔄 Fetching fresh GitHub data and updating attestations...");

      // Get existing attestations from localStorage
      const existingAttestations = JSON.parse(
        localStorage.getItem(`attestations_${username}`) || "{}"
      );

      // Don't check reputation_generated flag here - always update on post

      const response = await fetch("/api/reputation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          username,
          existingAttestations, // Pass client-side attestation data
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Attestations updated:", result);
        console.log(`Updated ${result.updated.length} attestations`);
        console.log(`Created ${result.created.length} new attestations`);

        // Update localStorage with new attestation data
        const attestations = JSON.parse(
          localStorage.getItem(`attestations_${username}`) || "{}"
        );

        // Update existing attestations with new scores
        result.updated.forEach(
          (update: {
            success: boolean;
            orgName: string;
            newScore?: number;
            attestationId?: string;
            prismUrl?: string;
          }) => {
            if (update.success && attestations[update.orgName]) {
              attestations[update.orgName].score = update.newScore;
              attestations[update.orgName].attestationId = update.attestationId;
              attestations[update.orgName].prismUrl = update.prismUrl;
            }
          }
        );

        // Add new attestations
        result.created.forEach(
          (created: {
            success: boolean;
            orgName: string;
            attestationIndex?: number;
            attestationId?: string;
            score?: number;
            prismUrl?: string;
          }) => {
            if (created.success) {
              attestations[created.orgName] = {
                attestationIndex: created.attestationIndex,
                attestationId: created.attestationId,
                score: created.score || 0,
                prismUrl: created.prismUrl,
              };
            }
          }
        );

        localStorage.setItem(
          `attestations_${username}`,
          JSON.stringify(attestations)
        );

        // Show subtle notification (optional)
        const totalSuccess =
          result.updated.filter((u: { success: boolean }) => u.success).length +
          result.created.filter((c: { success: boolean }) => c.success).length;
        if (totalSuccess > 0) {
          console.log(
            `🎉 Successfully updated/created ${totalSuccess} attestations on-chain!`
          );
        }
      } else {
        console.error("Failed to update attestations:", result.error);
      }
    } catch (error) {
      console.error("Error updating attestations:", error);
    }
  };

  const extractOrgFromUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : "";
  };

  const extractRepoFromUrl = (url: string) => {
    const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
    return match ? match[1] : "";
  };

  const handleBuyToken = (author: Post["author"]) => {
    console.log("[Home] Buy token clicked for:", author.login);

    if (!isAuthenticated) {
      console.log("[Home] Not authenticated, signing in...");
      signIn();
      return;
    }

    if (!isWalletConnected) {
      console.log("[Home] Wallet not connected, connecting...");
      handleWalletConnect();
      return;
    }

    // Check if author has a token
    const authorToken = getUserToken(author.login);
    if (!authorToken) {
      console.log("[Home] Author has no token:", author.login);
      alert(`${author.name || author.login} hasn't created their token yet.`);
      return;
    }

    // Open buy modal
    setSelectedAuthor(author);
    setBuyModalOpen(true);
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Get token price for a post author
  const getAuthorTokenInfo = (
    authorLogin: string
  ): { hasToken: boolean; price: string } => {
    const token = getUserToken(authorLogin);
    if (token) {
      return { hasToken: true, price: "0.001" }; // Could fetch real price here
    }
    return { hasToken: false, price: "0" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header onLoginClick={signIn} />

      <main className="flex-1 pb-8">
        {/* Top Banner - Connect & Post */}
        <section className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-4">
                      Want to yap about your developments? 🚀
                    </p>
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      {/* Step 1: Connect Wallet */}
                      {!isWalletConnected ? (
                        <>
                          <Button
                            onClick={handleWalletConnect}
                            size="lg"
                            className="gap-2 w-full"
                          >
                            <Wallet className="h-5 w-5" />
                            1. Connect Wallet (Base Sepolia)
                          </Button>
                          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Connect your wallet to get started
                          </p>
                        </>
                      ) : !isAuthenticated ? (
                        <>
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Wallet Connected
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                                {walletAddress.substring(0, 6)}...
                                {walletAddress.substring(38)}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleGitHubConnect}
                            size="lg"
                            className="gap-2 w-full"
                            disabled={loading}
                          >
                            <Github className="h-5 w-5" />
                            {loading ? "Connecting..." : "2. Connect GitHub"}
                          </Button>
                          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Sign in with GitHub to continue
                          </p>
                        </>
                      ) : isGeneratingReputation ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✓ Wallet Connected
                              </p>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user?.user.avatar_url} />
                                <AvatarFallback>
                                  {user?.user.login.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✓ GitHub: @{user?.user.login}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-pulse">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Generating reputation scores...
                              </p>
                            </div>
                          </div>
                        </>
                      ) : !hasCoin ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Wallet Connected
                              </p>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user?.user.avatar_url} />
                                <AvatarFallback>
                                  {user?.user.login.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                GitHub: @{user?.user.login}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleCreateCoin}
                            size="lg"
                            className="gap-2 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                            disabled={isCreatingCoin}
                          >
                            {isCreatingCoin ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {createCoinStatus || "Creating..."}
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-5 w-5" />
                                3. Create Your Token
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Deploy your personal developer token on Base Sepolia
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user?.user.avatar_url} />
                              <AvatarFallback>
                                {user?.user.login.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="font-semibold">
                                {user?.user.name || user?.user.login}
                              </p>
                              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                {userToken?.tokenSymbol} • {myTokenPrice} ETH
                              </p>
                            </div>
                          </div>
                          <Dialog
                            open={isPostDialogOpen}
                            onOpenChange={setIsPostDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Post
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Share Your Development Work
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    What did you work on?
                                  </label>
                                  <Textarea
                                    placeholder="I recently worked with [org] on [feature]..."
                                    value={postContent}
                                    onChange={(e) =>
                                      setPostContent(e.target.value)
                                    }
                                    rows={4}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    PR Link (optional)
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://github.com/org/repo/pull/123"
                                    value={prLink}
                                    onChange={(e) => setPrLink(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                  />
                                </div>
                                <Button
                                  onClick={handleCreatePost}
                                  className="w-full gap-2"
                                  disabled={!postContent.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                  Post
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feed Section */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {posts.map((post) => {
                const authorInfo = getAuthorTokenInfo(post.author.login);

                return (
                  <Card
                    key={post.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <a href={`/dev/${post.author.login}`}>
                            <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                              <AvatarImage
                                src={post.author.avatar_url}
                                alt={post.author.login}
                              />
                              <AvatarFallback>
                                {post.author.login.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </a>
                          <div>
                            <a
                              href={`/dev/${post.author.login}`}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {post.author.name}
                            </a>
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                              @{post.author.login} •{" "}
                              {formatTimeAgo(post.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Post Content */}
                      <p className="text-base leading-relaxed">
                        {post.content}
                      </p>

                      {/* PR Link */}
                      {post.prLink && post.orgName && post.repoName && (
                        <a
                          href={post.prLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {post.orgName}/{post.repoName}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                              View Pull Request
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </a>
                      )}

                      {/* Token Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Token with Avatar */}
                            <div className="relative">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5">
                                <Avatar className="h-full w-full border-2 border-white dark:border-gray-900">
                                  <AvatarImage
                                    src={post.author.avatar_url}
                                    alt={post.author.login}
                                  />
                                  <AvatarFallback>
                                    {post.author.login.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
                                $
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold text-sm">
                                {post.author.login.toUpperCase().slice(0, 6)}{" "}
                                Token
                              </p>
                              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                {authorInfo.hasToken
                                  ? "ERC-20 on Base Sepolia"
                                  : "Token not created"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-bold">
                              <DollarSign className="h-4 w-4" />
                              {authorInfo.hasToken ? authorInfo.price : "—"}
                            </div>
                            {authorInfo.hasToken && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <ArrowUp className="h-3 w-3" />
                                ETH
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Chart Line */}
                        <div className="h-12 mb-3 relative">
                          <svg
                            className="w-full h-full"
                            viewBox="0 0 200 40"
                            preserveAspectRatio="none"
                          >
                            <polyline
                              points="0,30 20,28 40,25 60,27 80,22 100,20 120,18 140,15 160,17 180,12 200,10"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            />
                            <polyline
                              points="0,30 20,28 40,25 60,27 80,22 100,20 120,18 140,15 160,17 180,12 200,10 200,40 0,40"
                              fill="url(#greenGradient)"
                              opacity="0.3"
                            />
                            <defs>
                              <linearGradient
                                id="greenGradient"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#10b981"
                                  stopOpacity="0.5"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#10b981"
                                  stopOpacity="0"
                                />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Buy Button */}
                        <Button
                          onClick={() => handleBuyToken(post.author)}
                          className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={!authorInfo.hasToken}
                        >
                          <Coffee className="h-4 w-4" />
                          {authorInfo.hasToken
                            ? `Cheers ${post.author.login}! ☕`
                            : "Token not available"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {posts.length === 0 && (
                <Card className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-text-secondary dark:text-text-dark-secondary">
                    Be the first to share your development work!
                  </p>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <ReputationGenerationModal
        open={isGeneratingReputation}
        organizations={attestationProgress.map((p) => p.orgName)}
        progress={attestationProgress}
        isGeneratingProof={isGeneratingProof}
      />

      <Footer />

      {/* Buy Token Modal */}
      {selectedAuthor && (
        <BuyTokenModal
          isOpen={buyModalOpen}
          onClose={() => {
            setBuyModalOpen(false);
            setSelectedAuthor(null);
          }}
          author={selectedAuthor}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
}
