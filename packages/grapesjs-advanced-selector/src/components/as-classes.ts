import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { createRef, ref } from "lit/directives/ref.js"
import { Component, Editor, Selector } from "grapesjs"

import './as-tag'
import './as-selector'
import { deleteSelector, editSelector } from '../model';

export type ASClassesOptions = {
  cssClassesLabel: string
}

export class ASClasses extends LitElement {
  @property({ type: Array })
  public selected: Selector[] = []
  @property({ type: Array })
  public states: Selector[] = []
  @property({ type: Object })
  public options: ASClassesOptions = { cssClassesLabel: 'CSS Classes' }
  @property({ type: Object })
  public editor: Editor | null = null
  @property({ type: Array })
  public components: Component[] = []

  private statesSelectRef = createRef<HTMLSelectElement>()
  private currentState = ''

  override render() {
    return html`
  <select
    ${ref(this.statesSelectRef)}
    @change=${(event: Event) => {
        this.currentState = (event.target as HTMLSelectElement).value
        this.requestUpdate()
      }}
  >
    <option value="">Normal</option>
    ${this.states.map(state => html`
      <option
        .value="${state.get('name')}"
        ?selected=${state.get('name') === this.currentState}
      >${state.get('name')}</option>
    `)}
  </select>
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
        @remove=${() => this.removeSelector(selector.getFullName())}
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

if (!customElements.get('as-classes')) {
  customElements.define('as-classes', ASClasses)
}
