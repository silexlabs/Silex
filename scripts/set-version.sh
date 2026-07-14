#!/usr/bin/env bash
# Stamp a version into every file that carries one (repo commits 0.0.0-dev).
set -euo pipefail

V="${1:?usage: set-version.sh X.Y.Z[-suffix]}"
cd "$(git rev-parse --show-toplevel)"

for f in package.json desktop/package.json desktop/src-tauri/tauri.conf.json; do
  jq --arg v "$V" '.version = $v' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done

echo "version set to $V"
