import {LitElement, html} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import { inputChainStyles } from './styles.js'

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

@customElement('input-chain')
export class InputChain extends LitElement {
  static override styles = inputChainStyles

  /**
   * Form id
   * This is the same API as input elements
   */
  @property({type: String, attribute: 'for'})
  for = ''

  /**
   * Name of the property
   * This is the same API as input elements
   */
  @property({type: String})
  name = ''

  constructor() {
    super()
  }

  /**
   * Form setter
   * Handle formdata event to add the current value to the form
   */
  protected _form: HTMLFormElement | null = null
  protected set form(newForm: HTMLFormElement | null) {
    if(this._form) {
      this._form.removeEventListener('formdata', this.onFormdata)
    }
    if(newForm) {
      newForm.addEventListener('formdata', this.onFormdata)
    }
  }
  protected get form() {
    return this._form
  }

  /**
   * All selected options
   * @readonly
   */
  @property({type: Array})
  get options(): HTMLOptionElement[] {
    return Array.from(this.querySelectorAll(':scope > select option, :scope > select custom-option'))
  }

  private onChange_ = this.onChange.bind(this)

  /**
   * Handle formdata event to add the current value to the form
   */
  protected onFormdata = (event: FormDataEvent) => {
    if(!this.name) {
      throw new Error('Attribute name is required for input-chain')
    }
    this.options
    .filter(option => option.selected)
    .forEach(option => {
      event.formData.append(this.name, option.value)
    })
  }

  /**
   * Render the component
   */
  override render() {
    return html`
      <slot></slot>
    `
  }

  override connectedCallback() {
    super.connectedCallback()
    // Use the form to add formdata
    if(this.for) {
      const form = document.querySelector<HTMLFormElement>(`form#${this.for}`)
      if(form) {
        this.form = form
      }
    } else {
      this.form = this.closest('form')
    }
    // Listen to slots changes
    this.shadowRoot!.addEventListener('change', this.onChange_)
  }

  override disconnectedCallback() {
    this.removeEventListener('change', this.onChange_)
    this.form = null
    super.disconnectedCallback()
  }

  /**
   * The data changed
   * Reset the steps after the change
   */
  private onChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const children = Array.from(this.querySelectorAll(':scope > select, :scope > custom-select')) as HTMLSelectElement[]
    if(!children.includes(target)) {
      return
    }
    this.changeAt(children.indexOf(target))
    // Dispatch our own event
    event.preventDefault()
    event.stopImmediatePropagation()
    this.dispatchEvent(new Event('change'))
    this.requestUpdate()
  }

  /**
   * Reset the steps after the given index
   */
  protected changeAt(idx: number) {
    const children = Array.from(this.querySelectorAll(':scope > select, :scope > custom-select')) as HTMLSelectElement[]
    const target = idx >= 0 ? children[idx] : null
    const next = target?.value ? children[idx+1] : target || children[0]
    const nextIndex = target?.value ? idx+1 : idx
    if(next) {
      // Remove all elements after next
      children.slice(nextIndex + 1)
        .forEach(child => child.remove())
      // Reset next
      next.value = ''
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-chain': InputChain
  }
}

