#!/usr/bin/env bash
# Reproducible Linux build of Silex Desktop (appimage, deb, rpm).
# Normalizes embedded-asset mtimes (rust-embed captures them) then builds with
# the deterministic environment. Used by CI and by anyone reproducing a release.
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
cd "$REPO_ROOT"

source scripts/repro-env.sh
pin_embedded_mtimes

( cd desktop && pnpm tauri build )
