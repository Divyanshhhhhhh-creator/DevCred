/**
 * Organization Reputation Score Card Component
 * 
 * Displays per-organization reputation scores with detailed metrics
 * Fetches data from True Network's on-chain reputation algorithm
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Code, Calendar, Award, Target, Activity } from "lucide-react";

interface OrgReputation {
  orgName: string;
  score: number;
  metrics: {
    repoActivity: number;
    tenure: number;
    languageStack: number;
    quality: number;
    ossContribution: number;
    consistency: number;
  };
  details: {
    totalPRs: number;
    mergedPRs: number;
    estimatedLOC: number;
    issueCount: number;
    repoCount: number;
    activeWeeks: number;
    tenureYears: number;
  };
}

interface ReputationScoreData {
  walletAddress: string;
  algorithmId?: number;
  overallScore: number;
  organizations: OrgReputation[];
  timestamp: number;
}

interface Props {
  walletAddress: string;
  algorithmId?: number;
  showOverallScore?: boolean;
}

export function OrgReputationScores({ 
  walletAddress, 
  algorithmId,
  showOverallScore = true 
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReputationScoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReputationScores();
  }, [walletAddress, algorithmId]);

  const fetchReputationScores = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/reputation/score', window.location.origin);
      url.searchParams.set('address', walletAddress);
      if (algorithmId) {
        url.searchParams.set('algorithmId', algorithmId.toString());
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reputation scores');
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching reputation scores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reputation scores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Loading Reputation Scores...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Error Loading Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          {error.includes('Algorithm not deployed') && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium mb-2">To enable reputation scores:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npm run acm:setup</code></li>
                <li>Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npm run acm:prepare</code></li>
                <li>Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npm run acm:compile</code></li>
                <li>Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npm run acm:deploy</code></li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 60) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {showOverallScore && data.overallScore > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Overall Reputation Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(data.overallScore)}`}>
                {data.overallScore}
              </div>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                Calculated from {data.organizations.length} organization{data.organizations.length !== 1 ? 's' : ''}
              </p>
              {data.algorithmId && (
                <Badge variant="outline" className="text-xs">
                  Algorithm ID: {data.algorithmId}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Organization Scores */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Reputation by Organization
        </h3>
        
        {data.organizations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-secondary dark:text-text-dark-secondary">
                No organization reputations found yet. Start contributing to open source projects!
              </p>
            </CardContent>
          </Card>
        ) : (
          data.organizations
            .sort((a, b) => b.score - a.score)
            .map((org) => (
              <Card key={org.orgName} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      <a 
                        href={`https://github.com/${org.orgName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {org.orgName}
                      </a>
                    </CardTitle>
                    <Badge className={`text-lg px-3 py-1 ${getScoreBadge(org.score)}`}>
                      {org.score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <MetricCard
                      icon={<Code className="h-4 w-4" />}
                      label="Repo Activity"
                      value={org.metrics.repoActivity}
                      color="blue"
                    />
                    <MetricCard
                      icon={<Calendar className="h-4 w-4" />}
                      label="Tenure"
                      value={org.metrics.tenure}
                      color="green"
                    />
                    <MetricCard
                      icon={<Target className="h-4 w-4" />}
                      label="Language Stack"
                      value={org.metrics.languageStack}
                      color="purple"
                    />
                    <MetricCard
                      icon={<Award className="h-4 w-4" />}
                      label="Quality"
                      value={org.metrics.quality}
                      color="yellow"
                    />
                    <MetricCard
                      icon={<TrendingUp className="h-4 w-4" />}
                      label="OSS Contribution"
                      value={org.metrics.ossContribution}
                      color="indigo"
                    />
                    <MetricCard
                      icon={<Activity className="h-4 w-4" />}
                      label="Consistency"
                      value={org.metrics.consistency}
                      color="pink"
                    />
                  </div>

                  {/* Details */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <DetailItem label="PRs" value={`${org.details.mergedPRs}/${org.details.totalPRs}`} />
                      <DetailItem label="LOC" value={org.details.estimatedLOC.toLocaleString()} />
                      <DetailItem label="Issues" value={org.details.issueCount} />
                      <DetailItem label="Repos" value={org.details.repoCount} />
                      <DetailItem label="Active Weeks" value={org.details.activeWeeks} />
                      <DetailItem label="Tenure" value={`${org.details.tenureYears} years`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300",
    pink: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
