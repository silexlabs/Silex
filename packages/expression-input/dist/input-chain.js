var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { inputChainStyles } from './styles.js';
/**
 * @element input-chain
 * Web component to select a sequence of steps, each step being a <select> element.
 *
 * Children are expected to be input or select html elements
 *
 * Features
 * - Nested Select Elements: Allows embedding <select> elements as children.
 * - Dynamic Interaction: Automatically updates subsequent select elements upon a change in any select element, resetting them to a default state.
 * - Event Handling: Emits change events whenever the value of a child select element changes.
 * - Validation Support: Supports form validation attributes like required, minlength, and maxlength.
 * - Combined Options Property: Holds a property with a concatenation of all options from child select elements.
 * - Supports option groups: Allows grouping options in the same select element.
 *
 * It has these events:
 * - [x] change
 *
 * It has these attributes:
 * - [x] name for form submission
 * - [x] for (form id)
 * - [ ] maxlength
 * - [ ] minlength
 *
 * It has these properties:
 * - [x] options: a concatenation of all options from child select elements
 *
 * It has these slots:
 * - [x] default: contains the select elements
 *
 */
let InputChain = class InputChain extends LitElement {
    get selectTagName() {
        return this._selectTagName;
    }
    set selectTagName(newTagName) {
        this._selectTagName = newTagName;
        this.SELECT_QUERY = `:scope > ${this._selectTagName}`;
        this.OPTION_QUERY = `:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`;
        this.requestUpdate();
    }
    get optionTagName() {
        return this._optionTagName;
    }
    set optionTagName(newTagName) {
        this._optionTagName = newTagName;
        this.OPTION_QUERY = `:scope > ${this._selectTagName} > ${newTagName}, :scope > ${this._selectTagName} > optgroup > ${newTagName}`;
        this.requestUpdate();
    }
    constructor() {
        super();
        this.SELECT_QUERY = ':scope > select, :scope > custom-select';
        this.OPTION_QUERY = ':scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option';
        /**
         * Form id
         * This is the same API as input elements
         */
        this.for = '';
        /**
         * Name of the property
         * This is the same API as input elements
         */
        this.name = '';
        this.reactive = false;
        this._selectTagName = 'select';
        this._optionTagName = 'option';
        /**
         * Form setter
         * Handle formdata event to add the current value to the form
         */
        this._form = null;
        this.onChange_ = this.onChangeValue.bind(this);
        /**
         * Handle formdata event to add the current value to the form
         */
        this.onFormdata = (event) => {
            if (!this.name) {
                throw new Error('Attribute name is required for input-chain');
            }
            this.options
                .filter(option => option.selected)
                .forEach(option => {
                event.formData.append(this.name, option.value);
            });
        };
        this.redrawing = false;
    }
    set form(newForm) {
        if (this._form) {
            this._form.removeEventListener('formdata', this.onFormdata);
        }
        if (newForm) {
            newForm.addEventListener('formdata', this.onFormdata);
        }
    }
    get form() {
        return this._form;
    }
    /**
     * All selected options
     * @readonly
     */
    get options() {
        return Array.from(this.querySelectorAll(this.OPTION_QUERY));
    }
    /**
     * Render the component
     */
    render() {
        return html `
      <slot></slot>
    `;
    }
    connectedCallback() {
        super.connectedCallback();
        // Use the form to add formdata
        if (this.for) {
            const form = document.querySelector(`form#${this.for}`);
            if (form) {
                this.form = form;
            }
        }
        else {
            this.form = this.closest('form');
        }
        // Listen to slots changes
        this.shadowRoot.addEventListener('change', this.onChange_);
    }
    disconnectedCallback() {
        this.shadowRoot.removeEventListener('change', this.onChange_);
        this.form = null;
        super.disconnectedCallback();
    }
    /**
     * The data changed
     * Reset the steps after the change
     */
    onChangeValue(event) {
        const target = event.target;
        const children = Array.from(this.querySelectorAll(this.SELECT_QUERY));
        if (!children.includes(target)) {
            return;
        }
        this.changeAt(children.indexOf(target));
        // Dispatch our own event
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        this.requestUpdate();
    }
    /**
     * Reset the steps after the given index
     */
    changeAt(idx, reset = false) {
        if (this.redrawing)
            return;
        this.redrawing = true;
        if (this.reactive) {
            if (reset) {
                const children = Array.from(this.querySelectorAll(':scope > select, :scope > custom-select'));
                children[0].value = '';
            }
            this.dispatchEvent(new CustomEvent('change', { detail: { idx } }));
        }
        else {
            // Messes with lit:
            const children = Array.from(this.querySelectorAll(':scope > select, :scope > custom-select'));
            const target = idx >= 0 ? children[idx] : children[0];
            const next = (target === null || target === void 0 ? void 0 : target.value) ? children[idx + 1] : target || children[0];
            const nextIndex = (target === null || target === void 0 ? void 0 : target.value) ? idx + 1 : idx;
            if (next) {
                // Remove all elements after next
                children.slice(nextIndex + 1)
                    .forEach(child => child.remove());
                // Reset next
                next.value = '';
            }
            this.dispatchEvent(new Event('change'));
        }
        this.redrawing = false;
    }
};
InputChain.styles = inputChainStyles;
__decorate([
    property({ type: String, attribute: 'for' })
], InputChain.prototype, "for", void 0);
__decorate([
    property({ type: String })
], InputChain.prototype, "name", void 0);
__decorate([
    property({ type: Boolean })
], InputChain.prototype, "reactive", void 0);
__decorate([
    property({ type: String, attribute: 'select-tag-name' })
], InputChain.prototype, "selectTagName", null);
__decorate([
    property({ type: String, attribute: 'option-tag-name' })
], InputChain.prototype, "optionTagName", null);
__decorate([
    property({ type: Array })
], InputChain.prototype, "options", null);
InputChain = __decorate([
    customElement('input-chain')
], InputChain);
export { InputChain };
//# sourceMappingURL=input-chain.js.map