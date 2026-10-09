const { test, describe } = require('node:test')
const assert = require('node:assert')
const { JSDOM, VirtualConsole } = require('jsdom')

const { window } = new JSDOM('<!DOCTYPE html><div id="gjs"></div>', { pretendToBeVisual: true, virtualConsole: new VirtualConsole() })
for (const key of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'Event', 'getComputedStyle', 'requestAnimationFrame']) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true })
}

async function createEditor(pluginOpts = {}) {
  const grapesjs = require('grapesjs')
  const plugin = (await import('../src/index.js')).default
  const editor = grapesjs.init({
    container: '#gjs',
    headless: true,
    storageManager: false,
    plugins: [plugin],
    pluginsOpts: { [plugin]: pluginOpts },
  })
  return editor
}

describe('variable-enabled property registry (#1846)', async () => {
  test('defaults cover the standard GrapesJS properties', async () => {
    const editor = await createEditor()
    const { getVariableProperties } = await import('../src/style-manager.js')
    const props = getVariableProperties(editor)
    const has = (sector, property, type, subProperty) => props.some(p =>
      p.sector === sector && p.property === property && p.type === type && (p.subProperty || '') === (subProperty || ''))
    assert.ok(has('typography', 'color', 'color'), 'typography color')
    assert.ok(has('decorations', 'background-color', 'color'), 'background-color')
    assert.ok(has('dimension', 'width', 'size'), 'width')
    assert.ok(has('typography', 'font-size', 'size'), 'font-size')
    assert.ok(has('typography', 'line-height', 'size'), 'line-height')
    assert.ok(has('typography', 'font-family', 'font-family'), 'font-family')
    assert.ok(has('dimension', 'margin', 'size', 'margin-top'), 'margin-top under margin')
    editor.destroy()
  })

  test('editor.CssVariables exposes add/remove/get', async () => {
    const editor = await createEditor()
    assert.equal(typeof editor.CssVariables?.addVariableProperty, 'function')
    assert.equal(typeof editor.CssVariables?.removeVariableProperty, 'function')
    assert.equal(typeof editor.CssVariables?.getVariableProperties, 'function')
    editor.destroy()
  })

  test('addVariableProperty registers Silex properties and is idempotent', async () => {
    const editor = await createEditor()
    const { getVariableProperties, addVariableProperty } = await import('../src/style-manager.js')
    const before = getVariableProperties(editor).length
    addVariableProperty(editor, { sector: 'typography', property: 'text-underline-offset', type: 'size' })
    addVariableProperty(editor, { sector: 'extra', property: 'transform-origin', subProperty: 'transform-origin-x', type: 'size' })
    // Duplicate add keeps a single entry
    addVariableProperty(editor, { sector: 'typography', property: 'text-underline-offset', type: 'size' })
    const after = getVariableProperties(editor)
    assert.equal(after.length, before + 2)
    editor.destroy()
  })

  test('addVariableProperty accepts type aliases', async () => {
    const editor = await createEditor()
    const { addVariableProperty, getVariableProperties } = await import('../src/style-manager.js')
    addVariableProperty(editor, { sector: 'typography', property: 'font-family', subProperty: undefined, type: 'typo' })
    // font-family default already exists as font-family, alias resolves to the same entry (still one)
    const matches = getVariableProperties(editor).filter(p => p.sector === 'typography' && p.property === 'font-family')
    assert.equal(matches.length, 1)
    assert.equal(matches[0].type, 'font-family')
    editor.destroy()
  })

  test('sub-properties are keyed by parent (border trap)', async () => {
    const editor = await createEditor()
    const { addVariableProperty, removeVariableProperty, getVariableProperties } = await import('../src/style-manager.js')
    addVariableProperty(editor, { sector: 'decorations', property: 'border', subProperty: 'border-color', type: 'color' })
    addVariableProperty(editor, { sector: 'decorations', property: 'border-top', subProperty: 'border-color', type: 'color' })
    let props = getVariableProperties(editor).filter(p => (p.subProperty || '') === 'border-color')
    assert.equal(props.length, 2)
    // Removing from one parent keeps the other
    const removed = removeVariableProperty(editor, { sector: 'decorations', property: 'border', subProperty: 'border-color', type: 'color' })
    assert.equal(removed, 1)
    props = getVariableProperties(editor).filter(p => (p.subProperty || '') === 'border-color')
    assert.equal(props.length, 1)
    assert.equal(props[0].property, 'border-top')
    editor.destroy()
  })

  test('removeVariableProperty without type removes all types on that target', async () => {
    const editor = await createEditor()
    const { addVariableProperty, removeVariableProperty, getVariableProperties } = await import('../src/style-manager.js')
    addVariableProperty(editor, { sector: 'extra', property: 'demo-prop', type: 'size' })
    const removed = removeVariableProperty(editor, { sector: 'extra', property: 'demo-prop' })
    assert.equal(removed, 1)
    assert.ok(!getVariableProperties(editor).some(p => p.property === 'demo-prop'))
    editor.destroy()
  })

  test('add/remove validate their input', async () => {
    const editor = await createEditor()
    const { addVariableProperty, removeVariableProperty } = await import('../src/style-manager.js')
    assert.throws(() => addVariableProperty(editor, { property: 'x', type: 'size' }), /sector/)
    assert.throws(() => addVariableProperty(editor, { sector: 'a', type: 'size' }), /property/)
    assert.throws(() => addVariableProperty(editor, { sector: 'a', property: 'x', type: 'nope' }), /invalid type/)
    assert.throws(() => removeVariableProperty(editor, { property: 'x' }), /sector/)
    editor.destroy()
  })

  test('options.properties are merged into the defaults', async () => {
    const editor = await createEditor({
      properties: [{ sector: 'typography', property: 'text-underline-offset', type: 'size' }],
    })
    const { getVariableProperties } = await import('../src/style-manager.js')
    assert.ok(getVariableProperties(editor).some(p => p.property === 'text-underline-offset'))
    editor.destroy()
  })
})
