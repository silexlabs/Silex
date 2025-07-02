import {LitElement, html} from 'lit'
import {property} from 'lit/decorators.js'
import {popinStyles} from './styles.js'

/**
 * This PopinOverlay component is a simple dialog that can be used to display any html on top of your UI
 * It is not a modal, it is not blocking the UI, it is just a simple dialog that will catch focus and hide when the user press escape or click outside of it
 * The dialog will be automatically positioned where placed in the DOM but it will be moved and resized to be fully visible on all screen sizes
 *
 * Usage:
 *
 * ```
 * <popin-overlay hidden style="width: 400px" no-auto-close>
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-overlay>
 * ```
 *
 * @element popin-overlay
 * @htmltag popin-overlay
 * @htmlslot The content of the dialog
 * @htmlattr hidden - Hide the dialog
 * @htmlattr no-auto-close - Do not close the dialog when the user click outside of it
 * @fires {CustomEvent} popin-closed - Fires when the dialog is closed
 * @fires {CustomEvent} popin-opened - Fires when the dialog is opened
 * @cssprop {Color} --popin-background - The background color of the dialog
 * @cssprop {Color} --popin-color - The text color of the dialog
 *
 */

export class PopinOverlay extends LitElement {
  static override styles = popinStyles

  @property()
  override hidden = false

  @property({type: Boolean, attribute: 'no-auto-close'})
  noAutoClose = false

  private resized_ = this.ensureElementInView.bind(this)
  private blured_ = this.blured.bind(this)
  private keydown_ = this.keydown.bind(this)

  override render() {
    setTimeout(() => this.ensureElementInView())
    return html` <slot></slot> `
  }

  override connectedCallback() {
    super.connectedCallback()
    // Make the element focusable
    this.setAttribute('tabindex', '0')
    // Attach events on this instance
    this.addEventListener('blur', this.blured_)
    this.addEventListener('keydown', this.keydown_)
    // Attach elements on window
    window.addEventListener('resize', this.resized_)
    window.addEventListener('blur', this.blured_)
  }

  override disconnectedCallback() {
    window.removeEventListener('resize', this.resized_)
    window.removeEventListener('blur', this.blured_)
    this.removeEventListener('blur', this.blured_)
    this.removeEventListener('keydown', this.keydown_)
    super.disconnectedCallback()
  }

  private getActiveElementRecursive(
    element: Element | null = document.activeElement
  ): Element | null {
    if (element?.shadowRoot) {
      return this.getActiveElementRecursive(
        element.shadowRoot.activeElement as HTMLElement
      )
    }
    return element
  }

  private blured() {
    if (this.noAutoClose) return

    // Give the time to the click event to be processed
    setTimeout(() => {
      // Check if the focus is still inside the dialog
      const focusedElement = this.getActiveElementRecursive()
      let popin = focusedElement as Node | ShadowRoot | null
      while (popin && popin !== this) {
        popin = popin.parentNode || (popin as ShadowRoot).host
      }
      if (popin !== this) {
        // Hide the dialog
        this.close()
      } else {
        // Focus the dialog again so that this function
        // will be called again when the user click outside
        //this.focus()
      }
    })
  }

  protected close() {
    this.setAttribute('hidden', '')
    this.blur()
  }

  private keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close()
    }
  }

  override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ): void {
    super.attributeChangedCallback(name, _old, value)
    if (name === 'hidden' && value === null) {
      this.focus()
      this.dispatchEvent(new CustomEvent('popin-opened'))
    }
    if (name === 'hidden' && value !== null) {
      this.dispatchEvent(new CustomEvent('popin-closed'))
    }
  }

  protected ensureElementInView() {
    // Set our position to the parent element position
    const parentStyle = this.parentElement?.getBoundingClientRect()
    this.style.left = `${parentStyle?.left}px`
    this.style.top = `${parentStyle?.top}px`

    const offsetX = 0
    const offsetY = 0

    // // Get the element's bounding rectangle
    const rect = this.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Check if the element is out of the viewport on the right side
    if (rect.left + rect.width + offsetX > viewportWidth) {
      this.style.left = `${viewportWidth - rect.width - offsetX}px`
    }

    // Check if the element is out of the viewport on the left side
    if (rect.left + offsetX < 0) {
      this.style.left = `${-offsetX}px`
    }

    // Check if the element is out of the viewport on the bottom
    if (rect.top + rect.height + offsetY > viewportHeight) {
      this.style.top = `${viewportHeight - rect.height - offsetY}px`
    }

    // Check if the element is out of the viewport on the top
    if (rect.top + offsetY < 0) {
      this.style.top = `${-offsetY}px`
    }
  }
}

if (!window.customElements.get('popin-overlay')) {
  window.customElements.define('popin-overlay', PopinOverlay)
}
