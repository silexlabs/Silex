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
  private suggestions: SimpleSelector[] = []


  /**
   * A list of all the classes, IDs, tags, custom tags, attributes, custom attributes
   * that are available to the related selector
   */
  @property({ type: Object, attribute: true, reflect: false })
  private relations: SimpleSelector[] = []


  // /////////////////
  // Properties

  // /////////////////
  // Element overrides
  static override styles = css`
  `

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
      ></compound-selector>
      <inline-select
        .value=${ this.value?.operator }
        .options=${ OPERATORS }
        placeholder="Relation"
        @change=${ (event: CustomEvent) => {
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
  }}
      ></inline-select>
      ${ this.value?.operator ? html`
        <compound-selector
          .value=${ this.value?.relatedSelector }
          .suggestions=${ this.relations }
          ?disable-pseudo-class=${ this.value?.operator.isCombinator === false }
          @change=${ (event: CustomEvent) => {
    const target = event.target as CompoundSelectorComponent
    this.value = {
      ...this.value!,
      relatedSelector: target.value as CompoundSelector,
    }
    event.stopPropagation()
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }}
        ></compound-selector>
      ` : ''}
    `
  }

  override toString(): string {
    return toString(this.value!)
  }
}

if (!customElements.get('complex-selector')) {
  customElements.define('complex-selector', ComplexSelectorComponent)
}
