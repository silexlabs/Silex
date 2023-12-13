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
import {customElement, property, query} from 'lit/decorators.js'
import { DataSourceEditor, DataTree, Token, getState, setState } from '..'

import './state-editor'
import { StateEditor } from './state-editor'
import { Component } from 'grapesjs'

enum PropsNames {
  innerHTML = 'innerHTML',
  title = 'title',
  className = 'className',
  style = 'style',
  src = 'src',
  href = 'href',
  alt = 'alt',
  condition = 'condition',
  condition2 = 'condition2',
  __data = '__data',
}

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

  @query('state-editor#innerHTML')
  innerHTMLInput: StateEditor | undefined

  private editor: DataSourceEditor | null = null
  private redrawing = false

  setEditor(editor: DataSourceEditor) {
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
    if(!this.editor) {
    this.redrawing = false
      return html``
    }
    if(!selected || selected.get('tagName') === 'body') {
    this.redrawing = false
      return empty
    }
    const result =  html`
      ${head}
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Properties</div>
        </div>
        <main>
            <state-editor
              id="innerHTML"
              name=${PropsNames.innerHTML}
              ${ref(el => {
                if (el) {
                  const stateEditor = el as StateEditor
                  stateEditor.setEditor(this.editor!)
                  stateEditor.data = this.getTokens(this.editor!.DataSourceManager.getDataTree(), selected, PropsNames.innerHTML, false)
                }
              })}
              @change=${() => this.onChange(selected, this.innerHTMLInput!, PropsNames.innerHTML, false)}
              .disabled=${this.disabled}
            >
              <label slot="label">Content</label>
            </state-editor>
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
  onChange(component: Component, stateEditor: StateEditor, name: PropsNames, publicState: boolean) {
    if(this.redrawing) return
    setState(component, name, {
      expression: stateEditor.data
    }, publicState)
  }
  getTokens(dataTree: DataTree, component: Component, name: PropsNames, publicState: boolean): Token[] {
    const state = getState(component, name, publicState)
    if(!state || !state.expression) return []
    return state.expression.map(token => dataTree.fromStored(token))
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'properties-editor': PropertiesEditor
  }
}
