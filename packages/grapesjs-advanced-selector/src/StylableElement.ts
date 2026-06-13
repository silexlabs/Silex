import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

export default class StylableElement extends LitElement {
  @property()
    t: (key: string) => string = (key) => key

  override connectedCallback() {
    super.connectedCallback()
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
    styles.forEach(style => {
      this.shadowRoot?.appendChild(style.cloneNode(true))
    })
  }
}
