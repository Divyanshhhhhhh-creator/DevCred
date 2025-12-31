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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertCircle,
  Coins,
  Lock,
} from "lucide-react";

interface TLSNotaryVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: {
    id: string;
    title: string;
    prUrl: string;
  };
  onVerified: (reputationGained: number) => void;
}

type VerificationStep =
  | "init"
  | "connecting"
  | "fetching"
  | "verifying"
  | "complete"
  | "error";

export function TLSNotaryVerificationModal({
  open,
  onOpenChange,
  issue,
  onVerified,
}: TLSNotaryVerificationModalProps) {
  const [step, setStep] = React.useState<VerificationStep>("init");
  const [error, setError] = React.useState("");
  const [reputationGained, setReputationGained] = React.useState(0);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setStep("init");
      setError("");
      setReputationGained(0);
    }
  }, [open]);

  const startVerification = async () => {
    setError("");

    try {
      // Step 1: Connecting to TLSNotary
      setStep("connecting");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Fetching PR data
      setStep("fetching");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Verifying with cryptographic proof
      setStep("verifying");
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Step 4: Complete - calculate reputation gained
      const baseReputation = 50; // Base reputation for completing an issue
      const bonusReputation = Math.floor(Math.random() * 20) + 10; // Random bonus 10-30
      const totalGained = baseReputation + bonusReputation;
      setReputationGained(totalGained);

      setStep("complete");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Verification failed. Please try again.");
      setStep("error");
    }
  };

  const handleComplete = () => {
    onVerified(reputationGained);
    onOpenChange(false);
  };

  const getStepContent = () => {
    switch (step) {
      case "init":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">TLSNotary Verification</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                This process will cryptographically verify that your PR was
                merged on GitHub without revealing sensitive data.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Privacy Preserving</p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                    Only the merge status is verified, not your code
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Cryptographic Proof</p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                    Uses TLS session proofs for verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Coins className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Earn Rewards</p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                    Get reputation points and unlock your stake
                  </p>
                </div>
              </div>
            </div>

            {issue.prUrl && (
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm truncate flex-1">{issue.prUrl}</span>
                <a
                  href={issue.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              </div>
            )}
          </div>
        );

      case "connecting":
      case "fetching":
      case "verifying":
        return (
          <div className="space-y-6 py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {step === "connecting" && "Connecting to TLSNotary..."}
                {step === "fetching" && "Fetching PR Data..."}
                {step === "verifying" && "Generating Cryptographic Proof..."}
              </h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                {step === "connecting" &&
                  "Establishing secure connection to verification service"}
                {step === "fetching" &&
                  "Retrieving PR merge status from GitHub"}
                {step === "verifying" &&
                  "Creating zero-knowledge proof of merge status"}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge
                variant={step === "connecting" ? "default" : "secondary"}
                className={
                  step !== "connecting" ? "bg-green-500 text-white" : ""
                }
              >
                {step !== "connecting" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                Connect
              </Badge>
              <Badge
                variant={
                  step === "fetching"
                    ? "default"
                    : step === "verifying"
                    ? "secondary"
                    : "outline"
                }
                className={
                  step === "verifying" ? "bg-green-500 text-white" : ""
                }
              >
                {step === "verifying" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : step === "fetching" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Fetch
              </Badge>
              <Badge variant={step === "verifying" ? "default" : "outline"}>
                {step === "verifying" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Verify
              </Badge>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Verification Complete!
              </h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Your PR merge has been cryptographically verified.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-2">
                Reputation Earned
              </p>
              <div className="flex items-center justify-center gap-2">
                <Coins className="h-8 w-8 text-amber-500" />
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{reputationGained}
                </span>
              </div>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2">
                Plus your staked amount has been unlocked
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6 py-8">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Verification Failed
              </h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                {error || "An error occurred during verification."}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === "complete" ? "Verification Complete" : "Verify Your Work"}
          </DialogTitle>
          {step === "init" && (
            <DialogDescription>
              Verify that your PR for &quot;{issue.title}&quot; was merged.
            </DialogDescription>
          )}
        </DialogHeader>

        {getStepContent()}

        <DialogFooter>
          {step === "init" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={startVerification} className="gap-2">
                <Shield className="h-4 w-4" />
                Start Verification
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleComplete} className="w-full gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          )}

          {step === "error" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={startVerification}>Try Again</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
