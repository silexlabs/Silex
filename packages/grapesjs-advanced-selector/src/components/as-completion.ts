import { LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

/**
 * @fileoverview This component handles the completion of the selector manager, i.e the list of tags and css classes that can be added to the selected component
 */

@customElement('as-completion')
export class AsCompletion extends LitElement {
  //input.addEventListener('keydown', (event: KeyboardEvent) => {
  //  if (event.key === 'Enter') {
  //    input.contentEditable = 'false'
  //    this.dispatchEvent(new CustomEvent('change', { detail: { selector: input.innerText } }))
  //  } else if (event.key === 'Escape') {
  //    input.contentEditable = 'false'
  //  }
  //})
}

declare global {
  interface HTMLElementTagNameMap {
    'as-completion': AsCompletion
  }
}
