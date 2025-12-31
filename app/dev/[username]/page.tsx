"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrgReputationCard } from "@/components/OrgReputationCard";
import { OrgReputationScores } from "@/components/OrgReputationScores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Github,
  GitPullRequest,
  Star,
  TrendingUp,
  Coins,
  ExternalLink,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Award,
} from "lucide-react";

interface OrgReputation {
  orgName: string;
  orgAvatar?: string;
  orgDescription?: string;
  totalScore: number;
  breakdown: {
    repoActivityScore: number;
    tenureScore: number;
    languageStackScore: number;
    qualityScore: number;
    ossContributionScore: number;
    consistencyScore: number;
  };
  totalContributions: number;
  repositoriesContributed: number;
  attestationId?: string;
  prismUrl?: string;
}

export default function DeveloperProfileLanding() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, signIn, loading } = useGitHubAuth();
  const [tokenPrice] = useState(0.025);
  const [isOwner, setIsOwner] = useState(false);
  const [orgReputations, setOrgReputations] = useState<OrgReputation[]>([]);
  const [loadingOrgRep, setLoadingOrgRep] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const developerUsername = params?.username as string;

  useEffect(() => {
    // Check if viewing own profile
    if (user?.user?.login === developerUsername) {
      setIsOwner(true);
      // Auto-generate organization reputations when profile loads
      loadOrgReputations();

      // Load wallet address from localStorage if available
      const savedWallet = localStorage.getItem("wallet_address");
      if (savedWallet) {
        setWalletAddress(savedWallet);
      }
    }
  }, [user, developerUsername]);

  const loadOrgReputations = async () => {
    setLoadingOrgRep(true);
    try {
      const response = await fetch("/api/reputation/org");
      if (response.ok) {
        const data = await response.json();
        setOrgReputations(data.organizations || []);
      }
    } catch (error) {
      console.error("Failed to load org reputations:", error);
    } finally {
      setLoadingOrgRep(false);
    }
  };

  // Calculate reputation score
  const calculateReputationScore = () => {
    if (!user?.stats) return 0;
    const starsWeight = user.stats.totalStars * 2;
    const prsWeight = user.stats.totalPRsMerged * 10;
    const reposWeight = user.stats.totalRepos * 5;
    const orgsWeight = user.stats.organizationsCount * 15;

    return Math.min(
      Math.floor((starsWeight + prsWeight + reposWeight + orgsWeight) / 10),
      10000
    );
  };

  const handleBuyTokens = () => {
    if (!isAuthenticated) {
      signIn();
    } else {
      // TODO: Connect wallet and show buy modal
      alert("Wallet connection coming soon!");
    }
  };

  const handleLogin = () => {
    signIn();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Not authenticated - show placeholder
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={handleLogin} />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <Github className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Developer Profile</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
              Sign in with GitHub to view {developerUsername}&apos;s profile and
              contributions
            </p>
            <Button onClick={handleLogin} size="lg" className="w-full">
              <Github className="mr-2 h-5 w-5" />
              Sign in with GitHub
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // TypeScript guard - user is definitely not null at this point
  if (!user) {
    return null;
  }

  const reputationScore = calculateReputationScore();
  const recentPRs =
    (
      user as {
        recentPRs?: Array<{
          id: string;
          html_url: string;
          org: string;
          repo: string;
          title: string;
          merged_at: string;
        }>;
      }
    )?.recentPRs || [];
  const prsByOrg =
    (user as { prsByOrganization?: Record<string, number> })
      ?.prsByOrganization || {};

  // Get top organizations by PR count
  const topOrgs = Object.entries(prsByOrg)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background-dark">
      <Header onLoginClick={handleLogin} />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Developer Profile Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-8 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage
                  src={user.user.avatar_url}
                  alt={user.user.name || user.user.login}
                />
                <AvatarFallback>
                  {user.user.login.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {user.user.name || user.user.login}
                  </h1>
                  <Badge variant="secondary" className="gap-1">
                    <Github className="h-3 w-3" />@{user.user.login}
                  </Badge>
                </div>
                {user.user.bio && (
                  <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                    {user.user.bio}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <GitPullRequest className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">
                      {user.stats.totalPRsMerged}
                    </span>
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      PRs Merged
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold">
                      {user.stats.totalStars}
                    </span>
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Stars
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">
                      {user.stats.organizationsCount}
                    </span>
                    <span className="text-text-secondary dark:text-text-dark-secondary">
                      Organizations
                    </span>
                  </div>
                </div>
              </div>

              {/* Reputation Score Badge */}
              <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl border-2 border-primary/20">
                <div className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                  Reputation Score
                </div>
                <div className="text-4xl font-bold text-primary">
                  {reputationScore}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Recent Contributions - 2 columns */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Recent Pull Requests
              </CardTitle>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Latest merged contributions across organizations
              </p>
            </CardHeader>
            <CardContent>
              {recentPRs.length > 0 ? (
                <div className="space-y-3">
                  {recentPRs.map((pr) => (
                    <a
                      key={pr.id}
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <GitPullRequest className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <Badge variant="outline" className="text-xs">
                              {pr.org}
                            </Badge>
                            <span className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                              {pr.repo.split("/")[1]}
                            </span>
                          </div>
                          <p className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {pr.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Merged{" "}
                              {new Date(pr.merged_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-text-secondary dark:text-text-dark-secondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-text-secondary dark:text-text-dark-secondary py-8">
                  No recent pull requests found
                </p>
              )}

              {/* Summary of contributions by org */}
              {topOrgs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border dark:border-border-dark">
                  <h4 className="text-sm font-semibold mb-3">
                    Contributions Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {topOrgs.map(([org, count]) => (
                      <a
                        key={org}
                        href={`/org/${org}`}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                      >
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {org}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {count} PRs
                        </Badge>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Purchase Card - 1 column */}
          <Card className="md:col-span-1 h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-amber-600" />
                Developer Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                <div className="text-sm text-text-secondary dark:text-text-dark-secondary mb-1">
                  Current Price
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {tokenPrice} ETH
                </div>
                <div className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                  per token
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-text-dark-secondary">
                    Market Cap
                  </span>
                  <span className="font-medium">12.5 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-text-dark-secondary">
                    24h Volume
                  </span>
                  <span className="font-medium">2.3 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-text-dark-secondary">
                    Holders
                  </span>
                  <span className="font-medium">47</span>
                </div>
              </div>

              {isOwner ? (
                <Button
                  className="w-full"
                  onClick={() => router.push("/developer/dashboard")}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    onClick={handleBuyTokens}
                    size="lg"
                  >
                    <Coins className="mr-2 h-5 w-5" />
                    Buy Tokens
                  </Button>

                  {!isAuthenticated && (
                    <div className="text-xs text-center text-text-secondary dark:text-text-dark-secondary">
                      Connect GitHub & Wallet to purchase
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Organization-Specific Reputation Section */}
        {isOwner && (
          <div className="max-w-4xl mx-auto mt-8">
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">Local Calculations</TabsTrigger>
                <TabsTrigger value="onchain">On-Chain Reputation</TabsTrigger>
              </TabsList>

              {/* Local Reputation Calculations */}
              <TabsContent value="local">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-purple-600" />
                    <h2 className="text-2xl font-bold">
                      Organization Reputation
                    </h2>
                  </div>
                  <Button
                    onClick={loadOrgReputations}
                    disabled={loadingOrgRep}
                    variant="outline"
                    className="gap-2"
                  >
                    {loadingOrgRep ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        Generate Reputation
                      </>
                    )}
                  </Button>
                </div>

                {loadingOrgRep ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
                      Analyzing your contributions across organizations...
                    </p>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : orgReputations.length > 0 ? (
                  <div className="grid gap-6">
                    {orgReputations.map((orgRep) => (
                      <OrgReputationCard key={orgRep.orgName} {...orgRep} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Organization Reputation Yet
                    </h3>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                      Click &quot;Generate Reputation&quot; to calculate your
                      reputation scores across all organizations you contribute
                      to.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* On-Chain Reputation from True Network Algorithm */}
              <TabsContent value="onchain">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-6 w-6 text-purple-600" />
                    <h2 className="text-2xl font-bold">
                      On-Chain Reputation Scores
                    </h2>
                  </div>
                  <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                    Verifiable reputation scores calculated by True
                    Network&apos;s on-chain algorithm
                  </p>
                </div>

                {walletAddress ? (
                  <OrgReputationScores
                    walletAddress={walletAddress}
                    showOverallScore={true}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Wallet Not Connected
                    </h3>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                      Connect your wallet to view your on-chain reputation
                      scores from True Network.
                    </p>
                    <Button onClick={() => router.push("/")}>
                      Connect Wallet
                    </Button>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
