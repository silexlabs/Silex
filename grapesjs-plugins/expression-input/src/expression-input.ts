import {html} from 'lit'
import {classMap} from 'lit/directives/class-map.js'
import {property} from 'lit/decorators.js'
import {InputChain} from './input-chain.js'

/**
 * @element expression-input
 * Web component to create an expression
 * Extends the InputChain component and adds
 * - [x] fixed value UI
 * - [x] dirty state
 * - [x] placeholder
 * - [x] reset mechanism
 * - [x] copy/paste whole expressions (using clipboard API)
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
  /**
   * Read only property dirty
   * @readonly
   */
  get dirty() {
    //return JSON.stringify(this.value) !== JSON.stringify(this.initialValue)
    return this.value.length > 0
  }

  /**
   * Value is the concatenation of all options' values
   * @readonly
   */
  get value(): string[] {
    return this.fixed
      ? ([this.getFixedInput()?.value].filter((v) => !!v) as string[])
      : this.options.filter((o) => o.selected && o.value).map((o) => o.value)
  }

  /**
   * Initial value to be set to track changes
   */
  //initialValue: string[] = []
  //initialContent: Node[] = []

  @property({type: Boolean, attribute: 'allow-fixed'})
  allowFixed = true

  private _fixed = false

  @property({type: Boolean, attribute: 'fixed', reflect: true})
  get fixed() {
    return this._fixed
  }
  set fixed(value) {
    this._fixed = value
    this.dispatchEvent(new Event('fixedChange'))
  }

  @property()
  placeholder = 'Enter a fixed value or switch to expression'

  private static readonly STORAGE_KEY = 'expression-input-clipboard'

  /**
   * Check if there's something to paste from localStorage
   */
  get canPaste(): boolean {
    try {
      const stored = localStorage.getItem(ExpressionInput.STORAGE_KEY)
      return !!stored
    } catch {
      return false
    }
  }

  override connectedCallback() {
    super.connectedCallback()
    //this.save()
  }

  /**
   * Copy the current expression to localStorage
   */
  copy(): void {
    const data = {
      type: 'expression-input',
      fixed: this.fixed,
      value: this.value,
    }

    try {
      localStorage.setItem(ExpressionInput.STORAGE_KEY, JSON.stringify(data))
      this.dispatchEvent(new CustomEvent('copy', {detail: data}))
      this.requestUpdate() // Update UI to show paste icon
    } catch (err) {
      console.error('Failed to copy expression:', err)
      throw err
    }
  }

  /**
   * Paste an expression from localStorage
   */
  async paste(): Promise<void> {
    try {
      const text = localStorage.getItem(ExpressionInput.STORAGE_KEY)
      if (!text) {
        throw new Error('No expression to paste')
      }

      const data = JSON.parse(text)

      // Validate the data format
      if (data.type !== 'expression-input' || !Array.isArray(data.value)) {
        throw new Error('Invalid expression data format')
      }

      // Restore the expression
      this.fixed = data.fixed

      if (this.fixed) {
        // Restore fixed value
        const input = this.getFixedInput()
        if (input && data.value.length > 0) {
          input.value = data.value[0]
        }
      } else {
        // Restore expression by selecting the right options
        await this.restoreExpression(data.value)
      }

      this.dispatchEvent(new CustomEvent('paste', {detail: data}))
      this.dispatchEvent(new Event('change'))
      this.requestUpdate()
    } catch (err) {
      console.error('Failed to paste expression:', err)
      throw err
    }
  }

  /**
   * Restore an expression by selecting options with the given values
   */
  private async restoreExpression(values: string[]): Promise<void> {
    // First, clear the current expression if any
    const currentSelects = Array.from(
      this.querySelectorAll(this.SELECT_QUERY)
    ) as HTMLSelectElement[]

    // If we have more than one select, reset from the first one
    if (currentSelects.length > 1) {
      // Reset the first select to trigger cleanup
      currentSelects[0].value = ''
      currentSelects[0].dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Restore each value sequentially
    for (let i = 0; i < values.length; i++) {
      const value = values[i]

      // Get the current selects
      const selects = Array.from(
        this.querySelectorAll(this.SELECT_QUERY)
      ) as HTMLSelectElement[]

      const select = selects[i]
      if (select) {
        // Find and select the option
        const option = Array.from(select.options).find(o => o.value === value)
        if (option) {
          option.selected = true
          select.value = value
          // Dispatch change event to trigger creation of next select
          select.dispatchEvent(new Event('change', { bubbles: true }))
          // Wait for the next select to be created
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    }
  }

  /**
   * Render the component
   */
  override render() {
    const dirty = this.dirty
    return html`
      <!-- header -->
      <header part="header" class="header">
        <label>
          <div
            class=${classMap({dirty, 'property-name': true})}
            part="property-name"
          >
            <slot name="label"></slot>
            ${dirty
              ? html`
                  <slot
                    name="dirty-icon"
                    part="dirty-icon"
                    class="dirty-icon"
                    @click=${this.reset}
                    title="Clear expression"
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                      ></path>
                    </svg>
                  </slot>
                  <slot
                    name="copy-icon"
                    part="copy-icon"
                    class="copy-icon"
                    @click=${this.copy}
                    title="Copy expression"
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                      ></path>
                    </svg>
                  </slot>
                `
              : html``}
            ${this.canPaste
              ? html`
                  <slot
                    name="paste-icon"
                    part="paste-icon"
                    class="paste-icon"
                    @click=${this.paste}
                    title="Paste expression"
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"
                      ></path>
                    </svg>
                  </slot>
                `
              : html``}
          </div>
          ${this.allowFixed
            ? html`
                <div part="fixed-selector" class="fixed-selector">
                  <span
                    class=${classMap({
                      active: this.fixed,
                      'fixed-selector-fixed': true,
                    })}
                    @click=${() => (this.fixed = true)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        this.fixed = true
                      }
                    }}
                    part="fixed-selector-fixed"
                    tabindex="0"
                    role="button"
                    >Fixed</span
                  >
                  <span
                    class=${classMap({
                      active: !this.fixed,
                      'fixed-selector-expression': true,
                    })}
                    @click=${() => (this.fixed = false)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        this.fixed = false
                      }
                    }}
                    part="fixed-selector-expression"
                    tabindex="0"
                    role="button"
                    >Expression</span
                  >
                </div>
              `
            : html``}
        </label>
      </header>
      <div
        part="property-container"
        class=${classMap({'property-container': true, fixed: this.fixed})}
      >
        <slot class="hide-when-fixed"
          >${this.options.length ? '' : this.placeholder}</slot
        >
        <slot name="fixed" part="fixed" class="show-when-fixed"></slot>
      </div>
    `
  }

  /**
   * Reset dirty flag and restore the initial value
   */
  reset() {
    if (this.fixed) {
      const input = this.getFixedInput()
      if (input) {
        input.value = ''
      } else {
        throw new Error('Input not found for fixed value')
      }
    } else {
      this.changeAt(-1, true)
    }
    this.dispatchEvent(new Event('change'))
    this.requestUpdate()
  }

  getFixedInput(): HTMLInputElement | null {
    return this.querySelector('input, textarea')
  }
}

if (!window.customElements.get('expression-input')) {
  window.customElements.define('expression-input', ExpressionInput)
}
