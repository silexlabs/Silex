import {LitElement, html} from 'lit'
import {property} from 'lit/decorators.js'
import {inputChainStyles} from './styles.js'

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
 * - [x] reactive (the parent app needs to update the options on change)
 * - [x] select-tag-name (default: select) to change the tag name of the select elements
 * - [x] option-tag-name (default: option) to change the tag name of the option elements
 * - [ ] required
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

export class InputChain extends LitElement {
  static override styles = inputChainStyles
  SELECT_QUERY = ':scope > select, :scope > custom-select'
  OPTION_QUERY =
    ':scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option'

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

  @property({type: Boolean})
  reactive = false

  _selectTagName = 'select'
  @property({type: String, attribute: 'select-tag-name'})
  get selectTagName() {
    return this._selectTagName
  }
  set selectTagName(newTagName: string) {
    this._selectTagName = newTagName
    this.SELECT_QUERY = `:scope > ${this._selectTagName}`
    this.OPTION_QUERY = `:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`
    this.requestUpdate()
  }

  _optionTagName = 'option'
  @property({type: String, attribute: 'option-tag-name'})
  get optionTagName() {
    return this._optionTagName
  }
  set optionTagName(newTagName: string) {
    this._optionTagName = newTagName
    this.OPTION_QUERY = `:scope > ${this._selectTagName} > ${newTagName}, :scope > ${this._selectTagName} > optgroup > ${newTagName}`
    this.requestUpdate()
  }

  constructor() {
    super()
  }

  /**
   * Form setter
   * Handle formdata event to add the current value to the form
   */
  protected _form: HTMLFormElement | null = null
  protected set form(newForm: HTMLFormElement | null) {
    if (this._form) {
      this._form.removeEventListener('formdata', this.onFormdata)
    }
    if (newForm) {
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
    return Array.from(this.querySelectorAll(this.OPTION_QUERY))
  }

  private onChange_ = this.onChangeValue.bind(this)

  /**
   * Handle formdata event to add the current value to the form
   */
  protected onFormdata = (event: FormDataEvent) => {
    if (!this.name) {
      throw new Error('Attribute name is required for input-chain')
    }
    this.options
      .filter((option) => option.selected)
      .forEach((option) => {
        event.formData.append(this.name, option.value)
      })
  }

  /**
   * Render the component
   */
  override render() {
    return html` <slot></slot> `
  }

  override connectedCallback() {
    super.connectedCallback()
    // Use the form to add formdata
    if (this.for) {
      const form = document.querySelector<HTMLFormElement>(`form#${this.for}`)
      if (form) {
        this.form = form
      }
    } else {
      this.form = this.closest('form')
    }
    // Listen to slots changes
    this.shadowRoot!.addEventListener('change', this.onChange_)
  }

  override disconnectedCallback() {
    this.shadowRoot!.removeEventListener('change', this.onChange_)
    this.form = null
    super.disconnectedCallback()
  }

  /**
   * The data changed
   * Reset the steps after the change
   */
  private onChangeValue(event: Event) {
    const target = event.target as HTMLSelectElement
    const children = Array.from(this.querySelectorAll(this.SELECT_QUERY))

    if (!children.includes(target)) {
      return
    }
    this.changeAt(children.indexOf(target))
    // Dispatch our own event
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    this.requestUpdate()
  }

  private redrawing = false
  /**
   * Reset the steps after the given index
   */
  protected changeAt(idx: number, reset = false) {
    if (this.redrawing) return
    this.redrawing = true
    if (this.reactive) {
      if (reset) {
        const children = Array.from(
          this.querySelectorAll(':scope > select, :scope > custom-select')
        ) as HTMLSelectElement[]
        children.forEach(child => child.value = '')
      }
      this.dispatchEvent(new CustomEvent('change', {detail: {idx}}))
    } else {
      // Messes with lit:
      const children = Array.from(
        this.querySelectorAll(':scope > select, :scope > custom-select')
      ) as HTMLSelectElement[]
      const target = idx >= 0 ? children[idx] : children[0]
      const next = target?.value ? children[idx + 1] : target || children[0]
      const nextIndex = target?.value ? idx + 1 : idx
      if (next) {
        // Remove all elements after next
        children.slice(nextIndex + 1).forEach((child) => child.remove())
        // Reset next
        next.value = ''
      }
      this.dispatchEvent(new Event('change'))
    }
    this.redrawing = false
  }
}

if (!window.customElements.get('input-chain')) {
  window.customElements.define('input-chain', InputChain)
}
