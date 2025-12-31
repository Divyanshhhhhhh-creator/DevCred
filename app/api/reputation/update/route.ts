/**
 * API Route: Update Existing Attestations
 *
 * This endpoint updates existing attestations on True Network when a user creates a new post.
 * It fetches fresh GitHub data and updates the on-chain attestations with new metrics.
 *
 * POST /api/reputation/update
 * Body: { walletAddress, username, existingAttestations }
 */

import { NextRequest, NextResponse } from "next/server";
import { orgReputationSchema } from "@/lib/trueNetwork/schemas";
import { getTrueNetworkInstance } from "@/lib/trueNetwork/true.config";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("github_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { walletAddress, username, existingAttestations } =
      await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log(
      "🔄 Updating attestations for:",
      username,
      "with wallet:",
      walletAddress
    );

    // Fetch fresh reputation data
    const reputationRes = await fetch(
      `${request.nextUrl.origin}/api/reputation/org`,
      {
        headers: {
          Cookie: `github_access_token=${accessToken}`,
        },
      }
    );

    if (!reputationRes.ok) {
      throw new Error("Failed to fetch fresh reputation data");
    }

    const reputationData = await reputationRes.json();

    // Get existing attestations from client (passed in request body)
    const existingAttestationsMap = existingAttestations || {};

    // Initialize TrueNetwork API
    console.log("Initializing TrueNetwork connection...");
    const api = await getTrueNetworkInstance();

    const updateResults = [];
    const newAttestations = [];

    // Helper function to safely convert scores
    const safeScore = (value: unknown): number => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? 0 : Math.round(num);
    };

    // Process all organizations
    for (const orgReputation of reputationData.organizations) {
      const orgName = orgReputation.orgName;
      const existingAttestation = existingAttestationsMap[orgName];

      // Prepare attestation data
      const attestationData = {
        orgName,
        developerAddress: walletAddress,
        totalScore: safeScore(orgReputation.totalScore * 100),
        repoActivityScore: safeScore(orgReputation.repoActivityScore * 100),
        tenureScore: safeScore(orgReputation.tenureScore * 100),
        languageStackScore: safeScore(orgReputation.languageStackScore * 100),
        qualityScore: safeScore(orgReputation.qualityScore * 100),
        ossContributionScore: safeScore(
          orgReputation.ossContributionScore * 100
        ),
        consistencyScore: safeScore(orgReputation.consistencyScore * 100),
        totalPRs: safeScore(orgReputation.metrics?.totalPRs || 0),
        mergedPRs: safeScore(orgReputation.metrics?.mergedPRs || 0),
        estimatedLOC: safeScore(orgReputation.metrics?.estimatedLOC || 0),
        issueCount: safeScore(orgReputation.metrics?.issueCount || 0),
        repoCount: safeScore(orgReputation.metrics?.repoCount || 0),
        activeWeeks: safeScore(orgReputation.metrics?.activeWeeks || 0),
        tenureYears: safeScore(orgReputation.metrics?.tenureYears || 0),
        timestamp: Date.now(),
      };

      if (existingAttestation && existingAttestation.attestationIndex) {
        // Update existing attestation
        try {
          console.log(
            `🔄 Updating attestation for ${orgName} (index: ${existingAttestation.attestationIndex})`
          );

          const output = await orgReputationSchema.updateAttestation(
            api,
            walletAddress,
            existingAttestation.attestationIndex,
            attestationData
          );

          if (!output) {
            throw new Error("Failed to get output from update");
          }

          console.log(`✅ Updated attestation for ${orgName}`);

          updateResults.push({
            orgName,
            success: true,
            attestationId: output.attestationId.toString(),
            attestationHash: output.transaction.hash,
            prismUrl: output.prismUrl,
            explorerUrl: output.transaction.explorerUrl,
            oldScore: existingAttestation.score,
            newScore: attestationData.totalScore,
          });
        } catch (error) {
          console.error(
            `❌ Failed to update attestation for ${orgName}:`,
            error
          );
          updateResults.push({
            orgName,
            success: false,
            error: error instanceof Error ? error.message : "Update failed",
          });
        }
      } else {
        // Create new attestation
        try {
          console.log(`🆕 Creating new attestation for ${orgName}`);

          const output = await orgReputationSchema.attest(
            api,
            walletAddress,
            attestationData
          );

          console.log(`✅ Created new attestation for ${orgName}`);

          newAttestations.push({
            orgName,
            success: true,
            attestationId: output.attestationId.toString(),
            attestationIndex: output.attestationId,
            attestationHash: output.transaction.hash,
            prismUrl: output.prismUrl,
            explorerUrl: output.transaction.explorerUrl,
            score: attestationData.totalScore,
          });
        } catch (error) {
          console.error(
            `❌ Failed to create attestation for ${orgName}:`,
            error
          );
          newAttestations.push({
            orgName,
            success: false,
            error: error instanceof Error ? error.message : "Creation failed",
          });
        }
      }

      // Add delay between operations to prevent connection issues
      const currentIndex = reputationData.organizations.indexOf(orgReputation);
      if (currentIndex < reputationData.organizations.length - 1) {
        console.log("⏳ Waiting 2 seconds before next operation...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Attestations updated successfully",
      updated: updateResults,
      created: newAttestations,
      totalOrganizations: reputationData.organizations.length,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update attestations",
      },
      { status: 500 }
    );
  }
}
