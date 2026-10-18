#!/usr/bin/env bash
# Deterministic build environment for Silex Desktop (Linux).
# Source it — don't execute. Used by verify.Dockerfile, desktop.yml and build-desktop-repro.sh.
set -eu

: "${SOURCE_DATE_EPOCH:=$(git log -1 --pretty=%ct)}"
export SOURCE_DATE_EPOCH
export RUSTFLAGS="${RUSTFLAGS:-} --remap-path-prefix=${CARGO_HOME:-$HOME/.cargo}=/cargo --remap-path-prefix=${PWD}=/build"
export CARGO_INCREMENTAL=0
export CARGO_NET_LOCKED=true
export TZ=UTC
export LC_ALL=C.UTF-8
export APPIMAGE_EXTRACT_AND_RUN=1

# rust-embed bakes the mtimes of the files it embeds into the binary, and a checkout sets them to
# the time of the checkout. Run once the editor and the dashboard are built.
pin_embedded_mtimes() {
  for dir in dist/client desktop/dashboard/dist; do
    find "$dir" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +
  done
}
