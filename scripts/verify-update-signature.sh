#!/usr/bin/env bash
# Verify the published auto-update feed is signed by the key the app trusts.
#
# Usage:
#   ./scripts/verify-update-signature.sh [latest.json-url]
#
# Downloads the update feed + its Linux artifact and checks the signature against
# the pubkey embedded in tauri.conf.json — the same check the in-app updater runs
# before installing. A tampered artifact or a wrong key fails here.
# Requires: rsign (cargo install rsign2) or minisign, plus jq and curl.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
ENDPOINT="${1:-https://github.com/silexlabs/Silex/releases/latest/download/latest.json}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

grep -o '"pubkey": *"[^"]*"' desktop/src-tauri/tauri.conf.json \
  | sed 's/.*"pubkey": *"//;s/"//' | base64 -d > "$TMP/pub"

curl -sSL "$ENDPOINT" -o "$TMP/latest.json"
URL="$(jq -r '.platforms."linux-x86_64".url' "$TMP/latest.json")"
jq -r '.platforms."linux-x86_64".signature' "$TMP/latest.json" | base64 -d > "$TMP/art.sig"
echo "feed version: $(jq -r .version "$TMP/latest.json")"
echo "artifact:     $URL"
curl -sSL "$URL" -o "$TMP/art"

if command -v rsign >/dev/null; then
  rsign verify -p "$TMP/pub" -x "$TMP/art.sig" "$TMP/art"
elif command -v minisign >/dev/null; then
  minisign -Vm "$TMP/art" -p "$TMP/pub" -x "$TMP/art.sig"
else
  echo "need rsign (cargo install rsign2) or minisign" >&2; exit 2
fi
