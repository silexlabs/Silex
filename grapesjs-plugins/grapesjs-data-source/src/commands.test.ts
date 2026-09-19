/**
 * @jest-environment jsdom
 */
import grapesjs from 'grapesjs'
import { requireExistingState } from './state-guards'
import { getStateIds, setState, removeState } from './model/state'

describe('requireExistingState', () => {
  it('rejects an unknown stateId and lists current ids', () => {
    expect(() => requireExistingState('href', ['innerHTML', 'src']))
      .toThrow('State "href" is not on the selected element. Its states are: innerHTML, src.')
  })

  it('rejects when the element has no states', () => {
    expect(() => requireExistingState('innerHTML', []))
      .toThrow('State "innerHTML" is not on the selected element. Its states are: (none).')
  })

  it('accepts a known stateId', () => {
    expect(() => requireExistingState('innerHTML', ['innerHTML'])).not.toThrow()
  })
})

describe('data-source:remove-state happy path', () => {
  it('removes an existing state after the guard accepts it', () => {
    const editor = grapesjs.init({
      container: document.createElement('div'),
      components: '<div id="box"></div>',
    })
    const box = editor.Components.getById('box')
    setState(box, 'innerHTML', { label: 'HTML', expression: [] }, true)
    setState(box, 'src', { label: 'Src', expression: [] }, true)

    requireExistingState('innerHTML', getStateIds(box, true))
    removeState(box, 'innerHTML', true)
    expect(getStateIds(box)).toEqual(['src'])

    expect(() => requireExistingState('innerHTML', getStateIds(box, true)))
      .toThrow('State "innerHTML" is not on the selected element. Its states are: src.')

    editor.destroy()
  })
})
