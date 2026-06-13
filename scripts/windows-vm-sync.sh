#!/usr/bin/env bash
# Sync Silex packages to the Windows VM (incremental, sends only changed files)
# Deletions are not synced — use --all for a full sync
# Usage: ./scripts/windows-vm-sync.sh user@host password [--all]
#   or:  VM=user@host VM_PASS=password ./scripts/windows-vm-sync.sh [--all]
set -euo pipefail

VM="${1:-${VM:-}}"
PASS="${2:-${VM_PASS:-}}"

if [ -z "$VM" ] || [ -z "$PASS" ]; then
  echo "Usage: $0 user@host password [--all]"
  echo "   or: VM=user@host VM_PASS=password $0 [--all]"
  exit 1
fi

# Silex monorepo root (two levels up from this script)
SRC="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="C:\\Users\\admin\\Silex"
SSH="sshpass -p $PASS ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no"
STAMP="$SRC/.last-win-sync"

# Build silex-lib client first
echo "Building silex-lib client..."
(cd "$SRC/packages/silex-lib" && npm run build:client:debug)

# We only need these packages on the VM
INCLUDES=(
  packages/silex-desktop
  packages/silex-server
  packages/silex-lib/dist/client
  packages/silex_silex-dashboard-2026/public
)

EXCLUDES=(
  --exclude=.git --exclude=node_modules --exclude=target
  --exclude=.DS_Store --exclude=.claude --exclude=.last-win-sync
)

# Ensure destination exists
$SSH "$VM" "if not exist $DEST mkdir $DEST"

if [ "${3:-}" = "--all" ] || [ ! -f "$STAMP" ]; then
  for pkg in "${INCLUDES[@]}"; do
    [ -d "$SRC/$pkg" ] || continue
    tar cf - -C "$SRC" "${EXCLUDES[@]}" "$pkg" | $SSH "$VM" "cd $DEST && tar xf -"
  done
  echo "Full sync to $VM:$DEST"
else
  SINCE=$(date -r "$STAMP" "+%Y-%m-%d %H:%M:%S")
  for pkg in "${INCLUDES[@]}"; do
    [ -d "$SRC/$pkg" ] || continue
    tar cf - -C "$SRC" "${EXCLUDES[@]}" --newer="$SINCE" "$pkg" 2>/dev/null | $SSH "$VM" "cd $DEST && tar xf -"
  done
  echo "Incremental sync to $VM:$DEST (changed since $SINCE)"
fi

touch "$STAMP"
