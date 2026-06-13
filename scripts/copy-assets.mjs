#!/usr/bin/env node
/**
 * Copies static assets into dist/client/ (public/, Font Awesome, @fontsource/ubuntu).
 * Replaces the former build:public/build:vendor shell scripts that broke on Windows
 * cmd.exe (Unix cp/mkdir, backtick substitution and globbing).
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'fs-extra'

const require = createRequire(import.meta.url)
const nodeModulesPath = require('node_modules-path')

const root = process.cwd()
const dist = path.join(root, 'dist', 'client')

const fontawesome = path.join(nodeModulesPath('@fortawesome'), '@fortawesome', 'fontawesome-free')
const fontsourceUbuntu = path.join(nodeModulesPath('@fontsource'), '@fontsource', 'ubuntu')

async function main() {
  await fs.copy(path.join(root, 'public'), dist)

  await fs.copy(path.join(fontawesome, 'css', 'all.min.css'), path.join(dist, 'css', 'all.min.css'))
  await fs.copy(path.join(fontawesome, 'webfonts'), path.join(dist, 'webfonts'))

  const filesSrc = path.join(fontsourceUbuntu, 'files')
  const filesDest = path.join(dist, 'css', 'files')
  await fs.ensureDir(filesDest)
  const entries = await fs.readdir(filesSrc)
  await Promise.all(
    entries
      .filter(name => name.startsWith('ubuntu-latin-'))
      .map(name => fs.copy(path.join(filesSrc, name), path.join(filesDest, name)))
  )
}

main().then(
  () => console.log('Copied public + vendor assets to dist/client/'),
  err => {
    console.error(err)
    process.exit(1)
  }
)
