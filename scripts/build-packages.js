#!/usr/bin/env node

/**
 * Builds packages in dependency order after yarn install
 * This ensures that packages requiring other packages' dist/ folders are built correctly
 * Uses scripts/sort-internal-deps.js to get the correct dependency order
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';

function getPackagesToBuild() {
  try {
    // Get dependency-sorted packages from sort-internal-deps.js
    const output = execSync('node scripts/sort-internal-deps.js', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    
    // Parse the output to get package names
    const packages = output
      .split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.replace('- ', '').trim())
      .filter(pkg => pkg.length > 0);
    
    return packages;
  } catch (error) {
    console.error('❌ Failed to get dependency order:', error.message);
    console.log('📦 Falling back to all packages...');
    
    // Fallback: get all packages from packages directory
    try {
      return readdirSync('packages', { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    } catch (fallbackError) {
      console.error('❌ Failed to list packages:', fallbackError.message);
      return [];
    }
  }
}

function buildPackage(packageName) {
  const packagePath = path.join('packages', packageName);
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${packageName} - package.json not found`);
    return;
  }

  // Yarn does not strip --if-present from the script args, so check manually.
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  if (!pkg.scripts || !pkg.scripts.build) {
    console.log(`⏭️  Skipping ${packageName} - no build script`)
    return
  }

  console.log(`🔨 Building ${packageName}...`)

  try {
    execSync('yarn run build', {
      cwd: packagePath,
      stdio: 'inherit',
    });
    console.log(`✅ ${packageName} built successfully`);
  } catch (error) {
    console.error(`❌ Failed to build ${packageName}:`, error.message);
    process.exit(1);
  }
}

console.log('📦 Building packages in dependency order...');

const packages = getPackagesToBuild();
console.log(`📋 Found ${packages.length} packages to build`);

for (const packageName of packages) {
  buildPackage(packageName);
}

console.log('🎉 Package build process completed');
