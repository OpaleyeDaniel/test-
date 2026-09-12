/**
 * ============================================================================
 * GitHub Achievements Automation Script
 * Targets: Pull Shark (Bronze, Silver x2, Gold x3), YOLO, Pair Extraordinaire
 * ============================================================================
 * 
 * HOW TO RUN:
 * 1. Create a GitHub Personal Access Token:
 *    - Go to: https://github.com/settings/tokens/new
 *    - Note: "Badge Script"
 *    - Expiration: 7 days
 *    - Select scope: [x] repo (Full control of private repositories)
 *    - Click "Generate token" and copy it.
 * 
 * 2. Run this script in your terminal:
 *    $env:GITHUB_TOKEN="your_token_here"; node badges.js
 * 
 * Or pass the target count (e.g. 16 for Silver Pull Shark):
 *    $env:GITHUB_TOKEN="your_token_here"; node badges.js 16
 */

const REPO_OWNER = "OpaleyeDaniel";
const REPO_NAME = "test-";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const TARGET_PRS = parseInt(process.argv[2], 10) || 2; // Default 2 for Pull Shark Bronze

if (!GITHUB_TOKEN) {
  console.log("==================================================");
  console.log("⚠️  GITHUB_TOKEN is not set!");
  console.log("==================================================");
  console.log("To automate Pull Requests via API:");
  console.log("1. Generate a token at: https://github.com/settings/tokens/new");
  console.log("   - Check the [x] 'repo' permission box");
  console.log("2. In PowerShell, run:");
  console.log('   $env:GITHUB_TOKEN="ghp_yourCopiedTokenHere"; node badges.js 2\n');
  console.log("💡 (Tip: If you don't want to use a token, see the direct 1-click links provided in chat!)");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "Badge-Automation-Script",
};

async function api(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API Error [${response.status}] ${endpoint}: ${
        data.message || text
      }`
    );
  }
  return data;
}

async function run() {
  console.log("==================================================");
  console.log(`🦈 Automating ${TARGET_PRS} Pull Requests for @${REPO_OWNER}`);
  console.log("==================================================");

  // 1. Get default branch SHA
  const mainRef = await api("/git/ref/heads/main");
  const baseSha = mainRef.object.sha;

  for (let i = 1; i <= TARGET_PRS; i++) {
    const branchName = `badge-pr-${Date.now()}-${i}`;
    console.log(`\n⏳ [${i}/${TARGET_PRS}] Creating PR on branch ${branchName}...`);

    try {
      // 2. Create new branch from main
      await api("/git/refs", {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });

      // 3. Create a commit on the branch with Co-authored-by for Pair Extraordinaire
      const commitMessage = `feat: badge milestone commit #${i}\n\nCo-authored-by: octocat <octocat@github.com>`;
      await api(`/contents/badges/badge-${Date.now()}-${i}.txt`, {
        method: "PUT",
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(`Milestone contribution #${i}`).toString("base64"),
          branch: branchName,
        }),
      });

      // 4. Open Pull Request
      const pr = await api("/pulls", {
        method: "POST",
        body: JSON.stringify({
          title: `Milestone PR #${i} for Achievements`,
          head: branchName,
          base: "main",
          body: "Automated PR milestone for GitHub Badges (Pull Shark, YOLO, Pair Extraordinaire).",
        }),
      });

      console.log(`   ✓ Opened PR #${pr.number}: ${pr.html_url}`);

      // 5. Merge Pull Request without review (Triggers YOLO & Pull Shark & Pair Extraordinaire)
      await api(`/pulls/${pr.number}/merge`, {
        method: "PUT",
        body: JSON.stringify({
          merge_method: "merge",
          commit_title: `Merge PR #${pr.number} for badge milestones`,
        }),
      });

      console.log(`   ✓ Merged PR #${pr.number}!`);

      // 6. Delete the temporary branch
      await api(`/git/refs/heads/${branchName}`, {
        method: "DELETE",
      });

      console.log(`   ✓ Cleaned up branch ${branchName}`);
    } catch (err) {
      console.error(`❌ Error on iteration ${i}:`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 All requested Pull Requests have been processed!");
  console.log("🏅 Unlocked Badges:");
  console.log("   • 🦈 Pull Shark (Merged Pull Requests)");
  console.log("   • 🦹 YOLO (Merged without review)");
  console.log("   • 👯 Pair Extraordinaire (Merged with co-author)");
  console.log("==================================================");
}

run().catch(console.error);
