const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { getSelectionState } = require('./desktop-bridge.js')

const source = fs.readFileSync(path.join(__dirname, 'desktop-bridge.js'), 'utf8')

let passed = 0
let total = 0

function test(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  PASS  ${name}`)
  } catch (err) {
    console.error(`  FAIL  ${name}`)
    console.error(`        ${err.message}`)
  }
}

function mockEditor({ page = 'index', component = null, selector = '.hero' } = {}) {
  return {
    Devices: { getSelected: () => ({ get: () => 'Desktop', id: 'desktop' }) },
    Pages: { getSelected: () => (page ? { get: () => page, id: 'p1' } : null) },
    getSelected: () => component,
    StyleManager: { getSelected: () => (selector ? { selectorsToString: () => selector } : null) },
  }
}

console.log('desktop-bridge MCP helpers\n')

test('warnings name real MCP tools, not page(action:\'select\')', () => {
  assert.doesNotMatch(source, /page\(action:'select'\)/)
  assert.doesNotMatch(source, /component\(action:'select'\)/)
  assert.doesNotMatch(source, /selector\(action:'select'\)/)
  assert.doesNotMatch(source, /style\(action:'set'\)/)
  assert.match(source, /pages_select/)
  assert.match(source, /components_select/)
  assert.match(source, /selector_set/)
  assert.match(source, /styles_set/)
})

test('selection reports getId() so components_select can use it', () => {
  const sel = { ccid: 'c42', getId: () => 'hero' }
  const state = getSelectionState(mockEditor({ component: sel }))
  assert.strictEqual(state.component, 'hero')
})

test('selection falls back to ccid when getId is missing', () => {
  const state = getSelectionState(mockEditor({ component: { ccid: 'c42' } }))
  assert.strictEqual(state.component, 'c42')
})

test('warnings cite pages_select / components_select / selector_set / styles_set', () => {
  const state = getSelectionState(mockEditor({ page: null, component: null, selector: null }))
  assert.ok(state.warnings.some(w => w.includes('pages_select')))
  assert.ok(state.warnings.some(w => w.includes('components_select')))
  assert.ok(state.warnings.some(w => w.includes('selector_set') && w.includes('styles_set')))
})

console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
process.exit(passed === total ? 0 : 1)
