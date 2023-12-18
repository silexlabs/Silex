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
import {customElement, property} from 'lit/decorators.js'
import { OPTIONS_STYLES, PROPERTY_STYLES } from './defaultStyles'
import { DataSourceEditor, Filter, Property, Token, getStateLabel } from '..'

import { createRef, ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'
import { FIXED_TOKEN_ID, equals, fromString, getFixedToken, getTokenDisplayName, toString } from '../utils'
import { ExpressionInput } from '@silexlabs/expression-input'
import { Component } from 'grapesjs'
import { PopinForm } from '@silexlabs/expression-input/dist/popin-form'

import '@silexlabs/expression-input'

/**
 * Editor for a state of the selected element's properties
 * 
 * Usage:
 * 
 * ```
 * <properties-editor disabled>
 *   <style> / * Custom styles * / </style>
 * </properties-editor>
 * ```
 * 
 */

@customElement('state-editor')
export class StateEditor extends LitElement {
  @property({type: Boolean})
  disabled = false

  @property({type: String})
  name = ''

  @property({type: Boolean, attribute: 'no-filters'})
  noFilters = false

  /**
   * Value string for for submissions
   */
  @property()
  get value(): string {
    return JSON.stringify(this.data)
  }
  set value(newValue: string) {
    try {
      this.data = JSON.parse(newValue)
    } catch(e) {
      this.data = newValue
    }
  }

  /**
   * Structured data
   */
  private _data: Token[] = []
  get data(): Token[] {
    const input = this.expressionInputRef.value
    if(!input) return []
    if(input.fixed) {
      return [getFixedToken(input.value[0] || '')]
    } else {
      const ids = input.value
      return ids
          .filter(id => !!id)
          .map(id => fromString(this.editor!, id))
    }
  }
  set data(value: Token[] | string) {
    if(typeof value === 'string') {
      this._data = value === '' ? [] : [getFixedToken(value)]
    } else {
      this._data = value
    }
    this.requestUpdate()
  }

  private editor: DataSourceEditor | null = null
  private redrawing = false
  private expressionInputRef = createRef<ExpressionInput>()

  setEditor(editor: DataSourceEditor) {
    if (this.editor) {
      return
    }

    this.editor = editor

    // Update the UI when a page is added/renamed/removed
    this.editor.on('page', () => this.requestUpdate())

    // Update the UI on component selection change
    this.editor.on('component:selected', () => this.requestUpdate())

    // Update the UI on component change
    this.editor.on('component:update', () => this.requestUpdate())
  }

  rerender() {
    this._data = this.data
    this.requestUpdate()
  }

  override render() {
    super.render()
    const selected = this.editor?.getSelected()
    if(!this.editor) {
      throw new Error('editor not set')
    }
    if(!selected) {
      throw new Error('no selected component')
    }
    if(!this.name) {
      throw new Error('name is required on state-editor')
    }
    const dataTree = this.editor.DataSourceManager.getDataTree()
    const _currentValue = this._data

    const fixed = _currentValue?.length === 1 && _currentValue[0].type === 'property' && _currentValue[0].fieldId === FIXED_TOKEN_ID
    const text = fixed ? (_currentValue![0] as Property).options?.value || '' : ''
    const _completion = dataTree.getCompletion(selected, _currentValue || [])
    const completion = this.noFilters ? _completion
      .filter(token => token.type !== 'filter')
      : _completion
    const maxLineWidth = Math.max(...completion.map(token => getTokenDisplayName(selected, token).length))
    const result = html`
      <expression-input
        @change=${() => this.dispatchEvent(new Event('change'))}
        data-is-input
        ${ref(this.expressionInputRef)}
        .fixed=${fixed}
        class="ds-section"
        name=${this.name}
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
            value=${text}
            />
        </div>
        ${ _currentValue && _currentValue.length > 0 ? html`
          ${ _currentValue?.map((token: Token, idx: number) => {
            const popinRef = createRef<PopinForm>()
            const optionsForm = this.getOptions(selected, _currentValue, idx)
            const partialExpression = _currentValue.slice(0, idx)
            const partialCompletion = dataTree
                .getCompletion(selected, partialExpression)
            const partialMaxLineWidth = Math.max(...partialCompletion.map(token => getTokenDisplayName(selected, token).length))
            return html`
              <select>
                <option value="">-</option>
                ${ partialCompletion
                  .map(partialToken => {
                    return html`
                      <option value="${toString(partialToken)}" .selected=${equals(partialToken, token)}>${getTokenDisplayName(selected, partialToken, partialMaxLineWidth)}</option>
                    `
                  })
                }
              </select>
              <button
                class="ds-expression-input__options-button"
                style=${styleMap({ display: optionsForm === '' ? 'none' : '' })}
                @click=${() => {
                  popinRef.value?.removeAttribute('hidden')
                }}
              >...</button>
              <popin-form
                ${ref(popinRef)}
                hidden
                name=${`${this.name}_options_${idx}`}
                @change=${() => this.setChangeOptions(selected, popinRef.value!, idx)}
              >
                <style>
                  ${OPTIONS_STYLES}
                </style>
                ${optionsForm}
              </popin-form>
              `
            })
          }
        ` : '' }
        ${ completion.length ? html`
          <select
            class="ds-expression-input__add"
            ${ref(el => el && ((el as HTMLSelectElement).value = ''))}
          >
            <option value="" selected>+</option>
            ${ completion
                  .map(partialToken => {
                    return html`
                      <option value="${toString(partialToken)}">${getTokenDisplayName(selected, partialToken, maxLineWidth)}</option>
                    `
                  })
            }
          </select>
        ` : '' }
      </expression-input>
    `
    this.redrawing = false
    return result
  }

  private setChangeOptions(component: Component, popin: PopinForm, idx: number) {
    if(this.redrawing) return
    const input = this.expressionInputRef.value!
    const tokensStrings = input.value
    // Get tokens as objects
    const tokens = tokensStrings
      .filter(id => !!id)
      .map(id => fromString(this.editor!, id))
    // Get the selected options
    const options = input.options
      .filter(o => o.selected)
    // Update the options of the token
    ;(tokens[idx] as Property | Filter).options = popin.value
    // Update the dom
    options[idx].value = toString(tokens[idx])
    // Update the state
    this.requestUpdate()
    // Notify the owner
    this.dispatchEvent(new Event('change'))
  }

  private getOptions(component: Component, tokens: Token[], idx: number): TemplateResult | '' {
    const dataTree = this.editor!.DataSourceManager.getDataTree()
    const token = tokens[idx]
    const beforeToken = tokens.slice(0, idx)
    const fields = beforeToken
      .map(token => dataTree.getExpressionResultType(tokens.concat(token), component))

    switch(token.type) {
      case 'property':
      case 'filter':
        if(token.optionsForm) {
          const form = token.optionsForm(fields[fields.length - 1], token.options || {})
          return form || ''
        }
        return ''
      default:
        return ''
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'state-editor': StateEditor
  }
}
