const assert = require('assert')
const plugin = require('../dist/index.js')

const {
    addCapability,
    getCapability,
    getAllCapabilities,
    removeCapability,
    hasCapability,
    PLUGIN_ID,
} = plugin

function createEditor(commands = {}) {
    const listeners = {}
    return {
        Commands: {
            has(id) { return id in commands },
        },
        on(event, fn) { (listeners[event] = listeners[event] || []).push(fn) },
        trigger(event, ...args) { (listeners[event] || []).forEach(fn => fn(...args)) },
    }
}

function setup() {
    const editor = createEditor({ 'core:canvas-clear': true })
    plugin.default(editor)
    return editor
}

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

console.log('grapesjs-ai-capabilities unit tests\n')

test('PLUGIN_ID is exported', () => {
    assert.strictEqual(PLUGIN_ID, 'grapesjs-ai-capabilities')
})

test('register and retrieve a capability', () => {
    const editor = setup()
    const res = addCapability(editor, {
        id: 'clear',
        command: 'core:canvas-clear',
        description: 'Clear the canvas',
        tags: ['core'],
        title: 'Clear',
        version: '1.0',
    })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(res.capability.id, 'clear')
    assert.strictEqual(res.capability.title, 'Clear')

    const get = getCapability(editor, 'clear')
    assert.strictEqual(get.ok, true)
    assert.strictEqual(get.capability.description, 'Clear the canvas')
})

test('addCapability returns a copy', () => {
    const editor = setup()
    const res = addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd' })
    res.capability.id = 'mutated'
    assert.strictEqual(getCapability(editor, 'a').capability.id, 'a')
})

test('reject duplicate id', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd' })
    const res = addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(res.ok, false)
    assert(res.error.includes('already exists'))
})

test('replace with option', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'v1' })
    const res = addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'v2' }, { replace: true })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(res.capability.description, 'v2')
})

test('validation: missing id, command, description', () => {
    const editor = setup()
    assert.strictEqual(addCapability(editor, { command: 'x', description: 'y' }).ok, false)
    assert.strictEqual(addCapability(editor, { id: '', command: 'x', description: 'y' }).ok, false)
    assert.strictEqual(addCapability(editor, { id: 'a', description: 'y' }).ok, false)
    assert.strictEqual(addCapability(editor, { id: 'a', command: 'x' }).ok, false)
    assert.strictEqual(addCapability(editor, null).ok, false)
    assert.strictEqual(addCapability(editor).ok, false)
})

test('validation: tags, inputSchema, outputSchema types', () => {
    const editor = setup()
    assert(addCapability(editor, { id: 'a', command: 'x', description: 'y', tags: 'bad' }).error.includes('tags'))
    assert(addCapability(editor, { id: 'a', command: 'x', description: 'y', inputSchema: 'bad' }).error.includes('inputSchema'))
    assert(addCapability(editor, { id: 'a', command: 'x', description: 'y', outputSchema: [1] }).error.includes('outputSchema'))
})

test('prompt alias for description', () => {
    const editor = setup()
    const res = addCapability(editor, { id: 'p', command: 'core:canvas-clear', prompt: 'Do something' })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(res.capability.description, 'Do something')
})

test('optional fields omitted when not provided', () => {
    const editor = setup()
    const res = addCapability(editor, { id: 'min', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(res.capability.title, undefined)
    assert.strictEqual(res.capability.tags, undefined)
    assert.strictEqual(res.capability.version, undefined)
})

test('getCapability returns copy', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd' })
    const r = getCapability(editor, 'a')
    r.capability.id = 'mutated'
    assert.strictEqual(getCapability(editor, 'a').capability.id, 'a')
})

test('getCapability missing returns error', () => {
    const editor = setup()
    const r = getCapability(editor, 'nope')
    assert.strictEqual(r.ok, false)
    assert(r.error.includes('not found'))
})

test('getAllCapabilities returns all in order with count', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd1' })
    addCapability(editor, { id: 'b', command: 'core:canvas-clear', description: 'd2' })
    const res = getAllCapabilities(editor)
    assert.strictEqual(res.ok, true)
    assert.strictEqual(res.count, 2)
    assert.strictEqual(res.capabilities[0].id, 'a')
    assert.strictEqual(res.capabilities[1].id, 'b')
})

test('getAllCapabilities returns copies and is JSON-serializable', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd' })
    const res = getAllCapabilities(editor)
    res.capabilities[0].id = 'mutated'
    assert.strictEqual(getAllCapabilities(editor).capabilities[0].id, 'a')
    JSON.parse(JSON.stringify(res.capabilities))
})

test('getAllCapabilities filter by tags', () => {
    const editor = setup()
    addCapability(editor, { id: 'a', command: 'core:canvas-clear', description: 'd', tags: ['ui'] })
    addCapability(editor, { id: 'b', command: 'core:canvas-clear', description: 'd', tags: ['data'] })
    assert.strictEqual(getAllCapabilities(editor, { tags: ['ui'] }).count, 1)
    assert.strictEqual(getAllCapabilities(editor, { tags: ['nope'] }).count, 0)
    assert.strictEqual(getAllCapabilities(editor, {}).count, 2)
})

test('removeCapability', () => {
    const editor = setup()
    addCapability(editor, { id: 'x', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(removeCapability(editor, 'x').removed, true)
    assert.strictEqual(removeCapability(editor, 'x').removed, false)
    assert.strictEqual(getAllCapabilities(editor).count, 0)
})

test('hasCapability', () => {
    const editor = setup()
    addCapability(editor, { id: 'h', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(hasCapability(editor, 'h'), true)
    assert.strictEqual(hasCapability(editor, 'nope'), false)
    assert.strictEqual(hasCapability({}, 'h'), false)
})

test('late-binding warns but succeeds', () => {
    const editor = setup()
    const res = addCapability(editor, { id: 'late', command: 'future:cmd', description: 'd' })
    assert.strictEqual(res.ok, true)
    assert(Array.isArray(res.warnings))
    assert(res.warnings[0].includes('not found'))
})

test('no warnings when command exists', () => {
    const editor = setup()
    const res = addCapability(editor, { id: 'ok', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(res.warnings, undefined)
})

test('triggers ai-capabilities:ready on load with addCapability', () => {
    const editor = setup()
    let received = null
    editor.on('ai-capabilities:ready', (fn) => { received = fn })
    editor.trigger('load')
    assert.strictEqual(typeof received, 'function')
    // The received function should be addCapability
    const res = received(editor, { id: 'via-event', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(getCapability(editor, 'via-event').ok, true)
})

test('uninitialized editor returns error', () => {
    const fake = {}
    assert.strictEqual(addCapability(fake, { id: 'x', command: 'y', description: 'z' }).ok, false)
    assert.strictEqual(getCapability(fake, 'x').ok, false)
    assert.strictEqual(getAllCapabilities(fake).ok, false)
    assert.strictEqual(removeCapability(fake, 'x').ok, false)
    assert.strictEqual(hasCapability(fake, 'x'), false)
})

console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
process.exit(passed === total ? 0 : 1)
