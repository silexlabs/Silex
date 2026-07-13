#!/usr/bin/env bash
# Deterministic build environment for Silex Desktop (Linux).
# Source it — don't execute. Used by CI and verify-reproducible.sh.
set -eu

: "${SOURCE_DATE_EPOCH:=$(git log -1 --pretty=%ct)}"
export SOURCE_DATE_EPOCH
export RUSTFLAGS="${RUSTFLAGS:-} --remap-path-prefix=${CARGO_HOME:-$HOME/.cargo}=/cargo --remap-path-prefix=${PWD}=/build"
export CARGO_INCREMENTAL=0
export CARGO_NET_LOCKED=true
export TZ=UTC
export LC_ALL=C.UTF-8
export APPIMAGE_EXTRACT_AND_RUN=1
