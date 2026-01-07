#!/bin/bash

# Script pour mettre à jour la palette de couleurs moderne 2025

# Change to repository root directory
cd "$(dirname "$0")/.." || exit 1

# Fichiers à modifier
FILES=(
  "packages/expression-input/src/styles.ts"
  "packages/grapesjs-data-source/src/view/settings.ts"
  "packages/grapesjs-advanced-selector/src/styles.ts"
  "packages/grapesjs-advanced-selector/src/components/complex-selector.ts"
  "packages/grapesjs-advanced-selector/src/components/simple-selector.ts"
  "packages/grapesjs-advanced-selector/src/components/compound-selector.ts"
  "packages/grapesjs-advanced-selector/src/components/inline-select.ts"
  "packages/grapesjs-advanced-selector/src/components/current-selector-display.ts"
  "packages/grapesjs-notifications/src/view.ts"
  "packages/grapesjs-fonts/src/fonts.js"
  "packages/silex-lib/src/css/dialog.scss"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Mise à jour de $file..."

    # Backgrounds
    sed -i 's/#0a0a0a/#111111/gi' "$file"
    sed -i 's/#1a1a1a/#181818/gi' "$file"
    sed -i 's/#2a2a2a/#1E1E1E/g' "$file"  # Attention: utilisé aussi pour bg-tertiary

    # Textes
    sed -i 's/#e4e4e7/#E5E5E5/gi' "$file"
    sed -i 's/#a1a1aa/#9CA3AF/gi' "$file"
    sed -i 's/#71717a/#6B7280/gi' "$file"

    # Accent cyan (old -> new)
    sed -i 's/#06b6d4/#00E5FF/gi' "$file"
    sed -i 's/rgba(6, 182, 212, 0\.3)/rgba(0, 229, 255, 0.25)/g' "$file"
    sed -i 's/rgba(6, 182, 212, 0\.1)/rgba(0, 229, 255, 0.08)/g' "$file"

    # Borders (attention à #2a2a2a qui est aussi bg-tertiary)
    sed -i 's/--color-border: #1E1E1E/--color-border: #2A2A2A/g' "$file"
    sed -i 's/#27272a/#2A2A2A/gi' "$file"
    sed -i 's/#3f3f46/#333333/gi' "$file"

    # Semantic colors
    sed -i 's/#ef4444/#DC2626/gi' "$file"
    sed -i 's/#10b981/#059669/gi' "$file"
    sed -i 's/#f59e0b/#D97706/gi' "$file"
    sed -i 's/#3b82f6/#2563EB/gi' "$file"

    # Remplacer color-accent-cyan par color-accent (nom cohérent)
    sed -i 's/--color-accent-cyan/--color-accent/g' "$file"
    sed -i 's/color-accent-cyan/color-accent/g' "$file"

  else
    echo "ATTENTION: $file n'existe pas!"
  fi
done

echo "✅ Mise à jour de la palette terminée!"
