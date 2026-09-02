#!/usr/bin/env node
/**
 * Extracts translatable strings from `t(editor, '...')` call sites in
 * editor/**\/*.ts and `msg('...')` call sites in server/**\/*.ts, and merges
 * them into editor/src/locales/en-US.json as identity keys (English string
 * used as its own key, matching the project's i18n house style).
 *
 * Usage:
 *   node scripts/extract-i18n.js          Add missing keys, report unused ones
 *   node scripts/extract-i18n.js --prune  Also remove keys no longer referenced
 *   node scripts/extract-i18n.js --check  Fail (exit 1) if any key is missing,
 *                                         without writing anything
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import path from 'path'

const root = process.cwd()
const localeFile = path.join(root, 'editor', 'src', 'locales', 'en-US.json')

const checkMode = process.argv.includes('--check')
const pruneMode = process.argv.includes('--prune')

const STRING_LITERAL = '(`(?:[^`\\\\]|\\\\.)*`|\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")'
// First arg is always some way of referring to the editor instance:
// `editor`, `this.editor`, `config.getEditor()`, etc.
const EDITOR_ARG = '(?:[\\w.]+(?:\\([^()]*\\))?)'
const T_CALL_RE = new RegExp(`\\bt\\(\\s*${EDITOR_ARG}\\s*,\\s*${STRING_LITERAL}`, 'g')
const MSG_CALL_RE = new RegExp(`\\bmsg\\(\\s*${STRING_LITERAL}`, 'g')

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))
    .map(entry => path.join(entry.parentPath ?? entry.path, entry.name))
}

function unquote(raw) {
  const quote = raw[0]
  return raw.slice(1, -1).replace(/\\(.)/g, (_, c) => {
    if (c === 'n') return '\n'
    if (c === 't') return '\t'
    if (c === quote || c === '\\') return c
    return c
  })
}

function extractKeys(files, pattern) {
  const keys = new Set()
  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    for (const match of content.matchAll(pattern)) {
      keys.add(unquote(match[1]))
    }
  }
  return keys
}

const editorFiles = walk(path.join(root, 'editor'))
  .filter(f => !f.includes(`${path.sep}src${path.sep}locales${path.sep}`))
const serverFiles = walk(path.join(root, 'server'))

const foundKeys = new Set([
  ...extractKeys(editorFiles, T_CALL_RE),
  ...extractKeys(serverFiles, MSG_CALL_RE),
])

const existing = JSON.parse(readFileSync(localeFile, 'utf8'))
const existingKeys = new Set(Object.keys(existing))

const missing = [...foundKeys].filter(key => !existingKeys.has(key))
const unused = [...existingKeys].filter(key => !foundKeys.has(key))

if (checkMode) {
  if (missing.length) {
    console.error(`i18n:extract --check failed: ${missing.length} key(s) referenced in source but missing from en-US.json:`)
    missing.forEach(key => console.error(`  - ${JSON.stringify(key)}`))
    process.exit(1)
  }
  console.log('i18n:extract --check passed: en-US.json is in sync with source.')
  process.exit(0)
}

const result = { ...existing }
missing.forEach(key => { result[key] = key })
if (pruneMode) {
  unused.forEach(key => { delete result[key] })
}

const sorted = Object.fromEntries(Object.keys(result).sort().map(key => [key, result[key]]))
writeFileSync(localeFile, JSON.stringify(sorted, null, 2) + '\n')

console.log(`i18n:extract: ${missing.length} new key(s) added, ${unused.length} unused key(s) ${pruneMode ? 'pruned' : 'found (run with --prune to remove)'}.`)
if (unused.length && !pruneMode) {
  unused.forEach(key => console.log(`  - unused: ${JSON.stringify(key)}`))
}
