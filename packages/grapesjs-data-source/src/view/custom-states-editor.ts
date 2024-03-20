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
import { StoredState, getState, getStateIds, removeState, setState } from '../model/state'
import { DataSourceEditor, Token  } from '../types'

import './state-editor'
import { StateEditor } from './state-editor'
import { Component } from 'grapesjs'
import { PROPERTY_STYLES } from './defaultStyles'
import { fromStored } from '../model/token'
import { DataTree } from '../model/DataTree'
import { cleanStateName } from '../utils'

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

  @property({type: Boolean, attribute: 'private-state'})
  privateState = false

  @property({type: String})
  title = 'Custom states'

  @property({type: Boolean, attribute: 'default-fixed'})
  defaultFixed = false

  @property({type: String, attribute: 'create-prompt'})
  createPrompt = 'Name this state'

  @property({type: String, attribute: 'rename-prompt'})
  renamePrompt = 'Rename this state'

  @property({type: String, attribute: 'default-name'})
  defaultName = 'New state'

  // This is a comma separated list of reserved names
  // Or an array of reserved names
  @property({type: String, attribute: 'reserved-names'})
  get reservedNames() { return this._reservedNames }
  set reservedNames(value: string | string[]) {
    if(typeof value === 'string') this._reservedNames = value.split(',').map(s => s.trim())
    else this._reservedNames = value
  }

  private _reservedNames: string[] = []
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

  getHead(selected: Component | null) {
    return html`
      <style>
        ${PROPERTY_STYLES}
      </style>
      <slot></slot>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">
            <span>${this.title}</span>
            ${ selected ? html`
            <button
              title="Add a new state"
              class="ds-states__add-button ds-states__button"
              @click=${() => {
                const item = this.createCustomState(selected)
                if(!item) return
                this.setState(selected, item.name, item.state)
              }}
              >+</button>
            ` : ''}
          </div>
        </div>
        <details class="ds-states__help">
          <summary>Help</summary>
          Custom states are used to store data in the component.
          They are useful to store data that is not displayed in the page, but that is used in the expressions of the properties section bellow.
          <a target="_blank" href="https://docs.silex.me/en/user/cms#custom-states">Learn more about custom states</a>
        </details>
      </section>
    `
  }

  override render() {
    super.render()
    this.redrawing = true
    const selected = this.editor?.getSelected()
    const empty = html`
      ${this.getHead(null)}
      <p class="ds-empty">Select an element to edit its states</p>
    `
    if(!this.editor || this.disabled) {
      this.redrawing = false
      return html``
    }
    if(!selected) {
      this.redrawing = false
      return empty
    }
    const items: Item[] = this.getStateIds(selected)
      .map(stateId => ({
        name: stateId,
        publicState: !this.privateState,
        state: this.getState(selected, stateId)!,
      }))
      .filter(item => item.state && !item.state.hidden)
    const result =  html`
      ${this.getHead(selected)}
      <div class="ds-states">
        <div class="ds-states__items">
          ${items
            .map((item, index) => html`
            <div class="ds-states__item">
              ${this.getStateEditor(selected, item.state.label || '', item.name)}
              <div class="ds-states__buttons">
                <button
                  title="Remove this state"
                  class="ds-states__remove-button ds-states__button"
                  @click=${() => {
                    this.removeState(selected, item.name)
                    this.requestUpdate()
                  }}
                  >x</button>
                <button
                  title="Rename this state"
                  class="ds-states__rename-button ds-states__button"
                  @click=${() => {
                    const newItem = this.renameCustomState(item)
                    if(!newItem || newItem === item) return
                    this.removeState(selected, item.name)
                    this.setState(selected, newItem.name, newItem.state)
                    this.requestUpdate()
                  }}
                  >\u270F</button>
                  <button
                    title="Move this state up"
                    class="ds-states__item-move-up ds-states__button${ index === 0 ? ' ds-states__button--disabled' : '' }"
                    @click=${() => {
                      items.splice(index - 1, 0, items.splice(index, 1)[0]);
                      this.updateOrderCustomStates(selected, items)
                    }}
                    >\u2191</button>
                  <button
                    title="Move this state down"
                    class="ds-states__item-move-down ds-states__button${ index === items.length - 1 ? ' ds-states__button--disabled' : '' }"
                    @click=${() => {
                      items.splice(index + 1, 0, items.splice(index, 1)[0]);
                      this.updateOrderCustomStates(selected, items)
                    }}
                  >\u2193</button>
              </div>
            </div>
            <hr class="ds-states__sep" />
          `)}
        </div>
      </div>
    `
    this.redrawing = false
    return result
  }

  /**
   * Get the states for this type of editor
   */
  getStateIds(component: Component): string[] {
    const stateIds = getStateIds(component, !this.privateState)
    switch(this.privateState) {
      case true:
        // All public states are states
        return stateIds
      case false:
        return stateIds
          // Filter out the states which are properties
          .filter(stateId => !this.reservedNames.includes(stateId))
    }
  }

  /**
   * Get the states for this type of editor
   */
  getState(component: Component, name: string): StoredState | null {
    return getState(component, name, !this.privateState)
  }

  /**
   * Set the states for this type of editor
   */
  setState(component: Component, name: string, state: StoredState) {
    setState(component, name, state, !this.privateState)
  }

  /**
   * Remove the states for this type of editor
   */
  removeState(component: Component, name: string) {
    removeState(component, name, !this.privateState)
  }

  getStateEditor(selected: Component, label: string, name: string) {
    return html`
      <state-editor
        id="${name}"
        name=${name}
        default-fixed=${this.defaultFixed}
        ${ref(el => {
          if (el) {
            const stateEditor = el as StateEditor
            stateEditor.setEditor(this.editor!)
            stateEditor.data = this.getTokens(this.editor!.DataSourceManager.getDataTree(), selected, name)
          }
        })}
        @change=${() => this.onChange(selected, name, label)}
        .disabled=${this.disabled}
      >
        <label slot="label">${label || name}</label>
      </state-editor>
    `
  }

  onChange(component: Component, name: string, label: string) {
    if(this.redrawing) return
    const stateEditor = this.shadowRoot!.querySelector(`#${name}`) as StateEditor
    this.setState(component, name, {
      expression: stateEditor.data,
      label,
    })
  }

  getTokens(dataTree: DataTree, component: Component, name: string): Token[] {
    const state = this.getState(component, name)
    if(!state || !state.expression) return []
    return state.expression.map(token => {
      try {
        return fromStored(token, dataTree)
      } catch (e) {
        // FIXME: notify user
        console.error('Error while getting expression result type', state.expression, component, dataTree)
        return {
          type: 'property',
          propType: 'field',
          fieldId: 'unknown',
          label: 'unknown',
          kind: 'scalar',
          typeIds: [],
        }
      }
    })
  }

  /**
   * Rename a custom state
   */
  renameCustomState(item: Item): Item {
    const label = prompt(this.renamePrompt, item.state.label)
      ?.toLowerCase()
      ?.replace(/[^a-z0-9]/g, '-')
      ?.replace(/^-+|-+$/g, '')
    if (!label || label === item.state.label) return item
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
  updateOrderCustomStates(component: Component, items: Item[]) {
    const stateIds = this.getStateIds(component)
    // Remove all states
    stateIds.forEach(stateId => {
      if(items.map(item => item.name).includes(stateId)) {
        this.removeState(component, stateId)
      }
    })
    // Add states in the order of the list
    items.forEach(item => {
      this.setState(component, item.name, item.state)
    })
  }
  
  /**
   * Create a new custom state
   */
  createCustomState(component: Component): Item | null {
    const label = cleanStateName(prompt(this.createPrompt, this.defaultName))
    if (!label) return null
    
    if(this.reservedNames.includes(label)) {
      alert(`The name ${label} is reserved, please choose another name`)
      return null
    }
    const stateId = `${component.getId()}-${Math.random().toString(36).slice(2)}`
    const state: StoredState = {
      label,
      expression: [],
    }
    this.setState(component, stateId, state)
    return {
      name: stateId,
      state,
      publicState: !this.privateState,
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-states-editor': CustomStatesEditor
  }
}
