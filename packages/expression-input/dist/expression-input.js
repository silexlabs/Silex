var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { property } from 'lit/decorators.js';
import { InputChain } from './input-chain.js';
/**
 * @element expression-input
 * Web component to create an expression
 * Extends the InputChain component and adds
 * - [x] fixed value UI
 * - [x] dirty state
 * - [x] placeholder
 * - [x] reset mechanism
 * - [ ] copy/paste hole expressions (using clipboard API)
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
export class ExpressionInput extends InputChain {
    constructor() {
        super(...arguments);
        /**
         * Initial value to be set to track changes
         */
        //initialValue: string[] = []
        //initialContent: Node[] = []
        this.allowFixed = true;
        this._fixed = false;
        this.placeholder = 'Enter a fixed value or switch to expression';
    }
    /**
     * Read only property dirty
     * @readonly
     */
    get dirty() {
        //return JSON.stringify(this.value) !== JSON.stringify(this.initialValue)
        return this.value.length > 0;
    }
    /**
     * Value is the concatenation of all options' values
     * @readonly
     */
    get value() {
        var _a;
        return this.fixed
            ? [(_a = this.getFixedInput()) === null || _a === void 0 ? void 0 : _a.value].filter((v) => !!v)
            : this.options.filter((o) => o.selected && o.value).map((o) => o.value);
    }
    get fixed() {
        return this._fixed;
    }
    set fixed(value) {
        this._fixed = value;
        this.dispatchEvent(new Event('fixedChange'));
    }
    connectedCallback() {
        super.connectedCallback();
        //this.save()
    }
    /**
     * Render the component
     */
    render() {
        const dirty = this.dirty;
        return html `
      <!-- header -->
      <header part="header" class="header">
        <label>
          <div
            class=${classMap({ dirty, 'property-name': true })}
            part="property-name"
          >
            <slot name="label"></slot>
            ${dirty
            ? html `
                  <slot
                    name="dirty-icon"
                    part="dirty-icon"
                    class="dirty-icon"
                    @click=${this.reset}
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                      ></path>
                    </svg>
                  </slot>
                `
            : html ``}
          </div>
          ${this.allowFixed
            ? html `
                <div part="fixed-selector" class="fixed-selector">
                  <span
                    class=${classMap({
                active: this.fixed,
                'fixed-selector-fixed': true,
            })}
                    @click=${() => (this.fixed = true)}
                    part="fixed-selector-fixed"
                    >Fixed</span
                  >
                  <span
                    class=${classMap({
                active: !this.fixed,
                'fixed-selector-expression': true,
            })}
                    @click=${() => (this.fixed = false)}
                    part="fixed-selector-expression"
                    >Expression</span
                  >
                </div>
              `
            : html ``}
        </label>
      </header>
      <div
        part="property-container"
        class=${classMap({ 'property-container': true, fixed: this.fixed })}
      >
        <slot class="hide-when-fixed"
          >${this.options.length ? '' : this.placeholder}</slot
        >
        <slot name="fixed" part="fixed" class="show-when-fixed"></slot>
      </div>
    `;
    }
    /**
     * Reset dirty flag and restore the initial value
     */
    reset() {
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
            this.changeAt(-1, true);
        }
        this.dispatchEvent(new Event('change'));
        this.requestUpdate();
    }
    getFixedInput() {
        return this.querySelector('input, textarea');
    }
}
__decorate([
    property({ type: Boolean, attribute: 'allow-fixed' })
], ExpressionInput.prototype, "allowFixed", void 0);
__decorate([
    property({ type: Boolean, attribute: 'fixed', reflect: true })
], ExpressionInput.prototype, "fixed", null);
__decorate([
    property()
], ExpressionInput.prototype, "placeholder", void 0);
if (!window.customElements.get('expression-input')) {
    window.customElements.define('expression-input', ExpressionInput);
}
//# sourceMappingURL=expression-input.js.map