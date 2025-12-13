#!/bin/bash

# release.sh
# Sript to release packages in the Silex monorepo based on npm workspaces and git submodules.
# This script automates the process of updating internal dependencies, bumping versions, and pushing changes to the repository.
# Usage:
#   ./scripts/release.sh [--release] [--dry-run]
# Options:
#   --release: Perform a release (default is prerelease)
#   --dry-run: Simulate the release process without making any changes
#   --help: Show this help message

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RELEASE=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --release) RELEASE=true ;;
    --dry-run) DRY_RUN=true ;;
    --h|--help)
      echo "Usage: $0 [--release] [--dry-run]"
      echo "Options:"
      echo "  --release: Perform a release (default is prerelease)"
      echo "  --dry-run: Simulate the release process without making any changes"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--release] [--dry-run]"
      echo "Options:"
      echo "  --release: Perform a release (default is prerelease)"
      echo "  --dry-run: Simulate the release process without making any changes"
      exit 1
      ;;
  esac
done

echo "🔍 Mode: $([[ $RELEASE == true ]] && echo "RELEASE" || echo "PRERELEASE")"
echo "🔍 Dry run: $([[ $DRY_RUN == true ]] && echo "YES" || echo "NO")"
echo ""

# Check for dirty packages
echo "🔎 Validating working directory status for all packages..."
DIRTY_PACKAGES=()
for dir in packages/*; do
  [ -e "$dir/.git" ] || continue
  if [ -n "$(cd "$dir" && git status --porcelain)" ]; then
    DIRTY_PACKAGES+=("$dir")
  fi
done

if [ ${#DIRTY_PACKAGES[@]} -gt 0 ]; then
  echo "❌ Some packages have uncommitted changes:"
  for p in "${DIRTY_PACKAGES[@]}"; do
    echo "   - $p"
  done
  echo ""
  echo "🛑 Please commit or stash these changes before running the release."
  exit 1
fi

echo "✅ All packages clean"
echo ""

ERRORS=()
SKIPPED=()
UPDATED=()

INTERNAL_PACKAGE_NAMES=($(find packages -mindepth 1 -maxdepth 1 -type d -exec jq -r .name {}/package.json \;))
PACKAGE_PATHS=($(./scripts/sort-internal-deps.js | grep '^-' | sed 's/^- //' | xargs -n1))

for pkg_dir in "${PACKAGE_PATHS[@]}"; do
  dir="packages/$pkg_dir"
  [ -f "$dir/package.json" ] || continue
  cd "$dir"

  echo "📦 Processing $pkg_dir"

  CURRENT_VERSION=$(jq -r .version package.json)
  LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

  HAS_NEW_COMMITS=false
  if [ -n "$LAST_TAG" ] && [ -n "$(git rev-list "$LAST_TAG"..HEAD)" ]; then
    HAS_NEW_COMMITS=true
  fi

  # Update internal deps
  OUTDATED=$(npx -y npm-check-updates --dep prod,dev,peer --target=greatest || true)
  INTERNAL_LINES=()
  INTERNAL_UPGRADE_LIST=()

  while IFS= read -r line; do
    dep=$(echo "$line" | awk '{print $1}' | xargs)
    if [[ " ${INTERNAL_PACKAGE_NAMES[*]} " =~ " $dep " ]]; then
      echo "  ✨ $line"
      INTERNAL_LINES+=("$line")
      INTERNAL_UPGRADE_LIST+=("$dep")
    fi
  done <<< "$OUTDATED"

  UPDATED_INTERNAL_DEPS=false
  if [[ ${#INTERNAL_UPGRADE_LIST[@]} -gt 0 ]]; then
    UPDATED_INTERNAL_DEPS=true
    if $DRY_RUN; then
      echo "  🧪 (dry-run) Would update internal deps: ${INTERNAL_UPGRADE_LIST[*]}"
    else
      echo "  🔧 Updating internal deps..."
      npx -y npm-check-updates --dep prod,dev,peer --target=greatest --upgrade "${INTERNAL_UPGRADE_LIST[@]}"
      npm install --package-lock-only --workspaces false
      git add package.json package-lock.json
      git commit -m "chore: update internal dependencies in $pkg_dir"
      git push
    fi
  else
    echo "  ✅ No internal dependencies to update."
  fi

  # Re-check for new commits after dependency update
  HAS_NEW_COMMITS=false
  if [ -n "$LAST_TAG" ] && [ -n "$(git rev-list "$LAST_TAG"..HEAD)" ]; then
    HAS_NEW_COMMITS=true
  fi

  # Determine if version bump needed
  SHOULD_BUMP=false
  if $RELEASE && [[ "$CURRENT_VERSION" == *-* ]]; then
    SHOULD_BUMP=true
  elif $HAS_NEW_COMMITS; then
    SHOULD_BUMP=true
  fi

  if ! $SHOULD_BUMP; then
    echo "  ✅ No version bump needed. Skipping."
    SKIPPED+=("$pkg_dir")
    cd "$REPO_ROOT"
    echo ""
    continue
  fi

  if $RELEASE; then
    # Mode release (stable)
    if [[ "$CURRENT_VERSION" == *-* ]]; then
      # On est sur une prerelease, on veut juste la version stable sans le suffixe
      STABLE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-[0-9]*$//')
      CMD="npm version $STABLE_VERSION -m 'chore: release %s'"
    else
      # On est déjà sur une version stable, incrémenter le minor
      CMD="npm version minor -m 'chore: release %s'"
    fi
  else
    # Mode prerelease
    if [[ "$CURRENT_VERSION" == *-* ]]; then
      # On est déjà sur une prerelease, incrémenter le suffixe
      CMD="npm version prerelease -m 'chore: prerelease %s'"
    else
      # On est sur une version stable, incrémenter le minor + ajouter -0
      CMD="npm version preminor -m 'chore: prerelease %s'"
    fi
  fi

  if $DRY_RUN; then
    echo "  🧪 (dry-run) Would run: $CMD"
    echo "  🧪 (dry-run) Would push + tag"
    NEW_VERSION=$(jq -r .version package.json)
  else
    echo "  🚀 Bumping version..."
    eval "$CMD"
    NEW_VERSION=$(jq -r .version package.json)
    git push
    git push --tags

    PACKAGE_NAME=$(jq -r .name package.json)
    echo ""
    echo "🛑 Waiting for $PACKAGE_NAME@$NEW_VERSION to appear on npm"
    echo "🔗 https://www.npmjs.com/package/$PACKAGE_NAME/"
    read -p "⏸️  Press enter to continue when it's available..."
    echo "⏳ Waiting 10s"
    sleep 10
    npm cache clean --force
  fi

  UPDATED+=("$pkg_dir|$CURRENT_VERSION → $NEW_VERSION")
  cd "$REPO_ROOT"
  echo ""
done

# Résumé
echo "✅ Script completed."
echo ""

if [ ${#UPDATED[@]} -gt 0 ]; then
  echo "📦 Tagged:"
  for entry in "${UPDATED[@]}"; do
    echo "   - $entry"
  done
  echo ""
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "⏭️ Skipped (no changes):"
  for d in "${SKIPPED[@]}"; do
    echo "   - $d"
  done
  echo ""
fi
