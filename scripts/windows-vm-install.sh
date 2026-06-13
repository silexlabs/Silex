#!/usr/bin/env bash
# Install Tauri build prerequisites on the Windows VM
# Usage: ./scripts/windows-vm-install.sh user@host password
#   or:  VM=user@host VM_PASS=password ./scripts/windows-vm-install.sh
set -euo pipefail

VM="${1:-${VM:-}}"
PASS="${2:-${VM_PASS:-}}"

if [ -z "$VM" ] || [ -z "$PASS" ]; then
  echo "Usage: $0 user@host password"
  echo "   or: VM=user@host VM_PASS=password $0"
  exit 1
fi

SSH="sshpass -p $PASS ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no"

run() { echo ">>> $1"; $SSH "$VM" "$1"; }

run "powershell -Command Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force"
run "winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements"
run "winget install Rustlang.Rustup --accept-source-agreements --accept-package-agreements"
run "winget install Microsoft.VisualStudio.2022.BuildTools --override \"--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended\" --accept-source-agreements --accept-package-agreements"

echo "Verifying..."
run "node -v && rustc -V && cargo -V"
echo "Done."
