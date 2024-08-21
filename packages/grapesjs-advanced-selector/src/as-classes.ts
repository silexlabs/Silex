import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from "lit/directives/ref.js"
import { Editor, Selector } from "grapesjs"

import './as-tag'
import './as-selector'

export type ASClassesOptions = {
  cssClassesLabel: string
}

@customElement('as-classes')
export class ASClasses extends LitElement {
  @property({ type: Array })
  public selected: Selector[] = []
  @property({ type: Array })
  public states: Selector[] = []
  @property({ type: Object })
  public options: ASClassesOptions = { cssClassesLabel: 'CSS Classes' }
  @property({ type: Object })
  public editor: Editor | null = null

  private statesSelectRef = createRef<HTMLSelectElement>()
  private currentState = ''

  override render() {
    //const components = editor.getSelectedAll()
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
          .active=${selector.getActive()}
          @click=${() => this.toggleSelector(selector)}
          @change=${(event: CustomEvent) => this.changeSelector(selector, event.detail.selector)}
          @remove=${() => this.removeSelector(selector)}
        ></as-tag>
      `)}
    </as-selector>
  `
  }

  changeSelector(selector: Selector, newSelector: string) {
    selector.set('name', newSelector)
    selector.setLabel(newSelector)
  }

  removeSelector(selector: Selector) {
    this.editor?.SelectorManager.removeSelected(selector)
    // TODO: if it is not referenced anywhere else? this.editor?.SelectorManager.remove(selector)
  }

  addSelector(value: string) {
    const selectorOpts = {
      name: value,
      label: value,
    }
    this.editor?.SelectorManager.add(value)
    this.editor?.SelectorManager.addSelected(selectorOpts)
  }

  toggleSelector(selector: Selector) {
    selector.setActive(!selector.getActive())
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'as-classes': ASClasses;
  }
}
