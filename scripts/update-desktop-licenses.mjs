import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const packages = new Map()

// One text per file: the Apache text of a dual licensed crate is then shared with the others
function licenseTexts(dir) {
  return readdirSync(dir)
    .filter((file) => /^(licen[cs]e|copying|notice)([-._].*)?$/i.test(file) && statSync(join(dir, file)).isFile())
    .sort()
    .map((file) => readFileSync(join(dir, file), 'utf8').replace(/[ \t\r]+$/gm, '').trim())
}

function repositoryUrl(repository) {
  const url = typeof repository === 'string' ? repository : repository?.url
  if (!url) return ''
  return url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^(github:)?([\w.-]+\/[\w.-]+)$/, 'https://github.com/$2')
    .replace(/\.git$/, '')
}

function add(pkg) {
  const key = `${pkg.name}@${pkg.version}`
  if (!packages.has(key)) packages.set(key, pkg)
}

// JavaScript: what the dashboard depends on, and what the sources of the editor import,
// then the dependencies of these packages, found the way Node finds them
function findPackage(name, from) {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
    if (dir === dirname(dir)) return null
  }
}

function addJs(name, from) {
  const dir = findPackage(name, from)
  if (!dir) return
  const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  if (json.name.startsWith('@silexlabs/') || packages.has(`${json.name}@${json.version}`)) return
  add({
    name: json.name,
    version: json.version,
    license: json.license ?? json.licenses?.map((license) => license.type).join(' OR ') ?? '',
    repository: repositoryUrl(json.repository),
    texts: licenseTexts(dir),
  })
  for (const dependency of Object.keys({ ...json.dependencies, ...json.optionalDependencies })) addJs(dependency, dir)
}

const dashboard = join(root, 'desktop/dashboard')
for (const name of Object.keys(JSON.parse(readFileSync(join(dashboard, 'package.json'), 'utf8')).dependencies)) {
  addJs(name, dashboard)
}

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|js|scss|css)$/.test(entry.name) && !/(^|[._-])(test|spec)[._-]/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !/[/\\](test|tests|__tests__)[/\\]/.test(file))
}

const editorSources = [
  ...sources(join(root, 'editor')),
  ...sources(join(root, 'common')),
  ...readdirSync(join(root, 'grapesjs-plugins')).flatMap((plugin) => {
    const src = join(root, 'grapesjs-plugins', plugin, 'src')
    return existsSync(src) ? sources(src) : []
  }),
]
const builtins = new Set(builtinModules)
for (const file of editorSources) {
  const imports = readFileSync(file, 'utf8').matchAll(/^\s*(?:import|export|@use|@import)\b(?!\s+type\b)[^'"]*['"]([^'"./~][^'"]*)['"]/gm)
  for (const [, specifier] of imports) {
    const name = specifier.match(/^(@[^/]+\/[^/]+|[^/]+)/)[1]
    if (!builtins.has(name)) addJs(name, dirname(file))
  }
}
// Copied as is next to the editor by scripts/copy-assets.mjs
addJs('@fortawesome/fontawesome-free', root)

// Rust: the crates linked into the desktop binary, on every platform. Proc macros and build
// scripts run at compile time only.
const metadata = JSON.parse(
  execFileSync('cargo', ['metadata', '--locked', '--offline', '--format-version', '1'], { cwd: root, maxBuffer: 1 << 28 }),
)
const crates = new Map(metadata.packages.map((crate) => [crate.id, crate]))
const nodes = new Map(metadata.resolve.nodes.map((node) => [node.id, node]))
const workspace = new Set(metadata.workspace_members)
const seen = new Set()
const desktop = metadata.packages.find((crate) => crate.name === 'silex-desktop').id
const queue = [desktop]
while (queue.length) {
  const id = queue.pop()
  if (seen.has(id)) continue
  seen.add(id)
  const crate = crates.get(id)
  if (crate.targets.some((target) => target.kind.includes('proc-macro'))) continue
  if (!workspace.has(id)) {
    add({
      name: crate.name,
      version: crate.version,
      license: crate.license ?? '',
      repository: crate.repository ?? '',
      texts: licenseTexts(dirname(crate.manifest_path)),
    })
  }
  for (const dependency of nodes.get(id).deps) {
    if (dependency.dep_kinds.some((kind) => kind.kind === null)) queue.push(dependency.pkg)
  }
}

// Most packages share a few license texts: each distinct text is written once
const texts = []
const list = [...packages.values()]
  .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.version.localeCompare(b.version, 'en', { numeric: true }))
  .map(({ texts: own, ...pkg }) => ({
    ...pkg,
    texts: own.map((text) => {
      if (!texts.includes(text)) texts.push(text)
      return texts.indexOf(text)
    }),
  }))

const file = new URL('../desktop/dashboard/src/licenses.json', import.meta.url)
await writeFile(file, `${JSON.stringify({ packages: list, texts }, null, 1)}\n`)
console.log(`${list.length} packages and ${texts.length} license texts written to ${file.pathname}`)
