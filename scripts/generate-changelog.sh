#!/bin/bash
set -euo pipefail

# Generate GitHub Release Notes
#
# Usage:
#   ./scripts/generate-changelog.sh FROM_TAG..TO_TAG
#
# Output: GitHub-flavored markdown suitable for release pages
# Features:
#   - Groups by conventional commit type (feat/fix/chore)
#   - Deduplicates and filters out version bumps
#   - Detects new contributors

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- Configurable noise filters ---
# Subjects matching these patterns are always skipped
SKIP_PATTERNS=(
  '^[0-9]+\.[0-9]+'                    # version numbers (e.g. "3.7.3-canary.1")
  '^v[0-9]+\.[0-9]+'                   # version tags
  '^chore:\ update\ internal\ dep'     # internal dep bumps
  '^Merge\ (branch|pull\ request)'     # merge commits
  '^Bump\ v'                           # npm version bumps
  '^wip'                               # work in progress
  '^doc:'                              # docs (conventional)
  '^docs:'                             # docs (conventional alt)
)
# fix: messages matching these are skipped (CI/infra, not user-facing)
FIX_SKIP_PATTERNS=(
  '^release'
  '^build'
  '^desktop\ build'
)
# Non-conventional subjects matching these are skipped
OTHER_SKIP_PATTERNS=(
  '^auto\ updater$'
  '^latest\ version'
  '^removed?\ .*(repo|submodule|platform)'
)

# ASCII Unit Separator — safe delimiter unlikely to appear in commit messages
SEP=$'\x1f'

# --- Parse arguments ---
TAG_RANGE="${1:-}"

if [[ -z "$TAG_RANGE" || "$TAG_RANGE" != *..* ]]; then
  echo "Usage: $0 FROM_TAG..TO_TAG" >&2
  echo "Example: $0 v3.7.2..v3.7.3-canary.3" >&2
  exit 1
fi

FROM_TAG="${TAG_RANGE%..*}"
TO_TAG="${TAG_RANGE#*..}"

for tag in "$FROM_TAG" "$TO_TAG"; do
  if ! git rev-parse "$tag" >/dev/null 2>&1; then
    echo "❌ Tag '$tag' not found" >&2
    exit 1
  fi
done

# --- Helper: check if subject matches any pattern in an array ---
matches_any() {
  local subject="$1"
  shift
  for pattern in "$@"; do
    if [[ "$subject" =~ $pattern ]]; then
      return 0
    fi
  done
  return 1
}

# tformat (not format): terminates the last record with \n, otherwise `read` drops it
ALL_COMMITS=$(git --no-pager log "${FROM_TAG}..${TO_TAG}" --pretty=tformat:"%s${SEP}%an" 2>/dev/null || true)

# --- Filter, deduplicate, and categorize ---
declare -A SEEN
FEATURES=""
FIXES=""
OTHER=""

while IFS="$SEP" read -r subject author; do
  [[ -z "$subject" ]] && continue

  # Skip noise
  matches_any "$subject" "${SKIP_PATTERNS[@]}" && continue

  if [[ "$subject" =~ ^feat(\(.+\))?:\ (.+) ]]; then
    msg="${BASH_REMATCH[2]}"
    [[ -n "${SEEN[$msg]+x}" ]] && continue
    SEEN[$msg]=1
    FEATURES+="- $msg - $author"$'\n'

  elif [[ "$subject" =~ ^fix(\(.+\))?:\ (.+) ]]; then
    msg="${BASH_REMATCH[2]}"
    matches_any "$msg" "${FIX_SKIP_PATTERNS[@]}" && continue
    [[ -n "${SEEN[$msg]+x}" ]] && continue
    SEEN[$msg]=1
    FIXES+="- $msg - $author"$'\n'

  elif [[ "$subject" =~ ^chore(\(.+\))?:\ (.+) ]]; then
    continue

  else
    matches_any "$subject" "${OTHER_SKIP_PATTERNS[@]}" && continue
    [[ -n "${SEEN[$subject]+x}" ]] && continue
    SEEN[$subject]=1
    OTHER+="- $subject - $author"$'\n'
  fi
done <<< "$ALL_COMMITS"

# --- Detect new contributors ---
RELEASE_AUTHORS=$(git log "${FROM_TAG}..${TO_TAG}" --pretty=format:"%an" 2>/dev/null | sort -u | grep -v '^$' || true)
# Limit history depth to avoid traversing entire repo
PREV_AUTHORS=$(git log "$FROM_TAG" --max-count=500 --pretty=format:"%an" 2>/dev/null | sort -u | grep -v '^$' || true)

NEW_CONTRIBUTORS=""
while IFS= read -r author; do
  [[ -z "$author" ]] && continue
  if ! echo "$PREV_AUTHORS" | grep -qxF "$author"; then
    NEW_CONTRIBUTORS+="- $author"$'\n'
  fi
done <<< "$RELEASE_AUTHORS"

# --- Output markdown ---
echo "## What's Changed"
echo ""

if [[ -n "$FEATURES" ]]; then
  echo "### Features"
  echo ""
  echo -n "$FEATURES"
  echo ""
fi

if [[ -n "$FIXES" ]]; then
  echo "### Bug Fixes"
  echo ""
  echo -n "$FIXES"
  echo ""
fi

if [[ -n "$OTHER" ]]; then
  echo "### Other Changes"
  echo ""
  echo -n "$OTHER"
  echo ""
fi

if [[ -n "$NEW_CONTRIBUTORS" ]]; then
  echo "### New Contributors"
  echo ""
  echo -n "$NEW_CONTRIBUTORS"
  echo ""
fi

if [[ -n "$RELEASE_AUTHORS" ]]; then
  echo "### Contributors"
  echo ""
  while IFS= read -r author; do
    [[ -z "$author" ]] && continue
    echo "- $author"
  done <<< "$RELEASE_AUTHORS"
  echo ""
fi

# --- Try it ---
if [[ "$TO_TAG" == *-canary* || "$TO_TAG" == *-alpha* || "$TO_TAG" == *-beta* ]]; then
  echo "### Try it"
  echo ""
  echo "This is a **pre-release** intended for testing: https://canary.silex.me"
else
  echo "### Try it"
  echo ""
  echo "Available now on https://v3.silex.me"
fi
echo ""

# --- Downloads table ---
VERSION="$TO_TAG"
BASE="https://github.com/silexlabs/Silex/releases/download/${VERSION}"

# Desktop artifacts (Tauri) are named with the monorepo version — the release
# workflow patches tauri.conf.json from the tag before building.
DESKTOP_VERSION="${TO_TAG#v}"

echo "### Desktop app"
echo ""
echo "Install Silex on your computer."
echo ""
if [[ -n "$DESKTOP_VERSION" ]]; then
  echo "- **Linux**: [.AppImage (auto-updates)](${BASE}/Silex_${DESKTOP_VERSION}_amd64.AppImage) · [.deb installer](${BASE}/Silex_${DESKTOP_VERSION}_amd64.deb) · [.rpm installer](${BASE}/Silex-${DESKTOP_VERSION}-1.x86_64.rpm)"
  echo "- **macOS** (Apple Silicon): [.dmg](${BASE}/Silex_${DESKTOP_VERSION}_aarch64.dmg)"
  echo "- **macOS** (Intel): [.dmg](${BASE}/Silex_${DESKTOP_VERSION}_x64.dmg)"
  echo "- **Windows**: [setup.exe](${BASE}/Silex_${DESKTOP_VERSION}_x64-setup.exe)"
else
  echo "_Desktop version not available for this release._"
fi
echo ""

echo "**Full Changelog**: https://github.com/silexlabs/Silex/compare/${FROM_TAG}...${TO_TAG}"
