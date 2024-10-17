import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('as-selector-display')
export class ASSelectorDisplay extends LitElement {
  override render() {
      return html`<div>Selected:</div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'as-selector-display': ASSelectorDisplay
  }
}

