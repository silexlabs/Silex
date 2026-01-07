#!/bin/bash
set -euo pipefail

# Usage:
#   ./scripts/generate-changelog.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Get the release version from silex-lib
RELEASE_VERSION=$(jq -r '.version' packages/silex-lib/package.json)

echo ""
echo "============================================"
echo "🚀 Release: v$RELEASE_VERSION"
echo "============================================"

for dir in packages/*; do
  [ -f "$dir/.git" ] || continue
  cd "$dir"

  name=$(basename "$dir")

  # Get all semver tags (with optional v prefix and prerelease suffix)
  # Matches: v1.2.3, 1.2.3, v1.2.3-canary.1, 1.2.3-alpha.0, v1.2.3-1, etc.
  all_tags=($(git tag --sort=-creatordate | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$' || true))

  last_real_tag=""
  last_pre_tag=""

  # Find last stable release (no dash in version)
  for tag in "${all_tags[@]}"; do
    if [[ "$tag" != *-* ]]; then
      last_real_tag="$tag"
      break
    fi
  done

  # Find last prerelease (has dash in version)
  for tag in "${all_tags[@]}"; do
    if [[ "$tag" == *-* ]]; then
      last_pre_tag="$tag"
      break
    fi
  done

  # Get commits since last stable release
  commits_since_release=""
  if [[ -z "$last_real_tag" ]]; then
    commits_since_release=$(git --no-pager log --pretty=format:"- %s (%an)")
  else
    last_real_tag_commit=$(git rev-list -n 1 "$last_real_tag")
    commits_since_release=$(git --no-pager log "${last_real_tag_commit}..HEAD" --pretty=format:"- %s (%an)")
  fi

  # Get commits since last prerelease (only if prerelease is newer than release)
  commits_since_prerelease=""
  prerelease_is_newer=false
  if [[ -n "$last_pre_tag" ]]; then
    last_pre_tag_commit=$(git rev-list -n 1 "$last_pre_tag")
    # Check if prerelease is newer than release (prerelease commit is not an ancestor of release commit)
    if [[ -z "$last_real_tag" ]] || ! git merge-base --is-ancestor "$last_pre_tag_commit" "$last_real_tag_commit" 2>/dev/null; then
      prerelease_is_newer=true
      commits_since_prerelease=$(git --no-pager log "${last_pre_tag_commit}..HEAD" --pretty=format:"- %s (%an)")
    fi
  fi

  # Skip if no commits since release AND no commits since prerelease
  if [[ -z "$commits_since_release" && -z "$commits_since_prerelease" ]]; then
    cd "$REPO_ROOT"
    continue
  fi

  echo "────────────────────────────────────────────"
  echo "📦 Package: $name"
  if [[ -f "README.md" ]]; then
    echo "README Preview:"
    grep -v '^\s*$' README.md | sed -n '1,10p' | sed 's/^/   /'
    echo ""
  fi

  echo "Release summary:"
  echo "   Last release: ${last_real_tag:-none}"
  if [[ -n "$last_pre_tag" ]]; then
    echo "   Last prerelease: $last_pre_tag"
  fi

  # Show commits since last prerelease (only if prerelease is newer than release)
  if [[ "$prerelease_is_newer" == "true" && -n "$commits_since_prerelease" ]]; then
    echo ""
    echo "   Commits since $last_pre_tag (prerelease):"
    echo "$commits_since_prerelease" | sed 's/^/      /'
  fi

  # Show commits since last stable release
  if [[ -n "$commits_since_release" ]]; then
    echo ""
    echo "   All commits since ${last_real_tag:-beginning}:"
    echo "$commits_since_release" | sed 's/^/      /'
  fi

  echo ""
  cd "$REPO_ROOT"
done
