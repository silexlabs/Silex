#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Monorepo: every package's history was absorbed in-tree, so a single `git log` over
// this repository captures all contributors across all packages. All commits now live
// in silexlabs/Silex (submodule commit hashes were rewritten by git filter-repo).
const REPO_URL = 'https://github.com/silexlabs/Silex';

// Authors to exclude (bots, placeholders)
const EXCLUDE = /ubuntu|john doe|^undefined$|grrhosting|gitter badger/i;

// Author identity normalization (e.g. lexoyo / lexa / Alexandre Hoyau → Alex Hoyau) is
// handled by git via .mailmap: `git log %aN` applies it. No hardcoded alias map here —
// .mailmap is the single source of truth (kept local / untracked).

function getContributors(dir) {
  try {
    const output = execSync('git log --format="%aN|%H|%aI" --all', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024, // full monorepo history exceeds the 1MB default
    });
    return output.trim().split('\n').filter(Boolean).map(line => {
      const [name, hash, date] = line.split('|');
      return { name, hash, date };
    });
  } catch {
    return [];
  }
}

function main() {
  // Single git log over the monorepo captures every package's contributors.
  const allContributions = getContributors(ROOT);

  // Group by author+year, keep the latest commit per author per year
  const byAuthorYear = {};
  for (const c of allContributions) {
    const name = c.name; // already normalized by git via .mailmap (%aN)
    if (EXCLUDE.test(name)) continue;
    const year = c.date.substring(0, 4);
    const key = `${name}|${year}`;
    if (!byAuthorYear[key] || c.date > byAuthorYear[key].date) {
      byAuthorYear[key] = { ...c, name, year };
    }
  }

  // Group by year
  const byYear = {};
  for (const entry of Object.values(byAuthorYear)) {
    if (!byYear[entry.year]) byYear[entry.year] = [];
    byYear[entry.year].push(entry);
  }

  // Sort contributors within each year by date descending
  for (const year of Object.keys(byYear)) {
    byYear[year].sort((a, b) => b.date.localeCompare(a.date));
  }

  // Generate markdown
  let md = '\n';
  for (const year of Object.keys(byYear).sort((a, b) => b - a)) {
    const names = byYear[year].map(c => {
      const commitUrl = `${REPO_URL}/commit/${c.hash}`;
      return `[${c.name}](${commitUrl})`;
    });
    md += `**${year}** — ${names.join(', ')}\n\n`;
  }

  console.log(md);
}

main();
