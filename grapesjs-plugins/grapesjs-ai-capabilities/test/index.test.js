const assert = require('assert')
const plugin = require('../dist/index.js')

const {
    addCapability,
    getCapability,
    getAllCapabilities,
    removeCapability,
    hasCapability,
    getTools,
    describeTool,
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

const cap = (tool, action, extra = {}) => ({ tool, action, command: 'core:canvas-clear', description: `${action} it`, ...extra })

test('a capability is keyed by its tool and action', () => {
    setup()
    addCapability(cap('page', 'list'))
    assert.strictEqual(getCapability('page.list').command, 'core:canvas-clear')
    assert.throws(() => addCapability(cap('page', 'list')), /already exists/)
    assert.throws(() => addCapability(cap('page', 'list:all')), /action/)
    assert.throws(() => addCapability(cap('Page', 'list')), /tool/)
    assert.throws(() => addCapability(cap('page', 'add', { inputSchema: { properties: { action: { type: 'string' } } } })), /action/)
})

test('getTools merges the actions of a family into one flat schema', () => {
    setup()
    describeTool('page', 'Pages of the website.')
    addCapability(cap('page', 'list', { readOnly: true }))
    addCapability(cap('page', 'select', { inputSchema: { required: ['page_id'], properties: { page_id: { type: 'string', description: 'Page id' } } } }))
    addCapability(cap('page', 'delete', { destructive: true, inputSchema: { properties: { page_id: { type: 'string', description: 'Page id' } } } }))
    addCapability(cap('page', 'add', { openWorld: true, inputSchema: { properties: { name: { type: 'string' } } } }))
    addCapability(cap('device', 'list', { readOnly: true }))
    const [page, device] = getTools()
    assert.strictEqual(page.name, 'page')
    assert.strictEqual(page.description, 'Pages of the website.')
    assert.deepStrictEqual(page.inputSchema.required, ['action'])
    assert.deepStrictEqual(page.inputSchema.properties.action.enum, ['list', 'select', 'delete', 'add'])
    assert.strictEqual(page.inputSchema.properties.action.description, 'list: list it select: select it delete: delete it add: add it')
    assert.strictEqual(page.inputSchema.properties.page_id.description, 'select/delete: Page id')
    assert.strictEqual(page.inputSchema.properties.name.description, 'used by add')
    assert.deepStrictEqual(page.actions.select, { command: 'core:canvas-clear', parameters: ['page_id'], required: ['page_id'], openWorld: false })
    assert.deepStrictEqual([page.readOnly, page.destructive, page.openWorld], [false, true, true])
    assert.deepStrictEqual([device.readOnly, device.destructive, device.description], [true, false, 'Actions: list.'])
    JSON.parse(JSON.stringify(getTools()))
})

test('getTools keeps the description of a parameter that every action reads the same way', () => {
    setup()
    const schema = { properties: { family: { type: 'string', description: 'Font family' } } }
    addCapability(cap('font', 'install', { inputSchema: schema }))
    addCapability(cap('font', 'remove', { inputSchema: schema }))
    assert.strictEqual(getTools()[0].inputSchema.properties.family.description, 'Font family')
})

test('a parameter means the same for every action of a tool', () => {
    setup()
    addCapability(cap('page', 'get', { inputSchema: { properties: { page: { type: 'string' } } } }))
    assert.throws(() => addCapability(cap('page', 'set', { inputSchema: { properties: { page: { type: 'object' } } } })), /parameter "page"/)
    assert.throws(() => addCapability(cap('page', 'add', { inputSchema: { properties: { page: { type: 'string', enum: ['a'] } } } })), /parameter "page"/)
    addCapability(cap('device', 'set', { inputSchema: { properties: { page: { type: 'object' } } } }))
})

test('registry functions and validation', () => {
    setup()
    assert.throws(() => addCapability({ tool: 'page', action: 'list', description: 'd' }), /command/)
    assert.throws(() => addCapability({ tool: 'page', action: 'list', command: 'c' }), /description/)
    assert.throws(() => addCapability(cap('page', 'list', { inputSchema: 'bad' })), /inputSchema/)
    assert.strictEqual(addCapability({ tool: 'page', action: 'list', command: 'c', prompt: 'p' }).description, 'p')
    assert.strictEqual(hasCapability('page.list'), true)
    assert.strictEqual(removeCapability('page.list'), true)
    assert.strictEqual(hasCapability('page.list'), false)
    assert.deepStrictEqual(getTools(), [])
})

test('triggers ai-capabilities:ready on load with addCapability and describeTool', () => {
    const editor = setup()
    let received = null
    editor.on('ai-capabilities:ready', (add, describe) => { received = { add, describe } })
    editor.trigger('load')
    received.add(cap('page', 'list'))
    received.describe('page', 'Pages')
    assert.strictEqual(getTools()[0].description, 'Pages')
})

console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
process.exit(passed === total ? 0 : 1)
