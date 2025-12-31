"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Coins,
  AlertCircle,
  Loader2,
  Wallet,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import {
  getReputationInfo,
  acceptAssignment,
  registerDeveloper,
  connectWallet,
  getConnectedAddress,
  ReputationInfo,
} from "@/lib/contracts/interactions";
import { getStakingAddress } from "@/lib/contracts/config";

interface StakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: {
    id: string;
    onChainId?: number;
    title: string;
    stakeAmountRequired: number;
  } | null;
  onSuccess?: () => void;
  ecosystemName?: string; // Name of the ecosystem to get staking address
  stakingAddress?: string; // Direct staking address override
}

export function StakeModal({
  open,
  onOpenChange,
  issue,
  onSuccess,
  ecosystemName,
  stakingAddress: propStakingAddress,
}: StakeModalProps) {
  const [amount, setAmount] = React.useState("");
  const [isStaking, setIsStaking] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [reputationInfo, setReputationInfo] =
    React.useState<ReputationInfo | null>(null);
  const [loadingRep, setLoadingRep] = React.useState(false);
  const [stakingAddress, setStakingAddress] = React.useState<string | null>(
    propStakingAddress || null
  );
  const { user } = useGitHubAuth();

  // Resolve staking address from ecosystem name or prop
  React.useEffect(() => {
    const resolveStakingAddress = async () => {
      if (propStakingAddress) {
        setStakingAddress(propStakingAddress);
      } else if (ecosystemName) {
        const addr = await getStakingAddress(ecosystemName);
        setStakingAddress(addr);
      }
    };
    resolveStakingAddress();
  }, [propStakingAddress, ecosystemName]);

  // Check wallet connection and load reputation on open
  React.useEffect(() => {
    if (open) {
      loadWalletAndReputation();
    }
  }, [open, stakingAddress]);

  const loadWalletAndReputation = async () => {
    setLoadingRep(true);
    try {
      const address = await getConnectedAddress();
      setWalletAddress(address);

      if (address && stakingAddress) {
        const repInfo = await getReputationInfo(stakingAddress, address);
        setReputationInfo(repInfo);
      } else if (address) {
        // Fallback to localStorage if contract not configured
        const stored = localStorage.getItem(`reputation_${user?.user?.login}`);
        const balance = stored ? parseInt(stored) : 1000;
        if (!stored) {
          localStorage.setItem(`reputation_${user?.user?.login}`, "1000");
        }
        setReputationInfo({
          total: BigInt(balance),
          locked: BigInt(0),
          available: BigInt(balance),
          isRegistered: true,
        });
      }
    } catch (err) {
      console.error("Error loading reputation:", err);
    } finally {
      setLoadingRep(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError("");
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        await loadWalletAndReputation();
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    } catch {
      setError("Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress) return;

    setIsRegistering(true);
    setError("");
    try {
      if (stakingAddress) {
        const result = await registerDeveloper(stakingAddress);
        if (result.success) {
          await loadWalletAndReputation();
        } else {
          setError(result.error || "Registration failed");
        }
      } else {
        // Simulate registration for testing
        localStorage.setItem(`reputation_${user?.user?.login}`, "50");
        setReputationInfo({
          total: BigInt(50),
          locked: BigInt(0),
          available: BigInt(50),
          isRegistered: true,
        });
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStake = async () => {
    if (!issue || !amount || !walletAddress) return;

    const stakeAmount = parseInt(amount);
    const availableRep = Number(reputationInfo?.available || 0);
    setError("");

    // Check if user has enough reputation
    if (stakeAmount > availableRep) {
      setError(
        `Insufficient reputation. You have ${availableRep} available, but need ${stakeAmount}.`
      );
      return;
    }

    // Check if stake amount meets requirement
    if (stakeAmount < issue.stakeAmountRequired) {
      setError(
        `Stake amount must be at least ${issue.stakeAmountRequired} points.`
      );
      return;
    }

    setIsStaking(true);
    try {
      if (stakingAddress && issue.onChainId !== undefined) {
        // Real contract call
        const result = await acceptAssignment(
          stakingAddress,
          issue.onChainId,
          BigInt(stakeAmount)
        );

        if (result.success) {
          console.log("Staked successfully:", result.txHash);
          if (onSuccess) onSuccess();
          onOpenChange(false);
          setAmount("");
        } else {
          setError(result.error || "Staking failed");
        }
      } else {
        // Fallback: localStorage simulation
        const newBalance = availableRep - stakeAmount;
        localStorage.setItem(
          `reputation_${user?.user?.login}`,
          newBalance.toString()
        );

        // Store staked issue
        const stakedIssues = JSON.parse(
          localStorage.getItem(`staked_issues_${user?.user?.login}`) || "[]"
        );
        stakedIssues.push({
          issueId: issue.id,
          amount: stakeAmount,
          timestamp: new Date().toISOString(),
          status: "assigned",
        });
        localStorage.setItem(
          `staked_issues_${user?.user?.login}`,
          JSON.stringify(stakedIssues)
        );

        console.log("Staked successfully (localStorage)");
        if (onSuccess) onSuccess();
        onOpenChange(false);
        setAmount("");
      }
    } catch (err) {
      console.error("Staking failed:", err);
      setError("Staking failed. Please try again.");
    } finally {
      setIsStaking(false);
    }
  };

  if (!issue) return null;

  const availableRep = Number(reputationInfo?.available || 0);
  const totalRep = Number(reputationInfo?.total || 0);
  const lockedRep = Number(reputationInfo?.locked || 0);
  const isRegistered = reputationInfo?.isRegistered ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Stake on Issue
          </DialogTitle>
          <DialogDescription className="text-left">
            {issue.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet Connection */}
          {!walletAddress ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                Connect your wallet to stake reputation on this issue
              </p>
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                Connect Wallet
              </Button>
            </div>
          ) : !isRegistered ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Register as a developer to receive your initial 50 reputation
                points
              </p>
              <Button
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full"
              >
                {isRegistering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Register & Get 50 Points
              </Button>
            </div>
          ) : (
            <>
              {/* Wallet Connected */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200 font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>

              {/* Reputation Balance */}
              {loadingRep ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Available Reputation
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {availableRep}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-text-secondary dark:text-text-dark-secondary">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>{totalRep}</span>
                    </div>
                    {lockedRep > 0 && (
                      <div className="flex justify-between">
                        <span>Locked (staked)</span>
                        <span className="text-yellow-600">-{lockedRep}</span>
                      </div>
                    )}
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                    <div className="h-full flex">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{
                          width: `${
                            totalRep > 0 ? (availableRep / totalRep) * 100 : 100
                          }%`,
                        }}
                      />
                      <div
                        className="bg-yellow-500 h-full transition-all"
                        style={{
                          width: `${
                            totalRep > 0 ? (lockedRep / totalRep) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Required Stake */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  Required stake:{" "}
                  <span className="font-semibold text-foreground">
                    {issue.stakeAmountRequired}
                  </span>{" "}
                  points
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Stake Amount Input */}
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Stake Amount
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min: ${issue.stakeAmountRequired}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    min={issue.stakeAmountRequired}
                    max={availableRep}
                  />
                </div>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                  Your stake will be locked until the issue is resolved
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {walletAddress && isRegistered && (
            <Button
              onClick={handleStake}
              disabled={
                !amount || isStaking || parseInt(amount || "0") > availableRep
              }
            >
              {isStaking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Staking...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Confirm Stake
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
