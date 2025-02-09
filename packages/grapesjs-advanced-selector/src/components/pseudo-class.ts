import { property } from 'lit/decorators.js'
import StylableElement from '../StylableElement'
import { css, html, TemplateResult } from 'lit'
import { PSEUDO_CLASSES, PseudoClass } from '../model/PseudoClass'
import { createRef, ref } from 'lit/directives/ref.js'
import './resize-input'
import { INVISIBLE_INPUT, INVISIBLE_SELECT } from '../styles'

export default class PseudoClassComponent extends StylableElement {
  // /////////////////
  // Attributes
  /**
   * Selected pseudo class
   */
  @property({ type: Object, reflect: true })
    pseudoClass?: PseudoClass

  // /////////////////
  // Properties
  private paramRef = createRef<HTMLInputElement>()

  // /////////////////
  // Element overrides
  static override styles = css`
    select {
      ${ INVISIBLE_SELECT }
      border-bottom: 1px dashed;
    }
    input {
      ${ INVISIBLE_INPUT }
      text-align: center;
    }
  `

  override render(): TemplateResult {
    if (!this.pseudoClass) {
      return html`
        Add a ${ this.renderList() }
      `
    }
    return html`
      ${ this.pseudoClass.sentencePre }
      ${ this.renderList() }
      ${ this.pseudoClass.sentencePost }
      ${ this.renderParam() }
    `
  }
  // /////////////////
  // Methods
  private select(pseudoClass: PseudoClass) {
    this.pseudoClass = pseudoClass
    this.dispatchEvent(new CustomEvent('change', { bubbles: true }))
    requestAnimationFrame(() => this.paramRef.value?.focus())
  }

  // /////////////////
  // Lifecycle Hooks

  // /////////////////
  // Render methods
  private renderList(): TemplateResult {
    return html`
      <select
        class="asm-pseudo__select"
        @change=${ (e: Event) => {
    const p = PSEUDO_CLASSES[(e.target as HTMLSelectElement).selectedIndex - 1]
    this.select(p)
  }}
      >
        <option
          .selected=${ !this.pseudoClass }
        >pseudo class</option>
        ${ PSEUDO_CLASSES.map(p => html`
          <option
            .selected=${ this.pseudoClass?.type === p.type }
          >${ p.displayName }</option>
        `) }
      </select>
    `
  }

  private renderParam(): TemplateResult {
    if (!this.pseudoClass?.hasParam) {
      return html``
    }
    return html`
      ( <input
        is="resize-input"
        id="resize-input"
        ${ ref(this.paramRef) }
        type="text"
        autocomplete="off"
        .value=${ this.pseudoClass.param ?? '' }
        placeholder=""
        @input=${ (e: Event) => {
    this.select({
      ...this.pseudoClass!,
      param: (e.target as HTMLInputElement).value,
    })
  }}
      /> )
    `
  }
}

if (!customElements.get('pseudo-class')) {
  customElements.define('pseudo-class', PseudoClassComponent)
}
