#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const currentScript = process.argv[1];
const scriptDir = path.dirname(currentScript);
const baseDir = path.join(scriptDir, '..', 'packages');
const packages = fs.readdirSync(baseDir);

// Étape 1 : lecture des versions et dépendances
const versions = {};
const graph = {};

for (const pkg of packages) {
  const pkgPath = path.join(baseDir, pkg, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const name = pkgJson.name;
  const deps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };

  versions[name] = pkgJson.version;

  graph[name] = Object.keys(deps).filter((dep) => dep.startsWith('@silexlabs/'));
}

// Étape 2 : vérification des versions incohérentes
let hasError = false;

for (const [pkgName, deps] of Object.entries(graph)) {
  // Trouver le dossier correspondant au nom du package
  const matchingDir = packages.find((dir) => {
    const fullPath = path.join(baseDir, dir, 'package.json');
    if (!fs.existsSync(fullPath)) return false;
    const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return json.name === pkgName;
  });

  if (!matchingDir) {
    console.error(`⚠️ Cannot find directory for ${pkgName}`);
    hasError = true;
    continue;
  }

  const pkgPath = path.join(baseDir, matchingDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const allDeps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };

  for (const depName of graph[pkgName]) {
    const expected = versions[depName];
    const actual = allDeps[depName];
    if (actual !== expected) {
      console.log(`❌ ${pkgName} depends on ${depName}@${actual}, but current version is ${expected}`);
      hasError = true;
    }
  }
}

// Étape 3 : détection de cycles (DFS)
const visited = new Set();
const stack = new Set();

function detectCycle(pkg) {
  if (stack.has(pkg)) {
    console.log(`🔁 Circular dependency detected: ${[...stack, pkg].join(' → ')}`);
    hasError = true;
    return;
  }
  if (visited.has(pkg)) return;

  visited.add(pkg);
  stack.add(pkg);

  for (const dep of graph[pkg] || []) {
    detectCycle(dep);
  }

  stack.delete(pkg);
}

for (const pkg of Object.keys(graph)) {
  detectCycle(pkg);
}

if (!hasError) {
  console.log('✅ All internal dependencies are valid and no cycles detected.');
  process.exit(0);
} else {
  process.exit(1);
}
