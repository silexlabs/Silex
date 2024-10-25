import { Editor, Component, CssRule } from 'grapesjs'

export function getSelectors(editor: Editor, components: Component[]): string[] {
  return editor.CssComposer.getRules()
    .map((rule: CssRule) => rule.getSelectorsString())
    .filter((selector: string) => components.every(component => component?.view?.el.matches(selector)))
}

export function setSelector(editor: Editor, selector: string) {
  //const rule = editor.CssComposer.setRule(selector)
  editor.StyleManager.select(selector)
}

export function removeSelector(editor: Editor, selector: string) {
  editor.CssComposer.remove(selector)
}
