#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { DepGraph } from 'dependency-graph';
import glob from 'glob';

// Ce script est utilisé pour trier les dépendances internes des packages dans le monorepo.
// Il génère un graphe de dépendances et effectue un tri topologique pour afficher l'ordre des packages.
// Il peut également filtrer les packages sans dépendances internes et afficher les dépendances internes si nécessaire.
function usage() {
  console.log('Usage: ./scripts/sort-internal-deps.js [options] [package-name]');
  console.log('Options:');
  console.log('  --help, -h                Show this help message');
  console.log('  --hide-empty              Hide packages without internal dependencies');
  console.log('  --show-internal-deps      Show internal dependencies');
  console.log('  [package-name]           Display the dependencies of a specific package');
  console.log('Examples:');
  console.log('  ./scripts/sort-internal-deps.js');
  console.log('  ./scripts/sort-internal-deps.js --hide-empty');
  console.log('  ./scripts/sort-internal-deps.js --show-internal-deps');
  console.log('  ./scripts/sort-internal-deps.js @silexlabs/silex');
  console.log('  ./scripts/sort-internal-deps.js @silexlabs/silex --hide-empty');
  process.exit(0);
}

console.log('Display internal dependencies of packages in the monorepo sorted by dependency order');

// Usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  usage();
}

// Récup du flag pour cacher les packages qui n'ont pas de dépendances internes
const hideEmpty = process.argv.includes('--hide-empty');
if (hideEmpty) {
  console.log('Hiding packages without internal dependencies');
}

// Flag pour afficher les dépendances internes
const showInternalDeps = process.argv.includes('--show-internal-deps');
if (showInternalDeps) {
  console.log('Showing internal dependencies');
}

// Trouver l'argument non positionnel
const nonPositionalArgs = process.argv.filter(arg => !arg.startsWith('-') && !arg.startsWith('/'));
if (nonPositionalArgs.length > 0) {
  const pkgName = nonPositionalArgs[0];
  if (pkgName) {
    console.log(`Displaying dependencies for package: ${pkgName}`);
  }
}

// Étape 1 : trouver tous les packages internes valides
const basePath = path.resolve(__dirname, '../packages');
const packagePaths = glob.sync(`${basePath}/**/package.json`, {
  ignore: '**/node_modules/**',
});

const internalPackages = {};

for (const pkgPath of packagePaths) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const isInternal = pkgPath.match(/\/packages\//) && pkgPath.match(/\/packages\/[^/]+\/package.json$/);
  if (pkg.name && isInternal) {
    internalPackages[pkg.name] = pkgPath;
  }
}

// Étape 2 : construire le graphe
const graph = new DepGraph();

Object.keys(internalPackages).forEach(pkgName => graph.addNode(pkgName));

for (const [pkgName, pkgPath] of Object.entries(internalPackages)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };

  for (const depName of Object.keys(deps || {})) {
    if (internalPackages[depName]) {
      graph.addDependency(pkgName, depName);
    }
  }
}

// Étape 3 : tri topologique
try {
  if (nonPositionalArgs.length > 0) {
    if (showInternalDeps) {
      console.error(`Not implemented: cannot show internal dependencies for a specific package's dependencies`);
      process.exit(1);
    }

    const pkgName = nonPositionalArgs[0];
    const pkgPath = internalPackages[pkgName];
    if (!pkgPath) {
      console.error(`Package ${pkgName} not found`);
      process.exit(1);
    }
    const deps = graph.dependenciesOf(pkgName);
    const filteredDeps = deps.filter(dep => internalPackages[dep]);

    if (hideEmpty) {
      const filteredSortedDeps = filteredDeps.filter(dep => graph.directDependenciesOf(dep).length > 0);
      console.log(`Dependencies of ${pkgName}:\n- ${filteredSortedDeps.join('\n- ')}`);
    } else {
      console.log(`Dependencies of ${pkgName}:\n- ${filteredDeps.join('\n- ')}`);
    }

    if (filteredDeps.length === 0) {
      console.log(`No dependencies found for ${pkgName}`);
    }
  } else {
    const ordered = graph.overallOrder();
    ordered.forEach((pkg, i) => {
      const deps = graph.directDependenciesOf(pkg);
      if (!hideEmpty || deps.length > 0) {
        const name = internalPackages[pkg]
          .replace(/.*\/packages\//, '')
          .replace(/\/package.json$/, '');

        if (showInternalDeps) {
          console.log(`- ${pkg}\n${deps.map(dep => `  | ${dep}\n`).join('')}`);
        } else {
          console.log(`- ${name}`);
        }
      }
    });
  }
} catch (err) {
  console.error('\n⛔️ Dependency cycle detected among internal packages:');
  if (err.cyclePath) {
    console.error(' → ' + err.cyclePath.join(' → '));
  } else {
    console.error(err);
  }
  process.exit(1);
}
