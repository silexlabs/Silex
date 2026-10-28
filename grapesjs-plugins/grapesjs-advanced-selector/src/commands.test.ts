/**
 * @jest-environment jsdom
 */
import grapesjs, { Component } from 'grapesjs'
import registerCommands from './commands'

// Headless: no canvas DOM to match a selector against, the classes stand in for it
jest.mock('./model/GrapesJsSelectors', () => ({
  ...jest.requireActual('./model/GrapesJsSelectors'),
  matchSelectorAll: (selector: string, components: Component[]) =>
    components.some(component => component.getClasses().some((name: string) => selector === `.${name}`)),
}))

describe('styles:set', () => {
  it('writes the CSS of a rule, and never changes the classes of the element', () => {
    const editor = grapesjs.init({ headless: true, storageManager: false, components: '<div class="card big">x</div>' })
    registerCommands(editor)
    const [card] = editor.getWrapper()!.components().models
    editor.select(card)
    editor.runCommand('styles:set', { selector: '.card', css: 'color: red; gap: 4px' })
    expect(editor.CssComposer.getRule('.card')?.getStyle()).toMatchObject({ color: 'red', gap: '4px' })
    expect(() => editor.runCommand('styles:set', { selector: '.other', css: 'color: blue' })).toThrow(/add_class/)
    expect(card.getClasses()).toEqual(['card', 'big'])
    expect(editor.CssComposer.getRule('.other')).toBeFalsy()
    editor.destroy()
  })
})
