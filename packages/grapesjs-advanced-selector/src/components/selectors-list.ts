import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { createRef } from "lit/directives/ref.js"
import { Component, Editor, Selector } from "grapesjs"

import './selector-pill'
import './as-selector'
import { removeSelectorsByType, SelectorType } from '../model'

export type SelectorsListOptions = {
  cssClassesLabel: string
}

export class SelectorsList extends LitElement {
  @property({ type: Array })
  public selected: Selector[] = []
  @property({ type: Object })
  public options: SelectorsListOptions = { cssClassesLabel: 'CSS Classes' }
  @property({ type: Object })
  public editor: Editor | null = null
  @property({ type: Array })
  public components: Component[] = []

  private statesSelectRef = createRef<HTMLSelectElement>()

  override render() {
    return html`
  <as-selector
    .state=${this.statesSelectRef.value?.value || ''}
    .editor=${this.editor}
    @add=${(event: CustomEvent) => this.addSelector(event.detail.selector)}
  >
    <span slot="label">${this.options.cssClassesLabel}</span>
    ${this.selected.map(selector => html`
      <as-tag
        class="as-class"
        .editor=${this.editor}
        .selector=${selector}
        @toggle=${() => this.toggleSelector(selector)}
        @remove=${() => removeSelectorsByType(components, selector, SelectorType.PRIMARY)}
      ></as-tag>
    `)}
  </as-selector>
`
  }

  removeSelector(selector: string) {
    deleteSelector(this.editor!, selector)
    //this.editor?.SelectorManager.removeSelected(selector)
    // TODO: if it is not referenced anywhere else? this.editor?.SelectorManager.remove(selector)
  }

  addSelector(selector: string) {
    //const added = this.editor?.SelectorManager.add(value)
    //this.editor?.SelectorManager.addSelected(selectorOpts)
    const rule = this.editor!.CssComposer.getRule(selector) || this.editor!.CssComposer.setRule(selector)
    this.components.forEach(component => component.get('classes')?.add(rule))
    editSelector(this.editor!, selector)
    console.log('ADD SELECTOR', { value: selector })
  }

  toggleSelector(selector: Selector) {
    console.log('toggleSelector', { selector })
    selector.setActive(!selector.getActive())
  }
}

if (!customElements.get('selectors-list')) {
  customElements.define('selectors-list', SelectorsList)
}
