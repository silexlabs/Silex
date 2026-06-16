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

// Names link to the contributor's GitHub profile (not a random commit, and no email
// is exposed in the README). The login comes from the commit author email:
//   1. GitHub noreply emails (`<id>+<login>@users.noreply.github.com`) encode the login.
//   2. Otherwise we ask GitHub, through the `gh` CLI (already authenticated locally),
//      for a public commit with that author email. The rewritten monorepo commits
//      aren't pushed yet, but the originals are, so the search finds them.
// Run this script yourself: it needs `gh` logged in. Without `gh`, step 2 is skipped
// and unresolved contributors render as plain text.

function loginFromNoreply(email) {
  const m = (email || '').match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
  return m ? m[1] : null;
}

let ghAvailable = true;
function resolveViaGh(email) {
  if (!ghAvailable) return null;
  try {
    const out = execSync(
      `gh api -H "Accept: application/vnd.github+json" ` +
      `"search/commits?q=author-email:${encodeURIComponent(email)}&per_page=1" ` +
      `--jq ".items[0].author.login // empty"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    execSync('sleep 2.2'); // GitHub commit search: 30 requests/min
    return out || null;
  } catch (e) {
    if (/command not found|not found in PATH|executable file not found/i.test(String(e))) {
      ghAvailable = false;
      console.error('[contributors] gh CLI not available — profile links limited to noreply emails');
    }
    return null;
  }
}

function getContributors(dir) {
  try {
    const output = execSync('git log --format="%aN|%aE|%aI" --all', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024, // full monorepo history exceeds the 1MB default
    });
    return output.trim().split('\n').filter(Boolean).map((line) => {
      const [name, email, date] = line.split('|');
      return { name, email, date };
    });
  } catch {
    return [];
  }
}

function main() {
  // Single git log over the monorepo captures every package's contributors.
  const allContributions = getContributors(ROOT);

  // Group by author+year, keep the latest commit per author per year (for display),
  // and collect every email seen per author (to resolve a login).
  const byAuthorYear = {};
  const emailsByName = {};
  for (const c of allContributions) {
    const name = c.name; // already normalized by git via .mailmap (%aN)
    if (EXCLUDE.test(name)) continue;
    const year = c.date.substring(0, 4);
    const key = `${name}|${year}`;
    if (!byAuthorYear[key] || c.date > byAuthorYear[key].date) {
      byAuthorYear[key] = { ...c, name, year };
    }
    (emailsByName[name] ||= new Set()).add(c.email);
  }

  // One GitHub login per author: noreply emails first (free), then `gh` for the rest.
  const loginByName = {};
  let resolved = 0;
  for (const [name, emails] of Object.entries(emailsByName)) {
    let login = null;
    for (const email of emails) { login = loginFromNoreply(email); if (login) break; }
    if (!login) {
      for (const email of emails) { login = resolveViaGh(email); if (login) { resolved++; break; } }
    }
    loginByName[name] = login || null;
  }
  if (resolved) console.error(`[contributors] resolved ${resolved} login(s) via gh`);

  // Group by year
  const byYear = {};
  for (const entry of Object.values(byAuthorYear)) {
    (byYear[entry.year] ||= []).push(entry);
  }
  for (const year of Object.keys(byYear)) {
    byYear[year].sort((a, b) => b.date.localeCompare(a.date));
  }

  // Generate markdown — link to the GitHub profile when known, plain name otherwise.
  let md = '\n';
  for (const year of Object.keys(byYear).sort((a, b) => b - a)) {
    const names = byYear[year].map((c) => {
      const login = loginByName[c.name];
      return login ? `[${c.name}](https://github.com/${login})` : c.name;
    });
    md += `**${year}** — ${names.join(', ')}\n\n`;
  }

  console.log(md);
}

main();
