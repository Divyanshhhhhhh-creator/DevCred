/**
 * API Route: Fetch User's Reputation Score from True Network
 *
 * This endpoint retrieves the on-chain reputation score for a user
 * calculated by the deployed reputation algorithm on True Network.
 *
 * GET /api/reputation/score?address=<wallet_address>&algorithmId=<optional>
 *
 * Returns:
 * - Overall reputation score (0-1000)
 * - Per-organization breakdown
 * - Detailed metrics for each organization
 */

import { NextRequest, NextResponse } from "next/server";
import { getTrueNetworkInstance } from "@/lib/trueNetwork/true.config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const algorithmId = searchParams.get("algorithmId");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get True Network instance
    const trueApi = await getTrueNetworkInstance();

    // Use algorithm ID from query param or from config
    const algoId = algorithmId ? parseInt(algorithmId) : undefined;

    if (!algoId) {
      return NextResponse.json(
        {
          error:
            "Algorithm not deployed yet. Please deploy the algorithm first using: npm run acm:deploy",
          message:
            "You need to deploy your reputation algorithm to True Network before fetching scores.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Fetching reputation score for:",
      walletAddress,
      "using algorithm:",
      algoId
    );

    // Fetch reputation score from True Network
    const reputationScore = await trueApi.getReputationScore(
      algoId,
      walletAddress
    );

    console.log("Reputation score from True Network:", reputationScore);

    // Also fetch per-organization breakdown from attestations
    // This requires querying all attestations for this user
    const orgReputations = await fetchOrgReputations(walletAddress);

    return NextResponse.json({
      success: true,
      walletAddress,
      algorithmId: algoId,
      overallScore: reputationScore,
      organizations: orgReputations,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching reputation score:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reputation score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch per-organization reputation breakdown
 * This queries all attestations for the user and returns detailed metrics
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchOrgReputations(_walletAddress: string) {
  try {
    // Query all attestations for this wallet address
    // For now, we'll return from our local calculation API
    // In production, this should query the blockchain directly

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/reputation/org`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch org reputations");
      return [];
    }

    const data = await response.json();

    // Return organizations with their detailed metrics
    return data.organizations.map(
      (org: {
        orgName: string;
        totalScore: number;
        repoActivityScore: number;
        tenureScore: number;
        languageStackScore: number;
        qualityScore: number;
        ossContributionScore: number;
        consistencyScore: number;
        totalPRs: number;
        mergedPRs: number;
        estimatedLOC: number;
        issueCount?: number;
        repoCount?: number;
        activeWeeks?: number;
        tenureYears?: number;
      }) => ({
        orgName: org.orgName,
        score: org.totalScore,
        metrics: {
          repoActivity: org.repoActivityScore,
          tenure: org.tenureScore,
          languageStack: org.languageStackScore,
          quality: org.qualityScore,
          ossContribution: org.ossContributionScore,
          consistency: org.consistencyScore,
        },
        details: {
          totalPRs: org.totalPRs,
          mergedPRs: org.mergedPRs,
          estimatedLOC: org.estimatedLOC,
          issueCount: org.issueCount,
          repoCount: org.repoCount,
          activeWeeks: org.activeWeeks,
          tenureYears: org.tenureYears,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching org reputations:", error);
    return [];
  }
}
