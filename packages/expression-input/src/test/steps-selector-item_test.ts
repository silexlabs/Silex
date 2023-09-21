import {StepsSelectorItem} from '../steps-selector-item'
import {fixture, assert} from '@open-wc/testing'
import {html} from 'lit/static-html.js'

suite('Steps selector item', () => {
  test('is defined', () => {
    const el = document.createElement('steps-selector-item')
    assert.instanceOf(el, StepsSelectorItem)
  })

  test('renders with default values', async () => {
    const shadowRoot = (await fixture(html`<steps-selector-item></steps-selector-item>`)).shadowRoot
    assert.equal((shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="name"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="tags"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="type"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="helpText"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="errorText"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.equal((shadowRoot?.querySelector('slot[name="edit-options-button"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.isTrue((shadowRoot?.querySelector('slot[name="edit-options-button"]') as HTMLSlotElement)?.childNodes.length > 1) // > 1 because of it has text nodes in addintion to the default svg
  })

  test('renders with a set HTML body', async () => {
    const el = await fixture(html`
      <steps-selector-item>
        <div slot="icon">Test icon</div>
        <div slot="name">Test name</div>
        <div slot="tags"><ul><li>Test tag</li></ul></div>
        <div slot="values"><ul><li>Test value</li></ul></div>
        <div slot="helpText">Test help text</div>
        <div slot="errorText">Test error text</div>
      </steps-selector-item>
    `)
    const shadowRoot = el.shadowRoot
    assert.equal((shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement)?.assignedNodes()[0].textContent, 'Test icon')
    assert.equal((shadowRoot?.querySelector('slot[name="name"]') as HTMLSlotElement)?.assignedNodes()[0].textContent, 'Test name')
    assert.equal((shadowRoot?.querySelector('slot[name="tags"]') as HTMLSlotElement)?.assignedNodes()[0].textContent, 'Test tag')
    assert.equal((shadowRoot?.querySelector('slot[name="helpText"]') as HTMLSlotElement)?.assignedNodes()[0].textContent, 'Test help text')
    assert.equal((shadowRoot?.querySelector('slot[name="errorText"]') as HTMLSlotElement)?.assignedNodes()[0].textContent, 'Test error text')
    assert.equal((shadowRoot?.querySelector('slot[name="edit-options-button"]') as HTMLSlotElement)?.assignedNodes().length, 0)
    assert.isTrue((shadowRoot?.querySelector('slot[name="edit-options-button"]') as HTMLSlotElement)?.childNodes.length > 1) // > 1 because of it has text nodes in addintion to the default svg
  })

  test('hide edit options button when no-options-editor attribute is set', async () => {
    const el = await fixture(html`<steps-selector-item no-options-editor></steps-selector-item>`)
    const shadowRoot = el.shadowRoot
    // Make sure that everything is normal
    assert.isNotNull((shadowRoot?.querySelector('slot[name="icon"]')))
    // Then check that the edit options button is not there
    assert.isNull((shadowRoot?.querySelector('slot[name="edit-options-button"]')))
  })
})
