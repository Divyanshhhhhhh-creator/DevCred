/**
 * True Network Reputation Algorithm
 * 
 * This algorithm calculates a comprehensive reputation score for developers
 * based on their GitHub contributions across different organizations.
 * 
 * The algorithm considers 6 key metrics:
 * - Repository Activity (10%): Based on PR count and estimated LOC
 * - Tenure (15%): Length of contribution history
 * - Language Stack (15%): Diversity of programming languages used
 * - Quality (20%): Merge rate and issue resolution
 * - OSS Contribution (25%): Overall open-source contributions
 * - Consistency (15%): Regular and sustained contributions
 */

import { Attestations } from "./attestations";

/**
 * Main reputation calculation function
 * This is the entry point that True Network will call to compute reputation
 * 
 * @returns Overall reputation score (0-1000)
 */
export async function calc(): Promise<number> {
  // Get all organization attestations for the user
  const orgAttestations = await Attestations.getOrgReputationAttestations();

  if (!orgAttestations || orgAttestations.length === 0) {
    return 0;
  }

  // Calculate aggregate score across all organizations
  let totalScore = 0;
  let totalWeight = 0;

  for (const attestation of orgAttestations) {
    // Weight each organization by their contribution volume
    const orgWeight = calculateOrgWeight(attestation);
    totalWeight += orgWeight;

    // Calculate weighted contribution to overall reputation
    totalScore += attestation.totalScore * orgWeight;
  }

  // Return average weighted score
  return totalWeight > 0 ? Math.floor(totalScore / totalWeight) : 0;
}

/**
 * Calculate organization weight based on contribution volume
 * Organizations with more contributions have higher weight
 */
function calculateOrgWeight(attestation: any): number {
  const prWeight = attestation.mergedPRs * 2;
  const locWeight = attestation.estimatedLOC / 100;
  const issueWeight = attestation.issueCount * 1.5;
  
  return prWeight + locWeight + issueWeight;
}

/**
 * Calculate reputation for a specific organization
 * This provides a detailed breakdown per organization
 */
export function calcOrgReputation(orgAttestation: any): number {
  if (!orgAttestation) return 0;

  // Use the total score from the attestation
  // which was already calculated using our 6-metric algorithm
  return orgAttestation.totalScore;
}

/**
 * Get reputation breakdown by organization
 * Returns an array of org reputations with detailed metrics
 */
export async function getOrgReputationBreakdown(): Promise<Array<{
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
    activeWeeks: number;
    tenureYears: number;
  };
}>> {
  const orgAttestations = await Attestations.getOrgReputationAttestations();

  return orgAttestations.map((attestation: any) => ({
    orgName: attestation.orgName,
    score: attestation.totalScore,
    metrics: {
      repoActivity: attestation.repoActivityScore,
      tenure: attestation.tenureScore,
      languageStack: attestation.languageStackScore,
      quality: attestation.qualityScore,
      ossContribution: attestation.ossContributionScore,
      consistency: attestation.consistencyScore,
    },
    details: {
      totalPRs: attestation.totalPRs,
      mergedPRs: attestation.mergedPRs,
      estimatedLOC: attestation.estimatedLOC,
      issueCount: attestation.issueCount,
      activeWeeks: attestation.activeWeeks,
      tenureYears: attestation.tenureYears,
    },
  }));
}
