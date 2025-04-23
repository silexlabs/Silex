import { property } from 'lit/decorators.js'
import StylableElement from '../StylableElement'
import { CompoundSelector, toString } from '../model/CompoundSelector'
import { isSameSelector, SimpleSelector, SimpleSelectorType, specificity } from '../model/SimpleSelector'
import { css, html, TemplateResult } from 'lit'
import SimpleSelectorComponent from './simple-selector'
import { PSEUDO_CLASSES } from '../model/PseudoClass'
import { FOCUS_VISIBLE } from '../styles'
import './inline-select'
import './simple-selector'

/**
 * A component to display and edit a compound selector
 * A compound selector is a list of simple selectors and a pseudo class
 * @emits change
 * @emits rename (when a simple selector in the selector is renamed)
 * @emits delete
 * @emits add
 */
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
  @property({ type: Array, attribute: true, reflect: false })
  public suggestions: SimpleSelector[] = []

  @property({ type: Boolean, attribute: 'disable-pseudo-class' })
  public disablePseudoClass: boolean = false

  // /////////////////
  // Properties

  // /////////////////
  // Element overrides
  static override styles = css`
  :host {
    ${ FOCUS_VISIBLE }
    button:hover, a:hover {
      transform: translateX(1px);
      font-weight: bold;
    }
    .asm-compound__selectors {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
      /* material design card style */
      padding: 0.5rem;
      background-color: var(--gjs-main-dark-color);
    }
    .asm-compound__add {
      color: var(--gjs-secondary-color, #b9a5a6);
    }
    .asm__add-inline {
      font-size: 0.8rem;
      background: transparent;
    }
  }
  `

  // override dispatchEvent(event: Event): boolean {
  //   console.info('[COMPOUND] Dispatching event', event)
  //   return super.dispatchEvent(event)
  // }

  override toString(): string {
    return toString(this.value!)
  }
  override render(): TemplateResult {
    return html`
      <section>
        <div
          class="asm-compound__selectors"
        >
          ${ this.value?.selectors
    .sort((a, b) => specificity(b, true) - specificity(a, true))
    .map((selector, idx) => html`
            <simple-selector
              .t=${ this.t }
              .value=${ selector }
              .suggestions=${ this.suggestions }
              ?readonly=${ ![SimpleSelectorType.CLASS, SimpleSelectorType.UNKNOWN].includes(selector.type) }
              @change=${ (event: CustomEvent<SimpleSelector>) => this.changeSelector(event, idx) }
              @delete=${ (event: CustomEvent) => this.deleteSelector(event, idx) }
            ></simple-selector>
          `) }
          <button
            id="gjs-clm-add-tag"
            class="gjs-clm-tags-btn gjs-clm-tags-btn__add asm-compound__add"
            .title=${ this.t('Add a new selector') }
            @click=${ this.addSelector }
            >
            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
          </button>
        </div>
        ${ this.disablePseudoClass ? '' : html`
          ${ this.value?.pseudoClass ? html`
            <div>
              <inline-select
                .t=${ this.t }
                .value=${ this.value?.pseudoClass }
                .options=${ PSEUDO_CLASSES }
                @change=${ this.changePseudoClass }
                placeholder=""
              ></inline-select>
            </div>
          ` : html`
            <button
              class="gjs-btn-prim asm__add-inline"
              @click=${ this.addPseudoClass }
              >\u2192 ${ this.t('Pseudo Class') }</button>
          ` }
        `}
      </section>
    `
  }

  // /////////////////
  // Methods
  private changeSelector(event: CustomEvent<SimpleSelector>, idx: number) {
    const oldValue: SimpleSelector = this.value!.selectors[idx]
    const onlyId = event.detail.type === SimpleSelectorType.ID && event.detail.active
    this.value = {
      ...this.value!,
      selectors: this.value!.selectors
        // Replace the old value with the new one
        .map((selector, i) => i === idx ? event.detail : selector)
        .map(selector => onlyId && selector.type !== SimpleSelectorType.ID ? { ...selector, active: false } : selector),
    }
    if(!isSameSelector(oldValue, event.detail, false)) {
      this.dispatchEvent(new CustomEvent('rename', { detail: {
        oldValue,
        value: event.detail,
      } }))
      this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
    }
    event.stopPropagation()
    this.requestUpdate()
  }
  private addSelector(event: MouseEvent) {
    this.value = this.value ?? { selectors: [] }
    this.value.selectors.push({ type: SimpleSelectorType.UNKNOWN, active: true })
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
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
    event.stopPropagation()
    this.requestUpdate()
  }
  private addPseudoClass(event: MouseEvent) {
    this.value = { ...this.value!, pseudoClass: PSEUDO_CLASSES[0] }
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
    event.stopPropagation()
  }
  private changePseudoClass(event: CustomEvent) {
    this.value = { ...this.value!, pseudoClass: event.detail }
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
    event.stopPropagation()
  }
}

if (!customElements.get('compound-selector')) {
  customElements.define('compound-selector', CompoundSelectorComponent)
}
