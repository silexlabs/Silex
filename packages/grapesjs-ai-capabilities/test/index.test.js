const assert = require('assert')
const plugin = require('../dist/index.js')

const {
    addCapability,
    getCapability,
    getAllCapabilities,
    removeCapability,
    hasCapability,
    clearCapabilities,
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
    clearCapabilities()
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
    const cap = addCapability({
        id: 'clear',
        command: 'core:canvas-clear',
        description: 'Clear the canvas',
        tags: ['core'],
        title: 'Clear',
        version: '1.0',
    })
    assert.strictEqual(cap.id, 'clear')
    assert.strictEqual(cap.title, 'Clear')

    const get = getCapability('clear')
    assert.strictEqual(get.description, 'Clear the canvas')
})

test('addCapability returns a copy', () => {
    const editor = setup()
    const cap = addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd' })
    cap.id = 'mutated'
    assert.strictEqual(getCapability('a').id, 'a')
})

test('reject duplicate id', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd' })
    assert.throws(
        () => addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd' }),
        /already exists/
    )
})

test('replace with option', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'v1' })
    const cap = addCapability({ id: 'a', command: 'core:canvas-clear', description: 'v2' }, { replace: true })
    assert.strictEqual(cap.description, 'v2')
})

test('validation: missing id, command, description', () => {
    const editor = setup()
    assert.throws(() => addCapability({ command: 'x', description: 'y' }), /id/)
    assert.throws(() => addCapability({ id: '', command: 'x', description: 'y' }), /id/)
    assert.throws(() => addCapability({ id: 'a', description: 'y' }), /command/)
    assert.throws(() => addCapability({ id: 'a', command: 'x' }), /description/)
    assert.throws(() => addCapability(null))
    assert.throws(() => addCapability(editor))
})

test('validation: tags, inputSchema, outputSchema types', () => {
    const editor = setup()
    assert.throws(() => addCapability({ id: 'a', command: 'x', description: 'y', tags: 'bad' }), /tags/)
    assert.throws(() => addCapability({ id: 'a', command: 'x', description: 'y', inputSchema: 'bad' }), /inputSchema/)
    assert.throws(() => addCapability({ id: 'a', command: 'x', description: 'y', outputSchema: [1] }), /outputSchema/)
})

test('prompt alias for description', () => {
    const editor = setup()
    const cap = addCapability({ id: 'p', command: 'core:canvas-clear', prompt: 'Do something' })
    assert.strictEqual(cap.description, 'Do something')
})

test('optional fields omitted when not provided', () => {
    const editor = setup()
    const cap = addCapability({ id: 'min', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(cap.title, undefined)
    assert.strictEqual(cap.tags, undefined)
    assert.strictEqual(cap.version, undefined)
})

test('getCapability returns copy', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd' })
    const r = getCapability('a')
    r.id = 'mutated'
    assert.strictEqual(getCapability('a').id, 'a')
})

test('getCapability missing throws', () => {
    setup()
    assert.throws(() => getCapability('nope'), /not found/)
})

test('getAllCapabilities returns all in order', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd1' })
    addCapability({ id: 'b', command: 'core:canvas-clear', description: 'd2' })
    const caps = getAllCapabilities()
    assert.strictEqual(caps.length, 2)
    assert.strictEqual(caps[0].id, 'a')
    assert.strictEqual(caps[1].id, 'b')
})

test('getAllCapabilities returns copies and is JSON-serializable', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd' })
    const caps = getAllCapabilities()
    caps[0].id = 'mutated'
    assert.strictEqual(getAllCapabilities()[0].id, 'a')
    JSON.parse(JSON.stringify(caps))
})

test('getAllCapabilities filter by tags', () => {
    const editor = setup()
    addCapability({ id: 'a', command: 'core:canvas-clear', description: 'd', tags: ['ui'] })
    addCapability({ id: 'b', command: 'core:canvas-clear', description: 'd', tags: ['data'] })
    assert.strictEqual(getAllCapabilities({ tags: ['ui'] }).length, 1)
    assert.strictEqual(getAllCapabilities({ tags: ['nope'] }).length, 0)
    assert.strictEqual(getAllCapabilities({}).length, 2)
})

test('removeCapability', () => {
    const editor = setup()
    addCapability({ id: 'x', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(removeCapability('x'), true)
    assert.strictEqual(removeCapability('x'), false)
    assert.strictEqual(getAllCapabilities().length, 0)
})

test('hasCapability', () => {
    const editor = setup()
    addCapability({ id: 'h', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(hasCapability('h'), true)
    assert.strictEqual(hasCapability('nope'), false)
})

test('late-binding warns but succeeds', () => {
    const editor = setup()
    const cap = addCapability({ id: 'late', command: 'future:cmd', description: 'd' })
    assert.strictEqual(cap.id, 'late')
})

test('triggers ai-capabilities:ready on load with addCapability', () => {
    const editor = setup()
    let received = null
    editor.on('ai-capabilities:ready', (fn) => { received = fn })
    editor.trigger('load')
    assert.strictEqual(typeof received, 'function')
    const cap = received({ id: 'via-event', command: 'core:canvas-clear', description: 'd' })
    assert.strictEqual(cap.id, 'via-event')
    assert.strictEqual(getCapability('via-event').id, 'via-event')
})

console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
process.exit(passed === total ? 0 : 1)
