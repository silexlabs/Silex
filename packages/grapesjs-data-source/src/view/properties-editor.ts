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
import { DataSourceEditor, DataTree, Filter, Property, Token, getState, setState } from '..'

import '@silexlabs/expression-input'
import { createRef, ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'
import { FIXED_TOKEN_ID, equals, fromString, getFixedToken, toString } from '../utils'
import { ExpressionInput } from '@silexlabs/expression-input'
import { Component } from 'grapesjs'
import { PopinForm } from '@silexlabs/expression-input/dist/popin-form'

declare global {
  interface Window { silex: any }
}

type PropsNames = 
  'innerHTML'
  | 'title'
  | 'className'
  | 'style'
  | 'src'
  | 'href'
  | 'alt'
  | 'condition'
  | 'condition2'
  | '__data'

/**
 * Editor for selected element's properties
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

@customElement('properties-editor')
export class PropertiesEditor extends LitElement {
  @property({type: Boolean})
  disabled = false

  private editor: DataSourceEditor | null = null
  private redrawing = false

  constructor() {
    super()
  }

  setEditor(editor: DataSourceEditor) {
    if (this.editor) throw new Error('editor already set')

    this.editor = editor

    // Update the UI when a page is added/renamed/removed
    this.editor.on('page', () => this.requestUpdate())

    // Update the UI on component selection change
    this.editor.on('component:selected', () => this.requestUpdate())

    // Update the UI on component change
    this.editor.on('component:update', () => this.requestUpdate())
  }

  override render() {
    super.render()
    this.redrawing = true
    const selected = this.editor?.getSelected()
    const head = html`
      <style>
        ${PROPERTY_STYLES}
      </style>
      <slot></slot>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Element Properties</div>
        </div>
        <details class="ds-states__help">
          <summary>Help</summary>
          Elements properties are expressions that can replace the HTML attributes of the element or it's whole content (innerHTML).
          <a target="_blank" href="https://docs.silex.me/en/user/cms#element-properties">Learn more about element properties</a>
        </details>
      </section>
    `
    const empty = html`
      ${head}
      <p class="ds-empty">Select an element to edit its properties</p>
    `
    if(!this.editor || this.disabled) {
      this.redrawing = false
      return html``
    }
    if(!selected || selected.get('tagName') === 'body') {
      this.redrawing = false
      return empty
    }
    const dataTree = this.editor.DataSourceManager.getDataTree()
    const innerHTMLRef = createRef<ExpressionInput>()
    const innerHTML = this.getTokens(dataTree, selected, 'innerHTML', false)
    //const title = this.getTokens(dataTree, selected, 'title')
    //const className = this.getTokens(dataTree, selected, 'className')
    //const style = this.getTokens(dataTree, selected, 'style')
    //const src = this.getTokens(dataTree, selected, 'src')
    //const href = this.getTokens(dataTree, selected, 'href')
    //const alt = this.getTokens(dataTree, selected, 'alt')
    //const conditionOperator = selected.get('conditionOperator') || 'truthy'
    //const condition = this.getTokens(dataTree, selected, 'condition')
    //const condition2 = this.getTokens(dataTree, selected, 'condition2')
    //const __data = this.getTokens(dataTree, selected, '__data', true)

    const fixed = innerHTML?.length === 1 && innerHTML[0].type === 'property' && innerHTML[0].fieldId === FIXED_TOKEN_ID
    const text = fixed ? (innerHTML![0] as Property).options?.value || '' : ''
    const result = html`
      ${head}
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Properties</div>
        </div>
        <main>
            <expression-input
              ${ref(innerHTMLRef)}
              @change=${() => this.onChange(selected, innerHTMLRef.value!, 'innerHTML', false)}
              .fixed=${fixed}
            >
              <label slot="label">Content</label>
              <div slot="fixed" class="ds-slot-fixed">
                <input
                  type="text"
                  class="ds-expression-input__fixed"
                  placeholder="Enter a text or switch to expression mode"
                  value=${text}
                  />
              </div>
              ${ innerHTML && innerHTML.length > 0 ? html`
                ${ innerHTML?.map((token: Token, idx: number) => {
                  const partialExpression = innerHTML.slice(0, idx)
                  const popinRef = createRef<PopinForm>()
                  const optionsForm = this.getOptions(selected, innerHTML, idx)
                  return html`
                    <select>
                      <option value="">-</option>
                      ${ dataTree
                      .getCompletion(selected, partialExpression)
                        .map(partialToken => {
                          return html`
                            <option value="${toString(partialToken)}" .selected=${equals(partialToken, token)}>${partialToken.label}</option>
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
                      name=${`innerHTML_options_${idx}`}
                      @change=${() => this.setChangeOptions(selected, innerHTMLRef.value!, 'innerHTML', false, popinRef.value!, idx)}
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
              <select
                class="ds-expression-input__add"
                ${ref(el => el && ((el as HTMLSelectElement).value = ''))}
              >
                <option value="" selected>+</option>
                ${ dataTree
                    .getCompletion(selected, innerHTML || [])
                      .map(partialToken => {
                        return html`
                          <option value="${toString(partialToken)}">${partialToken.label}</option>
                        `
                      })
                  }
                }
              </select>
            </expression-input>
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop</label>
        </div>
        <main>
        </main>
      </section>
    `
    this.redrawing = false
    return result
  }

  getTokens(dataTree: DataTree, component: Component, key: PropsNames, isPublic = false): Token[] | null {
    const state = getState(component, key, isPublic)
    if(!state || !state.expression) return null
    return state.expression.map(token => dataTree.fromStored(token))
  }

  onChange(component: Component, input: ExpressionInput, key: string, isPublic: boolean) {
    if(this.redrawing) return
    if(input.fixed) {
      setState(component, key, {
        expression: [getFixedToken(input.value[0] || '')],
      }, isPublic)
    } else {
      const ids = input.value
      setState(component, key, {
        expression: ids
          .filter(id => !!id)
          .map(id => fromString(this.editor!, id)),
      }, isPublic)
    }
  }

  setChangeOptions(component: Component, input: ExpressionInput, key: PropsNames, isPublic: boolean, popin: PopinForm, idx: number) {
    if(this.redrawing) return
    const tokensStrings = input.value
    // Get tokens as objects
    const tokens = tokensStrings
      .filter(id => !!id)
      .map(id => fromString(this.editor!, id))
    // Update the options of the token
    console.log('setChangeOptions', tokens[idx], popin.value)
    ;(tokens[idx] as Property | Filter).options = popin.value
    // Update the state
    setState(component, key, {
      expression: tokens
    }, isPublic)
  }

  getOptions(component: Component, tokens: Token[], idx: number): TemplateResult | '' {
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
    'properties-editor': PropertiesEditor
  }
}
