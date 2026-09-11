import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const git = simpleGit();
const FILE_PATH = "./data.json";

/**
 * Creates a Git commit with a specific date and updates data.json
 * @param {string} date - ISO date string
 */
async function makeCommitAtDate(date) {
  const data = { date };
  await jsonfile.writeFile(FILE_PATH, data, { spaces: 2 });
  await git.add(FILE_PATH);
  await git.commit(date, { "--date": date });
  console.log(`✓ Committed: ${date}`);
}

/**
 * Creates a single commit for a specific day in the past (e.g. 5 days ago)
 * @param {number} daysAgo - Number of days in the past
 */
async function runSingleCommit(daysAgo = 5) {
  try {
    const date = moment().subtract(daysAgo, "d").format();
    console.log(`Creating commit for ${daysAgo} days ago (${date})...`);
    await makeCommitAtDate(date);

    console.log("Pushing commit to GitHub...");
    await git.push("origin", "main");
    console.log("✓ Successfully pushed to GitHub!");
  } catch (error) {
    console.error("Failed to commit and push:", error);
  }
}

/**
 * Optional: Creates multiple random commits over the past year
 * (Useful for filling in multiple activity squares on GitHub)
 * @param {number} totalCommits - Number of commits to generate
 */
async function runRandomCommits(totalCommits = 10) {
  try {
    console.log(`Generating ${totalCommits} random commits across the past year...`);
    for (let i = 0; i < totalCommits; i++) {
      const weeks = random.int(0, 52);
      const days = random.int(0, 6);
      const date = moment()
        .subtract(weeks, "w")
        .subtract(days, "d")
        .format();
      await makeCommitAtDate(date);
    }

    console.log("Pushing all commits to GitHub...");
    await git.push("origin", "main");
    console.log(`✓ Successfully pushed ${totalCommits} commits to GitHub!`);
  } catch (error) {
    console.error("Failed to commit and push:", error);
  }
}

// -------------------------------------------------------------
// CHOOSE HOW TO RUN:
// 1) Single commit (default - 5 days ago):
runSingleCommit(5);

// 2) Or uncomment below to generate e.g. 20 random commits:
// runRandomCommits(20);
// -------------------------------------------------------------