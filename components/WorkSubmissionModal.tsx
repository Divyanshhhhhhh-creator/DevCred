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
  GitPullRequest,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { submitWork } from "@/lib/contracts/interactions";

interface WorkSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: {
    id: string;
    onChainId?: number;
    title: string;
    githubUrl?: string;
  } | null;
  onSuccess?: (prUrl: string) => void;
  stakingAddress?: string; // Dynamic staking contract address
}

export function WorkSubmissionModal({
  open,
  onOpenChange,
  issue,
  onSuccess,
  stakingAddress,
}: WorkSubmissionModalProps) {
  const [prUrl, setPrUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [prInfo, setPrInfo] = React.useState<{
    title?: string;
    merged?: boolean;
    state?: string;
  } | null>(null);
  const [checkingPR, setCheckingPR] = React.useState(false);

  // Validate and fetch PR info when URL changes
  React.useEffect(() => {
    const checkPR = async () => {
      if (!prUrl) {
        setPrInfo(null);
        return;
      }

      // Validate GitHub PR URL format
      const prMatch = prUrl.match(
        /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/
      );
      if (!prMatch) {
        setPrInfo(null);
        return;
      }

      setCheckingPR(true);
      try {
        const [, owner, repo, prNumber] = prMatch;
        const response = await fetch(
          `/api/github/pr?owner=${owner}&repo=${repo}&pr=${prNumber}`
        );
        if (response.ok) {
          const data = await response.json();
          setPrInfo({
            title: data.title,
            merged: data.merged,
            state: data.state,
          });
        } else {
          setPrInfo(null);
        }
      } catch {
        setPrInfo(null);
      } finally {
        setCheckingPR(false);
      }
    };

    const debounce = setTimeout(checkPR, 500);
    return () => clearTimeout(debounce);
  }, [prUrl]);

  const handleSubmit = async () => {
    if (!issue || !prUrl) return;

    setError("");

    // Validate PR URL format
    const prMatch = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!prMatch) {
      setError("Please enter a valid GitHub Pull Request URL");
      return;
    }

    // Check if contract is configured
    if (!stakingAddress) {
      // For now, just simulate success if contract not deployed
      console.log(
        "[WorkSubmission] Staking address not configured, simulating success"
      );
      if (onSuccess) onSuccess(prUrl);
      onOpenChange(false);
      setPrUrl("");
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit work to contract
      const result = await submitWork(
        stakingAddress,
        issue.onChainId || 0,
        prUrl
      );

      if (result.success) {
        console.log("[WorkSubmission] Submitted:", result.txHash);
        if (onSuccess) onSuccess(prUrl);
        onOpenChange(false);
        setPrUrl("");
      } else {
        setError(result.error || "Failed to submit work");
      }
    } catch (err) {
      console.error("[WorkSubmission] Error:", err);
      setError("Failed to submit work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-primary" />
            Submit Work
          </DialogTitle>
          <DialogDescription className="text-left">
            Submit the Pull Request that resolves this issue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Issue Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium">{issue.title}</p>
            {issue.githubUrl && (
              <a
                href={issue.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
              >
                View Issue <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* PR URL Input */}
          <div className="space-y-2">
            <label htmlFor="prUrl" className="text-sm font-medium">
              Pull Request URL
            </label>
            <div className="relative">
              <GitPullRequest className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
              <Input
                id="prUrl"
                type="url"
                placeholder="https://github.com/owner/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* PR Info Preview */}
          {checkingPR && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking PR status...
            </div>
          )}

          {prInfo && (
            <div
              className={`p-3 rounded-lg border ${
                prInfo.merged
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {prInfo.merged ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{prInfo.title}</p>
                  <p
                    className={`text-xs mt-1 ${
                      prInfo.merged
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {prInfo.merged ? "✓ Merged" : `Status: ${prInfo.state}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info about verification */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Next Step:</strong> After submitting, you can click
              &quot;Post & Verify&quot; to generate a TLSNotary proof and verify
              your work on-chain. Your reputation points will be unlocked after
              verification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!prUrl || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <GitPullRequest className="h-4 w-4 mr-2" />
                Submit Work
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
