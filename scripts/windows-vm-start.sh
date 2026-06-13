#!/usr/bin/env bash
# Launch npm run tauri dev on the Windows VM desktop
# Usage: ./scripts/windows-vm-start.sh user@host password
#   or:  VM=user@host VM_PASS=password ./scripts/windows-vm-start.sh
set -euo pipefail

VM="${1:-${VM:-}}"
PASS="${2:-${VM_PASS:-}}"

if [ -z "$VM" ] || [ -z "$PASS" ]; then
  echo "Usage: $0 user@host password"
  echo "   or: VM=user@host VM_PASS=password $0"
  exit 1
fi

DEST="C:\\Users\\admin\\Silex\\packages\\silex-desktop"
SSH="sshpass -p $PASS ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no"

# Install npm deps (skip lifecycle scripts that require yarn)
$SSH "$VM" "cd $DEST && npm install --ignore-scripts"

# Write batch file
$SSH "$VM" "( echo @echo off& echo set RUST_LOG=silex_desktop=debug& echo cd /d $DEST& echo npm run dev ^> C:\Users\admin\silex-dev.log 2^>^&1& echo if errorlevel 1 pause ) > C:\Users\admin\run-silex.bat"

# Clear old log, run in interactive desktop session via scheduled task, then tail log
$SSH "$VM" "type nul > C:\\Users\\admin\\silex-dev.log 2>nul & schtasks /delete /tn SilexDev /f 2>nul & schtasks /create /tn SilexDev /tr C:\\Users\\admin\\run-silex.bat /sc once /st 00:00 /f /rl highest /it && schtasks /run /tn SilexDev"

echo "App launching on VM desktop. Tailing logs (Ctrl+C to stop)..."
$SSH "$VM" "powershell -Command Get-Content C:\\Users\\admin\\silex-dev.log -Wait"
