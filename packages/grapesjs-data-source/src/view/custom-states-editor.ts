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
import {customElement, property} from 'lit/decorators.js'
import { DataSourceEditor, DataTree, StoredState, Token, getState, getStateIds, removeState, setState } from '..'

import './state-editor'
import { StateEditor } from './state-editor'
import { Component } from 'grapesjs'

interface Item {
  name: string
  publicState?: boolean
  state: StoredState
}

/**
 * Editor for selected element's states
 * 
 */
@customElement('custom-states-editor')
export class CustomStatesEditor extends LitElement {
  @property({type: Boolean})
  disabled = false

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
          <div class="gjs-traits-label">Element States</div>
        </div>
        <details class="ds-states__help">
          <summary>Help</summary>
          Custom states are used to store data in the component.
          They are useful to store data that is not displayed in the page, but that is used in the expressions of the properties section bellow.
          <a target="_blank" href="https://docs.silex.me/en/user/cms#custom-states">Learn more about custom states</a>
        </details>
      </section>
    `
    const empty = html`
      ${head}
      <p class="ds-empty">Select an element to edit its states</p>
    `
    if(!this.editor) {
    this.redrawing = false
      return html``
    }
    if(!selected || selected.get('tagName') === 'body') {
    this.redrawing = false
      return empty
    }
    const items: Item[] = getStateIds(selected, true)
      .map(stateId => ({
        name: stateId,
        publicState: true,
        state: getState(selected, stateId, true),
      }))
    const result =  html`
      ${head}
      <div class="ds-states">
        <div class="ds-states__items">
          ${items
            .filter(item => !item.state.hidden)
            .map((item, index) => html`
            <div class="ds-states__item">
              ${this.getStateEditor(selected, item.state.label || '', item.name, !!item.publicState)}
              <div class="ds-states__buttons">
                <button
                  title="Remove this state"
                  class="ds-states__remove-button ds-states__button"
                  @click=${() => {
                    removeState(selected, item.name, !!item.publicState)
                    this.requestUpdate()
                  }}
                  >x</button>
                <button
                  title="Rename this state"
                  class="ds-states__rename-button ds-states__button"
                  @click=${() => {
                    const newItem = this.renameCustomState(item)
                    if(!newItem) return
                    removeState(selected, item.name, !!item.publicState)
                    setState(selected, newItem.name, newItem.state, !!newItem.publicState)
                    this.requestUpdate()
                  }}
                  >\u270F</button>
                  <button
                    title="Move this state up"
                    class="ds-states__item-move-up ds-states__button${ index === 0 ? ' ds-states__button--disabled' : '' }"
                    @click=${() => {
                      items.splice(index - 1, 0, items.splice(index, 1)[0]);
                      this.updateCustomStates(selected, items)
                    }}
                    >\u2191</button>
                  <button
                    title="Move this state down"
                    class="ds-states__item-move-down ds-states__button${ index === items.length - 1 ? ' ds-states__button--disabled' : '' }"
                    @click=${() => {
                      items.splice(index + 1, 0, items.splice(index, 1)[0]);
                      this.updateCustomStates(selected, items)
                    }}
                  >\u2193</button>
              </div>
            </div>
            <hr class="ds-states__sep" />
          `)}
        </div>
        <button
          title="Add a new state"
          class="ds-states__add-button ds-states__button"
          @click=${() => {
            const item = this.createCustomState(selected)
            if(!item) return
            setState(selected, item.name, item.state, !!item.publicState)
          }}
          >+</button>
        </div>
    `
    this.redrawing = false
    return result
  }

  getStateEditor(selected: Component, label: string, name: string, publicState: boolean) {
    return html`
      <state-editor
        id="${name}"
        name=${name}
        ${ref(el => {
          if (el) {
            const stateEditor = el as StateEditor
            stateEditor.setEditor(this.editor!)
            stateEditor.data = this.getTokens(this.editor!.DataSourceManager.getDataTree(), selected, name, publicState)
          }
        })}
        @change=${() => this.onChange(selected, name, label, publicState)}
        .disabled=${this.disabled}
      >
        <label slot="label">${label}</label>
      </state-editor>
    `
  }

  onChange(component: Component, name: string, label: string, publicState: boolean) {
    if(this.redrawing) return
    const stateEditor = this.shadowRoot!.querySelector(`#${name}`) as StateEditor
    setState(component, name, {
      expression: stateEditor.data,
      label,
    }, publicState)
  }

  getTokens(dataTree: DataTree, component: Component, name: string, publicState: boolean): Token[] {
    const state = getState(component, name, publicState)
    if(!state || !state.expression) return []
    return state.expression.map(token => dataTree.fromStored(token))
  }

  /**
   * Rename a custom state
   */
  renameCustomState(item: Item): Item {
    const label = prompt('Rename this state', item.state.label)
    if (!label) return item
    return {
      ...item,
      state: {
        ...item.state,
        label: label,
      }
    }
  }

  /**
   * Update the custom states, in the order of the list
   */
  updateCustomStates(component: Component, items: Item[]) {
    const stateIds = getStateIds(component, true)
    // Remove all states
    stateIds.forEach(stateId => {
      removeState(component, stateId, true)
    })
    // Add states in the order of the list
    items.forEach(item => {
      setState(component, item.name, item.state, true)
    })
  }
  
  /**
   * Create a new custom state
   */
  createCustomState(component: Component): Item | null {
    const label = prompt('Name this state', 'New state')
    if (!label) return null
    const stateId = `${component.getId()}-${Math.random().toString(36).slice(2)}`
    const state: StoredState = {
      label,
      expression: [],
    }
    setState(component, stateId, state, true)
    return {
      name: stateId,
      state,
      publicState: true,
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-states-editor': CustomStatesEditor
  }
}
