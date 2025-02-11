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
    value?: PseudoClass

  // /////////////////
  // Properties
  private paramRef = createRef<HTMLInputElement>()

  // /////////////////
  // Element overrides
  static override styles = css`
    :host {
      display: block;
      text-align: left;
    }
    select {
      ${ INVISIBLE_SELECT }
      text-align: center;
      border-bottom: 1px dashed;
    }
    input {
      ${ INVISIBLE_INPUT }
      text-align: center;
    }
    .asm-pseudo__help {
      font-size: 0.8rem;
      margin-left: 0.5rem;
      text-decoration: none;
      border-radius: 50%;
      padding: 0.25rem;
      color: var(--gjs-secondary-color, #333);
      border: 1px solid var(--gjs-secondary-color, #333);
      background-color: var(--gjs-primary-color, #fff);
      /* make the link a circle */
      display: inline-block;
      width: .5rem;
      height: .5rem;
      text-align: center;
      line-height: .7rem;
      font-size: .7rem;
    }
  `

  override render(): TemplateResult {
    if (!this.value) {
      return html`
        Add a ${ this.renderList() }
      `
    }
    return html`
      ${ this.value.sentencePre }
      ${ this.renderList() }
      ${ this.value.sentencePost }
      ${ this.renderParam() }
    `
  }
  // /////////////////
  // Methods
  private select(pseudoClass: PseudoClass) {
    this.value = pseudoClass
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: pseudoClass }))
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
          .selected=${ !this.value }
        >pseudo class</option>
        ${ PSEUDO_CLASSES.map(p => html`
          <option
            .selected=${ this.value?.type === p.type }
          >${ p.displayName }</option>
        `) }
      </select>
      ${ this.value?.helpLink ? html`
        <a
          class="asm-pseudo__help"
          href=${ this.value?.helpLink }
          target="_blank"
        >?</a>
      `: html`` }

    `
  }

  private renderParam(): TemplateResult {
    if (!this.value?.hasParam) {
      return html``
    }
    return html`
      ( <input
        is="resize-input"
        id="resize-input"
        ${ ref(this.paramRef) }
        type="text"
        autocomplete="off"
        .value=${ this.value.param ?? '' }
        placeholder=""
        @input=${ (e: Event) => {
    this.select({
      ...this.value!,
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
