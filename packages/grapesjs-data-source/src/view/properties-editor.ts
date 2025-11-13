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

import {LitElement, html} from 'lit'
import { ref } from 'lit/directives/ref.js'
import {property} from 'lit/decorators.js'

import './state-editor'
import { StateEditor } from './state-editor'
import { Component, Editor } from 'grapesjs'
import { PROPERTY_STYLES } from './defaultStyles'
import { fromStored } from '../model/token'
import { BinaryOperator, Properties, Token, UnariOperator } from '../types'
import { getState, setState } from '../model/state'
import { getFixedToken } from '../utils'

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

export class PropertiesEditor extends LitElement {
  @property({type: Boolean})
    disabled = false

  @property({type: Boolean, attribute: 'default-fixed'})
    defaultFixed = false

  inputs: Record<Properties, {stateEditor: StateEditor, selected: Component | undefined} | undefined> = {
    innerHTML: undefined,
    condition: undefined,
    condition2: undefined,
    __data: undefined,
  }

  private editor: Editor | null = null
  private redrawing = false

  setEditor(editor: Editor) {
    if (this.editor) {
      console.warn('property-editor setEditor already set')
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

  override render() {
    super.render()
    this.redrawing = true
    const selected = this.editor?.getSelected()
    const head = html`
      <style>
        ${PROPERTY_STYLES}
      </style>
      <slot></slot>
    `
    const empty = html`
      ${head}
      <p class="ds-empty">Select an element to edit its properties</p>
    `
    if(!this.editor || this.disabled) {
      this.resetInputs()
      this.redrawing = false
      return html``
    }
    if(!selected || selected.get('tagName') === 'body') {
      this.resetInputs()
      this.redrawing = false
      return empty
    }
    const result =  html`
      ${head}
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Properties</div>
        </div>
        <details class="ds-states__help">
          <summary>Help</summary>
          Elements properties are expressions that can replace the HTML attributes of the element or it's whole content (innerHTML).
          <a target="_blank" href="https://docs.silex.me/en/user/cms-concepts#properties">Learn more about element properties</a>
        </details>
        <main>
          ${[
    {label: 'HTML content', name: Properties.innerHTML, publicState: false},
  ].map(({label, name, publicState}) => this.renderStateEditor(selected, label, name, publicState))}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${this.renderStateEditor(selected, 'Condition', Properties.condition, false)}
          <div>
          <span>... is</span>
          <select
            class="ds-visibility__condition-operator"
            @change=${(e: Event) => {
    const select = e.target as HTMLSelectElement
    const value = select.value
    if(!value) throw new Error('Selection required for operator select element')
    selected.set('conditionOperator', value)
    this.requestUpdate()
  }}
          >
          </div>
          ${ Object.values<string>(UnariOperator)
    .concat(Object.values(BinaryOperator))
    .map(operator => html`
                <option value="${operator}" .selected=${selected.get('conditionOperator') === operator} >${operator}</option>
              `)
}
          </select>
          ${ this.renderStateEditor(selected, '', Properties.condition2, false, false, selected.has('conditionOperator') && Object.values(BinaryOperator).includes(selected.get('conditionOperator'))) }
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop</label>
        </div>
        <main>
          ${this.renderStateEditor(selected, 'Data', Properties.__data, false, true)}
        </main>
      </section>
    `
    this.redrawing = false
    return result
  }

  resetInputs() {
    this.inputs = {
      innerHTML: undefined,
      condition: undefined,
      condition2: undefined,
      __data: undefined,
    }
  }

  renderStateEditor(selected: Component, label: string, name: Properties, publicState: boolean, hideLoopData = false, visible = true) {
    return html`
      <state-editor
        .style=${visible ? '' : 'display: none;'}
        .selected=${selected}
        .editor=${this.editor}
        id="${name}"
        name=${name}
        default-fixed=${this.defaultFixed}
        ?hide-loop-data=${hideLoopData}
        ${ref(el => {
    // Get the stateEditor ref
    if (el) {
      // Set the editor - we could do this only once
      const stateEditor = el as StateEditor
      // Store the stateEditor ref and the component it is representing
      if (!this.inputs[name]) {
        this.inputs[name] = {
          stateEditor,
          selected: undefined, // clear the selected component so that we update the data
        }
      }
    }
    // Finally update the data
    if (this.inputs[name]) {
      const stateEditorFinally = this.inputs[name]!.stateEditor
      this.redrawing = true
      try {
        stateEditorFinally.data = this.getTokens(selected, name, publicState)
      } catch (e) {
        console.error('Error setting data', e)
        stateEditorFinally.data = [getFixedToken(`Error setting data: ${e}`)]
      }
      this.redrawing = false
      // Store the selected component
      this.inputs[name]!.selected = selected
    }
  })}
        @change=${() => this.onChange(selected, name, publicState)}
        ?disabled=${this.disabled}
      >
        <label slot="label">${label}</label>
      </state-editor>
    `
  }

  onChange(component: Component, name: Properties, publicState: boolean) {
    const {stateEditor} = this.inputs[name]!
    if(this.redrawing) return
    if (name === Properties.__data) {
      // Handle the case when data is empty (after clearing)
      if (stateEditor.data.length === 0) {
        setState(component, name, {
          expression: [],
        }, publicState)
      } else {
        setState(component, name, {
          expression: stateEditor.data.slice(0, -1).concat({
            ...stateEditor.data[stateEditor.data.length - 1],
            previewIndex: 0,
          } as unknown as Token),
        }, publicState)
      }
    } else {
      setState(component, name, {
        expression: stateEditor.data,
      }, publicState)
    }
  }

  getTokens(component: Component, name: Properties, publicState: boolean): Token[] {
    const state = getState(component, name, publicState)
    if(!state || !state.expression) return []
    return state.expression
      .filter(token => token && typeof token === 'object' && token.type) // Filter out invalid tokens
      .map(token => fromStored(token, component.getId()))
  }
}

if(!window.customElements.get('properties-editor')) {
  window.customElements.define('properties-editor', PropertiesEditor)
}
