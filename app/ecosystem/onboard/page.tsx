"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Coins,
  GitBranch,
  Users,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import {
  CONTRACT_ADDRESSES,
  checkNetwork,
  switchToBaseSepolia,
  BASE_SEPOLIA_EXPLORER,
  cacheEcosystems,
  fetchEcosystemsFromFactory,
} from "@/lib/contracts/config";
import {
  connectWallet,
  getConnectedAddress,
} from "@/lib/contracts/interactions";

const ECOSYSTEM_STAKE_AMOUNT = "0.02"; // 0.02 ETH required to create ecosystem

// DevWorkFactory ABI for deployEcosystem
const DEV_WORK_FACTORY_ABI = [
  "function deployEcosystem(string orgName, string tokenSymbol, address verifierAddress, address arbiterAddress) external payable returns (address token, address staking)",
  "function ecosystems(uint256) view returns (string name, address token, address staking, address deployer, uint256 deployedAt)",
  "function getEcosystemsCount() view returns (uint256)",
];

interface GitHubOrg {
  login: string;
  avatar_url: string;
  description: string | null;
  isOwner?: boolean;
}

type Step = "select-org" | "configure" | "deploy" | "success";

export default function EcosystemOnboard() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    signIn,
  } = useGitHubAuth();

  const [step, setStep] = React.useState<Step>("select-org");
  const [organizations, setOrganizations] = React.useState<GitHubOrg[]>([]);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<GitHubOrg | null>(null);
  const [tokenSymbol, setTokenSymbol] = React.useState("");
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deployStatus, setDeployStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [deployedAddresses, setDeployedAddresses] = React.useState<{
    token: string;
    staking: string;
    txHash: string;
  } | null>(null);

  // Check wallet connection on mount
  React.useEffect(() => {
    const checkWallet = async () => {
      const addr = await getConnectedAddress();
      setWalletAddress(addr);
    };
    checkWallet();
  }, []);

  // Fetch user's organizations where they are owner
  React.useEffect(() => {
    if (isAuthenticated && user?.organizations) {
      setLoadingOrgs(true);
      // Filter to only show orgs where user might be owner
      // In a real app, you'd check org membership via API
      const orgs = user.organizations.map((org) => ({
        login: org.login,
        avatar_url: org.avatar_url,
        description: org.description,
        isOwner: true, // Assume owner for now, would need API check
      }));

      // Also add user's personal account as an "org" option
      const personalOrg: GitHubOrg = {
        login: user.user.login,
        avatar_url: user.user.avatar_url,
        description: "Your personal ecosystem",
        isOwner: true,
      };

      setOrganizations([personalOrg, ...orgs]);
      setLoadingOrgs(false);
    }
  }, [isAuthenticated, user]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError("");
    try {
      const addr = await connectWallet();
      if (addr) {
        setWalletAddress(addr);
        // Check and switch network
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
          await switchToBaseSepolia();
        }
      } else {
        setError("Failed to connect wallet");
      }
    } catch (err) {
      setError("Failed to connect wallet");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectOrg = (org: GitHubOrg) => {
    setSelectedOrg(org);
    setTokenSymbol(`${org.login.toUpperCase().slice(0, 6)}-REP`);
    setStep("configure");
  };

  const handleDeploy = async () => {
    if (!selectedOrg || !walletAddress || !tokenSymbol) return;

    setIsDeploying(true);
    setError("");
    setDeployStatus("Checking network...");

    try {
      // Check network
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        setDeployStatus("Switching to Base Sepolia...");
        const switched = await switchToBaseSepolia();
        if (!switched) {
          throw new Error("Failed to switch to Base Sepolia network");
        }
      }

      if (!CONTRACT_ADDRESSES.devWorkFactory) {
        throw new Error("DevWorkFactory contract address not configured");
      }

      setDeployStatus("Preparing transaction...");

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        CONTRACT_ADDRESSES.devWorkFactory,
        DEV_WORK_FACTORY_ABI,
        signer
      );

      setDeployStatus("Deploying ecosystem (please confirm in wallet)...");

      // For simplicity, use deployer address as both verifier and arbiter
      // In production, these would be separate addresses
      const deployerAddress = await signer.getAddress();

      const tx = await factory.deployEcosystem(
        selectedOrg.login,
        tokenSymbol,
        deployerAddress, // verifier
        deployerAddress, // arbiter
        {
          value: ethers.parseEther(ECOSYSTEM_STAKE_AMOUNT),
        }
      );

      setDeployStatus("Waiting for confirmation...");
      const receipt = await tx.wait();

      // Parse the EcosystemDeployed event to get addresses
      let tokenAddr = "";
      let stakingAddr = "";

      // Try to get addresses from return value or events
      // For now, fetch from contract
      const ecosystemCount = await factory.getEcosystemsCount();
      const lastEcosystem = await factory.ecosystems(
        Number(ecosystemCount) - 1
      );
      tokenAddr = lastEcosystem.token;
      stakingAddr = lastEcosystem.staking;

      setDeployedAddresses({
        token: tokenAddr,
        staking: stakingAddr,
        txHash: receipt.hash,
      });

      // Update ecosystem cache
      const ecosystems = await fetchEcosystemsFromFactory();
      cacheEcosystems(ecosystems);

      // Store ecosystem info locally
      const ecosystemData = {
        name: selectedOrg.login,
        tokenSymbol,
        token: tokenAddr,
        staking: stakingAddr,
        deployer: deployerAddress,
        deployedAt: Date.now(),
        repos: [],
      };
      localStorage.setItem(
        `ecosystem_${selectedOrg.login}`,
        JSON.stringify(ecosystemData)
      );

      setStep("success");
      setDeployStatus("");
    } catch (err: unknown) {
      console.error("Deploy error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to deploy ecosystem";
      if (errorMessage.includes("user rejected")) {
        setError("Transaction rejected by user");
      } else {
        setError(errorMessage);
      }
      setDeployStatus("");
    } finally {
      setIsDeploying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={signIn} />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Create Your Ecosystem</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                Sign in with GitHub to create an ecosystem for your organization
              </p>
              <Button onClick={signIn} className="w-full">
                Sign in with GitHub
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            <StepIndicator
              number={1}
              label="Select Org"
              active={step === "select-org"}
              completed={step !== "select-org"}
            />
            <div className="h-px w-12 bg-border dark:bg-border-dark" />
            <StepIndicator
              number={2}
              label="Configure"
              active={step === "configure"}
              completed={step === "deploy" || step === "success"}
            />
            <div className="h-px w-12 bg-border dark:bg-border-dark" />
            <StepIndicator
              number={3}
              label="Deploy"
              active={step === "deploy"}
              completed={step === "success"}
            />
            <div className="h-px w-12 bg-border dark:bg-border-dark" />
            <StepIndicator
              number={4}
              label="Success"
              active={step === "success"}
              completed={false}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Select Organization */}
          {step === "select-org" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Select Organization
                </CardTitle>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Choose which GitHub organization to create an ecosystem for
                </p>
              </CardHeader>
              <CardContent>
                {loadingOrgs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                      No organizations found. You can create an ecosystem for
                      your personal account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {organizations.map((org) => (
                      <button
                        key={org.login}
                        onClick={() => handleSelectOrg(org)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-border dark:border-border-dark hover:border-primary hover:bg-primary/5 transition-colors text-left"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={org.avatar_url} alt={org.login} />
                          <AvatarFallback>
                            {org.login.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{org.login}</span>
                            {org.isOwner && (
                              <Badge variant="secondary" className="text-xs">
                                Owner
                              </Badge>
                            )}
                          </div>
                          {org.description && (
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary line-clamp-1">
                              {org.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-text-secondary" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Configure */}
          {step === "configure" && selectedOrg && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configure Ecosystem
                </CardTitle>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Set up your ecosystem parameters
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selected Org Preview */}
                <div className="flex items-center gap-4 p-4 bg-surface dark:bg-surface-dark rounded-lg">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedOrg.avatar_url} />
                    <AvatarFallback>
                      {selectedOrg.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{selectedOrg.login}</p>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                      Creating ecosystem for this organization
                    </p>
                  </div>
                </div>

                {/* Token Symbol */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reputation Token Symbol
                  </label>
                  <Input
                    value={tokenSymbol}
                    onChange={(e) =>
                      setTokenSymbol(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., BASE-REP"
                    maxLength={12}
                  />
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    This will be the symbol for your ecosystem&apos;s reputation
                    token
                  </p>
                </div>

                {/* Cost Info */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Coins className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        Deployment Cost
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {ECOSYSTEM_STAKE_AMOUNT} ETH on Base Sepolia to deploy
                        your ecosystem contracts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Connection */}
                {!walletAddress ? (
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="w-full"
                    variant="outline"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Wallet Connected: {walletAddress.slice(0, 6)}...
                      {walletAddress.slice(-4)}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrg(null);
                      setStep("select-org");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep("deploy")}
                    disabled={!walletAddress || !tokenSymbol}
                    className="flex-1"
                  >
                    Continue to Deploy
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Deploy */}
          {step === "deploy" && selectedOrg && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Deploy Ecosystem
                </CardTitle>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Review and deploy your ecosystem contracts
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4 p-4 bg-surface dark:bg-surface-dark rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Organization
                    </span>
                    <span className="font-medium">{selectedOrg.login}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Token Symbol
                    </span>
                    <span className="font-medium">{tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Cost
                    </span>
                    <span className="font-medium">
                      {ECOSYSTEM_STAKE_AMOUNT} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Network
                    </span>
                    <span className="font-medium">Base Sepolia</span>
                  </div>
                </div>

                {/* What gets deployed */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Contracts to be deployed:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-primary" />
                      <span>Reputation Token ({tokenSymbol})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Issue Staking Contract</span>
                    </div>
                  </div>
                </div>

                {deployStatus && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {deployStatus}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("configure")}
                    disabled={isDeploying}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="flex-1"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        Deploy Ecosystem
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Success */}
          {step === "success" && selectedOrg && deployedAddresses && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Ecosystem Created!</CardTitle>
                <p className="text-text-secondary dark:text-text-dark-secondary">
                  Your ecosystem has been successfully deployed
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Deployed Addresses */}
                <div className="space-y-3">
                  <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">
                      Reputation Token
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono flex-1 truncate">
                        {deployedAddresses.token}
                      </code>
                      <a
                        href={`${BASE_SEPOLIA_EXPLORER}/address/${deployedAddresses.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">
                      Issue Staking Contract
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono flex-1 truncate">
                        {deployedAddresses.staking}
                      </code>
                      <a
                        href={`${BASE_SEPOLIA_EXPLORER}/address/${deployedAddresses.staking}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">
                      Transaction
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono flex-1 truncate">
                        {deployedAddresses.txHash}
                      </code>
                      <a
                        href={`${BASE_SEPOLIA_EXPLORER}/tx/${deployedAddresses.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1"
                  >
                    Go Home
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/ecosystem/${selectedOrg.login}/dashboard`)
                    }
                    className="flex-1"
                  >
                    View Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          completed
            ? "bg-green-500 text-white"
            : active
            ? "bg-primary text-white"
            : "bg-surface dark:bg-surface-dark text-text-secondary"
        }`}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <span
        className={`text-xs ${
          active ? "text-primary font-medium" : "text-text-secondary"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
