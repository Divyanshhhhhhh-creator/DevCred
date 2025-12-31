import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubUserStats } from "@/lib/github";
import {
  calculateOrgReputation,
  extractOrgData,
  calculateOrgRepoActivityScore,
  calculateOrgTenureScore,
  calculateOrgLanguageStackScore,
  calculateOrgQualityScore,
  calculateOrgOSSContributionScore,
  calculateOrgConsistencyScore,
} from "@/lib/orgReputation";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("github_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userStats = await fetchGitHubUserStats(accessToken);

    // Get all organizations where user has merged PRs (from prsByOrganization)
    const orgsWithMergedPRs = Object.keys(
      userStats.prsByOrganization || {}
    ).filter((orgName) => userStats.prsByOrganization[orgName] > 0);

    // Calculate reputation for each organization where user has merged PRs
    const orgReputations = [];

    for (const orgName of orgsWithMergedPRs) {
      // Find org details if user is a member, otherwise use minimal data
      const orgDetails = userStats.organizations.find(
        (org: { login: string }) => org.login === orgName
      );

      const orgData = extractOrgData(userStats, orgName);

      // Calculate individual scores using actual data
      const repoActivity = calculateOrgRepoActivityScore(
        [], // Org repos not available, but we pass user's contributed repos
        orgData.orgRepos
      );

      // Calculate tenure: use 2015 as a reasonable org founding year fallback
      const estimatedOrgFoundingYear = Math.min(
        2015,
        orgData.firstContributionYear
      );
      const tenure = calculateOrgTenureScore(
        orgData.firstContributionYear,
        estimatedOrgFoundingYear
      );

      // Use calculated language contributions
      const languageStack = calculateOrgLanguageStackScore(
        orgData.languageContributions, // User's language contributions in org
        orgData.languageContributions // Using same for both as we don't have org-wide data
      );

      const quality = calculateOrgQualityScore(
        orgData.orgPRs.filter((pr) => pr.merged_at),
        orgData.orgPRs.length
      );

      const ossContribution = calculateOrgOSSContributionScore(
        orgData.orgPRs.filter((pr) => pr.merged_at).length,
        orgData.issueDetails.length, // Count of issues/PRs
        0 // Reviews count not yet available from API
      );

      // Calculate average weekly commits for org (use median of user's commits as proxy)
      const avgWeeklyCommits =
        orgData.weeklyCommits.length > 0
          ? orgData.weeklyCommits.reduce((a, b) => a + b, 0) /
            orgData.weeklyCommits.length
          : 1;

      const consistency = calculateOrgConsistencyScore(
        orgData.weeklyCommits,
        Math.max(1, avgWeeklyCommits) // Use calculated average
      );

      const reputation = calculateOrgReputation(
        orgName,
        repoActivity,
        tenure,
        languageStack,
        quality,
        ossContribution,
        consistency
      );

      // Calculate active weeks (weeks with at least 1 commit)
      const activeWeeks = orgData.weeklyCommits.filter(
        (count) => count > 0
      ).length;
      const mergedPRCount = orgData.orgPRs.filter((pr) => pr.merged_at).length;
      const tenureYears =
        new Date().getFullYear() - orgData.firstContributionYear;

      orgReputations.push({
        ...reputation,
        // Flatten breakdown into top-level properties for easier access
        repoActivityScore: reputation.breakdown.repoActivityScore,
        tenureScore: reputation.breakdown.tenureScore,
        languageStackScore: reputation.breakdown.languageStackScore,
        qualityScore: reputation.breakdown.qualityScore,
        ossContributionScore: reputation.breakdown.ossContributionScore,
        consistencyScore: reputation.breakdown.consistencyScore,
        orgAvatar:
          orgDetails?.avatar_url || `https://github.com/${orgName}.png`,
        orgDescription: orgDetails?.description || null,
        // Detailed metrics for attestation
        metrics: {
          totalPRs: orgData.orgPRs.length,
          mergedPRs: mergedPRCount,
          estimatedLOC: orgData.totalLinesChanged,
          issueCount: orgData.issueDetails.length,
          repoCount: orgData.orgRepos.length,
          activeWeeks,
          tenureYears,
        },
        // Legacy fields for UI compatibility
        totalContributions: orgData.orgPRs.length,
        repositoriesContributed: orgData.orgRepos.length,
        totalLinesChanged: orgData.totalLinesChanged,
        languageBreakdown: orgData.languageContributions,
        issues: orgData.issueDetails,
        mergedPRs: mergedPRCount,
        openPRs: orgData.orgPRs.filter((pr) => pr.state === "open").length,
        firstContributionYear: orgData.firstContributionYear,
      });
    }

    return NextResponse.json({
      user: userStats.user,
      organizations: orgReputations,
    });
  } catch (error) {
    console.error("Error calculating org reputation:", error);
    return NextResponse.json(
      { error: "Failed to calculate organization reputation" },
      { status: 500 }
    );
  }
}
