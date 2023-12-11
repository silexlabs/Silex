var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { InputChain } from './input-chain.js';
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
let ExpressionInput = class ExpressionInput extends InputChain {
    constructor() {
        super(...arguments);
        /**
         * Initial value to be set to track changes
         */
        //initialValue: string[] = []
        //initialContent: Node[] = []
        this.allowFixed = true;
        this.fixed = false;
        this.placeholder = 'Enter a fixed value or switch to expression';
    }
    /**
     * Read only property dirty
     * @readonly
     */
    get dirty() {
        var _a, _b;
        //return JSON.stringify(this.value) !== JSON.stringify(this.initialValue)
        console.log(this.options.filter(o => o.selected));
        return !!this.options
            .filter(o => o.selected && !!o.value)
            .length || !!((_b = (_a = this.getFixedInput()) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.length);
    }
    /**
     * Value is the concatenation of all options' values
     * @readonly
     */
    get value() {
        return this.options
            .filter(o => o.selected)
            .map(o => o.value);
    }
    connectedCallback() {
        super.connectedCallback();
        //this.save()
    }
    /**
     * Render the component
     */
    render() {
        return html `
      <!-- header -->
      <header part="header" class="header">
        <label>
          <slot name="label"></slot>
          <div class=${classMap({ dirty: this.dirty, 'property-name': true })} part="property-name">
            ${this.dirty ? html `
              <slot name="dirty-icon" part="dirty-icon" class="dirty-icon" @click=${this.reset}>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
              </slot>
            ` : html ``}
          </div>
          ${this.allowFixed ? html `
            <div part="fixed-selector" class="fixed-selector">
              <span
                class=${classMap({ active: this.fixed, 'fixed-selector-fixed': true })}
                @click=${() => this.fixed = true}
                part="fixed-selector-fixed"
              >Fixed</span>
              <span
                class=${classMap({ active: !this.fixed, 'fixed-selector-expression': true })}
                @click=${() => this.fixed = false}
                part="fixed-selector-expression"
              >Expression</span>
            </div>
          ` : html ``}
        </label>
      </header>
      <div part="property-container" class="property-container">
        <slot>${this.options.length ? '' : this.placeholder}</slot>
      </div>
    `;
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
        if (this.fixed) {
            const input = this.getFixedInput();
            if (input) {
                input.value = '';
            }
            else {
                throw new Error('Input not found for fixed value');
            }
        }
        else {
            this.changeAt(-1);
        }
        this.requestUpdate();
    }
    getFixedInput() {
        return this.querySelector('input, textarea');
    }
};
__decorate([
    property({ type: Boolean, attribute: 'allow-fixed' })
], ExpressionInput.prototype, "allowFixed", void 0);
__decorate([
    property({ type: Boolean, attribute: 'fixed', reflect: true })
], ExpressionInput.prototype, "fixed", void 0);
__decorate([
    property()
], ExpressionInput.prototype, "placeholder", void 0);
ExpressionInput = __decorate([
    customElement('expression-input')
], ExpressionInput);
export { ExpressionInput };
//# sourceMappingURL=expression-input.js.map