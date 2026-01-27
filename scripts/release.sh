#!/bin/bash

# release.sh
# Sript to release packages in the Silex monorepo based on npm workspaces and git submodules.
# This script automates the process of updating internal dependencies, bumping versions, and pushing changes to the repository.
# Usage:
#   ./scripts/release.sh [--type=TYPE] [--dry-run]
# Options:
#   --type=TYPE: Version bump type (prepatch, patch, preminor, minor). Default: preminor
#   --dry-run: Simulate the release process without making any changes
#   --help: Show this help message

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TYPE=""
DRY_RUN=false

show_help() {
  echo "Usage: $0 --type=TYPE [--dry-run]"
  echo ""
  echo "Release packages in the Silex monorepo based on npm workspaces and git submodules."
  echo "This script automates the process of updating internal dependencies, bumping versions,"
  echo "and pushing changes to the repository."
  echo ""
  echo "Options:"
  echo "  --type=TYPE  (required) Version bump type:"
  echo "               - prepatch: Increment patch and add/increment canary prerelease (e.g., 1.0.0 -> 1.0.1-canary.0)"
  echo "               - preminor: Increment minor and add/increment canary prerelease (e.g., 1.0.0 -> 1.1.0-canary.0)"
  echo "               - patch:    Release stable patch version (e.g., 1.0.1-canary.0 -> 1.0.1)"
  echo "               - minor:    Release stable minor version (e.g., 1.1.0-canary.0 -> 1.1.0)"
  echo "  --dry-run    Simulate the release process without making any changes"
  echo "  --help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --type=preminor           # Create a canary prerelease"
  echo "  $0 --type=minor              # Promote prerelease to stable minor"
  echo "  $0 --type=patch --dry-run    # Simulate a stable patch release"
}

for arg in "$@"; do
  case "$arg" in
    --type=*) TYPE="${arg#--type=}" ;;
    --dry-run) DRY_RUN=true ;;
    --h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo ""
      show_help
      exit 1
      ;;
  esac
done

# Show help if no --type provided
if [ -z "$TYPE" ]; then
  show_help
  exit 0
fi

# Validate type
if [[ ! "$TYPE" =~ ^(prepatch|patch|preminor|minor)$ ]]; then
  echo "❌ Invalid type: $TYPE"
  echo "   Valid types: prepatch, patch, preminor, minor"
  exit 1
fi

echo "🔍 Release: $TYPE$([[ $DRY_RUN == true ]] && echo " (dry-run)")"
echo ""

# Check for dirty packages
DIRTY_PACKAGES=()
for dir in packages/*; do
  [ -e "$dir/.git" ] || continue
  if [ -n "$(cd "$dir" && git status --porcelain)" ]; then
    DIRTY_PACKAGES+=("$dir")
  fi
done

if [ ${#DIRTY_PACKAGES[@]} -gt 0 ]; then
  echo "❌ Uncommitted changes in: ${DIRTY_PACKAGES[*]}"
  exit 1
fi

ERRORS=()
SKIPPED=()
UPDATED=()

# Bump version for a package or monorepo
# Usage: bump_version <name> [--wait-npm]
bump_version() {
  local name="$1"
  local wait_npm="${2:-}"

  local current_version=$(jq -r .version package.json)
  local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

  local has_new_commits=false
  if [ -n "$last_tag" ] && [ -n "$(git rev-list "$last_tag"..HEAD)" ]; then
    has_new_commits=true
  fi

  # Determine if version bump needed
  local should_bump=false
  if [[ "$TYPE" == "minor" || "$TYPE" == "patch" ]] && [[ "$current_version" == *-* ]]; then
    should_bump=true
  elif $has_new_commits; then
    should_bump=true
  fi

  if ! $should_bump; then
    echo "  ✅ No version bump needed. Skipping."
    SKIPPED+=("$name")
    return 0
  fi

  local cmd
  local expected_version=""
  case "$TYPE" in
    minor|patch)
      if [[ "$current_version" == *-* ]]; then
        expected_version=$(echo "$current_version" | sed 's/-.*$//')
        cmd="npm version $expected_version -m '%s'"
      else
        cmd="npm version $TYPE -m '%s'"
        expected_version="($TYPE bump)"
      fi
      ;;
    preminor|prepatch)
      if [[ "$current_version" == *-* ]]; then
        cmd="npm version prerelease --preid=canary -m '%s'"
        # Compute expected: increment last number in canary version
        local base=$(echo "$current_version" | sed 's/\.[0-9]*$//')
        local num=$(echo "$current_version" | grep -oE '[0-9]+$')
        expected_version="$base.$((num + 1))"
      else
        cmd="npm version $TYPE --preid=canary -m '%s'"
        expected_version="($TYPE bump)"
      fi
      ;;
  esac

  if $DRY_RUN; then
    echo "  $current_version → $expected_version (dry-run)"
    UPDATED+=("$name|$current_version → $expected_version")
  else
    if ! output=$(eval "$cmd" 2>&1); then
      echo "  ❌ Failed: $output"
      return 1
    fi
    local new_version=$(jq -r .version package.json)
    echo "  $current_version → $new_version"
    git push -q
    git push -q --tags

    if [ "$wait_npm" == "--wait-npm" ]; then
      local package_name=$(jq -r .name package.json)
      echo "  ⏳ Waiting for npm... https://www.npmjs.com/package/$package_name/"
      read -p "  Press enter when available..."
      sleep 10
      npm cache clean --force > /dev/null 2>&1
    fi

    UPDATED+=("$name|$current_version → $new_version")
  fi
}

INTERNAL_PACKAGE_NAMES=($(find packages -mindepth 1 -maxdepth 1 -type d -exec jq -r .name {}/package.json \;))
PACKAGE_PATHS=($(./scripts/sort-internal-deps.js | grep '^-' | sed 's/^- //' | xargs -n1))

for pkg_dir in "${PACKAGE_PATHS[@]}"; do
  dir="packages/$pkg_dir"
  [ -f "$dir/package.json" ] || continue
  cd "$dir"

  echo "📦 Processing $pkg_dir"

  # Update internal deps
  OUTDATED=$(npx -y npm-check-updates --dep prod,dev,peer --target=greatest 2>/dev/null || true)
  INTERNAL_UPGRADE_LIST=()

  while IFS= read -r line; do
    dep=$(echo "$line" | awk '{print $1}' | xargs)
    if [[ " ${INTERNAL_PACKAGE_NAMES[*]} " =~ " $dep " ]]; then
      INTERNAL_UPGRADE_LIST+=("$dep")
    fi
  done <<< "$OUTDATED"

  if [[ ${#INTERNAL_UPGRADE_LIST[@]} -gt 0 ]]; then
    if $DRY_RUN; then
      echo "  ↑ deps: ${INTERNAL_UPGRADE_LIST[*]} (dry-run)"
    else
      echo "  ↑ deps: ${INTERNAL_UPGRADE_LIST[*]}"
      npx -y npm-check-updates --dep prod,dev,peer --target=greatest --upgrade "${INTERNAL_UPGRADE_LIST[@]}" > /dev/null 2>&1
      npm install --package-lock-only --workspaces false > /dev/null 2>&1
      git add package.json package-lock.json
      git commit -q -m "chore: update internal dependencies in $pkg_dir"
      git push -q
    fi
  fi

  bump_version "$pkg_dir" --wait-npm
  cd "$REPO_ROOT"
done

echo ""
echo "📦 Processing monorepo"

# Commit submodule and lockfile updates before bumping monorepo version
CHANGED_FILES=$(git status --porcelain packages/ yarn.lock package-lock.json 2>/dev/null | grep -v '^??' || true)
if [ -n "$CHANGED_FILES" ]; then
  if $DRY_RUN; then
    echo "  (dry-run) Would commit submodule/lockfile updates"
  else
    git add packages/ yarn.lock package-lock.json 2>/dev/null || true
    git commit -q -m "chore: update submodule references"
  fi
fi

bump_version "monorepo"

echo ""
echo "✅ Done. Released: ${#UPDATED[@]}, Skipped: ${#SKIPPED[@]}"
