/**
 * True Network Schema for Organization Reputation Attestations
 */

import { Schema, U32, Text, U64 } from "@truenetworkio/sdk";

// Organization Reputation Schema for True Network
export const orgReputationSchema = Schema.create({
  orgName: Text,
  developerAddress: Text,
  totalScore: U32,
  repoActivityScore: U32,
  tenureScore: U32,
  languageStackScore: U32,
  qualityScore: U32,
  ossContributionScore: U32,
  consistencyScore: U32,
  timestamp: U64,
});

export type OrgReputationAttestation = {
  orgName: string;
  developerAddress: string;
  totalScore: number;
  repoActivityScore: number;
  tenureScore: number;
  languageStackScore: number;
  qualityScore: number;
  ossContributionScore: number;
  consistencyScore: number;
  timestamp: number;
};
