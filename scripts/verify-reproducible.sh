#!/usr/bin/env bash
# Verify the current checkout reproduces a published Silex Desktop binary.
#
# Run from a clean checkout at the release tag:
#   git clone --recurse-submodules https://github.com/silexlabs/Silex && cd Silex
#   git checkout v3.9.0   # the tag of the release you are verifying
#   ./scripts/verify-reproducible.sh [expected-sha256]
#
# Rebuilds the binary with the deterministic env + pinned toolchain and compares
# its sha256 to the release's SHA256SUMS.inner. Needs the Rust/Node toolchain,
# not the AppImage bundler.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
source scripts/repro-env.sh

corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile --filter @silexlabs/silex --filter @silexlabs/silex-desktop
pnpm run build
for d in dist/client silex-dashboard-2026/public; do
  [ -d "$d" ] && find "$d" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +
done
cargo build --release --locked --manifest-path desktop/src-tauri/Cargo.toml

REBUILT="$(sha256sum desktop/src-tauri/target/release/silex-desktop | cut -d' ' -f1)"
echo "rebuilt binary sha256: $REBUILT"

EXPECTED="${1:-}"
if [ -z "$EXPECTED" ]; then
  echo "compare this against SHA256SUMS.inner from the release"
  exit 0
fi
[ "$REBUILT" = "$EXPECTED" ] && echo "✅ reproducible" || { echo "❌ mismatch (expected $EXPECTED)"; exit 1; }
