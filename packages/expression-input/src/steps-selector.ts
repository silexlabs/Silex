import {LitElement, html, css} from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import {customElement, property} from 'lit/decorators.js'
import {unsafeHTML} from 'lit/directives/unsafe-html.js'

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

export interface Step {
  name: string
  icon: string
  type: string
  tags?: string[]
  helpText?: string
  errorText?: string
  options?: any
  optionsForm?: string
  meta?: any
}

@customElement('steps-selector')
export class StepsSelector extends LitElement {
  static override styles = css`
    ::part(header) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .dirty {
      color: var(--steps-selector-dirty-color, red);
    }
    ::part(dirty-icon) {
      display: inline-block;
      width: 1rem;
    }
    ::part(property-container) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    ::part(fixed-selector) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--steps-selector-dirty-border-color, #ccc);
      background-color: var(--steps-selector-dirty-background-color, #ccc);
      border-radius: var(--steps-selector-dirty-border-radius, 3px);
      padding: 3px;
    }
    ul[slot="tags"] {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* an arrow between elements */
    .steps-container__separator {
      display: inline;
    }
    .steps-container__separator::after {
      content: "▶";
      color: var(--steps-selector-separator-color, #333);
      font-size: var(--steps-selector-separator-font-size, 1.5em);
      margin: var(--steps-selector-separator-margin, 0);
      padding: var(--steps-selector-separator-padding, 0);
    }
    /* selector between fixed value (text input) and steps */
    .fixed-selector span {
      padding: 3px;
    }
    .fixed-selector span:not(.active):hover {
      color: var(--steps-selector-dirty-color, #0091ff);
    }
    .fixed-selector span:not(.active) {
      cursor: pointer;
    }
    .fixed-selector span:last-child {
      margin-left: 5px;
    }
    .fixed-selector span.active {
      border-radius: var(--steps-selector-active-border-radius, 3px);
      background-color: var(--steps-selector-active-background-color, #eee);
      color: var(--steps-selector-active-color, #333);
      cursor: default;
    }
    ul.values-ul {
      list-style: none;
      padding: var(--steps-selector-values-ul-padding, 0);
      margin: var(--steps-selector-values-ul-margin, 0);
      color: var(--steps-selector-values-ul-color, #000);
      background-color: var(--steps-selector-values-ul-background-color, transparent);
    }
    li.values-li {
      padding: var(--steps-selector-values-li-padding, 5px);
      margin: var(--steps-selector-values-li-margin, 0);
      background-color: var(--steps-selector-values-li-background-color, transparent);
      border-bottom: var(--steps-selector-values-li-border, 1px solid #ccc);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
    }
    li.values-li:last-child {
      border-bottom: none;
    }
    li.values-li:hover {
      background-color: var(--steps-selector-values-li-hover-background-color, #eee);
    }
    li.values-li.active {
      background-color: var(--steps-selector-values-li-active-background-color, #ccc);
      font-weight: var(--steps-selector-values-li-active-font-weight, bold);
    }
    li.values-li .values__icon {
      margin-right: var(--steps-selector-values-li-icon-margin-right, 5px);
    }
    li.values-li .values__name {
      margin-right: var(--steps-selector-values-li-name-margin-right, 25px);
    }
    li.values-li .values__type {
      color: var(--steps-selector-values-li-type-color, #999);
    }
    .placeholder > * {
      color: var(--steps-selector-placeholder-color, #999);
      font-style: var(--steps-selector-placeholder-font-style, italic);
      margin: var(--steps-selector-placeholder-margin, 10px 0);
    }
  `

  public static getFixedValueStep(value: string): Step {
    return {
      name: 'Fixed value',
      icon: '',
      type: 'fixed',
      options: {
        value,
      },
      optionsForm: `<form>
        <input name="value" type="text" value="${value}" />
        <button type="submit">Save</button>
      </form>`,
    }
  }


  // Read only property dirty
  get dirty() {
    return JSON.stringify(this._steps) !== JSON.stringify(this.initialValue)
  }

  // Steps currently selected
  @property({type: Array})
  steps: Step[] = []

  // Steps with change events - internal use only
  protected get _steps() {
    return this.steps
  }
  protected set _steps(value) {
    const oldValue = this.steps
    this.steps = value
    this.requestUpdate('steps', oldValue)
    this.dispatchEvent(new CustomEvent('change', {detail: {value}}))
  }

  // Initial value
  protected initialValue: Step[] = []

  // Get the list of steps that can be added after the given selection
  @property({type: Function})
  completion: (steps: Step[]) => Step[] = () => []

  @property({type: Boolean, attribute: 'allow-fixed'})
  allowFixed = false

  @property({type: Boolean, attribute: 'fixed', reflect: true})
  fixed = false

  @property({type: String, attribute: 'fixed-type'})
  fixedType: 'text' | 'date' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url' = 'text'

  @property()
  placeholder = 'Add a first step'

  @property()
  fixedPlaceholder = 'Enter a fixed value or switch to expression'

  @property({type: Number, attribute: 'max-steps'})
  maxSteps: number | undefined

  override render() {
    const nextSteps = this.completion(this._steps)
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
        ` : ''}
      </header>
      <!-- fixed value -->
      ${this.fixed ? html`
        <div part="property-container" class="property-container">
          <input
            part="property-input" class="property-input"
            .placeholder=${this.fixedPlaceholder}
            .type=${this.fixedType}
            .value=${this._steps[0]?.options ? this._steps[0].options['value'] : ''}
            @change=${(event: InputEvent) => this.fixedValueChanged((event.target as HTMLInputElement).value)}
          >
        </div>
      ` : html`
        <!-- steps -->
        <div part="scroll-container" class="scroll-container">
        <div part="steps-container" class="steps-container">
          ${this._steps
            .map((step, index) => ({
              step,
              completion: this.completion(this._steps.slice(0, index)),
            }))
            .map(({step, completion}, index) => html`
              ${index > 0 ? html`<div class="steps-container__separator"></div>` : html``}
              <steps-selector-item
                key=${index}
                ?no-options-editor=${!step.optionsForm}
                ?no-info=${!step.helpText}
                @set=${(event: CustomEvent) => this.setStepAt(index, completion.find(s => s.name === event.detail.value))}
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
                  <ul class="values-ul">
                    ${
                      completion
                        .map(step => html`<li class=${classMap({'values-li': true, active: step.name === this._steps[index].name})} value=${step.name}>
                          <span class="values__name">
                            <span class="values__icon">${unsafeHTML(step.icon)}</span>
                            ${unsafeHTML(step.name)}
                          </span>
                          <span class="values__type">${unsafeHTML(step.type)}</span>
                        </li>`)
                    }
                  </ul>
                </div>
                <div slot="options">${unsafeHTML(step.optionsForm)}</div>
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
            @set=${(event: CustomEvent) => this.setStepAt(this._steps.length, nextSteps.find(step => step.name === event.detail.value))}
          >
            <div name="add-button" part="add-button" slot="name">+</div>
            <div slot="values">
              <ul class="values-ul">
                ${ nextSteps.map(step => html`<li class="values-li" value=${step.name}>
                  <span class="values__name">
                    <span class="values__icon">${unsafeHTML(step.icon)}</span>
                    ${unsafeHTML(step.name)}
                  </span>
                  <span class="values__type">${unsafeHTML(step.type)}</span>
                </li>`) }
              </ul>
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

  override connectedCallback() {
    super.connectedCallback()
    this.dispatchEvent(new Event('load'))
  }

  isFixedValue() {
    return this.allowFixed && this.fixed && (this._steps.length === 0 || this._steps[0].type === 'fixed')
  }

  fixedValueChanged(value: string) {
    if (value && value !== '') {
      this._steps = [
        StepsSelector.getFixedValueStep(value),
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

  setOptionsAt(at: number, options: unknown, optionsForm: string) {
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
