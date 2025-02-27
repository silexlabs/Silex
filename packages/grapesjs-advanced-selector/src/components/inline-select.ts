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
    select:focus-visible,
    input:focus-visible,
    button:focus-visible,
    a:focus-visible {
      outline: initial !important;
      box-shadow: revert !important;
      border: 1px solid !important;
    }
    button:hover, a:hover {
      transform: translateY(1px);
      color: var(--gjs-primary-color, #333);
    }
    input, select, button, inline-select {
      font-family: inherit;
      font-size: inherit;
      color: var(--gjs-secondary-color, #333);
      margin: 0;
      padding: 0;
    }
    :host {
      display: block;
      text-align: left;
      padding: 0 0.5rem;
      margin: 0.5rem 0;
    }
    section {
      display: flex;
      justify-content: space-between;
    }
    select {
      ${ INVISIBLE_SELECT }
      text-align: center;
      border-bottom: 1px dashed;
    }
    aside {
      flex: 0 0 auto;
    }
    input {
      ${ INVISIBLE_INPUT }
      text-align: center;
    }
    .asm-inline-select__btn {
      font-size: 0.8rem;
      text-decoration: none;
      border-radius: 50%;
      color: var(--gjs-secondary-color, #333);
      /* make the link a circle */
      display: inline-block;
      width: .5rem;
      height: .5rem;
      text-align: center;
      line-height: .7rem;
      font-size: .7rem;
      padding: 4px;
      &:hover {
        background-color: var(--gjs-secondary-color, #fff);
      }
    }
    .unbreakable {
      white-space: nowrap;
    }
  `

  override render(): TemplateResult {
    if (!this.value) {
      return html`
        ${ this.renderList() }
      `
    }
    return html`
      <section>
        <main>
          ${ this.t(this.value.sentencePre) }
          <span class="unbreakable">
            ${ this.renderList() }
            ${ this.value.sentencePost ?? '' }
            ${ this.renderParam() }
          </span>
        </main>
        <aside>
          ${ this.renderButtons() }
        </aside>
      </section>
    `
  }
  // /////////////////
  // Methods
  private select(option?: Option) {
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
          >${ this.t(p.displayName ?? p.type) }</option>
        `) }
      </select>
    `
  }
  private renderButtons(): TemplateResult {
    return html`
      ${ this.value?.helpLink ? html`
        <a
          .title=${ this.t('Help') }
          class="asm-inline-select__btn"
          href=${ this.t(this.value.helpLink) }
          target="_blank"
        >?</a>`: html`` 
}<a
        href="#"
        .title=${ this.t('Remove') }
        class="asm-inline-select__btn"
        @click=${ (event: MouseEvent) => {
    this.select() 
    event.preventDefault()
  }}
      >\u2715</a>
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
        .value=${ (this.value as PseudoClass).param ?? '' } // It may not be a pseudo class, in which case param will be undefined
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
