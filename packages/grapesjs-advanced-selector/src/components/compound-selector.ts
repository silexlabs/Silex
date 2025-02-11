import { property } from "lit/decorators.js"
import StylableElement from "../StylableElement"
import { CompoundSelector, toString } from "../model/CompoundSelector"
import { SimpleSelector, SimpleSelectorType } from "../model/SimpleSelector"
import { css, html, TemplateResult } from "lit"
import SimpleSelectorComponent from "./simple-selector"


export default class CompoundSelectorComponent extends StylableElement {

  // /////////////////
  // Attributes
  /**
   * The selector to display
   */
  @property({ type: Object, attribute: true, reflect: true })
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
  private suggestions: SimpleSelector[] = []

  // /////////////////
  // Properties

  // /////////////////
  // Element overrides
  static override styles = css`
    .asm-compound__selectors {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
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
  override dispatchEvent(event: Event): boolean {
    console.info('[CompoundSelectorComponent] Dispatching ', event.type, (event as CustomEvent).detail, this.value)
    return super.dispatchEvent(event)
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
              @delete=${ () => this.deleteSelector(idx) }
            ></simple-selector>
          `) }
          <button
            class="gjs-fonts gjs-f-button asm-compound__add"
            @click=${ this.addSelector }
            >+</button>
        </div>
        <div>
          <pseudo-class .value=${ this.value?.pseudoClass } @change=${ this.changePseudoClass }></pseudo-class>
        <div>
      </section>
    `
  }

  // /////////////////
  // Methods
  private changeSelector(event: CustomEvent<SimpleSelector>, idx: number) {
    this.value?.selectors.splice(idx, 1, event.detail)
    this.dispatchEvent(new CustomEvent('change'))
    this.requestUpdate()
  }
  private addSelector() {
    this.value?.selectors.push({ type: SimpleSelectorType.UNKNOWN, active: true })
    this.dispatchEvent(new CustomEvent('change'))
    this.requestUpdate()
    // Make the last selector editable
    requestAnimationFrame(() => {
      const selector = this.shadowRoot!.querySelectorAll('simple-selector')[this.value!.selectors.length - 1] as SimpleSelectorComponent
      selector.editing = true
    })
  }
  private deleteSelector(idx: number) {
    this.value?.selectors.splice(idx, 1)
    this.dispatchEvent(new CustomEvent('change'))
    this.requestUpdate()
  }
  private changePseudoClass(event: CustomEvent) {
    this.value = { ...this.value!, pseudoClass: event.detail }
    this.dispatchEvent(new CustomEvent('change'))
  }
}

if (!customElements.get('compound-selector')) {
  customElements.define('compound-selector', CompoundSelectorComponent)
}
