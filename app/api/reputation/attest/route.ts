import { NextRequest, NextResponse } from "next/server";
import { orgReputationSchema } from "@/lib/trueNetwork/schemas";
import { getTrueNetworkInstance } from "@/lib/trueNetwork/true.config";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("github_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { walletAddress, organization } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required for attestation" },
        { status: 400 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    // Fetch reputation data from the org endpoint
    const reputationRes = await fetch(
      `${request.nextUrl.origin}/api/reputation/org`,
      {
        headers: {
          Cookie: `github_access_token=${accessToken}`,
        },
      }
    );

    if (!reputationRes.ok) {
      const errorText = await reputationRes.text();
      console.error("Reputation fetch error:", errorText);
      throw new Error("Failed to fetch reputation data");
    }

    let reputationData;
    try {
      reputationData = await reputationRes.json();
    } catch {
      const responseText = await reputationRes.text();
      console.error("Failed to parse reputation response:", responseText);
      throw new Error("Invalid response format from reputation endpoint");
    }

    // Find the specific organization's reputation
    const orgReputation = reputationData.organizations.find(
      (org: { orgName: string }) =>
        org.orgName.toLowerCase() === organization.toLowerCase()
    );

    if (!orgReputation) {
      throw new Error(
        `No reputation data found for organization: ${organization}`
      );
    }

    // Helper function to safely convert scores to integers, defaulting to 0 for invalid values
    const safeScore = (value: unknown): number => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? 0 : Math.round(num);
    };

    // Create attestation data with detailed metrics
    const attestationData = {
      orgName: organization,
      developerAddress: walletAddress,
      totalScore: safeScore(orgReputation.totalScore * 100), // Scale to 0-100
      repoActivityScore: safeScore(orgReputation.repoActivityScore * 100),
      tenureScore: safeScore(orgReputation.tenureScore * 100),
      languageStackScore: safeScore(orgReputation.languageStackScore * 100),
      qualityScore: safeScore(orgReputation.qualityScore * 100),
      ossContributionScore: safeScore(orgReputation.ossContributionScore * 100),
      consistencyScore: safeScore(orgReputation.consistencyScore * 100),
      // Detailed metrics from the new calculation
      totalPRs: safeScore(orgReputation.metrics?.totalPRs || 0),
      mergedPRs: safeScore(orgReputation.metrics?.mergedPRs || 0),
      estimatedLOC: safeScore(orgReputation.metrics?.estimatedLOC || 0),
      issueCount: safeScore(orgReputation.metrics?.issueCount || 0),
      repoCount: safeScore(orgReputation.metrics?.repoCount || 0),
      activeWeeks: safeScore(orgReputation.metrics?.activeWeeks || 0),
      tenureYears: safeScore(orgReputation.metrics?.tenureYears || 0),
      timestamp: Date.now(),
    };

    // Initialize TrueNetwork API - create fresh connection for each attestation
    console.log("Initializing TrueNetwork connection...");
    const api = await getTrueNetworkInstance();

    // Check if schema is already registered, if not, register it
    console.log("Checking if schema exists...");
    const schemaExists = await orgReputationSchema.ifExistAlready(api);
    if (!schemaExists) {
      console.log("Schema not registered yet, registering now...");
      await orgReputationSchema.register(api);
      console.log("Schema registered successfully");
    } else {
      console.log("Schema already exists");
    }

    // Create the attestation on-chain
    console.log("Creating attestation for:", { organization, walletAddress });
    const output = await orgReputationSchema.attest(
      api,
      walletAddress,
      attestationData
    );

    console.log("Attestation created:", {
      attestationId: output.attestationId,
      prismUrl: output.prismUrl,
      txHash: output.transaction.hash,
    });

    // Return both attestationId (index) and transaction hash for future updates
    return NextResponse.json({
      success: true,
      attestationId: output.attestationId.toString(), // This is the index for updates
      attestationIndex: output.attestationId, // Store the index for updateAttestation
      attestationHash: output.transaction.hash,
      prismUrl: output.prismUrl,
      explorerUrl: output.transaction.explorerUrl,
      reputation: orgReputation,
      attestationData,
    });
  } catch (error) {
    console.error("Attestation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create attestation",
      },
      { status: 500 }
    );
  }
}
