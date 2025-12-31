"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, Award } from "lucide-react";

interface OrgReputationCardProps {
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

export function OrgReputationCard({
  orgName,
  orgAvatar,
  orgDescription,
  totalScore,
  breakdown,
  totalContributions,
  repositoriesContributed,
  attestationId,
  prismUrl,
}: OrgReputationCardProps) {
  // Convert decimal score (0-1) to reputation points (0-10000)
  const reputationPoints = Math.round(totalScore * 10000);

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-600 dark:text-green-400";
    if (score >= 0.4) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Developing";
  };

  // Convert decimal to points for breakdown
  const toPoints = (decimal: number) => Math.round(decimal * 1000);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={orgAvatar} />
              <AvatarFallback>
                {orgName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{orgName}</CardTitle>
              {orgDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {orgDescription}
                </p>
              )}
            </div>
          </div>
          {prismUrl && (
            <a
              href={prismUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              title="View attestation on True Network"
            >
              <Award className="h-5 w-5" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Organization Reputation
              </p>
              <p className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
                {reputationPoints.toLocaleString()}
                <span className="text-lg font-normal text-gray-500 ml-1">
                  pts
                </span>
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {getScoreLabel(totalScore)}
            </Badge>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {totalContributions} contributions
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {repositoriesContributed} repos
            </span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm mb-3">Score Breakdown</h4>

          <ScoreBar
            label="Repo Activity"
            score={breakdown.repoActivityScore}
            weight={10}
            points={toPoints(breakdown.repoActivityScore)}
          />
          <ScoreBar
            label="Tenure"
            score={breakdown.tenureScore}
            weight={15}
            points={toPoints(breakdown.tenureScore)}
          />
          <ScoreBar
            label="Tech Stack"
            score={breakdown.languageStackScore}
            weight={15}
            points={toPoints(breakdown.languageStackScore)}
          />
          <ScoreBar
            label="Quality"
            score={breakdown.qualityScore}
            weight={20}
            points={toPoints(breakdown.qualityScore)}
          />
          <ScoreBar
            label="OSS Contribution"
            score={breakdown.ossContributionScore}
            weight={25}
            points={toPoints(breakdown.ossContributionScore)}
          />
          <ScoreBar
            label="Consistency"
            score={breakdown.consistencyScore}
            weight={15}
            points={toPoints(breakdown.consistencyScore)}
          />
        </div>

        {attestationId && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Award className="h-3 w-3" />
              <span>Attestation ID: {attestationId}</span>
              {prismUrl && (
                <a
                  href={prismUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                >
                  View on Prism <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({
  label,
  score,
  weight,
  points,
}: {
  label: string;
  score: number;
  weight: number;
  points: number;
}) {
  const percentage = Math.round(score * 100);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">
          {label} <span className="text-gray-400">(×{weight / 10})</span>
        </span>
        <span className="font-medium">{points.toLocaleString()} pts</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
