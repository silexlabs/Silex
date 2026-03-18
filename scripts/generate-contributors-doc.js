#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ini from 'js-ini';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

// Parse .gitmodules to map submodule path → GitHub web URL
function getRepoUrls() {
  const gitmodules = readFileSync(resolve(ROOT, '.gitmodules'), 'utf-8');
  const parsed = ini.parse(gitmodules);
  const urls = {};
  for (const [key, value] of Object.entries(parsed)) {
    const name = key.replace(/^submodule "packages\//, '').replace(/"$/, '');
    const webUrl = value.url
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/^git@gitlab\.com:/, 'https://gitlab.com/')
      .replace(/\.git$/, '');
    urls[name] = webUrl;
  }
  urls['meta repo'] = 'https://github.com/silexlabs/Silex';
  return urls;
}

function main() {
  const repoUrls = getRepoUrls();
  const allContributions = [];

  // Submodules
  const pkgDir = join(ROOT, 'packages');
  for (const name of readdirSync(pkgDir)) {
    const dir = join(pkgDir, name);
    if (!existsSync(join(dir, '.git'))) continue;
    for (const c of getContributors(dir)) {
      allContributions.push({ ...c, pkg: name });
    }
  }

  // Meta repo
  for (const c of getContributors(ROOT)) {
    allContributions.push({ ...c, pkg: 'meta repo' });
  }

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
      const repoUrl = repoUrls[c.pkg] || '';
      const commitUrl = repoUrl ? `${repoUrl}/commit/${c.hash}` : '';
      return commitUrl ? `[${c.name}](${commitUrl})` : c.name;
    });
    md += `**${year}** — ${names.join(', ')}\n\n`;
  }

  console.log(md);
}

main();
