#!/usr/bin/env node

/**
 * Usage:
 *   node scripts/create-release.js [--release] [--dry-run] [--from-sha=<sha>]
 *
 * This script creates a GitHub release in the meta-repo (silexlabs/Silex) with a changelog.
 *
 * It collects commits from each submodule (packages/*) since the last version:
 *   - If `--release` is passed: from the last `vX.Y.Z` tag in the meta repo
 *   - Else: from the last `vX.Y.Z` or `vX.Y.Z-beta` tag
 *   - Or: if `--from-sha=xyz` is used, compares submodules as they were at that meta repo commit
 */

import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const isRelease = process.argv.includes("--release");
const isDryRun = process.argv.includes("--dry-run");
const fromShaArg = process.argv.find((arg) => arg.startsWith("--from-sha="));
const overrideMetaSha = fromShaArg?.split("=")[1] || null;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN not set in .env");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const repoOwner = "silexlabs";
const repoName = "Silex";

const APP_PACKAGES = ["silex-platform", "silex-puter", "silex-desktop"];

// Get meta version
const version = JSON.parse(fs.readFileSync("packages/silex-lib/package.json", "utf-8")).version;
const tag = `v${version}`;

// Find base SHA in meta repo
let lastMetaSha;
let lastMetaLabel;

if (overrideMetaSha) {
  lastMetaSha = overrideMetaSha;
  lastMetaLabel = `custom (${overrideMetaSha.slice(0, 7)})`;
  console.log(`🔧 Using manually provided SHA: ${lastMetaSha}`);
} else {
  const allTags = execSync("git tag --sort=-creatordate", { encoding: "utf-8" })
    .split("\n")
    .filter(Boolean);

  const lastTag = allTags.find((t) => {
    if (isRelease) return /^v\d+\.\d+\.\d+$/.test(t);
    return /^v\d+\.\d+\.\d+(-.+)?$/.test(t);
  });

  if (!lastTag) {
    console.error("❌ No previous tag found in meta repo. Cannot generate changelog.");
    process.exit(1);
  }

  lastMetaSha = execSync(`git rev-list -n 1 ${lastTag}`, { encoding: "utf-8" }).trim();
  lastMetaLabel = lastTag;
}

// List submodules
const packageDirs = fs.readdirSync("packages").filter((name) => {
  const fullPath = path.join("packages", name);
  return fs.existsSync(path.join(fullPath, ".git"));
});

// Group packages
const grouped = {
  apps: [],
  libs: [],
};

for (const name of packageDirs) {
  if (APP_PACKAGES.includes(name)) grouped.apps.push(name);
  else grouped.libs.push(name);
}

// Get commits for one submodule
function getCommitsFromSubmodule(pkgDir) {
  const subPath = `packages/${pkgDir}`;
  const cwd = path.resolve(subPath);

  let submoduleSha;
  try {
    const output = execSync(`git ls-tree ${lastMetaSha} ${subPath}`, {
      encoding: "utf-8",
    }).trim();

    if (!output) {
      console.warn(`⚠️ Submodule ${pkgDir} did not exist at ${lastMetaLabel}`);
      return [];
    }

    const parts = output.split(/\s+/);
    submoduleSha = parts[2]; // this is the actual SHA

    if (!submoduleSha || !/^[0-9a-f]{40}$/.test(submoduleSha)) {
      console.warn(`⚠️ Invalid SHA '${submoduleSha}' for ${pkgDir}`);
      return [];
    }
  } catch (err) {
    console.warn(`⚠️ Cannot resolve submodule SHA for ${pkgDir}: ${err.message}`);
    return [];
  }

  try {
      let raw;
      try {
          raw = execSync(`git log ${submoduleSha}..HEAD --pretty=format:%s\\|%an`, {
              cwd,
              encoding: "utf-8",
          }).trim();
      } catch (e) {
          console.warn(`⚠️ Failed to get commits from ${pkgDir}: ${e.message}`);
          return [];
      }

    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [subject, author] = line.split("^|^");
        return { package: pkgDir, subject: subject.trim(), author: author.trim() };
      });
  } catch (e) {
    console.warn(`⚠️ Failed to get commits from ${pkgDir}: ${e.message}`);
    return [];
  }
}

// Classify by type
function classify(commits) {
  const result = { feat: [], fix: [], chore: [], docs: [] };
  for (const { subject, author, package: pkg } of commits) {
    const line = `(${pkg}) ${subject} (${author})`;
    const type = subject.split(":")[0];
    if (type === "feat" || type === "feature") result.feat.push(line);
    else if (type === "fix") result.fix.push(line);
    else if (type === "chore") result.chore.push(line);
    else if (type === "docs") result.docs.push(line);
  }
  return result;
}

// Build changelog
let changelog = `Release ${tag}\n\n(Compared to ${lastMetaLabel})\n\n`;

for (const [label, icon, names] of [
  ["Apps", "🖥️", grouped.apps],
  ["Core libraries", "🧱", grouped.libs],
]) {
  const allCommits = names.flatMap(getCommitsFromSubmodule);
  if (allCommits.length === 0) continue;

  const groupedCommits = classify(allCommits);
  changelog += `## ${icon} ${label}\n\n`;

  if (groupedCommits.feat.length > 0) {
    changelog += `✨ **Features**\n`;
    groupedCommits.feat.forEach((c) => (changelog += `- ${c}\n`));
    changelog += `\n`;
  }
  if (groupedCommits.fix.length > 0) {
    changelog += `🐛 **Fixes**\n`;
    groupedCommits.fix.forEach((c) => (changelog += `- ${c}\n`));
    changelog += `\n`;
  }
  if (groupedCommits.chore.length > 0) {
    changelog += `🔧 **Chores**\n`;
    groupedCommits.chore.forEach((c) => (changelog += `- ${c}\n`));
    changelog += `\n`;
  }
  if (groupedCommits.docs.length > 0) {
    changelog += `📝 **Docs**\n`;
    groupedCommits.docs.forEach((c) => (changelog += `- ${c}\n`));
    changelog += `\n`;
  }
}

// Tag meta repo if needed
const existingTags = execSync("git tag", { encoding: "utf-8" }).split("\n").filter(Boolean);
if (!existingTags.includes(tag)) {
  console.log(`🏷️ Tagging ${tag}`);
  if (!isDryRun) {
    execSync(`git tag ${tag}`);
    execSync(`git push origin ${tag}`);
  } else {
    console.log("🧪 (dry-run) Would tag and push");
  }
} else {
  console.log(`✅ Tag ${tag} already exists`);
}

// Create GitHub release
(async () => {
  if (isDryRun) {
    console.log("🧪 (dry-run) Would create GitHub release:");
    console.log("Tag:", tag);
    console.log("Title:", `Release ${tag}`);
    console.log("Prerelease:", !isRelease);
    console.log("Body:\n" + changelog);
    return;
  }

  try {
    await octokit.repos.createRelease({
      owner: repoOwner,
      repo: repoName,
      tag_name: tag,
      name: `Release ${tag}`,
      body: changelog,
      draft: false,
      prerelease: !isRelease,
    });

    console.log(`🚀 GitHub Release ${tag} created`);
  } catch (err) {
    console.error("❌ Failed to create release:", err.message);
    process.exit(1);
  }
})();
