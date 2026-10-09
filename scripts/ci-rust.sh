#!/usr/bin/env bash
# Runs what the rust job of CI runs, in the same order, so that a red CI can be
# seen here first. Exits non-zero on the first step CI would fail on.
set -uo pipefail
cd "$(dirname "$0")/.."

failed=0
step() {
  printf '\n\033[1m== %s\033[0m\n' "$1"
}
verdict() {
  if [ "$1" -eq 0 ]; then
    printf '\033[32mok\033[0m\n'
  else
    printf '\033[31mCI would fail here\033[0m\n'
    failed=1
  fi
}

# silex-desktop compiles both of these into the binary. Without them the build
# stops on `the trait bound EditorAssets: Embed is not satisfied`, which says
# nothing about what is missing.
step "what silex-desktop needs to compile"
missing=0
for f in dist/client/index.html desktop/dashboard/dist/index.html; do
  [ -f "$f" ] || { echo "  $f is missing"; missing=1; }
done
if [ "$missing" -eq 0 ]; then
  echo "  both are there"
else
  echo "  run: pnpm install --frozen-lockfile --filter @silexlabs/silex --filter @silexlabs/silex-desktop-dashboard && pnpm build:desktop"
fi
verdict "$missing"
if [ "$missing" -ne 0 ]; then
  echo
  echo "Stopping: the rust steps below would all fail for this reason alone."
  exit 1
fi

step "cargo fmt --all --check"
if cargo fmt --all --check; then verdict 0; else verdict 1; fi

step "cargo check -p silex-server -p silex-desktop"
if cargo check -p silex-server -p silex-desktop; then verdict 0; else verdict 1; fi

# Informational in CI too: the lints that predate this are not enforced yet
step "cargo clippy -p silex-server -p silex-desktop (informational)"
cargo clippy -p silex-server -p silex-desktop || echo "  (not counted)"

step "cargo test -p silex-server -p silex-desktop"
if cargo test -p silex-server -p silex-desktop; then verdict 0; else verdict 1; fi

echo
if [ "$failed" -eq 0 ]; then
  printf '\033[32mCI should be green.\033[0m\n'
else
  printf '\033[31mCI would be red. Fix the steps marked above.\033[0m\n'
fi
exit "$failed"
