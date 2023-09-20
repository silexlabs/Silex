var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
/**
 * @element popin-dialog
 * @fires {CustomEvent} popin-dialog-closed - Fires when the dialog is closed
 * @fires {CustomEvent} popin-dialog-opened - Fires when the dialog is opened
 * @cssprop {Color} --popin-dialog-background - The background color of the dialog
 * @cssprop {Color} --popin-dialog-header-background - The background color of the header
 * @cssprop {Color} --popin-dialog-body-background - The background color of the body
 * @cssprop {Color} --popin-dialog-footer-background - The background color of the footer
 * @cssprop {Color} --popin-dialog-header-color - The text color of the header
 * @cssprop {Color} --popin-dialog-body-color - The text color of the body
 * @cssprop {Color} --popin-dialog-footer-color - The text color of the footer
 * @cssprop {Border} --popin-dialog-header-border-bottom - The border of the header
 * @cssprop {Border} --popin-dialog-footer-border-top - The border of the footer
 * @cssprop {Padding} --popin-dialog-header-padding - The padding of the header
 * @cssprop {Padding} --popin-dialog-body-padding - The padding of the body
 * @cssprop {Padding} --popin-dialog-footer-padding - The padding of the footer
 *
 * This PopinDialog component is a simple dialog that can be used to display any html on top of your UI
 * It is not a modal, it is not blocking the UI, it is just a simple dialog that will catch focus and hide when the user press escape or click outside of it
 * The dialog will be automatically positioned where placed in the DOM but it will be moved and resized to be fully visible on all screen sizes
 * Usage:
 * ```
 * <popin-dialog hidden style="width: 400px">
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-dialog>
 * ```
 */
let PopinDialog = class PopinDialog extends LitElement {
    constructor() {
        super();
        this.hidden = false;
        this.ensureElementInView_ = this.ensureElementInView.bind(this);
        this.setAttribute('tabindex', "0");
        this.onkeydown = (event) => this.keydown(event);
        this.onblur = () => this.blured();
    }
    render() {
        setTimeout(() => this.ensureElementInView());
        return html `
      <header>
        <slot class="header" name="header"></slot>
      </header>
      <main>
        <slot class="body" name="body"></slot>
        <slot class="default"></slot>
      </main>
      <footer>
        <slot class="footer" name="footer"></slot>
      </footer>
    `;
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this.ensureElementInView_);
    }
    disconnectedCallback() {
        window.removeEventListener('resize', this.ensureElementInView_);
        super.disconnectedCallback();
    }
    blured() {
        this.setAttribute('hidden', '');
    }
    keydown(event) {
        if (event.key === 'Escape') {
            this.blur();
        }
    }
    attributeChangedCallback(name, _old, value) {
        super.attributeChangedCallback(name, _old, value);
        if (name === 'hidden' && value === null) {
            this.focus();
        }
    }
    ensureElementInView() {
        // Reset the position
        this.style.left = '';
        this.style.top = '';
        // Get the element's bounding rectangle
        const rect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Check if the element is out of the viewport on the right side
        if (rect.right > viewportWidth) {
            this.style.left = `${viewportWidth - rect.width}px`;
        }
        // Check if the element is out of the viewport on the left side
        if (rect.left < 0) {
            this.style.left = '0px';
        }
        // Check if the element is out of the viewport on the bottom
        if (rect.bottom > viewportHeight) {
            this.style.top = `${viewportHeight - rect.height}px`;
        }
        // Check if the element is out of the viewport on the top
        if (rect.top < 0) {
            this.style.top = '0px';
        }
    }
};
PopinDialog.styles = css `
  :host {
  --popin-dialog-background: #fff;
  --popin-dialog-header-background: #f5f5f5;
  --popin-dialog-body-background: #f5f5f5;
  --popin-dialog-footer-background: #f5f5f5;
  --popin-dialog-header-color: #333;
  --popin-dialog-body-color: #666;
  --popin-dialog-footer-color: #333;
  --popin-dialog-header-border-bottom: none;
  --popin-dialog-footer-border-top: none;
  --popin-dialog-header-padding: 0;
  --popin-dialog-body-padding: 5px;
  --popin-dialog-footer-padding: 0;
}
    :host {
      display: inline-block;
      position: absolute;
      max-width: 100%;
      box-sizing: border-box;
      z-index: 1000; /* Ensure it's on top of other content */
      border-radius: 8px;
      overflow: hidden; /* To ensure border-radius applies to children elements */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      display: inline-flex;
      flex-direction: column;
      background-color: var(--popin-dialog-background);
    }
    :host([hidden]) {
      display: none;
    }

header {
  border-bottom: var(--popin-dialog-header-border-bottom);
  background-color: var(--popin-dialog-header-background);
  padding: var(--popin-dialog-header-padding);
}

footer {
  border-top: var(--popin-dialog-footer-border-top);
  display: flex;
  justify-content: flex-end;
  background-color: var(--popin-dialog-footer-background);
  padding: var(--popin-dialog-footer-padding);
}

main {
  background-color: var(--popin-dialog-body-background);
  padding: var(--popin-dialog-body-padding);
}
  `;
__decorate([
    property()
], PopinDialog.prototype, "hidden", void 0);
PopinDialog = __decorate([
    customElement('popin-dialog')
], PopinDialog);
export { PopinDialog };
//# sourceMappingURL=popin-dialog.js.map