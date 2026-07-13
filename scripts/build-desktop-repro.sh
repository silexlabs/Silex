#!/usr/bin/env bash
# Reproducible Linux build of Silex Desktop (appimage, deb, rpm).
# Normalizes embedded-asset mtimes (rust-embed captures them) then builds with
# the deterministic environment. Used by CI and by anyone reproducing a release.
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
cd "$REPO_ROOT"

source scripts/repro-env.sh

# rust-embed bakes file mtimes into the binary; pin them so a fresh checkout
# (git sets mtime to checkout time) yields identical bytes.
for dir in dist/client silex-dashboard-2026/public; do
  [ -d "$dir" ] && find "$dir" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +
done

( cd desktop && pnpm tauri build )
