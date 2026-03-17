#!/bin/bash
set -euo pipefail

# Generate GitHub Release Notes with submodule support
#
# Usage:
#   ./scripts/generate-changelog.sh FROM_TAG..TO_TAG
#
# Output: GitHub-flavored markdown suitable for release pages
# Features:
#   - Traverses git submodules to collect all commits
#   - Groups by conventional commit type (feat/fix/chore)
#   - Deduplicates and filters out version bumps
#   - Detects new contributors (across monorepo + submodules)

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

# --- Submodule name → GitHub URL mapping ---
declare -A PACKAGE_URL
for _dir in packages/*; do
  [ -f "$_dir/.git" ] || continue
  _name=$(basename "$_dir")
  _remote=$(cd "$_dir" && git remote get-url origin 2>/dev/null || true)
  # Convert git@github.com:org/repo.git → https://github.com/org/repo
  _remote=$(echo "$_remote" | sed -E 's|^git@github\.com:|https://github.com/|; s|\.git$||')
  PACKAGE_URL[$_name]="$_remote"
done

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

# --- Helper: iterate submodules with changes between two monorepo tags ---
# Usage: for_each_submodule <callback_function>
# Callback receives: $1=dir, $2=from_sha, $3=to_sha
for_each_submodule() {
  local callback="$1"
  for dir in packages/*; do
    [ -f "$dir/.git" ] || continue
    local from_sha to_sha
    from_sha=$(git ls-tree "$FROM_TAG" "$dir" 2>/dev/null | awk '{print $3}')
    to_sha=$(git ls-tree "$TO_TAG" "$dir" 2>/dev/null | awk '{print $3}')
    [[ -z "$from_sha" || -z "$to_sha" || "$from_sha" == "$to_sha" ]] && continue
    "$callback" "$dir" "$from_sha" "$to_sha"
  done
}

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

# --- Helper: format package name as markdown link if URL available ---
format_package() {
  local pkg="$1"
  local url="${PACKAGE_URL[$pkg]:-}"
  if [[ -n "$url" ]]; then
    echo "[$pkg]($url)"
  else
    echo "$pkg"
  fi
}

# --- Collect all commits (monorepo + submodules) ---
ALL_COMMITS=""

collect_submodule_commits() {
  local dir="$1" from_sha="$2" to_sha="$3"
  local name
  name=$(basename "$dir")
  cd "$dir"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    ALL_COMMITS+="${line}${SEP}${name}"$'\n'
  done < <(git --no-pager log "${from_sha}..${to_sha}" --pretty=format:"%s${SEP}%an" 2>/dev/null || true)
  cd "$REPO_ROOT"
}

# Monorepo-level commits
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  ALL_COMMITS+="${line}${SEP}monorepo"$'\n'
done < <(git --no-pager log "${FROM_TAG}..${TO_TAG}" --pretty=format:"%s${SEP}%an" 2>/dev/null || true)

for_each_submodule collect_submodule_commits

# --- Filter, deduplicate, and categorize ---
declare -A SEEN
FEATURES=""
FIXES=""
OTHER=""

while IFS="$SEP" read -r subject author package; do
  [[ -z "$subject" ]] && continue

  # Skip noise
  matches_any "$subject" "${SKIP_PATTERNS[@]}" && continue

  # Extract conventional commit type
  pkg_link=$(format_package "$package")

  if [[ "$subject" =~ ^feat(\(.+\))?:\ (.+) ]]; then
    msg="${BASH_REMATCH[2]}"
    [[ -n "${SEEN[$msg]+x}" ]] && continue
    SEEN[$msg]=1
    FEATURES+="- $msg ($pkg_link) @$author"$'\n'

  elif [[ "$subject" =~ ^fix(\(.+\))?:\ (.+) ]]; then
    msg="${BASH_REMATCH[2]}"
    matches_any "$msg" "${FIX_SKIP_PATTERNS[@]}" && continue
    [[ -n "${SEEN[$msg]+x}" ]] && continue
    SEEN[$msg]=1
    FIXES+="- $msg ($pkg_link) @$author"$'\n'

  elif [[ "$subject" =~ ^chore(\(.+\))?:\ (.+) ]]; then
    continue

  else
    matches_any "$subject" "${OTHER_SKIP_PATTERNS[@]}" && continue
    [[ -n "${SEEN[$subject]+x}" ]] && continue
    SEEN[$subject]=1
    OTHER+="- $subject ($pkg_link) @$author"$'\n'
  fi
done <<< "$ALL_COMMITS"

# --- Detect new contributors ---
RELEASE_AUTHORS=""
PREV_AUTHORS=""

collect_release_authors() {
  local dir="$1" from_sha="$2" to_sha="$3"
  cd "$dir"
  RELEASE_AUTHORS+=$(git --no-pager log "${from_sha}..${to_sha}" --pretty=format:"%an" 2>/dev/null)$'\n'
  cd "$REPO_ROOT"
}

collect_prev_authors() {
  local dir="$1" from_sha="$2"
  cd "$dir"
  # Limit history depth to avoid traversing entire repo
  PREV_AUTHORS+=$(git --no-pager log "$from_sha" --max-count=500 --pretty=format:"%an" 2>/dev/null)$'\n'
  cd "$REPO_ROOT"
}

# Release authors
RELEASE_AUTHORS+=$(git log "${FROM_TAG}..${TO_TAG}" --pretty=format:"%an" 2>/dev/null)$'\n'
for_each_submodule collect_release_authors
RELEASE_AUTHORS=$(echo "$RELEASE_AUTHORS" | sort -u | grep -v '^$' || true)

# Previous authors (with depth limit)
PREV_AUTHORS+=$(git log "$FROM_TAG" --max-count=500 --pretty=format:"%an" 2>/dev/null)$'\n'
# For prev authors we need all submodules that existed at FROM_TAG, not just changed ones
for dir in packages/*; do
  [ -f "$dir/.git" ] || continue
  from_sha=$(git ls-tree "$FROM_TAG" "$dir" 2>/dev/null | awk '{print $3}')
  [[ -z "$from_sha" ]] && continue
  cd "$dir"
  PREV_AUTHORS+=$(git --no-pager log "$from_sha" --max-count=500 --pretty=format:"%an" 2>/dev/null)$'\n'
  cd "$REPO_ROOT"
done
PREV_AUTHORS=$(echo "$PREV_AUTHORS" | sort -u | grep -v '^$' || true)

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
echo "### Downloads"
echo ""
echo "| Platform | Server (CLI) | Desktop App |"
echo "|----------|-------------|-------------|"
echo "| Linux x64 | [silex-server-linux-amd64](${BASE}/silex-server-linux-amd64) | [.deb](${BASE}/silex-desktop_amd64.deb) |"
echo "| macOS ARM | [silex-server-macos-arm64](${BASE}/silex-server-macos-arm64) | [.dmg](${BASE}/Silex_aarch64.dmg) |"
echo "| macOS x64 | [silex-server-macos-x64](${BASE}/silex-server-macos-x64) | [.dmg](${BASE}/Silex_x64.dmg) |"
echo "| Windows x64 | [silex-server-windows-amd64.exe](${BASE}/silex-server-windows-amd64.exe) | [.exe](${BASE}/Silex_x64-setup.exe) |"
echo ""

echo "**Full Changelog**: https://github.com/silexlabs/Silex/compare/${FROM_TAG}...${TO_TAG}"
