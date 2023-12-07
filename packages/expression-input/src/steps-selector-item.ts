import {LitElement, html, TemplateResult} from 'lit'
import { Ref, createRef, ref } from 'lit/directives/ref.js'
import {customElement, property} from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { stepsSelectorItemStyles } from './styles.js'

import './popin-dialog.js'

/**
 * @element steps-selector-item
 * This class is a step in the selection of the steps-selector component
 * 
 * It has these events:
 * - set
 * - delete
 * - edit-options
 * - edit-value
 * 
 * These actions can be done by clicking on buttons in the UI:
 * - open popin with list of choices to select from
 * - open popin with form to edit the options
 * - delete the step
 * 
 * It displays these texts:
 * - icon
 * - name
 * - tags
 * - type
 * - help text
 * - error or warning text
 * 
 * Usage:
 * ```
 * <steps-selector-item>
 *   <div slot="icon"><svg>...</svg></div>
 *   <div slot="name">My step</div>
 *   <ul slot="tags">
 *     <li>tag1</li>
 *     <li>tag2</li>
 *   </ul>
 *   <div slot="type">string</div>
 *   <div slot="helpText"><p>Some help text</p></div>
 *   <div slot="errorText"><p>Some error text</p></div>
 * </steps-selector-item>
 * ```
 */

@customElement('steps-selector-item')
export class StepsSelectorItem extends LitElement {
  static override styles = stepsSelectorItemStyles

  private _selectedItem = ''
  get selectedItem() {
    return this._selectedItem
  }
  set selectedItem(value: string) {
    this._selectedItem = value
    this.dispatchEvent(new CustomEvent('set', {detail: {value}}))
  }

  @property({type: Boolean, attribute: 'no-options-editor'})
  noOptionsEditor = false

  @property({type: Boolean, attribute: 'no-delete'})
  noDelete = false

  @property({type: Boolean, attribute: 'no-arrow'})
  noArrow = false

  @property({type: Boolean, attribute: 'no-info'})
  noInfo = false

  get values() {
    const list = this.querySelector('slot[name="values"]') as HTMLUListElement
    return Array.from(list?.querySelectorAll('li') || []).map(li => li.getAttribute('value') ?? '')
  }

  helpTextPopin: Ref<HTMLElement> = createRef()
  helpTextSlot: Ref<HTMLElement> = createRef()
  valuesPopin: Ref<HTMLElement> = createRef()
  optionsPopin: Ref<HTMLElement> = createRef()

  constructor() {
    super()
  }

  override render() {
    return html`
      <header part="header">
        <div class="value" part="value" @click=${() => this.editValue()}>
          <slot part="icon" name="icon"></slot>
          <slot part="name" name="name"></slot>
          <slot part="type" name="type" class=${classMap({ 'with-arrow': !this.noArrow })}></slot>
        </div>
        <popin-dialog hidden ${ref(this.valuesPopin)} @click=${(e: MouseEvent) => this.selectValue(e)}>
          <slot part="values" name="values"></slot>
        </popin-dialog>
        ${this.noInfo ? '' : html`
          <div part="separator__info"></div>
          <slot
            class="svg-icon"
            name="helpTitle"
            @click=${() => this.showHelpText()}
            title="Info"
            >
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 448c-105.9 0-192-86.1-192-192S150.1 64 256 64s192 86.1 192 192S361.9 448 256 448zM240 160h32v32h-32V160zM240 192h32v128h-32V192zM240 352h32v32h-32V352z"/></svg>
          </slot>
          <popin-dialog hidden ${ref(this.helpTextPopin)}>
            <slot part="helpText" "name="helpText"></slot>
          </popin-dialog>
        `}
        <div class="buttons">
          ${this.noOptionsEditor ? '' : html`
          <div part="separator__options"></div>
          <button
            @click=${() => this.editOptions()}
            title="Options"
            class="svg-icon button"
            >
            <slot
              name="edit-options-button"
              >
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
            </slot>
          </button>
          <popin-dialog hidden no-auto-close ${ref(this.optionsPopin)} @submit=${(e: SubmitEvent) => this.selectOptions(e)} @reset=${() => this.cancelOptions()}>
              <slot part="options" name="options" slot="body"></slot>
          </popin-dialog>
          `}
          ${this.noDelete ? '' : html`
            <div part="separator__delete"></div>
            <button
              @click=${() => this.delete()}
              title="Delete"
              part="delete-button"
              class="delete-button svg-icon"
              >
              <slot
                name="delete-button"
                >
                x
              </slot>
            </button>
          `}
        </div>
      </header>
      <slot part="tags" name="tags"></slot>
      <slot part="errorText" name="errorText"></slot>
    `
  }

  override connectedCallback() {
    super.connectedCallback()
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
  }

  override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, _old, value)
  }

  editOptions() {
    this.optionsPopin.value?.toggleAttribute('hidden')
    const optionsSlot = this.optionsPopin.value?.querySelector('slot[name="options"]') as HTMLSlotElement
    const form = optionsSlot?.assignedElements().map(el => el.querySelector('form')).find(el => !!el) as HTMLFormElement
    this.dispatchEvent(new CustomEvent('edit-options', {detail: {form}}))
  }

  editValue() {
    this.dispatchEvent(new CustomEvent('edit-value'))
    this.valuesPopin.value?.toggleAttribute('hidden')
  }

  showHelpText() {
    this.helpTextPopin.value?.toggleAttribute('hidden')
  }

  delete() {
    this.dispatchEvent(new CustomEvent('delete'))
  }

  selectValue(e: MouseEvent) {
    if (e.target instanceof HTMLElement) {
      const li = e.target.closest('li')
      if (li) {
        this.selectedItem = li.getAttribute('value') ?? ''
      }
    }
  }

  selectOptions(e: SubmitEvent) {
    // Prevent reloading the page
    e.preventDefault()
    // Hide the options popin
    this.optionsPopin.value?.setAttribute('hidden', '')
    const form = e.target as HTMLFormElement
    // Update the options object
    const formData = new FormData(form)
    const options = Object.fromEntries(formData.entries())
    // Update the optionsForm too
    const optionsForm = this.formToHtml(form, formData)
    // Notify the steps-selector
    this.dispatchEvent(new CustomEvent('set-options', {detail: {options, optionsForm}}))
  }

  /**
   * Update the form with the values from the formData
   * Returns the form as a string
   */
  formToHtml(form: HTMLFormElement, formData: FormData): TemplateResult {
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
    inputs.forEach(input => {
      const name = input.getAttribute('name')
      if(name) {
        const value = formData.get(name)
        if (value) {
          input.setAttribute('value', value.toString())
        }
      } else {
        console.warn('input has no name', input)
      }
    })
    return unsafeHTML(form.outerHTML.toString()) as any
  }

  cancelOptions() {
    this.optionsPopin.value?.setAttribute('hidden', '')
    //e.preventDefault()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steps-selector-item': StepsSelectorItem
  }
}
