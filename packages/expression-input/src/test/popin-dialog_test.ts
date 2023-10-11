import {PopinDialog} from '../popin-dialog';
import {fixture, assert} from '@open-wc/testing';
import {html} from 'lit/static-html.js';

suite('popin-dialog', () => {
  test('is defined', () => {
    const el = document.createElement('popin-dialog')
    assert.instanceOf(el, PopinDialog)
  })

  test('renders with default values', async () => {
    const el = await fixture(html`<popin-dialog></popin-dialog>`)
    assert.shadowDom.equalSnapshot(el)
  })

  test('renders with a set HTML body', async () => {
    //const el = await fixture(html`<popin-dialog><div slot="body">Test body</div>Test default</popin-dialog>`)
    const el = await fixture(html`<popin-dialog><head id="test">Test default</head></popin-dialog>`)
    const slot = el.shadowRoot?.querySelector('slot.default') as HTMLSlotElement
    const nodes = slot.assignedNodes()
    assert.equal(nodes.length, 1)
    assert.equal(nodes[0].textContent, 'Test default')
  })

  test('hides when lose focus', async () => {
    const el = await fixture(html`<popin-dialog><head>Test</head></popin-dialog>`) as HTMLElement
    el.focus()
    el.blur()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(getComputedStyle(el).display, 'none')
    assert.equal(el.hasAttribute('hidden'), true)
  })

  test('do not hide when lose focus with autoclose set to false', async () => {
    const el = await fixture(html`<popin-dialog no-auto-close><head>Test</head></popin-dialog>`) as HTMLElement
    el.focus()
    el.blur()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.notEqual(getComputedStyle(el).display, 'none')
  })

  test('hides when hidden attribute is set', async () => {
    const el = await fixture(html`<popin-dialog hidden><head>Test</head></popin-dialog>`)
    assert.equal(getComputedStyle(el).display, 'none')
  })
})
