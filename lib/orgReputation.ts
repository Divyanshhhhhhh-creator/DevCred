/**
 * Organization-Specific Reputation Calculation System
 * Using True Network for on-chain attestations
 */

import { GitHubUserStats, GitHubRepo, GitHubPullRequest } from './github';

export interface OrgReputationScore {
  orgName: string;
  totalScore: number;
  breakdown: {
    repoActivityScore: number;
    tenureScore: number;
    languageStackScore: number;
    qualityScore: number;
    ossContributionScore: number;
    consistencyScore: number;
  };
  metrics?: {
    totalPRs: number;
    mergedPRs: number;
    estimatedLOC: number;
    issueCount: number;
    repoCount: number;
    activeWeeks: number;
    tenureYears: number;
  };
  attestationId?: string;
  prismUrl?: string;
}

/**
 * 1. Org Repository Scope (Org Repo Activity Score)
 * Counts only repositories within the organization that the user contributed to
 */
export function calculateOrgRepoActivityScore(
  orgRepos: GitHubRepo[],
  userContributedRepos: string[]
): number {
  // If we don't have org repos data, score based on user's contributed repos count
  if (orgRepos.length === 0) {
    // Fallback: Score based on number of repos contributed to (more repos = higher score)
    const repoCount = userContributedRepos.length;
    return Math.min(1.0, repoCount / 10); // 10+ repos = max score
  }

  const totalOrgRepos = orgRepos.length;
  const contributedRepos = userContributedRepos.filter(repo => 
    orgRepos.some(orgRepo => orgRepo.full_name === repo)
  );

  const ownRepos = contributedRepos.length;
  const majorContributionRepos = contributedRepos.length; // Simplified for now

  const score = Math.min(0.5, ownRepos / totalOrgRepos) +
                Math.min(0.5, majorContributionRepos / totalOrgRepos);

  return Math.min(1.0, score);
}

/**
 * 2. Org Years of Experience (Org Tenure Score)
 * Time since first contribution to the organization
 */
export function calculateOrgTenureScore(
  firstOrgCommitYear: number,
  orgFoundingYear: number
): number {
  const currentYear = new Date().getFullYear();
  
  if (firstOrgCommitYear === 0) return 0;
  
  const orgAge = currentYear - orgFoundingYear;
  if (orgAge === 0) return 0;
  
  const userTenure = currentYear - firstOrgCommitYear;
  
  return Math.min(1.0, userTenure / orgAge);
}

/**
 * 3. Org Languages/Tech Stack Score
 * How well the dev uses the technologies this org uses
 */
export function calculateOrgLanguageStackScore(
  orgLanguageDistribution: Record<string, number>,
  userLanguageContributions: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [lang, orgWeight] of Object.entries(orgLanguageDistribution)) {
    const userContribution = userLanguageContributions[lang] || 0;
    totalScore += userContribution * orgWeight;
    totalWeight += orgWeight;
  }

  return totalWeight > 0 ? Math.min(1.0, totalScore / totalWeight) : 0;
}

/**
 * 4. Org Quality Score (Org Commit Quality)
 * Quality of commits within the org repositories
 */
export function calculateOrgQualityScore(
  mergedPRs: GitHubPullRequest[],
  totalPRs: number
): number {
  if (totalPRs === 0) return 0;
  
  const mergeRate = mergedPRs.length / totalPRs;
  
  // Weight by recency (last 6 months get higher weight)
  const now = Date.now();
  const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);
  
  const recentPRs = mergedPRs.filter(pr => 
    pr.merged_at && new Date(pr.merged_at).getTime() > sixMonthsAgo
  );
  
  const recencyBonus = recentPRs.length / Math.max(1, mergedPRs.length);
  
  return Math.min(1.0, (mergeRate * 0.7) + (recencyBonus * 0.3));
}

/**
 * 5. Org Open-Source Contribution Score
 * PRs, issues, reviews within the organization
 */
export function calculateOrgOSSContributionScore(
  mergedPRs: number,
  openedIssues: number,
  reviews: number
): number {
  // Weighted scoring
  const prScore = Math.min(1.0, mergedPRs / 50); // 50 PRs = max score
  const issueScore = Math.min(1.0, openedIssues / 30); // 30 issues = max score
  const reviewScore = Math.min(1.0, reviews / 40); // 40 reviews = max score
  
  return (prScore * 0.5) + (issueScore * 0.2) + (reviewScore * 0.3);
}

/**
 * 6. Org Consistency Score (Org MAT Commit Frequency)
 * Regular contributions to the organization
 */
export function calculateOrgConsistencyScore(
  commitsPerWeek: number[],
  orgAverage: number
): number {
  if (commitsPerWeek.length === 0) return 0;
  
  // Calculate weighted Moving Average (more weight to recent weeks)
  let weightedSum = 0;
  let weightTotal = 0;
  
  commitsPerWeek.forEach((commits, index) => {
    const recencyWeight = (index + 1) / commitsPerWeek.length;
    weightedSum += commits * recencyWeight;
    weightTotal += recencyWeight;
  });
  
  const userAverage = weightedSum / weightTotal;
  const normalizedScore = orgAverage > 0 ? userAverage / orgAverage : 0;
  
  return Math.min(1.0, normalizedScore);
}

/**
 * Calculate final organization-specific reputation score
 */
export function calculateOrgReputation(
  orgName: string,
  repoActivity: number,
  tenure: number,
  languageStack: number,
  quality: number,
  ossContribution: number,
  consistency: number
): OrgReputationScore {
  const breakdown = {
    repoActivityScore: repoActivity,
    tenureScore: tenure,
    languageStackScore: languageStack,
    qualityScore: quality,
    ossContributionScore: ossContribution,
    consistencyScore: consistency,
  };

  // Weighted final score
  const totalScore = 
    0.10 * repoActivity +
    0.15 * tenure +
    0.15 * languageStack +
    0.20 * quality +
    0.25 * ossContribution +
    0.15 * consistency;

  return {
    orgName,
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimals
    breakdown,
  };
}

/**
 * Extract organization-specific data from GitHub user stats
 */
export function extractOrgData(
  userStats: GitHubUserStats,
  orgName: string
): {
  orgPRs: GitHubPullRequest[];
  orgRepos: string[];
  firstContributionYear: number;
  languageContributions: Record<string, number>;
  totalLinesChanged: number;
  issueDetails: Array<{ title: string; number: number; state: string }>;
  weeklyCommits: number[];
} {
  // Filter PRs that belong to the organization
  const orgPRs = userStats.pullRequests.filter(pr => 
    pr.repository.full_name.startsWith(`${orgName}/`)
  );

  // Get unique repositories
  const orgRepos = Array.from(new Set(orgPRs.map(pr => pr.repository.full_name)));

  // Find first contribution year
  let firstYear = new Date().getFullYear();
  if (orgPRs.length > 0) {
    const sortedPRs = orgPRs.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    firstYear = new Date(sortedPRs[0].created_at).getFullYear();
  }

  // Calculate language contributions from org PRs (simplified approach)
  // Since we don't have direct repo language data, estimate based on PR count
  const languageContributions: Record<string, number> = {
    'TypeScript': orgPRs.length * 0.4,
    'JavaScript': orgPRs.length * 0.3,
    'Python': orgPRs.length * 0.2,
    'Other': orgPRs.length * 0.1,
  };

  // Calculate total lines changed from PRs (estimate based on PR count)
  const totalLinesChanged = orgPRs.length * 100; // Rough estimate

  // Extract issue details from PRs (GitHub API returns issues as PRs sometimes)
  const issueDetails = orgPRs.map(pr => ({
    title: pr.title,
    number: pr.number,
    state: pr.state
  }));

  // Calculate weekly commits (last 52 weeks)
  const weeklyCommits: number[] = [];
  const now = Date.now();
  for (let i = 0; i < 52; i++) {
    const weekStart = now - (i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = weekStart - (7 * 24 * 60 * 60 * 1000);
    
    const commitsThisWeek = orgPRs.filter(pr => {
      const prDate = new Date(pr.created_at).getTime();
      return prDate >= weekEnd && prDate < weekStart;
    }).length;
    
    weeklyCommits.push(commitsThisWeek);
  }

  return {
    orgPRs,
    orgRepos,
    firstContributionYear: firstYear,
    languageContributions,
    totalLinesChanged,
    issueDetails,
    weeklyCommits,
  };
}
