import { property } from 'lit/decorators.js'
import StylableElement from '../StylableElement'
import { css, html, TemplateResult } from 'lit'
import './resize-input'
import { SimpleSelector } from '../model/SimpleSelector'
import { ComplexSelector, toString } from '../model/ComplexSelector'
import { Operator, OPERATORS } from '../model/Operator'
import InlineSelectComponent from './inline-select'
import CompoundSelectorComponent from './compound-selector'
import { CompoundSelector } from '../model/CompoundSelector'

/**
 * A component to display and edit a complex selector
 * A complex selector is a main selector, an operator, and a related selector
 * @emits change
 * @emits rename (when a simple selector in the main compound selector is renamed)
 */
export default class ComplexSelectorComponent extends StylableElement {
  // /////////////////
  // Attributes
  /**
   * The selector to display
   */
  @property({ type: Object, attribute: true, reflect: false })
  public get value(): ComplexSelector | undefined {
    return this._value
  }
  public set value(value: ComplexSelector | string | undefined) {
    try {
      this._value = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      console.error('Error parsing value for selector', { value, error })
    }
    this.requestUpdate()
  }
  private _value: ComplexSelector | undefined

  /**
   * A list of all the classes, IDs, tags, custom tags, attributes, custom attributes
   * that are available in the document, applicable to the current selection
   */
  @property({ type: Object, attribute: true, reflect: false })
  public suggestions: SimpleSelector[] = []


  /**
   * A list of all the classes, IDs, tags, custom tags, attributes, custom attributes
   * that are available to the related selector
   */
  @property({ type: Object, attribute: true, reflect: false })
  public relations: SimpleSelector[] = []


  // /////////////////
  // Properties

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
      transform: translateX(1px);
      font-weight: bold;
    }
    :host {
      display: block;
      text-align: left;
      padding: 0.5rem 0;
    }
    button.asm__add-inline {
      font-size: 0.8rem;
      background: transparent;
    }
  `

  override dispatchEvent(event: Event): boolean {
    console.info('[COMPLEX] Dispatching event', event)
    return super.dispatchEvent(event)
  }

  override render(): TemplateResult {
    return html`
      <compound-selector
        .value=${ this.value?.mainSelector }
        .suggestions=${ this.suggestions }
        @change=${ (event: CustomEvent) => {
    const target = event.target as CompoundSelectorComponent
    this.value = {
      ...this.value!,
      mainSelector: target.value as CompoundSelector,
    }
    event.stopPropagation()
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }}
        @rename=${ (event: CustomEvent) => this.dispatchEvent(new CustomEvent('rename', { detail: event.detail })) }
      ></compound-selector>
      ${ this.value?.operator ? html`
        <inline-select
          .value=${ this.value?.operator }
          .options=${ OPERATORS }
          placeholder=""
          @change=${ this.changeOperator }
        ></inline-select>
      ` : html`
        <button
          class="gjs-btn-prim asm__add-inline"
          @click=${ this.addOperator }
        >\u2192 Relation</button>
      `}
      ${ this.value?.operator ? html`
        <compound-selector
          .value=${ this.value?.relatedSelector }
          .suggestions=${ this.relations }
          ?disable-pseudo-class=${ this.value?.operator.isCombinator === false }
          @change=${ this.changeRelatedSelector }
        ></compound-selector>
      ` : ''}
    `
  }

  // /////////////////
  // Methods
  private changeOperator(event: CustomEvent<Operator>) {
    const target = event.target as InlineSelectComponent
    if ((target.value as Operator)?.isCombinator === false) {
      // Make sure we don't have a pseudo class as a param of a pseudo class
      delete this.value?.relatedSelector?.pseudoClass
    }
    this.value = {
      ...this.value!,
      operator: target.value as Operator,
    }
    if (!target.value) {
      delete this.value?.relatedSelector
      delete this.value?.operator
    }
    event.stopPropagation()
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }

  private addOperator() {
    this.requestUpdate()
    this.value = {
      ...this.value!,
      operator: OPERATORS[0],
      relatedSelector: {
        selectors: [],
      },
    } as ComplexSelector
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }

  private changeRelatedSelector(event: CustomEvent<CompoundSelector>) {
    const target = event.target as CompoundSelectorComponent
    this.value = {
      ...this.value!,
      relatedSelector: target.value as CompoundSelector,
    }
    event.stopPropagation()
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }

  override toString(): string {
    return toString(this.value!)
  }
}

if (!customElements.get('complex-selector')) {
  customElements.define('complex-selector', ComplexSelectorComponent)
}
