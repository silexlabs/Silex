import { LitElement } from 'lit'

export default class StylableElement extends LitElement {
  override connectedCallback() {
    super.connectedCallback();
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(style => {
        this.shadowRoot?.appendChild(style.cloneNode(true));
    });
  }
}