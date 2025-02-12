import { property } from 'lit/decorators.js'
import StylableElement from '../StylableElement'
import { css, html, TemplateResult } from 'lit'
import { PseudoClass } from '../model/PseudoClass'
import { Operator } from '../model/Operator'
import { createRef, ref } from 'lit/directives/ref.js'
import './resize-input'
import { INVISIBLE_INPUT, INVISIBLE_SELECT } from '../styles'

type Option = PseudoClass | Operator

export default class InlineSelectComponent extends StylableElement {
  // /////////////////
  // Attributes
  /**
   * Selected option
   */
  @property({ type: Object, reflect: true })
    value?: Option
  
  /**
   * List of options
   */
  @property({ type: Array, reflect: true })
    options: Option[] = []

  /**
   * Placeholder displayed when no option is selected
   */
  @property({ type: String, reflect: true })
    placeholder = 'Select an option'

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
    .asm-inline-select__help {
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
      ${ this.value.sentencePost ?? '' }
      ${ this.renderParam() }
    `
  }
  // /////////////////
  // Methods
  private select(option: Option) {
    this.value = option
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: option }))
    requestAnimationFrame(() => this.paramRef.value?.focus())
  }

  // /////////////////
  // Lifecycle Hooks

  // /////////////////
  // Render methods
  private renderList(): TemplateResult {
    return html`
      <select
        class="asm-inline-select__select"
        @change=${ (e: Event) => {
    const p = this.options[(e.target as HTMLSelectElement).selectedIndex - 1]
    this.select(p)
  }}
      >
        <option
          .selected=${ !this.value }
        >${ this.placeholder }</option>
        ${ this.options.map(p => html`
          <option
            .selected=${ this.value?.type === p.type }
          >${ p.type }</option>
        `) }
      </select>
      ${ this.value?.helpLink ? html`
        <a
          class="asm-inline-select__help"
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
        .value=${ (this.value as PseudoClass).param } // It may not be a pseudo class, in which case param will be undefined
        placeholder=""
        @input=${ (e: Event) => {
    this.select({
      ...this.value!,
      param: (e.target as HTMLInputElement).value,
    } as Option)
  }}
      /> )
    `
  }
}

if (!customElements.get('inline-select')) {
  customElements.define('inline-select', InlineSelectComponent)
}
