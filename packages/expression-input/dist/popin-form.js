var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { PopinOverlay } from './popin-overlay.js';
/**
 * This component extends the `<popin-overlay>` component and the native `<form>` tag
 * It handles form submissions both as an input for the parent form and with it's children inputs
 *
 * Usage:
 *
 * ```
 * <popin-form hidden style="width: 400px" no-auto-close>
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-form>
 * ```
 *
 * @element popin-form
 * @htmltag popin-form
 * @htmlslot header - The header of the dialog
 * @htmlslot default - The body of the dialog
 * @htmlslot footer - The footer of the dialog
 * @cssprop {Color} --popin-form-header-background - The background color of the header
 * @cssprop {Color} --popin-form-body-background - The background color of the body
 * @cssprop {Color} --popin-form-footer-background - The background color of the footer
 * @cssprop {Color} --popin-form-header-color - The text color of the header
 * @cssprop {Color} --popin-form-body-color - The text color of the body
 * @cssprop {Color} --popin-form-footer-color - The text color of the footer
 * @cssprop {Border} --popin-form-header-border-bottom - The border of the header
 * @cssprop {Border} --popin-form-footer-border-top - The border of the footer
 * @cssprop {Padding} --popin-form-header-padding - The padding of the header
 * @cssprop {Padding} --popin-form-body-padding - The padding of the body
 * @cssprop {Padding} --popin-form-footer-padding - The padding of the footer
 * @cssprop {Color} --popin-button-background - The background color of the button
 * @cssprop {Color} --popin-button-color - The text color of the button
 * @cssprop {Color} --popin-button-hover-background - The background color of the button when hovered
 * @cssprop {Color} --popin-button-hover-color - The text color of the button when hovered
 * @cssprop {Border} --popin-button-border - The border of the button
 * @cssprop {Border} --popin-button-hover-border - The border of the button when hovered
 * @cssprop {Padding} --popin-button-padding - The padding of the button
 * @cssprop {Padding} --popin-button-hover-padding - The padding of the button when hovered
 * @cssprop {Margin} --popin-button-margin - The margin of the button
 * @cssprop {Margin} --popin-button-hover-margin - The margin of the button when hovered
 * @cssprop {BorderRadius} --popin-form-border-radius - The border radius of the dialog
 * @cssprop {Color} --popin-button-background--secondary - The background color of the secondary button
 * @cssprop {Color} --popin-button-color--secondary - The text color of the secondary button
 * @cssprop {Color} --popin-button-hover-background--secondary - The background color of the secondary button when hovered
 * @cssprop {Color} --popin-button-hover-color--secondary - The text color of the secondary button when hovered
 * @cssprop {Border} --popin-button-border--secondary - The border of the secondary button
 * @cssprop {Border} --popin-button-hover-border--secondary - The border of the secondary button when hovered
 * @cssprop {Padding} --popin-button-padding--secondary - The padding of the secondary button
 * @cssprop {Padding} --popin-button-hover-padding--secondary - The padding of the secondary button when hovered
 * @cssprop {Margin} --popin-button-margin--secondary - The margin of the secondary button
 * @cssprop {Margin} --popin-button-hover-margin--secondary - The margin of the secondary button when hovered
 *
 */
export class PopinForm extends PopinOverlay {
    constructor() {
        super(...arguments);
        /**
         * Form id
         * This is the same API as input elements
         */
        this.for = '';
        this.name = '';
        this.formData = new FormData();
        this.onFormdata_ = this.onFormdata.bind(this);
        this.slotChanged_ = this.slotChanged.bind(this);
        /**
         * Form setter
         * Handle formdata event to add the current value to the form
         */
        this._form = null;
        /**
         * Handle slot change to update the form
         */
        this.inputs = [];
    }
    set form(newForm) {
        if (this._form) {
            this._form.removeEventListener('formdata', this.onFormdata_);
        }
        if (newForm) {
            newForm.addEventListener('formdata', this.onFormdata_);
        }
    }
    get form() {
        return this._form;
    }
    get value() {
        this.updateFormData();
        return Object.fromEntries(this.formData.entries());
    }
    render() {
        super.render(); // For placement
        return html `
      <form @submit=${this.submit} @change=${this.change}>
        <header>
          <slot class="header" name="header"></slot>
        </header>
        <main>
          <slot class="body" part="body"></slot>
        </main>
        <footer>
          <slot class="footer" name="footer">
            <button type="button" class="secondary" @click=${this.close}>
              Cancel
            </button>
            <button type="submit">Apply</button>
          </slot>
        </footer>
      </form>
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
        this.shadowRoot.addEventListener('slotchange', this.slotChanged_);
        // Update current list of inputs
        this.slotChanged();
    }
    disconnectedCallback() {
        this.removeEventListener('slotchange', this.slotChanged_);
        this.form = null;
        super.disconnectedCallback();
    }
    slotChanged() {
        this.inputs = Array.from(this.querySelectorAll('input, select, textarea, [data-is-input]'));
    }
    /**
     * Handle formdata event to add the current value to the form
     */
    onFormdata(event) {
        event.preventDefault();
        const formData = event.formData;
        for (const [key, value] of this.formData.entries()) {
            formData.set(`${this.name}-${key}`, value);
        }
    }
    updateFormData() {
        this.formData = new FormData();
        for (const input of this.inputs) {
            this.formData.set(input.getAttribute('name'), input.value);
        }
    }
    submit(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.updateFormData();
        this.close();
        this.dispatchEvent(new Event('change'));
    }
    change(event) {
        const me = event.target.closest(this.tagName);
        if (me === this) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
}
__decorate([
    property({ type: String, attribute: 'for' })
], PopinForm.prototype, "for", void 0);
__decorate([
    property({ type: String })
], PopinForm.prototype, "name", void 0);
if (!window.customElements.get('popin-form')) {
    window.customElements.define('popin-form', PopinForm);
}
//# sourceMappingURL=popin-form.js.map