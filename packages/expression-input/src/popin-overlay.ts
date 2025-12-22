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
  private resizeObserver_: ResizeObserver | null = null
  private originalParent_: HTMLElement | null = null
  private originalNextSibling_: Node | null = null

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
    // Watch for size changes (e.g., when content changes)
    this.resizeObserver_ = new ResizeObserver(() => this.ensureElementInView())
    this.resizeObserver_.observe(this)
  }

  override disconnectedCallback() {
    window.removeEventListener('resize', this.resized_)
    window.removeEventListener('blur', this.blured_)
    this.removeEventListener('blur', this.blured_)
    this.removeEventListener('keydown', this.keydown_)
    this.resizeObserver_?.disconnect()
    this.resizeObserver_ = null
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
      // Move to body to avoid containing block issues (e.g., backdrop-filter)
      this.originalParent_ = this.parentElement
      this.originalNextSibling_ = this.nextSibling
      document.body.appendChild(this)
      // Delay focus to let the click event fully complete
      setTimeout(() => {
        this.focus()
      }, 0)
      this.dispatchEvent(new CustomEvent('popin-opened'))
    }
    if (name === 'hidden' && value !== null) {
      // Move back to original location
      if (this.originalParent_) {
        this.originalParent_.insertBefore(this, this.originalNextSibling_)
        this.originalParent_ = null
        this.originalNextSibling_ = null
      }
      this.dispatchEvent(new CustomEvent('popin-closed'))
    }
  }

  protected ensureElementInView() {
    // Adjust position to keep the element within viewport boundaries
    const rect = this.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Adjust if out of viewport on the right
    if (rect.right > viewportWidth) {
      const currentLeft = parseFloat(this.style.left) || 0
      this.style.left = `${currentLeft - (rect.right - viewportWidth)}px`
    }
    // Adjust if out of viewport on the left
    if (rect.left < 0) {
      this.style.left = '0px'
    }
    // Adjust if out of viewport on the bottom
    if (rect.bottom > viewportHeight) {
      const currentTop = parseFloat(this.style.top) || 0
      this.style.top = `${currentTop - (rect.bottom - viewportHeight)}px`
    }
    // Adjust if out of viewport on the top
    if (rect.top < 0) {
      this.style.top = '0px'
    }
  }
}

if (!window.customElements.get('popin-overlay')) {
  window.customElements.define('popin-overlay', PopinOverlay)
}
