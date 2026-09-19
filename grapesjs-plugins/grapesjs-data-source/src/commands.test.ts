/**
 * @jest-environment jsdom
 */
import grapesjs, { Editor } from 'grapesjs'
import registerCommands, { CMD_DS_REMOVE_STATE, requireExistingState } from './commands'
import { getStateIds, setState } from './model/state'

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

describe('data-source:remove-state command', () => {
  let editor: Editor

  beforeEach(() => {
    editor = grapesjs.init({
      container: document.createElement('div'),
      components: '<div id="box"></div>',
    })
    registerCommands(editor, {
      dataSources: [],
      view: {},
      filters: [],
      previewActive: false,
    })
  })

  afterEach(() => {
    editor.destroy()
  })

  it('throws when the state is missing and lists valid ids', () => {
    const box = editor.Components.getById('box')
    editor.select(box)
    setState(box, 'innerHTML', { label: 'HTML', expression: [] }, true)

    expect(() => editor.runCommand(CMD_DS_REMOVE_STATE, { stateId: 'href' }))
      .toThrow('State "href" is not on the selected element. Its states are: innerHTML.')
    expect(getStateIds(box)).toEqual(['innerHTML'])
  })

  it('removes an existing state', () => {
    const box = editor.Components.getById('box')
    editor.select(box)
    setState(box, 'innerHTML', { label: 'HTML', expression: [] }, true)
    setState(box, 'src', { label: 'Src', expression: [] }, true)

    editor.runCommand(CMD_DS_REMOVE_STATE, { stateId: 'innerHTML' })
    expect(getStateIds(box)).toEqual(['src'])
  })
})
