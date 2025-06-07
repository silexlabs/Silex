#!/bin/bash
set -euo pipefail

# Usage:
#   ./scripts/prepare-release-summary.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo ""

for dir in packages/*; do
  [ -f "$dir/.git" ] || continue
  cd "$dir"

  name=$(basename "$dir")

  # Get tags and changelog info
  all_tags=($(git tag --sort=-creatordate | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9]+)?$'))
  last_real_tag=""
  last_pre_tag=""

  for tag in "${all_tags[@]}"; do
    if [[ "$tag" != *-* ]]; then
      last_real_tag="$tag"
      break
    fi
  done

  for tag in "${all_tags[@]}"; do
    if [[ "$tag" == *-* ]]; then
      last_pre_tag="$tag"
      break
    fi
  done

  # If no real tag, show all history since beginning
  if [[ -z "$last_real_tag" ]]; then
    commits=$(git --no-pager log --pretty=format:"- %s (%an)")
  else
    # Only show commits strictly after the last real tag (exclude the tag commit itself)
    last_real_tag_commit=$(git rev-list -n 1 "$last_real_tag")
    commits=$(git --no-pager log "${last_real_tag_commit}..HEAD" --pretty=format:"- %s (%an)")
  fi

  if [[ -z "$commits" ]]; then
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
  echo "   Last release: $last_real_tag"
  if [[ -n "$last_pre_tag" ]]; then
    echo "   Last prerelease: $last_pre_tag"
  fi
  echo "   All commits since $last_real_tag:"
  echo "$commits" | sed 's/^/      /'

  echo ""
  cd "$REPO_ROOT"
done
