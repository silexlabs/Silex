import {html} from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import {customElement, property} from 'lit/decorators.js'
import { InputChain } from './input-chain.js'

/**
 * @element expression-input
 * Web component to create an expression
 * Extends the InputChain component and adds
 * - [x] fixed value UI
 * - [x] dirty state
 * - [x] placeholder
 * - [x] reset mechanism
 *
 * It adds these properties
 * - [x] value and initial value
 * - [ ] dirty
 * 
 * It adds these attributes
 * - [x] allowFixed
 * - [x] fixed
 * 
 * It has these spots
 * 
 * - [x] default: the select elements for the expression
 * - [x] label
 * - [x] dirty-icon
 */

@customElement('expression-input')
export class ExpressionInput extends InputChain {
  /**
   * Read only property dirty
   * @readonly
   */
  get dirty() {
    //return JSON.stringify(this.value) !== JSON.stringify(this.initialValue)
    console.log(this.options.filter(o => o.selected))
    return !!this.options
      .filter(o => o.selected && !!o.value)
      .length || !!this.getFixedInput()?.value?.length
  }

  /**
   * Value is the concatenation of all options' values
   * @readonly
   */
  get value(): string[] {
    return this.options
      .filter(o => o.selected)
      .map(o => o.value)
  }

  /**
   * Initial value to be set to track changes
   */
  //initialValue: string[] = []
  //initialContent: Node[] = []

  @property({type: Boolean, attribute: 'allow-fixed'})
  allowFixed = true

  @property({type: Boolean, attribute: 'fixed', reflect: true})
  fixed = false

  @property()
  placeholder = 'Enter a fixed value or switch to expression'

  override connectedCallback() {
    super.connectedCallback()
    //this.save()
  }

  /**
   * Render the component
   */
  override render() {
    return html`
      <!-- header -->
      <header part="header" class="header">
        <label>
          <slot name="label"></slot>
          <div class=${classMap({dirty: this.dirty, 'property-name': true})} part="property-name">
            ${this.dirty ? html`
              <slot name="dirty-icon" part="dirty-icon" class="dirty-icon" @click=${this.reset}>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
              </slot>
            ` : html``}
          </div>
          ${this.allowFixed ? html`
            <div part="fixed-selector" class="fixed-selector">
              <span
                class=${classMap({active: this.fixed, 'fixed-selector-fixed': true})}
                @click=${() => this.fixed = true}
                part="fixed-selector-fixed"
              >Fixed</span>
              <span
                class=${classMap({active: !this.fixed, 'fixed-selector-expression': true})}
                @click=${() => this.fixed = false}
                part="fixed-selector-expression"
              >Expression</span>
            </div>
          ` : html``}
        </label>
      </header>
      <div part="property-container" class="property-container">
        <slot>${this.options.length ? '' : this.placeholder}</slot>
      </div>
    `
  }

  // <slot name="fixed">
  //   <input
  //     part="property-input" class="property-input"
  //     placeholder=${this.placeholder}
  //     type="text"
  //     value=${this.options[0]?.value}
  //     @change=${(event: InputEvent) => this.fixedValueChanged(event)}
  //   >
  // </slot>
  //fixedValueChanged(event: Event) {
  //  event.preventDefault()
  //  event.stopImmediatePropagation()
  //  const value = (event.target as HTMLInputElement).value
  //  console.log('fixedValueChanged', value)
  //  // Remove all options but the first
  //  const options = this.options
  //  options
  //    .slice(1)
  //    .forEach(o => o.remove())
  //  // Reset the first
  //  options[0].selected = false
  //  // Change event
  //  this.dispatchEvent(new Event('change'))
  //  this.requestUpdate()
  //}

  // /**
  //  * Reset dirty flag and store the current value as initial value
  //  */
  // public save() {
  //   this.initialValue = this.options
  //     .filter(o => o.selected)
  //     .map(o => o.value)
  //   this.initialContent = Array.from(this.children)
  //     .map(o => o.cloneNode(true))
  //   this.dispatchEvent(new Event('change'))
  //   this.requestUpdate()
  // }

  /**
   * Reset dirty flag and restore the initial value
   */
  reset() {
    //// Remove all children
    //Array.from(this.children)
    //  .forEach(o => o.remove())
    //// Add the previous content
    //this.initialContent
    //  .map(o => o.cloneNode(true))
    //  .forEach(o => this.appendChild(o))
    // Remove all children but the first
    if(this.fixed) {
      const input = this.getFixedInput()
      if(input) {
        input.value = ''
      } else {
        throw new Error('Input not found for fixed value')
      }
    } else {
      this.changeAt(-1)
    }
    this.requestUpdate()
  }

  getFixedInput(): HTMLInputElement | null {
    return this.querySelector('input, textarea')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'expression-input': ExpressionInput
  }
}

