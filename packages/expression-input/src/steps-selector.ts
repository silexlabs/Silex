import {LitElement, html, css} from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import {customElement, eventOptions, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import './steps-selector-item'

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
  options?: unknown
  optionsForm?: string
}

@customElement('steps-selector')
export class StepsSelector extends LitElement {
  static override styles = css`
    :host {
      --steps-selector-dirty-color: red;
    }
    :host .dirty {
      color: var(--steps-selector-dirty-color, red);
    }
    :host .property-container {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    steps-selector-item {
      padding: 10px;
      margin: 10px;
    }
  `;

  // Read only property dirty
  private _dirty = false
  get dirty() {
    return this._dirty
  }
  protected set dirty(value) {
    const oldValue = this._dirty
    this._dirty = value
    this.requestUpdate('dirty', oldValue)
  }

  // Steps currently selected
  protected _steps: Step[] = []
  get steps() {
    return this._steps
  }
  set steps(value) {
    const oldValue = this._steps
    this._steps = value
    this.requestUpdate('steps', oldValue)
    this.dispatchEvent(new CustomEvent('change', {detail: {value}}));
  }

  // Initial value
  protected initialValue: Step[] = []

  // Get the list of steps that can be added after the given selection
  @property({type: Function})
  completion: (steps: Step[]) => Step[] = () => []

  override render() {
    const nextSteps = this.completion(this.steps)
    return html`
      <div class=${classMap({dirty: this.dirty, "property-container": true})}>
        <slot></slot>
        ${this.dirty ? html`
          <slot name="dirty-icon" @click=${this.reset}>
            <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
          </slot>
        ` : html``}
      </div>
      <div class="steps-container">
        ${this.steps
          .map((step, index) => ({
            step,
            completion: this.completion(this.steps.slice(0, index)),
          }))
          .map(({step, completion}, index) => html`
            <steps-selector-item
              key=${index}
              ?no-options-editor=${!step.optionsForm}
              ?no-info=${!step.helpText}
              @set=${(event: CustomEvent) => this.setStepAt(index, completion.find(s => s.name === event.detail.value))}
              @delete=${() => this.deleteStepAt(index)}
              @set-options=${(event: CustomEvent) => this.setOptionsAt(index, event.detail.options)}
            >
              <div slot="icon">${step.icon}</div>
              <div slot="name">${step.name}</div>
              <ul slot="tags">
                ${step.tags?.map(tag => html`<li>${tag}</li>`)}
              </ul>
              <div slot="type">${step.type}</div>
              <div slot="helpText">${unsafeHTML(step.helpText)}</div>
              <div slot="errorText">${unsafeHTML(step.errorText)}</div>
              <div slot="values">
                <ul>
                  ${
                    completion
                      .map(step => html`<li value=${step.name}>${step.name}</li>`)
                  }
                </ul>
              </div>
              <div slot="options">${unsafeHTML(step.optionsForm)}</div>
            </steps-selector-item>
          `)}
        ${this.steps.length > 0 ? html`` : html`
          <slot name="placeholder">
            Add a first step
          </slot>
        `}
        ${nextSteps.length > 0 ? html`
          <steps-selector-item
            no-options-editor
            no-delete
            no-arrow
            no-info
            @set=${(event: CustomEvent) => this.setStepAt(this.steps.length, nextSteps.find(step => step.name === event.detail.value))}
          >
            <div slot="name">+</div>
            <div slot="values">
              <ul>
                ${ nextSteps.map(step => html`<li value=${step.name}>${step.name}</li>`) }
              </ul>
            </div>
          </steps-selector-item>
        ` : html``}
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback()
    this.dispatchEvent(new Event('load'))
  }

  /**
   * Set the step at the given index
   */
  setStepAt(at: number, step: Step | undefined) {
    if (step) {
      this.steps = [
        ...this.steps.slice(0, at),
        step,
      ]
      this.dirty = true
    } else {
      console.error(`Step is undefined`)
    }
  }

  setOptionsAt(at: number, options: unknown) {
    this.steps = [
      ...this.steps.slice(0, at),
      {
        ...this.steps[at],
        options,
      },
      ...this.steps.slice(at + 1),
    ]
    this.dirty = true
  }

  /**
   * Delete the step at the given index and all the following steps
   */
  deleteStepAt(at: number) {
    this.steps = this.steps.slice(0, at)
    this.dirty = true
  }

  /**
   * Reset dirty flag and store the current value as initial value
   */
  public save() {
    this.dirty = false
    this.initialValue = [
      ...this.steps,
    ]
  }

  /**
   * Reset dirty flag and restore the initial value
   */
  reset() {
    this.dirty = false
    this.steps = [
      ...this.initialValue,
    ]
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steps-selector': StepsSelector;
  }
}
