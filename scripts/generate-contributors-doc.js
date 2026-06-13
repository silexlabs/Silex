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

// Normalize author names (different git identities → single name)
const AUTHOR_ALIASES = {
  'lexoyo': 'Alex Hoyau',
  'lexa': 'Alex Hoyau',
  'Alexandre Hoyau': 'Alex Hoyau',
  'pierreozoux': 'Pierre Ozoux',
  'JbIPS': 'Jean-Baptiste Richardet',
  'ioleo': 'Piotr Golebiewski',
};

function normalizeName(name) {
  return AUTHOR_ALIASES[name] || name;
}

function getContributors(dir) {
  try {
    const output = execSync('git log --format="%an|%H|%aI" --all', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
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
    const name = normalizeName(c.name);
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
