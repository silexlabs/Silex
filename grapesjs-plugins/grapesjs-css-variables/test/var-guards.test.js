const assert = require('assert')
const { pathToFileURL } = require('url')
const path = require('path')

async function load() {
  return import(pathToFileURL(path.join(__dirname, '../src/var-guards.js')).href)
}

function test(name, fn) {
  return fn().then(() => {
    console.log(`  PASS  ${name}`)
    return true
  }).catch(err => {
    console.error(`  FAIL  ${name}`)
    console.error(`        ${err.message}`)
    return false
  })
}

async function main() {
  const {
    formatVariableList,
    requireExistingVariable,
    requireRenameTarget,
    requireCompatibleType,
  } = await load()

  let passed = 0
  let total = 0

  async function run(name, fn) {
    total++
    if (await test(name, async () => fn())) passed++
  }

  const order = [
    { name: 'primary', type: 'color' },
    { name: 'heading', type: 'size' },
  ]

  console.log('grapesjs-css-variables var-guards unit tests\n')

  await run('requireExistingVariable rejects unknown names and lists valid ones', () => {
    assert.throws(
      () => requireExistingVariable('missing', order),
      /CSS variable "missing" does not exist\. Existing variables: primary \(color\), heading \(size\)/
    )
  })

  await run('requireExistingVariable accepts a known name', () => {
    requireExistingVariable('primary', order)
  })

  await run('requireRenameTarget rejects overwrite of an existing newName', () => {
    assert.throws(
      () => requireRenameTarget('primary', 'heading', order),
      /Cannot rename "primary" to "heading": a variable named "heading" already exists/
    )
  })

  await run('requireRenameTarget rejects an unknown oldName', () => {
    assert.throws(
      () => requireRenameTarget('ghost', 'brand', order),
      /CSS variable "ghost" does not exist/
    )
  })

  await run('requireRenameTarget allows a free newName', () => {
    requireRenameTarget('primary', 'brand', order)
  })

  await run('requireCompatibleType throws when set would ignore a new type', () => {
    assert.throws(
      () => requireCompatibleType('primary', 'size', order),
      /already exists with type color[\s\S]*requested type "size" was not applied/
    )
  })

  await run('requireCompatibleType allows the existing type and a new name', () => {
    assert.strictEqual(requireCompatibleType('primary', 'color', order).name, 'primary')
    assert.strictEqual(requireCompatibleType('brand', 'color', order), null)
  })

  await run('empty list is reported as (none)', () => {
    assert.strictEqual(formatVariableList([]), '(none)')
    assert.throws(
      () => requireExistingVariable('primary', []),
      /Existing variables: \(none\)/
    )
  })

  console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
  process.exit(passed === total ? 0 : 1)
}

main()
