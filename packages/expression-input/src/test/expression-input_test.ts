import {ExpressionInput} from '../expression-input'
import {fixture, assert, oneEvent} from '@open-wc/testing'
import {html} from 'lit/static-html.js'

suite('expression-input copy/paste', () => {
  setup(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  teardown(() => {
    // Clean up after each test
    localStorage.clear()
  })

  test('is defined', () => {
    const el = document.createElement('expression-input')
    assert.instanceOf(el, ExpressionInput)
  })

  test('copy() writes expression to localStorage', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
          <option value="user" selected>user</option>
        </select>
      </expression-input>
    `)

    el.copy()

    const stored = localStorage.getItem('expression-input-clipboard')
    assert.isNotNull(stored)
    const data = JSON.parse(stored!)
    assert.equal(data.type, 'expression-input')
    assert.equal(data.fixed, false)
    assert.deepEqual(data.value, ['user'])
  })

  test('copy() dispatches copy event', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
          <option value="user" selected>user</option>
        </select>
      </expression-input>
    `)

    setTimeout(() => el.copy())
    const {detail} = await oneEvent(el, 'copy')

    assert.equal(detail.type, 'expression-input')
    assert.deepEqual(detail.value, ['user'])
  })

  test('paste() restores expression from localStorage', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="">Select...</option>
          <option value="data">data</option>
          <option value="user">user</option>
          <option value="settings">settings</option>
        </select>
      </expression-input>
    `)

    // Prepare localStorage data
    const data = {
      type: 'expression-input',
      fixed: false,
      value: ['user'],
    }
    localStorage.setItem('expression-input-clipboard', JSON.stringify(data))

    // Paste
    el.paste()

    // Wait for Lit to update
    await el.updateComplete

    // Verify the expression was restored
    assert.deepEqual(el.value, ['user'])
  })

  test('paste() dispatches paste and change events', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="">Select...</option>
          <option value="data">data</option>
          <option value="user">user</option>
        </select>
      </expression-input>
    `)

    const data = {
      type: 'expression-input',
      fixed: false,
      value: ['data'],
    }
    localStorage.setItem('expression-input-clipboard', JSON.stringify(data))

    // Listen for events
    let pasteEventFired = false
    let changeEventFired = false

    el.addEventListener('paste', () => {
      pasteEventFired = true
    })
    el.addEventListener('change', () => {
      changeEventFired = true
    })

    el.paste()

    assert.isTrue(pasteEventFired, 'paste event should fire')
    assert.isTrue(changeEventFired, 'change event should fire')
  })

  test('copy/paste works with fixed values', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input fixed>
        <input type="text" slot="fixed" value="Hello World" />
      </expression-input>
    `)

    // Copy
    el.copy()

    const stored = localStorage.getItem('expression-input-clipboard')
    assert.isNotNull(stored)
    const data = JSON.parse(stored!)
    assert.equal(data.fixed, true)
    assert.deepEqual(data.value, ['Hello World'])

    // Clear the input
    const input = el.getFixedInput()!
    input.value = ''

    // Paste
    el.paste()

    assert.equal(input.value, 'Hello World')
  })

  test('paste() throws error for invalid data format', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
        </select>
      </expression-input>
    `)

    // Invalid data format
    localStorage.setItem(
      'expression-input-clipboard',
      JSON.stringify({type: 'wrong-type', value: ['test']})
    )

    try {
      el.paste()
      assert.fail('Should have thrown an error')
    } catch (err) {
      assert.instanceOf(err, Error)
      assert.include((err as Error).message, 'Invalid expression data format')
    }
  })

  test('paste() throws error for non-array value', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
        </select>
      </expression-input>
    `)

    // Non-array value
    localStorage.setItem(
      'expression-input-clipboard',
      JSON.stringify({type: 'expression-input', value: 'not-an-array'})
    )

    try {
      el.paste()
      assert.fail('Should have thrown an error')
    } catch (err) {
      assert.instanceOf(err, Error)
      assert.include((err as Error).message, 'Invalid expression data format')
    }
  })

  test('copy/paste preserves multiple selections in expression chain', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="">Select...</option>
          <option value="data" selected>data</option>
        </select>
        <select>
          <option value="">Select...</option>
          <option value="users" selected>users</option>
        </select>
        <select>
          <option value="">Select...</option>
          <option value="name" selected>name</option>
        </select>
      </expression-input>
    `)

    // Copy the chain
    el.copy()

    const stored = localStorage.getItem('expression-input-clipboard')
    assert.isNotNull(stored)
    const data = JSON.parse(stored!)
    assert.deepEqual(data.value, ['data', 'users', 'name'])

    // Reset selections
    el.querySelectorAll('option[selected]').forEach((opt) => {
      ;(opt as HTMLOptionElement).selected = false
    })

    // Paste
    el.paste()

    // Wait for Lit to update
    await el.updateComplete

    assert.deepEqual(el.value, ['data', 'users', 'name'])
  })

  test('canPaste returns true when data exists in localStorage', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
        </select>
      </expression-input>
    `)

    // Initially should be false
    assert.isFalse(el.canPaste)

    // Add data to localStorage
    localStorage.setItem(
      'expression-input-clipboard',
      JSON.stringify({type: 'expression-input', fixed: false, value: ['data']})
    )

    // Now should be true
    assert.isTrue(el.canPaste)
  })

  test('canPaste returns false when no data in localStorage', async () => {
    const el = await fixture<ExpressionInput>(html`
      <expression-input>
        <select>
          <option value="data">data</option>
        </select>
      </expression-input>
    `)

    // Should be false when nothing in localStorage
    assert.isFalse(el.canPaste)
  })
})
