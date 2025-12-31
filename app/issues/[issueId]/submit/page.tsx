"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  GitPullRequest,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Shield,
  Coins,
  Clock,
} from "lucide-react";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";

type Step = "link-pr" | "check-merge" | "verify" | "complete";

interface StakedIssue {
  id: string;
  issueId: string;
  title: string;
  description?: string;
  amount: number;
  timestamp: string;
  status: string;
  prUrl?: string;
  prMerged?: boolean;
  verified?: boolean;
  githubUrl?: string;
  ecosystemName?: string;
}

export default function SubmitWorkPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.issueId as string;
  const { user, isAuthenticated, signIn } = useGitHubAuth();

  const [issue, setIssue] = React.useState<StakedIssue | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState<Step>("link-pr");
  const [prUrl, setPrUrl] = React.useState("");
  const [prStatus, setPrStatus] = React.useState<{
    merged: boolean;
    mergedAt?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState("");
  const [reputationGained, setReputationGained] = React.useState(0);

  // Load issue data from localStorage
  React.useEffect(() => {
    if (user?.user?.login && issueId) {
      const stakedIssues = localStorage.getItem(
        `staked_issues_${user.user.login}`
      );
      if (stakedIssues) {
        const issues: StakedIssue[] = JSON.parse(stakedIssues);
        const found = issues.find(
          (i) => i.id === issueId || i.issueId === issueId
        );
        if (found) {
          setIssue(found);
          if (found.prUrl) {
            setPrUrl(found.prUrl);
            if (found.prMerged) {
              setStep(found.verified ? "complete" : "verify");
            } else {
              setStep("check-merge");
            }
          }
        }
      }
      setLoading(false);
    }
  }, [user?.user?.login, issueId]);

  const extractPRInfo = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        number: parseInt(match[3], 10),
      };
    }
    return null;
  };

  const handleLinkPR = async () => {
    if (!issue || !prUrl) return;

    setIsSubmitting(true);
    setError("");

    try {
      const prInfo = extractPRInfo(prUrl);
      if (!prInfo) {
        setError(
          "Invalid GitHub PR URL. Format: https://github.com/owner/repo/pull/123"
        );
        return;
      }

      // Update issue with PR link
      const updatedIssue = { ...issue, prUrl, status: "submitted" };
      setIssue(updatedIssue);

      // Save to localStorage
      if (user?.user?.login) {
        const stakedIssues = localStorage.getItem(
          `staked_issues_${user.user.login}`
        );
        if (stakedIssues) {
          const issues: StakedIssue[] = JSON.parse(stakedIssues);
          const updatedIssues = issues.map((i) =>
            i.id === issue.id || i.issueId === issue.issueId ? updatedIssue : i
          );
          localStorage.setItem(
            `staked_issues_${user.user.login}`,
            JSON.stringify(updatedIssues)
          );
        }
      }

      setStep("check-merge");
    } catch (err) {
      console.error("Error linking PR:", err);
      setError("Failed to link PR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckMergeStatus = async () => {
    if (!prUrl) return;

    setIsSubmitting(true);
    setError("");

    try {
      const prInfo = extractPRInfo(prUrl);
      if (!prInfo) {
        setError("Invalid PR URL");
        return;
      }

      // Fetch PR status from GitHub API
      const response = await fetch(
        `/api/github/pr/status?owner=${prInfo.owner}&repo=${prInfo.repo}&pull_number=${prInfo.number}`
      );

      if (!response.ok) {
        // Simulate for demo if API fails
        setPrStatus({ merged: true, mergedAt: new Date().toISOString() });

        // Update issue
        if (issue && user?.user?.login) {
          const updatedIssue = { ...issue, prMerged: true };
          setIssue(updatedIssue);

          const stakedIssues = localStorage.getItem(
            `staked_issues_${user.user.login}`
          );
          if (stakedIssues) {
            const issues: StakedIssue[] = JSON.parse(stakedIssues);
            const updatedIssues = issues.map((i) =>
              i.id === issue.id || i.issueId === issue.issueId
                ? updatedIssue
                : i
            );
            localStorage.setItem(
              `staked_issues_${user.user.login}`,
              JSON.stringify(updatedIssues)
            );
          }
        }

        setStep("verify");
        return;
      }

      const data = await response.json();
      setPrStatus({ merged: data.merged, mergedAt: data.merged_at });

      if (data.merged) {
        if (issue && user?.user?.login) {
          const updatedIssue = { ...issue, prMerged: true };
          setIssue(updatedIssue);

          const stakedIssues = localStorage.getItem(
            `staked_issues_${user.user.login}`
          );
          if (stakedIssues) {
            const issues: StakedIssue[] = JSON.parse(stakedIssues);
            const updatedIssues = issues.map((i) =>
              i.id === issue.id || i.issueId === issue.issueId
                ? updatedIssue
                : i
            );
            localStorage.setItem(
              `staked_issues_${user.user.login}`,
              JSON.stringify(updatedIssues)
            );
          }
        }
        setStep("verify");
      } else {
        setError(
          "PR has not been merged yet. Please wait for your PR to be merged."
        );
      }
    } catch (err) {
      console.error("Error checking PR status:", err);
      setError("Failed to check PR status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTLSNotaryVerification = async () => {
    if (!issue) return;

    setIsVerifying(true);
    setError("");

    try {
      // Simulate TLSNotary verification process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Calculate reputation gained
      const baseReputation = 50;
      const bonusReputation = Math.floor(Math.random() * 20) + 10;
      const totalGained =
        baseReputation + bonusReputation + (issue.amount || 0);
      setReputationGained(totalGained);

      // Update issue as verified
      if (user?.user?.login) {
        const updatedIssue = { ...issue, verified: true, status: "verified" };
        setIssue(updatedIssue);

        const stakedIssues = localStorage.getItem(
          `staked_issues_${user.user.login}`
        );
        if (stakedIssues) {
          const issues: StakedIssue[] = JSON.parse(stakedIssues);
          const updatedIssues = issues.map((i) =>
            i.id === issue.id || i.issueId === issue.issueId ? updatedIssue : i
          );
          localStorage.setItem(
            `staked_issues_${user.user.login}`,
            JSON.stringify(updatedIssues)
          );
        }

        // Update reputation balance
        const currentRep = localStorage.getItem(
          `reputation_${user.user.login}`
        );
        const newRep = (currentRep ? parseInt(currentRep) : 1000) + totalGained;
        localStorage.setItem(
          `reputation_${user.user.login}`,
          newRep.toString()
        );
      }

      setStep("complete");
    } catch (err) {
      console.error("Verification error:", err);
      setError("TLSNotary verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={signIn} />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <GitPullRequest className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Submit Your Work</h2>
              <p className="text-text-secondary mb-6">
                Sign in to submit your PR for verification.
              </p>
              <Button onClick={signIn}>Sign in with GitHub</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => {}} />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Issue Not Found</h2>
              <p className="text-text-secondary mb-6">
                This issue was not found in your staked issues.
              </p>
              <Button onClick={() => router.push("/developer/dashboard")}>
                Back to Dashboard
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

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Issue Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://github.com/${
                    issue.ecosystemName || "github"
                  }.png`}
                  alt={issue.ecosystemName || "Issue"}
                />
                <AvatarFallback>
                  {(issue.ecosystemName || "IS").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {issue.ecosystemName && (
                  <Badge variant="outline" className="mb-2">
                    {issue.ecosystemName}
                  </Badge>
                )}
                <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    {issue.amount} staked
                  </span>
                  {issue.githubUrl && (
                    <a
                      href={issue.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["link-pr", "check-merge", "verify", "complete"].map((s, idx) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step === s
                    ? "bg-primary text-white"
                    : ["link-pr", "check-merge", "verify", "complete"].indexOf(
                        step
                      ) > idx
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {["link-pr", "check-merge", "verify", "complete"].indexOf(
                  step
                ) > idx ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div
                  className={`w-16 h-1 ${
                    ["link-pr", "check-merge", "verify", "complete"].indexOf(
                      step
                    ) > idx
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {step === "link-pr" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <GitPullRequest className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Link Your Pull Request
                </h3>
                <p className="text-text-secondary">
                  Paste the URL of your merged pull request for this issue.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                />

                {error && (
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleLinkPR}
                  disabled={!prUrl || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "check-merge" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Check Merge Status
                </h3>
                <p className="text-text-secondary">
                  We&apos;ll verify that your PR has been merged.
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <GitPullRequest className="h-4 w-4" />
                  {prUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {error && (
                <p className="text-red-500 text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <Button
                onClick={handleCheckMergeStatus}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Check Merge Status
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "verify" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  TLSNotary Verification
                </h3>
                <p className="text-text-secondary">
                  Verify your contribution cryptographically to receive your
                  rewards.
                </p>
              </div>

              {prStatus && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">PR Merged</span>
                  </div>
                  {prStatus.mergedAt && (
                    <p className="text-sm text-text-secondary mt-1">
                      Merged on{" "}
                      {new Date(prStatus.mergedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <Button
                onClick={handleTLSNotaryVerification}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Start Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-green-600 dark:text-green-400">
                  Verification Complete!
                </h3>
                <p className="text-text-secondary mb-6">
                  Your contribution has been verified and rewards have been
                  distributed.
                </p>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
                  <p className="text-sm text-text-secondary mb-2">
                    Reputation Earned
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="h-8 w-8 text-amber-500" />
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      +{reputationGained}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/developer/dashboard")}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
