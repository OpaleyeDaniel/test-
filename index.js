import { execFileSync } from "child_process";
import fs from "fs";
import moment from "moment";
import random from "random";

// =============================================================
// CONFIGURATION: Auto Contribution Generator (2024 - 2026)
// =============================================================
const START_DATE = "2024-01-01";
const END_DATE = moment().format("YYYY-MM-DD"); // up to today in 2026
const WEEKDAY_PROBABILITY = 0.82; // 82% of weekdays will have activity
const WEEKEND_PROBABILITY = 0.50; // 50% of weekends will have activity
const AUTO_PUSH = true;          // Automatically push to origin/main when done

/**
 * Returns a random number of commits for an active day
 * Gives a realistic mix of light green, medium green, and bright green
 */
function getCommitCountForDay(isWeekend) {
  if (isWeekend) {
    // Weekends: lighter activity (1 to 4 commits)
    return random.float(0, 1) < 0.70 ? random.int(1, 2) : random.int(3, 4);
  }

  // Weekdays: richer activity (1 to 8 commits)
  const roll = random.float(0, 1);
  if (roll < 0.35) return random.int(1, 2);      // Light green
  if (roll < 0.80) return random.int(3, 5);      // Medium green
  return random.int(6, 8);                       // Dark / vibrant green
}

async function generateContributions() {
  console.log("==================================================");
  console.log("🚀 GitHub Contribution Generator (2024 - 2026)");
  console.log(`📅 Date Range: ${START_DATE} to ${END_DATE}`);
  console.log("==================================================");

  // 1. Prepare Git Tree & Parent
  const tree = execFileSync("git", ["write-tree"]).toString().trim();
  let parent = execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();

  let totalCommits = 0;
  let activeDays = 0;
  let totalDays = 0;
  const yearCounts = {};

  const current = moment(START_DATE);
  const end = moment(END_DATE);

  const startTime = Date.now();

  // 2. Iterate through every single day from 2024 to 2026
  while (current.isSameOrBefore(end, "day")) {
    totalDays++;
    const dayOfWeek = current.day(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const chance = isWeekend ? WEEKEND_PROBABILITY : WEEKDAY_PROBABILITY;

    if (random.float(0, 1) < chance) {
      activeDays++;
      const commitCount = getCommitCountForDay(isWeekend);
      const year = current.format("YYYY");
      yearCounts[year] = (yearCounts[year] || 0) + commitCount;

      for (let i = 0; i < commitCount; i++) {
        totalCommits++;

        // Generate realistic commit timestamps between 09:00 and 22:00
        const hour = random.int(9, 21);
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

    // Print progress every 100 days
    if (totalDays % 100 === 0 || current.isSame(end, "day")) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `⏳ [${current.format("YYYY-MM-DD")}] Processed ${totalDays} days | ${totalCommits} commits generated (${elapsed}s)...`
      );
    }

    current.add(1, "day");
  }

  // 3. Update data.json with generation summary
  const summary = {
    status: "GitHub contributions generated",
    startDate: START_DATE,
    endDate: END_DATE,
    totalDays,
    activeDays,
    totalCommits,
    yearBreakdown: yearCounts,
    generatedAt: moment().format(),
  };

  fs.writeFileSync("./data.json", JSON.stringify(summary, null, 2));

  // 4. Update local branch ref to the new head
  execFileSync("git", ["update-ref", "refs/heads/main", parent]);

  // Stage and commit the final summary in data.json
  execFileSync("git", ["add", "data.json", "index.js"]);
  execFileSync("git", ["commit", "-m", `Generate ${totalCommits} contributions for 2024-2026`]);

  console.log("\n==================================================");
  console.log("🎉 Contribution Generation Complete!");
  console.log(`📊 Total Commits Created: ${totalCommits}`);
  console.log(`📅 Active Days: ${activeDays} / ${totalDays}`);
  console.log("📈 Contributions by Year:");
  Object.keys(yearCounts).sort().forEach((yr) => {
    console.log(`   • ${yr}: ${yearCounts[yr]} contributions`);
  });
  console.log("==================================================");

  // 5. Push to GitHub
  if (AUTO_PUSH) {
    console.log("\n⬆️  Pushing all contributions to GitHub (origin/main)...");
    try {
      execFileSync("git", ["push", "origin", "main"], { stdio: "inherit" });
      console.log("\n✅ SUCCESS! All contributions have been pushed to GitHub.");
      console.log("👉 Visit your profile: https://github.com/OpaleyeDaniel");
      console.log("💡 Tip: It can take 5-10 minutes for GitHub's cache to re-render the green squares.");
    } catch (err) {
      console.error("❌ Error pushing to GitHub:", err.message);
      console.log("You can manually push anytime by running: git push origin main");
    }
  }
}

// Run generator
generateContributions().catch(console.error);