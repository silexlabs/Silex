#!/usr/bin/env bash
# Stop the Tauri dev process on the Windows VM
# Usage: ./scripts/windows-vm-stop.sh user@host password
#   or:  VM=user@host VM_PASS=password ./scripts/windows-vm-stop.sh
set -euo pipefail

VM="${1:-${VM:-}}"
PASS="${2:-${VM_PASS:-}}"

if [ -z "$VM" ] || [ -z "$PASS" ]; then
  echo "Usage: $0 user@host password"
  echo "   or: VM=user@host VM_PASS=password $0"
  exit 1
fi

SSH="sshpass -p $PASS ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no"

$SSH "$VM" "taskkill /IM silex-desktop.exe /F 2>nul & taskkill /IM cargo.exe /F 2>nul & taskkill /IM node.exe /F 2>nul & schtasks /delete /tn SilexDev /f 2>nul & exit /b 0"

echo "Stopped."
