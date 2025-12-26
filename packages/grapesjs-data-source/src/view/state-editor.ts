/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {LitElement, TemplateResult, html} from 'lit'
import {property} from 'lit/decorators.js'
import { Ref, createRef, ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'
import { PROPERTY_STYLES } from './defaultStyles'
import { DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, Filter, FIXED_TOKEN_ID, Property, Token } from '../types'
import { fromString, getFixedToken, getTokenDisplayName, groupByType, toExpression, toId, toValue } from '../utils'
import { ExpressionInput, PopinForm } from '@silexlabs/expression-input'
import { Component, Editor } from 'grapesjs'

import '@silexlabs/expression-input'
import { getCompletion } from '../model/completion'
import { evaluateExpressionTokens, EvaluationContext } from '../model/expressionEvaluator'
import { getAllDataSources } from '../model/dataSourceRegistry'
import { getFilters, getPreviewData, getManager } from '../model/dataSourceManager'
import { fromStored, getExpressionResultType } from '../model/token'

/**
 * Editor for a state of the selected element's properties
 *
 * Usage:
 *
 * ```
 * <state-editor
 *  name="state"
 *  disabled
 *  hide-loop-data
 *  parent-name="parent"
 *  no-filters
 *  root-type="root"
 *  default-fixed
 *  dismiss-current-component-states
 *  ></state-editor>
 * ```
 *
 */

export class StateEditor extends LitElement {
  @property({type: Boolean})
    disabled = false

  @property({type: String})
    name = ''

  @property({type: Boolean, attribute: 'hide-loop-data'})
    hideLoopData = false

  /**
   * used in the expressions found in filters options
   * This will be used to filter states which are not defined yet
   */
  @property({type: String, attribute: 'parent-name'})
    parentName = ''

  @property({type: Boolean, attribute: 'no-filters'})
    noFilters = false

  @property({type: String, attribute: 'root-type'})
    rootType = ''

  @property({type: Boolean, attribute: 'default-fixed'})
    defaultFixed = false

  // Note: dismissCurrentComponentStates not used in this project anymore
  @property({type: Boolean, attribute: 'dismiss-current-component-states'})
    dismissCurrentComponentStates = false

  private _selected: Component | null = null
  @property({type: Object})
  get selected(): Component | null {
    return this._selected
  }
  set selected(value: Component | null) {
    this._selected = value
    this.requestUpdate()
  }

  /**
   * Value string for for submissions
   */
  @property()
  get value(): string {
    return JSON.stringify(this.data)
  }
  set value(newValue: string) {
    const expression = toExpression(newValue)
    if (!expression) {
      this.data = newValue
      return
    }
    this.data = expression as Token[]
  }

  /**
   * Form id
   * This is the same API as input elements
   */
  @property({type: String, attribute: 'for'})
    for = ''

  /**
   * Binded listeners
   */
  private onFormdata_ = this.onFormdata.bind(this)
  private renderBinded = () => this.requestUpdate()

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

    this.editor?.on(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_DATA_LOAD_END}`, this.renderBinded)
  }

  override disconnectedCallback() {
    this.form = null
    super.disconnectedCallback()
    this.editor?.off(`${DATA_SOURCE_CHANGED} ${DATA_SOURCE_DATA_LOAD_END}`, this.renderBinded)
  }

  /**
   * Handle formdata event to add the current value to the form
   */
  private onFormdata(event: FormDataEvent) {
    event.preventDefault()
    const formData = event.formData
    formData.set(this.name, this.value)
  }

  /**
   * Form setter
   * Handle formdata event to add the current value to the form
   */
  protected _form: HTMLFormElement | null = null
  set form(newForm: HTMLFormElement | null) {
    if(this._form) {
      this._form.removeEventListener('formdata', this.onFormdata_)
    }
    if(newForm) {
      newForm.addEventListener('formdata', this.onFormdata_)
    }
  }
  get form() {
    return this._form
  }

  /**
   * Structured data
   */
  private _data: Token[] = []
  get data(): Token[] {
    const input = this.expressionInputRef.value
    if(!this._selected || !this.editor) {
      console.error('selected and editor are required', this._selected, this.editor)
      //throw new Error('selected and editor are required')
      return []
    }
    if(!input || input.value.length === 0) return []
    if(input.fixed) {
      return [getFixedToken(input.value[0] || '')]
    } else {
      const ids = input.value
      return ids
        .filter((id: string) => !!id)
        .map((id: string) => {
          try {
            return fromString(this.editor!, id, this.selected!.getId())
          } catch(e) {
            console.error(`Error while getting token from id ${id}`, e)
            // Return unknown
            return {
              type: 'property',
              propType: 'field',
              fieldId: 'unknown',
              label: 'Unknown',
              kind: 'scalar',
              typeIds: [],
              options: {},
            } as Property
          }
        })
        // Here the data is missing options as data comes from completion
        // Add the options
        .map((token: Token, idx: number) => {
          const popin = this.popinsRef[idx]?.value
          switch(token.type) {
          case 'property':
          case 'filter':
            token.options = popin?.value || token.options
            break
          default:
            break
          }
          return token
        })
    }
  }
  set data(value: Token[] | string) {
    if(typeof value === 'string') {
      this._data = value === '' ? [] : [getFixedToken(value)]
    } else {
      this._data = value
    }
    if (this.editor) this.requestUpdate()
  }

  private _editor: Editor | null = null
  @property({type: Object})
  get editor(): Editor | null {
    return this._editor
  }
  set editor(value: Editor | null) {
    this._editor = value
    this.requestUpdate()
  }

  private redrawing = false
  private expressionInputRef = createRef<ExpressionInput>()
  private popinsRef: Ref<PopinForm>[] = []

  override render() {
    this.noFilters = false
    this.redrawing = true
    super.render()
    if(!this.name) throw new Error('name is required on state-editor')
    if(!this.editor || !this.selected) {
      console.error('editor and selected are required', this.editor, this.selected)
      return html`<div class="ds-section
        ds-section--error">Error rendering state-editor component: editor and selected are required</div>`
    }

    const selected = this.selected
    // FIXME: fromStored every time we render is not efficient, it is supposed to have been done before
    const _currentValue = this._data.map(token => fromStored(token, selected.getId()))

    // Get the data to show in the "+" drop down
    const manager = getManager()
    const completion = getCompletion({
      component: this.dismissCurrentComponentStates ? selected.parent()! : selected,
      expression: _currentValue || [],
      rootType: this.rootType,
      currentStateId: this.parentName || this.name,
      hideLoopData: this.hideLoopData,
      manager,
    })
      .filter(token => token.type !== 'filter' || !this.noFilters)

    const groupedCompletion = groupByType(this.editor, selected, completion, _currentValue)

    // Check if the expression has a fixed value and nothing else
    const fixed = (_currentValue?.length === 1 && _currentValue[0].type === 'property' && _currentValue[0].fieldId === FIXED_TOKEN_ID)
      // If the value is empty and the default is fixed, then the input is fixed
      || (this.defaultFixed && _currentValue.length === 0)
      // If there is no completion and the value is empty
      || (completion.length === 0 && _currentValue.length === 0)

    // Fixed text
    const text = fixed ? (_currentValue![0] as Property)?.options?.value || '' : ''

    let currentData = '' as unknown
    try {
      const context: EvaluationContext = {
        dataSources: getAllDataSources(),
        filters: getFilters(),
        previewData: getPreviewData(),
        component: selected,
        resolvePreviewIndex: true,
      }
      const realData = evaluateExpressionTokens(_currentValue || [], context)
      currentData = realData
    } catch(e) {
      console.error('Current data could not be retrieved:', e)
    }
    if (typeof currentData === 'undefined' || currentData === null) currentData = ''
    // Build the expression input
    const result = html`
      <expression-input
        @change=${(event: Event) => this.onChangeValue(event)}
        data-is-input
        ${ref(this.expressionInputRef)}
        .fixed=${fixed}
        class="ds-section"
        name=${this.name}
        reactive
      >
        <style>
          ${PROPERTY_STYLES}
        </style>
        <slot name="label" slot="label"></slot>
        <div slot="fixed" class="ds-slot-fixed">
          <input
            type="text"
            class="ds-expression-input__fixed"
            placeholder="Enter a text or switch to expression mode"
            .value=${text}
            />
        </div>
        ${ _currentValue && _currentValue.length > 0 ? html`
          ${ _currentValue.map((token: Token, idx: number) => {
    this.popinsRef[idx] = createRef<PopinForm>()
    const optionsForm = this.getOptions(selected, _currentValue, idx)
    const partialExpression = _currentValue.slice(0, idx)

    const _partialCompletion = getCompletion({
      component: this.dismissCurrentComponentStates ? selected.parent()! : selected,
      expression: partialExpression,
      rootType: this.rootType,
      currentStateId: idx === 0 ? this.parentName || this.name : undefined,
      hideLoopData: this.hideLoopData,
      manager,
    })
    const partialCompletion = this.noFilters ? _partialCompletion
      .filter(token => token.type !== 'filter')
      : _partialCompletion
    const partialGroupedCompletion = groupByType(this.editor!, selected, partialCompletion, _currentValue.slice(0, idx))
    const id = toId(token)
    return html`
              <select>
                <option value="">-</option>
                ${ Object.entries(partialGroupedCompletion)
    .reverse()
    .map(([type, completion]) => {
      return html`
                      <optgroup label="${type}">
                      ${ completion
    .map(partialToken => ({
      displayName: getTokenDisplayName(selected, partialToken),
      partialToken,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(({partialToken, displayName}) => {
      const partialId = toId(partialToken)
      return html`
                            <option value=${toValue(partialToken)} .selected=${partialId === id}>${displayName}</option>
                          `
    })
}
                      </optgroup>
                    `
    })
}
              </select>
              <button
                class="ds-expression-input__options-button"
                style=${styleMap({ display: optionsForm === '' ? 'none' : '' })}
                @click=${(e: MouseEvent) => {
    this.popinsRef[idx].value?.openAt(e.currentTarget as HTMLElement)
  }}
              >...</button>
              <popin-form
                ${ref(this.popinsRef[idx])}
                hidden
                name=${`${this.name}_options_${idx}`}
                @change=${(event: Event) => this.onChangeOptions(event, selected, this.popinsRef[idx].value!, idx)}
              >
                ${optionsForm}
              </popin-form>
              `
  })
}
        ` : '' }
        ${Object.entries(groupedCompletion).length ? html`
          <select
            class="ds-expression-input__add"
            ${ref(el => el && ((el as HTMLSelectElement).value = ''))}
            >
            <option value="" selected>+</option>
            ${ Object.entries(groupedCompletion)
    .reverse()
    .map(([type, completion]) => {
      return html`
                    <optgroup label="${type}">
                    ${ completion
    .map(token => ({
      displayName: getTokenDisplayName(selected, token),
      token,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(({displayName, token}) => {
      return html`<option value="${toValue(token)}">${displayName}</option>`
    })
}
                    </optgroup>
                `
    })
}
          </select>
      ` : ''}
      </expression-input>
      <div class="ds-real-data">
        <code class="ds-real-data__display">
          ${Array.isArray(currentData) ? html`${currentData.length} objects with ${Object.keys(currentData[0] || {}).filter(k => k !== '__typename').join(', ')}` : currentData}
        </code>
      </div>
        `
    this.redrawing = false
    return result
  }

  private onChangeValue(event: Event) {
    if(this.redrawing) return
    const idx = (event as CustomEvent).detail?.idx
    if(idx >= 0) {
      // Custom event coming from the expression input
      // Remove the tokens after the changed one
      const data = this.data.slice(0, idx + 1)
      if(data.length > idx) {
        // Clear options
        if(data[idx].type === 'property' || data[idx].type === 'filter') {
          (data[idx] as Property | Filter).options = {}
        }
      } else {
        // We selected the "-" option, do nothing, this step will be removed
      }
      this.data = data
    } else if(idx === -1) {
      // Clear expression (case when user clicks reset/clear button)
      this.data = []
    } else {
      // Event coming from the options (no idx in detail)
    }
    // Stop default behavior of inputs
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    // Let the redraw update this.data
    setTimeout(() => this.dispatchEvent(new Event('change', { bubbles: true })))
  }

  private onChangeOptions(event: Event, component: Component, popin: PopinForm, idx: number) {
    if(this.redrawing) return
    if(!this.editor) throw new Error('editor is required')
    const input = this.expressionInputRef.value!
    const tokensStrings = input.value
    // Get tokens as objects
    const tokens = tokensStrings
      .filter((id: string) => !!id)
      .map((id: string) => {
        try {
          return fromString(this.editor!, id, component.getId())
        } catch(e) {
          // FIXME: notify user
          console.error('Error while getting token from string', {id}, e)
          // Return unknown
          return {
            type: 'property',
            propType: 'field',
            fieldId: 'unknown',
            label: 'Unknown',
            kind: 'scalar',
            typeIds: [],
            options: {},
          } as Property
        }
      })
    // Get the selected options
    const options = input.options
      .filter((o: HTMLOptionElement) => o.selected)
    // Update the options of the token
    ;(tokens[idx] as Property | Filter).options = popin.value
    // Update the dom
    options[idx].value = toValue(tokens[idx])
    // Update the state
    this.requestUpdate()
    // Stop the original event
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    // Notify the owner
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  private getOptions(component: Component, tokens: Token[], idx: number): TemplateResult | '' {
    if(!this.editor) throw new Error('editor is required')
    const token = tokens[idx]
    const beforeToken = tokens.slice(0, idx)
    const fields = beforeToken
      .map(token => {
        try {
          return getExpressionResultType(tokens.concat(token), component)
        } catch(e) {
          // FIXME: notify the user
          console.error(`Error while getting expression result type for token ${token} on component ${component.getName()}#${component.get('id')}.${component.getClasses().join('.')} (${component.cid})`, e)
          return null
        }
      })

    switch(token.type) {
    case 'property':
    case 'filter':
      if(token.optionsForm) {
        const form = token.optionsForm(component, fields[fields.length - 1], token.options || {}, this.parentName || this.name)
        return form || ''
      }
      return ''
    default:
      return ''
    }
  }
}

if(!window.customElements.get('state-editor')) {
  window.customElements.define('state-editor', StateEditor)
}
