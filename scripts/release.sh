#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RELEASE=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --release) RELEASE=true ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

if [[ "${RELEASE:-}" == "true" || "${RELEASE:-}" == "1" ]]; then
  RELEASE=true
fi
if [[ "${DRY_RUN:-}" == "true" || "${DRY_RUN:-}" == "1" ]]; then
  DRY_RUN=true
fi

echo "🔍 Mode: $([[ $RELEASE == true ]] && echo "RELEASE" || echo "PRERELEASE")"
echo "🔍 Dry run: $([[ $DRY_RUN == true ]] && echo "YES" || echo "NO")"
echo ""

# Vérifie que tous les packages sont clean avant toute opération
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

# Liste des noms internes (scopés ou non)
INTERNAL_PACKAGE_NAMES=($(find packages -mindepth 1 -maxdepth 1 -type d -exec jq -r .name {}/package.json \;))

# Ordre réel des packages retourné proprement
PACKAGE_PATHS=($(./scripts/sort-internal-deps.js | grep '^-' | sed 's/^- //' | xargs -n1))

for pkg_dir in "${PACKAGE_PATHS[@]}"; do
  dir="packages/$pkg_dir"
  [ -f "$dir/package.json" ] || continue
  cd "$dir"

  echo "📦 Processing $pkg_dir"

  CURRENT_VERSION=$(jq -r .version package.json)
  LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  HAS_NEW_COMMITS=true
  if [ -n "$LAST_TAG" ] && [ -z "$(git rev-list "$LAST_TAG"..HEAD)" ]; then
    HAS_NEW_COMMITS=false
  fi

  # Détection des dépendances internes à mettre à jour
  OUTDATED=$(npx -y npm-check-updates --dep prod,dev,peer || true)
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

  if [[ ${#INTERNAL_UPGRADE_LIST[@]} -gt 0 ]]; then
    if $DRY_RUN; then
      echo "  🧪 (dry-run) Would update internal deps: ${INTERNAL_UPGRADE_LIST[*]}"
    else
      echo "  🔧 Updating internal deps..."
      npx -y npm-check-updates --dep prod,dev,peer --upgrade "${INTERNAL_UPGRADE_LIST[@]}"
      npm install
      npm install --package-lock-only --workspaces false
      git add package.json package-lock.json
      git commit -m "chore: update internal dependencies in $pkg_dir"
      git push
    fi
  fi

  # Décision de bump de version
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

  # Bump version
  if $RELEASE; then
    CMD="npm version minor -m 'chore: release %s'"
  else
    CMD="npm version prerelease -m 'chore: prerelease %s'"
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
    echo "🔗 https://www.npmjs.com/package/$PACKAGE_NAME/v/$NEW_VERSION"
    read -p "⏸️  Press enter to continue when it's available..."
  fi

  UPDATED+=("$pkg_dir|$CURRENT_VERSION → $NEW_VERSION")
  cd "$REPO_ROOT"
  echo ""
done

# Résumé final
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
