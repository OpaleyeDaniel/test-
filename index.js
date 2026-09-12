import { execFileSync } from "child_process";
import fs from "fs";
import moment from "moment";
import random from "random";

// =============================================================
// CONFIGURATION: Boost Contributions for 2024 & 2025 Only
// =============================================================
const START_DATE = "2024-01-01";
const END_DATE = "2025-12-31";    // Only boost 2024 and 2025 (leave 2026 untouched)
const WEEKDAY_PROBABILITY = 0.88; // 88% chance of activity on weekdays
const WEEKEND_PROBABILITY = 0.65; // 65% chance on weekends
const AUTO_PUSH = true;

/**
 * Returns a commit count per day for a solid, vibrant green look
 */
function getCommitCountForDay(isWeekend) {
  if (isWeekend) {
    return random.int(2, 4); // 2 to 4 commits on weekends
  }

  // Weekdays: heavier activity (2 to 9 commits)
  const roll = random.float(0, 1);
  if (roll < 0.30) return random.int(2, 3);
  if (roll < 0.80) return random.int(4, 6);
  return random.int(7, 9);
}

async function boost2024And2025Contributions() {
  console.log("==================================================");
  console.log("🚀 Boosting Contributions for 2024 & 2025");
  console.log(`📅 Target Date Range: ${START_DATE} to ${END_DATE}`);
  console.log("ℹ️  2026 is left unchanged as requested.");
  console.log("==================================================");

  // Load existing data.json stats if available
  let previousSummary = {};
  try {
    previousSummary = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
  } catch (e) {
    previousSummary = { totalCommits: 0, yearBreakdown: {} };
  }

  const tree = execFileSync("git", ["write-tree"]).toString().trim();
  let parent = execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();

  let totalNewCommits = 0;
  let activeDays = 0;
  let totalDays = 0;
  const newYearCounts = { "2024": 0, "2025": 0 };

  const current = moment(START_DATE);
  const end = moment(END_DATE);
  const startTime = Date.now();

  while (current.isSameOrBefore(end, "day")) {
    totalDays++;
    const dayOfWeek = current.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const chance = isWeekend ? WEEKEND_PROBABILITY : WEEKDAY_PROBABILITY;

    if (random.float(0, 1) < chance) {
      activeDays++;
      const commitCount = getCommitCountForDay(isWeekend);
      const year = current.format("YYYY");
      newYearCounts[year] = (newYearCounts[year] || 0) + commitCount;

      for (let i = 0; i < commitCount; i++) {
        totalNewCommits++;

        // Natural timestamp between 08:30 and 22:45
        const hour = random.int(8, 22);
        const minute = random.int(0, 59);
        const second = random.int(0, 59);
        const commitTime = current.clone().hour(hour).minute(minute).second(second);
        const isoDate = commitTime.format();

        const env = {
          ...process.env,
          GIT_AUTHOR_DATE: isoDate,
          GIT_COMMITTER_DATE: isoDate,
        };

        parent = execFileSync(
          "git",
          [
            "commit-tree",
            tree,
            "-p",
            parent,
            "-m",
            `Contribution on ${commitTime.format("YYYY-MM-DD")}`,
          ],
          { env }
        ).toString().trim();
      }
    }

    if (totalDays % 100 === 0 || current.isSame(end, "day")) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `⏳ [${current.format("YYYY-MM-DD")}] Processed ${totalDays}/${731} days | +${totalNewCommits} commits added (${elapsed}s)...`
      );
    }

    current.add(1, "day");
  }

  // Calculate cumulative stats
  const prevBreakdown = previousSummary.yearBreakdown || {};
  const cumulativeYearBreakdown = {
    "2024": (prevBreakdown["2024"] || 0) + (newYearCounts["2024"] || 0),
    "2025": (prevBreakdown["2025"] || 0) + (newYearCounts["2025"] || 0),
    "2026": prevBreakdown["2026"] || 662, // unchanged
  };

  const cumulativeTotalCommits =
    (previousSummary.totalCommits || 0) + totalNewCommits;

  const updatedSummary = {
    status: "Boosted contributions for 2024 & 2025 (2026 preserved)",
    boostRange: `${START_DATE} to ${END_DATE}`,
    newCommitsAdded: totalNewCommits,
    cumulativeTotalCommits,
    yearBreakdown: cumulativeYearBreakdown,
    updatedAt: moment().format(),
  };

  fs.writeFileSync("./data.json", JSON.stringify(updatedSummary, null, 2));

  // Update git ref to new head
  execFileSync("git", ["update-ref", "refs/heads/main", parent]);

  // Stage and commit data.json & index.js
  execFileSync("git", ["add", "data.json", "index.js"]);
  execFileSync("git", [
    "commit",
    "-m",
    `Boost 2024 and 2025 with +${totalNewCommits} contributions`,
  ]);

  console.log("\n==================================================");
  console.log("🎉 Boost Complete!");
  console.log(`➕ New Commits Added: +${totalNewCommits}`);
  console.log(`📈 New Contributions Breakdown:`);
  console.log(`   • 2024: +${newYearCounts["2024"]} added (Total: ~${cumulativeYearBreakdown["2024"]})`);
  console.log(`   • 2025: +${newYearCounts["2025"]} added (Total: ~${cumulativeYearBreakdown["2025"]})`);
  console.log(`   • 2026: 0 added (Total: ~${cumulativeYearBreakdown["2026"]} - untouched)`);
  console.log(`📦 Cumulative Total Commits: ${cumulativeTotalCommits}`);
  console.log("==================================================");

  if (AUTO_PUSH) {
    console.log("\n⬆️  Pushing updated contributions to GitHub (origin/main)...");
    try {
      execFileSync("git", ["push", "origin", "main"], { stdio: "inherit" });
      console.log("\n✅ SUCCESS! All commits pushed to GitHub.");
      console.log("👉 View your profile: https://github.com/OpaleyeDaniel");
      console.log("💡 Tip: GitHub will update your 2024 and 2025 graphs in 5-10 minutes.");
    } catch (err) {
      console.error("❌ Error pushing to GitHub:", err.message);
    }
  }
}

boost2024And2025Contributions().catch(console.error);