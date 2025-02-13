import { property } from "lit/decorators.js"
import StylableElement from "../StylableElement"
import { CompoundSelector, toString } from "../model/CompoundSelector"
import { SimpleSelector, SimpleSelectorType } from "../model/SimpleSelector"
import { css, html, TemplateResult } from "lit"
import SimpleSelectorComponent from "./simple-selector"
import { PSEUDO_CLASSES } from "../model/PseudoClass"


export default class CompoundSelectorComponent extends StylableElement {

  // /////////////////
  // Attributes
  /**
   * The selector to display
   */
  @property({ type: Object, attribute: true, reflect: false })
  public get value(): CompoundSelector | undefined {
    return this._value
  }
  public set value(value: CompoundSelector | string | undefined) {
    try {
      this._value = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      console.error('Error parsing value for selector', { value, error })
    }
    this.requestUpdate()
  }
  private _value: CompoundSelector | undefined

  /**
   * A list of all the classes, IDs, tags, custom tags, attributes, custom attributes
   * that are available in the document, applicable to the current selection
   */
  @property({ type: Object, attribute: true, reflect: false })
  public suggestions: SimpleSelector[] = []

  @property({ type: Boolean, attribute: 'disable-pseudo-class' })
  public disablePseudoClass: boolean = false

  // /////////////////
  // Properties

  // /////////////////
  // Element overrides
  static override styles = css`
    .asm-compound__selectors {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .asm-compound__add {
      background-color: transparent;
      border: none;
      font-size: 1.5rem;
      margin: 0 0.5rem;
      cursor: pointer;
    }
  `

  override toString(): string {
    return toString(this.value!)
  }
  override render(): TemplateResult {
    return html`
      <section>
        <div
          class="asm-compound__selectors"
        >
          ${ this.value?.selectors.map((selector, idx) => html`
            <simple-selector
              .value=${ selector }
              .suggestions=${ this.suggestions }
              @change=${ (event: CustomEvent<SimpleSelector>) => this.changeSelector(event, idx) }
              @delete=${ (event: CustomEvent) => this.deleteSelector(event, idx) }
            ></simple-selector>
          `) }
          <button
            title="Add a new selector"
            class="gjs-fonts gjs-f-button asm-compound__add"
            @click=${ this.addSelector }
            >+</button>
        </div>
        ${ this.disablePseudoClass ? '' : html`
          <div>
            <inline-select
              .value=${ this.value?.pseudoClass }
              .options=${ PSEUDO_CLASSES }
              @change=${ this.changePseudoClass }
              placeholder="pseudo class"
            ></inline-select>
          <div>
        `}
      </section>
    `
  }

  // /////////////////
  // Methods
  private changeSelector(event: CustomEvent<SimpleSelector>, idx: number) {
    this.value?.selectors.splice(idx, 1, event.detail)
    this.dispatchEvent(new CustomEvent('change'))
    event.stopPropagation()
    this.requestUpdate()
  }
  private addSelector(event: MouseEvent) {
    this.value = this.value ?? { selectors: [] }
    this.value.selectors.push({ type: SimpleSelectorType.UNKNOWN, active: true })
    this.dispatchEvent(new CustomEvent('change'))
    event.stopPropagation()
    this.requestUpdate()
    // Make the last selector editable
    requestAnimationFrame(() => this.focusLastSelector())
  }
  private focusLastSelector() {
    if (!this.value) {
      return
    }
    const selector = this.shadowRoot!.querySelectorAll('simple-selector')[this.value!.selectors.length - 1] as SimpleSelectorComponent
    selector.editing = true
    requestAnimationFrame(() => {
      selector.focus()
    })
  }
  private deleteSelector(event: CustomEvent, idx: number) {
    this.value?.selectors.splice(idx, 1)
    this.dispatchEvent(new CustomEvent('change'))
    event.stopPropagation()
    this.requestUpdate()
  }
  private changePseudoClass(event: CustomEvent) {
    this.value = { ...this.value!, pseudoClass: event.detail }
    this.dispatchEvent(new CustomEvent('change'))
    event.stopPropagation()
  }
}

if (!customElements.get('compound-selector')) {
  customElements.define('compound-selector', CompoundSelectorComponent)
}
