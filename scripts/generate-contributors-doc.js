#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Monorepo: every package's history was absorbed in-tree, so a single `git log` over
// this repository captures all contributors across all packages. All commits now live
// in silexlabs/Silex (submodule commit hashes were rewritten by git filter-repo).
const REPO_URL = 'https://github.com/silexlabs/Silex';

// Authors to exclude (bots, placeholders, AI assistants credited as co-authors)
const EXCLUDE = /ubuntu|john doe|^undefined$|grrhosting|gitter badger|claude|anthropic|copilot|\[bot\]/i;

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

// Co-authors are credited too: a squashed PR keeps its real author in a
// `Co-authored-by` trailer, so `%aN` alone would drop them. Records are NUL separated
// because a commit can carry several trailers, each one on its own line.
function getContributors(dir) {
  try {
    const output = execSync(
      'git log --format="%aN|%aE|%aI|%(trailers:key=Co-authored-by,valueonly,separator=%x1F)%x00" --all',
      {
        cwd: dir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 256 * 1024 * 1024, // full monorepo history exceeds the 1MB default
      });
    return output.split('\0').filter((record) => record.trim()).flatMap((record) => {
      const [name, email, date, coauthors] = record.trim().split('|');
      const contributions = [{ name, email, date }];
      for (const trailer of (coauthors || '').split('\x1F').filter(Boolean)) {
        const parsed = trailer.match(/^\s*(.+?)\s*<(.+?)>\s*$/);
        if (parsed) contributions.push({ name: parsed[1], email: parsed[2], date });
      }
      return contributions;
    });
  } catch {
    return [];
  }
}

function main() {
  // Single git log over the monorepo captures every package's contributors.
  const allContributions = getContributors(ROOT);

  // Collect every email seen per author name (to resolve a login).
  const contributionsByName = {};
  const emailsByName = {};
  for (const c of allContributions) {
    const name = c.name;
    if (EXCLUDE.test(name)) continue;
    (contributionsByName[name] ||= []).push(c);
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

  // Identity is the GitHub login, not the name a contributor happened to configure:
  // `lexoyo`, `lexa` and `Alex Hoyau` all resolve to the same profile, so they are one
  // person. Names without a resolved login fall back to their own name as key.
  // The display name is the one used in the most recent commit of the group.
  const byIdentityYear = {};
  const displayNameByIdentity = {};
  const latestDateByIdentity = {};
  for (const [name, contributions] of Object.entries(contributionsByName)) {
    const identity = loginByName[name] ? `gh:${loginByName[name]}` : `name:${name}`;
    for (const c of contributions) {
      if (!latestDateByIdentity[identity] || c.date > latestDateByIdentity[identity]) {
        latestDateByIdentity[identity] = c.date;
        displayNameByIdentity[identity] = name;
      }
      const year = c.date.substring(0, 4);
      const key = `${identity}|${year}`;
      if (!byIdentityYear[key] || c.date > byIdentityYear[key].date) {
        byIdentityYear[key] = { identity, year, date: c.date };
      }
    }
  }

  // Group by year
  const byYear = {};
  for (const entry of Object.values(byIdentityYear)) {
    (byYear[entry.year] ||= []).push(entry);
  }
  for (const year of Object.keys(byYear)) {
    byYear[year].sort((a, b) => b.date.localeCompare(a.date));
  }

  // Generate markdown — link to the GitHub profile when known, plain name otherwise.
  let md = '\n';
  for (const year of Object.keys(byYear).sort((a, b) => b - a)) {
    const names = byYear[year].map((entry) => {
      const name = displayNameByIdentity[entry.identity];
      const login = entry.identity.startsWith('gh:') ? entry.identity.slice(3) : null;
      return login ? `[${name}](https://github.com/${login})` : name;
    });
    md += `**${year}** — ${names.join(', ')}\n\n`;
  }

  console.log(md);
}

main();
