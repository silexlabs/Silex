const { test } = require('node:test')
const assert = require('node:assert')
const { JSDOM, VirtualConsole } = require('jsdom')

const { window } = new JSDOM('<!DOCTYPE html><div id="gjs"></div>', { pretendToBeVisual: true, virtualConsole: new VirtualConsole() })
for (const key of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'Event', 'getComputedStyle', 'requestAnimationFrame']) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true })
}

test('changing the unit of a size variable updates its value', async () => {
  const grapesjs = require('grapesjs')
  const { setVariable } = await import('../src/variables.js')
  const { renderModal } = await import('../src/modal.js')
  const editor = grapesjs.init({ container: '#gjs', headless: true, storageManager: false })
  editor.getModel().set('cssVarOrder', [{ type: 'size', name: 'size' }])
  setVariable(editor, { name: 'size', value: '16px' })
  const el = document.createElement('div')
  renderModal(el, editor, { enableSizes: true })

  const select = el.querySelector('.css-vars-size-unit')
  select.value = 'rem'
  select.dispatchEvent(new window.Event('change'))

  assert.match(editor.getCss(), /--size:16rem/)
})
