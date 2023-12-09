import {LitElement, html, TemplateResult} from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import {customElement, property} from 'lit/decorators.js'
import {unsafeHTML} from 'lit/directives/unsafe-html.js'
import { stepsSelectorStyles } from './styles.js'

import './steps-selector-item.js'

/**
 * @element steps-selector
 * Web component to select a sequence of steps
 * 
 * It has these events:
 * - load
 * - change
 * 
 * It has these properties:
 * - steps
 * - dirty
 * 
 * It has these slots:
 * - placeholder
 * - dirty-icon
 * 
 * User actions:
 * - add a next step at the end of the selection
 * - reset to default value
 * - copy value to clipboard
 * - paste value from clipboard
 */

export type StepId = string
export interface Step {
  name: string
  id: StepId
  icon: string
  type: string
  tags?: string[]
  helpText?: string
  errorText?: string
  options?: any
  optionsForm?: TemplateResult | string | null
  meta?: any
  category?: string
}

export type FixedType = 'text' | 'date' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url'

@customElement('steps-selector')
export class StepsSelector extends LitElement {
  static override styles = stepsSelectorStyles

  public getFixedValueStep(value: string): Step {
    return {
      name: 'Fixed value',
      id: 'fixed' as StepId,
      icon: '',
      type: 'fixed',
      options: {
        value,
        inputType: this.inputType,
      },
      optionsForm: html`<form>
        <input name="value" type=${this.inputType} value=${value} />
        <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>`,
    }
  }


  // Read only property dirty
  get dirty() {
    return JSON.stringify(this._steps) !== JSON.stringify(this.initialValue)
  }

  // Steps currently selected
  @property({type: Array})
  protected __steps: Step[] = []
  get steps() {
    return this.__steps
  }
  set steps(value) {
    const oldValue = this.__steps
    this.__steps = value
    this.requestUpdate('steps', oldValue)
  }

  // Steps with change events - internal use only
  protected get _steps() {
    return this.steps
  }
  protected set _steps(value) {
    this.steps = value
    this.dispatchEvent(new CustomEvent('change', {detail: {value}}))
  }

  // Initial value
  protected initialValue: Step[] = []

  // Get the list of steps that can be added after the given selection
  @property({type: Function})
  completion: (steps: Step[]) => Step[] = () => []

  @property({type: Boolean, attribute: 'allow-fixed'})
  allowFixed = false

  @property({type: String, attribute: 'input-type'})
  inputType: FixedType = 'text'

  @property({type: Boolean, attribute: 'fixed', reflect: true})
  fixed = false

  @property()
  placeholder = 'Add a first step'

  @property()
  fixedPlaceholder = 'Enter a fixed value or switch to expression'

  @property({type: Number, attribute: 'max-steps'})
  maxSteps: number | undefined

  @property({type: Boolean, attribute: 'group-by-category'})
  groupByCategory = false

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

  /**
   * Value setter/getter
   * This will parse the value as JSON and set the steps
   * This is the same API as input elements
   */
  @property({type: String, attribute: 'value'})
  get value() {
    return JSON.stringify(this.steps)
  }
  set value(newValue: string) {
    if(newValue) {
      this.steps = JSON.parse(newValue)
    } else {
      this.steps = []
    }
    this.dispatchEvent(new Event('change'))
  }

  /**
   * Form setter
   * Handle formdata event to add the current value to the form
   */
  protected _form: HTMLFormElement | null = null
  set form(newForm: HTMLFormElement | null) {
    if(this._form) {
      this._form.removeEventListener('formdata', this.onFormdata)
    }
    if(newForm) {
      newForm.addEventListener('formdata', this.onFormdata)
    }
  }
  get form() {
    return this._form
  }

  /**
   * Handle formdata event to add the current value to the form
   */
  protected onFormdata = (event: FormDataEvent) => {
    if(!this.name) {
      throw new Error('Attribute name is required for steps-selector')
    }
    event.formData.append(this.name, JSON.stringify(this._steps))
  }

  /**
   * Render the component
   */
  override render() {
    const nextSteps = this.completion(this._steps)
    const nextStepsByCategory = this.group(nextSteps)
    return html`
      <!-- header -->
      <header part="header" class="header">
        <div class=${classMap({dirty: this.dirty, 'property-name': true})} part="property-name">
          <slot></slot>
          ${this.dirty ? html`
            <slot name="dirty-icon" part="dirty-icon" class="dirty-icon" @click=${this.reset}>
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
            </slot>
          ` : html``}
        </div>
        ${this.allowFixed ? html`
          <div part="fixed-selector" class="fixed-selector">
            <span
              class=${classMap({active: this.fixed, 'fixed-selector-fixed': true})}
              @click=${() => this.fixed = true}
              part="fixed-selector-fixed"
            >Fixed</span>
            <span
              class=${classMap({active: !this.fixed, 'fixed-selector-expression': true})}
              @click=${() => this.fixed = false}
              part="fixed-selector-expression"
            >Expression</span>
          </div>
        ` : html``}
      </header>
      <!-- fixed value -->
      ${this.fixed ? html`
        <div part="property-container" class="property-container">
          <input
            part="property-input" class="property-input"
            placeholder=${this.fixedPlaceholder}
            type=${this.inputType}
            value=${this._steps[0]?.options ? this._steps[0].options['value'] : ''}
            @change=${(event: InputEvent) => this.fixedValueChanged((event.target as HTMLInputElement).value)}
          >
        </div>
      ` : html`
        <!-- steps -->
        <div part="scroll-container" class="scroll-container">
        <div part="steps-container" class="steps-container">
          ${this._steps
            // Add completion to each step
            .map((step, index) => ({
              step,
              completion: this.completion(this._steps.slice(0, index)),
            }))
            // Group steps by catégory
            .map(({step, completion}) => {
              return {
                step,
                completion,
                completionMap: this.group(completion),
              }
            })
            // Create the ui
            .map(({step, completion, completionMap}, index) => html`
              ${index > 0 ? html`<div class="steps-container__separator"></div>` : html``}
              <steps-selector-item
                key=${index}
                ?no-options-editor=${!step.optionsForm}
                ?no-info=${!step.helpText}
                @set=${(event: CustomEvent) => this.setStepAt(index, completion.find(s => s.id === event.detail.value))}
                @delete=${() => this.deleteStepAt(index)}
                @set-options=${(event: CustomEvent) => this.setOptionsAt(index, event.detail.options, event.detail.optionsForm)}
                part="steps-selector-item"
                exportparts="value,delete-button,separator__info,separator__options,separator__delete,type,values,helpText,options,tags,errorText,header,name,icon"
              >
                <div part="icon" slot="icon">${unsafeHTML(step.icon)}</div>
                <div part="name" slot="name">${unsafeHTML(step.name)}</div>
                <div part="type" slot="type">${unsafeHTML(step.type)}</div>
                <slot slot="delete-button" name="delete-button">x</slot>
                <div slot="helpText">${unsafeHTML(step.helpText)}</div>
                <ul slot="tags">
                  ${step.tags?.map(tag => html`<li>${unsafeHTML(tag)}</li>`)}
                </ul>
                <div slot="errorText">${unsafeHTML(step.errorText)}</div>
                <div slot="values">
                  ${ this.renderValues(completion, completionMap, this._steps[index]) }
                </div>
                <div slot="options">${typeof step.optionsForm === 'string' ? unsafeHTML(step.optionsForm) : step.optionsForm}</div>
              </steps-selector-item>
            `)}
        <!-- add a step -->
        ${nextSteps.length > 0 && (typeof this.maxSteps === 'undefined' || this.maxSteps === -1 || this._steps.length < this.maxSteps ) ? html`
          <div part="separator__add"></div>
          <steps-selector-item
            exportparts="value,delete-button,separator__info,separator__options,separator__delete,type,values,helpText,options,tags,header,errorText,icon"
            class="steps-selector-item__add"
            part="steps-selector-item__add"
            no-options-editor
            no-delete
            no-arrow
            no-info
            @set=${(event: CustomEvent) => this.setStepAt(this._steps.length, nextSteps.find(step => step.id === event.detail.value))}
          >
            <div name="add-button" part="add-button" slot="name">+</div>
            <div slot="values">
              ${ this.renderValues(nextSteps, nextStepsByCategory) }
            </div>
          </steps-selector-item>
        ` : html``}
        <!-- no steps -->
        ${this._steps.length > 0 ? html`` : html`
          <slot name="placeholder" part="placeholder" class="placeholder">
            <p>${this.placeholder}</p>
          </slot>
        `}
        </div>
        </div>
      `}
    `
  }

  group(completion: Step[]): Map<string, Step[]> {
    return completion.reduce((map, step) => {
      const category = step.category ?? 'Other'
      const steps = map.get(category) ?? []
      steps.push(step)
      map.set(category, steps)
      return map
    }, new Map<string, Step[]>())
  }

  renderValues(completion: Step[], completionMap: Map<string, Step[]>, currentStep?: Step) {
    return this.groupByCategory ? html`
      <ul class="values-ul">
        ${Array.from(completionMap.entries())
          .map(([category, steps]) => html`
          <li class="values-li values__title" value=${category}>
            <span class="values__name">${unsafeHTML(category)}</span>
          </li>
          ${steps.map(step => html`<li class=${classMap({'values-li': true, active: step.id === currentStep?.id})} value=${step.id}>
            <span class="values__name">
              <span class="values__icon">${unsafeHTML(step.icon)}</span>
              ${unsafeHTML(step.name)}
            </span>
            <span class="values__type">${unsafeHTML(step.type)}</span>
          </li>`)}
        `)}
      </ul>
    ` : html`
      <ul class="values-ul">
        ${
          completion
            .map(step => html`<li class=${classMap({'values-li': true, active: step.id === currentStep?.id})} value=${step.id}>
              <span class="values__name">
                <span class="values__icon">${unsafeHTML(step.icon)}</span>
                ${unsafeHTML(step.name)}
              </span>
              <span class="values__type">${unsafeHTML(step.type)}</span>
            </li>`)
        }
      </ul>
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

    // Notify the parent app
    this.dispatchEvent(new Event('load'))
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.form = null
  }

  isFixedValue() {
    return this.allowFixed && this.fixed && (this._steps.length === 0 || this._steps[0].type === 'fixed')
  }

  fixedValueChanged(value: string) {
    if (value && value !== '') {
      this._steps = [
        this.getFixedValueStep(value),
      ]
    } else {
      this._steps = []
    }
  }

  /**
   * Set the step at the given index
   */
  setStepAt(at: number, step: Step | undefined) {
    if (step) {
      this._steps = [
        ...this._steps.slice(0, at),
        step,
      ]
    } else {
      console.error(`Step is undefined at ${at}`)
    }
  }

  setOptionsAt(at: number, options: unknown, optionsForm: TemplateResult) {
    this._steps = [
      ...this._steps.slice(0, at),
      {
        ...this._steps[at],
        options,
        optionsForm,
      },
      ...this._steps.slice(at + 1),
    ]
  }

  /**
   * Delete the step at the given index and all the following steps
   */
  deleteStepAt(at: number) {
    this._steps = this._steps.slice(0, at)
  }

  /**
   * Reset dirty flag and store the current value as initial value
   */
  public save() {
    this.initialValue = [
      ...this._steps,
    ]
  }

  /**
   * Reset dirty flag and restore the initial value
   */
  reset() {
    this._steps = [
      ...this.initialValue,
    ]
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steps-selector': StepsSelector
  }
}
