import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/^(github:)?([\w.-]+\/[\w.-]+)$/, 'https://github.com/$2')
    .replace(/\.git$/, '')
}

function add(pkg) {
  const key = `${pkg.name}@${pkg.version}`
  if (!packages.has(key)) packages.set(key, pkg)
}

// JavaScript: the packages the dashboard depends on, and those the sources of the editor import,
// with their dependencies as pnpm-lock.yaml resolves them. The texts are read from the install of
// the desktop build.
function lockedTree(filter) {
  const [project] = JSON.parse(
    execFileSync('pnpm', ['ls', '--lockfile-only', '--json', '--prod', '--no-optional', '--depth', 'Infinity', '--filter', filter], {
      cwd: root,
      maxBuffer: 1 << 28,
    }),
  )
  return project.dependencies ?? {}
}

// pnpm lists the dependencies of a package once, where it first meets it
const locked = new Map()
function index(dependencies) {
  for (const [name, node] of Object.entries(dependencies)) {
    const key = `${name}@${node.version}`
    if (!locked.has(key) || (node.dependencies && !locked.get(key).dependencies)) locked.set(key, { name, ...node })
    index(node.dependencies ?? {})
  }
}

function addJs(name, node) {
  const key = `${name}@${node.version}`
  if (name.startsWith('@silexlabs/') || packages.has(key)) return
  if (!existsSync(join(node.path, 'package.json'))) {
    throw new Error(`${key} is not installed, run: pnpm install --frozen-lockfile --filter @silexlabs/silex --filter @silexlabs/silex-desktop-dashboard`)
  }
  const json = JSON.parse(readFileSync(join(node.path, 'package.json'), 'utf8'))
  add({
    name,
    version: node.version,
    license: json.license ?? json.licenses?.map((license) => license.type).join(' OR ') ?? '',
    repository: repositoryUrl(json.repository),
    texts: licenseTexts(node.path),
  })
  for (const [dependency, { version }] of Object.entries(locked.get(key).dependencies ?? {})) {
    addJs(dependency, locked.get(`${dependency}@${version}`))
  }
}

const dashboard = lockedTree('@silexlabs/silex-desktop-dashboard')
const editor = lockedTree('@silexlabs/silex')
index(dashboard)
index(editor)
for (const [name, node] of Object.entries(dashboard)) addJs(name, node)

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|js|scss|css)$/.test(entry.name) && !/(^|[._-])(test|spec)[._-]/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !/[/\\](test|tests|__tests__)[/\\]/.test(file))
}

// Webpack resolves every bare import of the editor from the root node_modules: a direct dependency
// of the root package, or the only version of a package that one of them brings
function editorPackage(name) {
  if (editor[name]) return editor[name]
  const versions = [...locked.values()].filter((node) => node.name === name)
  if (versions.length > 1) throw new Error(`the editor imports ${name}, locked in several versions: add it to the root package.json`)
  return versions[0]
}

const editorSources = [
  ...sources(join(root, 'editor')),
  ...sources(join(root, 'common')),
  ...readdirSync(join(root, 'grapesjs-plugins')).flatMap((plugin) => {
    const src = join(root, 'grapesjs-plugins', plugin, 'src')
    return existsSync(src) ? sources(src) : []
  }),
]
const imports = [
  /^\s*(?:import|export)\s+(?!type\b)[^'";]*?\bfrom\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*['"]([^'"]+)['"]/gm,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
]
// Sass also finds a partial of the same folder by a bare name
const styleImports = /^\s*@(?:use|import)\s+['"]([^'"]+)['"]/gm
const builtins = new Set(builtinModules)
for (const file of editorSources) {
  const code = readFileSync(file, 'utf8')
  const specifiers = /\.s?css$/.test(file)
    ? [...code.matchAll(styleImports)].map(([, specifier]) => [specifier, false])
    : imports.flatMap((pattern) => [...code.matchAll(pattern)].map(([, specifier]) => [specifier, true]))
  for (const [specifier, required] of specifiers) {
    if (/^[./~]|^node:|^https?:/.test(specifier)) continue
    const name = specifier.match(/^(@[^/]+\/[^/]+|[^/]+)/)[1]
    if (builtins.has(name) || name.startsWith('@silexlabs/')) continue
    const node = editorPackage(name)
    if (node) addJs(name, node)
    else if (required) throw new Error(`${file} imports ${name}, which the root package does not depend on`)
  }
}
// Copied as is next to the editor by scripts/copy-assets.mjs
addJs('@fortawesome/fontawesome-free', editor['@fortawesome/fontawesome-free'])

// Rust: the crates linked into the desktop binary, on every platform. Proc macros and build
// scripts run at compile time only.
const metadata = JSON.parse(
  execFileSync('cargo', ['metadata', '--locked', '--format-version', '1'], { cwd: root, maxBuffer: 1 << 28 }),
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

// Not a package: the desktop draws this logo next to the host of a website, and its license asks for the credit
add({
  name: 'Forgejo logo',
  version: '',
  license: 'CC-BY-SA-4.0',
  repository: 'https://codeberg.org/forgejo/meta/src/branch/readme/branding',
  texts: ['The Forgejo logo was created by Caesar Schinas and is licensed under the Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) license: https://creativecommons.org/licenses/by-sa/4.0/\n\nSilex Desktop draws it without its holes.'],
})

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
