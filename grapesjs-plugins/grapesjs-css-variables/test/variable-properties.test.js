const { test, describe } = require('node:test')
const assert = require('node:assert')
const { JSDOM, VirtualConsole } = require('jsdom')

const { window } = new JSDOM('<!DOCTYPE html><div id="gjs"></div>', { pretendToBeVisual: true, virtualConsole: new VirtualConsole() })
for (const key of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'Event', 'getComputedStyle', 'requestAnimationFrame', 'DOMParser']) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true })
}

// A composite whose sub-properties are not CSS properties: GrapesJS writes them
// joined into the parent declaration (`border: 1px solid red`)
function borderPlugin(editor) {
  editor.on('load', () => {
    editor.StyleManager.addType('test-color', {})
    editor.StyleManager.addProperty('decorations', {
      name: 'Border',
      property: 'border',
      type: 'composite',
      properties: [
        { name: 'Width', property: 'border-width', type: 'integer', units: ['px'], default: '' },
        { name: 'Style', property: 'border-style', type: 'select', default: '', options: [
          { id: '', value: '', name: '' },
          { id: 'solid', value: 'solid', name: 'solid' },
        ] },
        { name: 'Color', property: 'border-color', type: 'test-color', default: '' },
      ],
    })
    editor.CssVariables.addVariableProperty({ sector: 'decorations', property: 'border', subProperty: 'border-color', type: 'color' })
  })
}

async function createEditor(pluginOpts = {}) {
  const grapesjs = require('grapesjs')
  const plugin = (await import('../src/index.js')).default
  const editor = grapesjs.init({
    container: '#gjs',
    headless: true,
    storageManager: false,
    components: '<div id="myid">hello</div>',
    style: '#myid { border: 1px solid red }',
    plugins: [plugin, borderPlugin],
    pluginsOpts: { [plugin]: pluginOpts },
  })
  editor.trigger('load')
  const { setVariable } = await import('../src/variables.js')
  setVariable(editor, { name: 'primary', value: '#00ff00' })
  editor.getModel().set('cssVarOrder', [{ name: 'primary', type: 'color' }])
  return editor
}

// Apply a variable the way the plugin UI does, and return the rule's CSS
async function applyVariable(editor, property) {
  const { setTargetStyleValue } = await import('../src/variables.js')
  const component = editor.getWrapper().components().at(0)
  editor.StyleManager.select(component)
  setTargetStyleValue(editor, property, 'var(--primary)')
  return editor.StyleManager.getSelected().getStyle()
}

describe('variable on a registered sub-property (#1846)', () => {
  test('a variable applies on a border sub-property and reaches the rule CSS', async () => {
    const editor = await createEditor()
    const border = editor.StyleManager.getProperty('decorations', 'border')
    // GrapesJS writes the sub-properties into the parent declaration,
    // `border-color: var(--primary)` alone would be ignored by the browser
    assert.equal(typeof border.getProperty('border-color'), 'object')

    const style = await applyVariable(editor, border.getProperty('border-color'))

    assert.equal(style.border, '1px solid var(--primary)')
    editor.destroy()
  })

  test('a variable on a border-top sub-property does not touch border-color', async () => {
    const editor = await createEditor()
    editor.StyleManager.addProperty('decorations', {
      name: 'Border top',
      property: 'border-top',
      type: 'composite',
      properties: [
        { name: 'Width', property: 'border-top-width', type: 'integer', units: ['px'], default: '' },
        { name: 'Style', property: 'border-top-style', type: 'select', default: '', options: [
          { id: '', value: '', name: '' },
          { id: 'solid', value: 'solid', name: 'solid' },
        ] },
        { name: 'Color', property: 'border-top-color', type: 'test-color', default: '' },
      ],
    })
    editor.CssVariables.addVariableProperty({ sector: 'decorations', property: 'border-top', subProperty: 'border-top-color', type: 'color' })
    editor.Css.setRule('#myid', { 'border': '1px solid red', 'border-top': '2px dashed blue' })

    const borderTop = editor.StyleManager.getProperty('decorations', 'border-top')
    const style = await applyVariable(editor, borderTop.getProperty('border-top-color'))

    assert.equal(style['border-top'], '2px dashed var(--primary)')
    assert.equal(style.border, '1px solid red')
    editor.destroy()
  })
})
