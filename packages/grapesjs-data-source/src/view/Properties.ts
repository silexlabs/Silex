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

import { Component } from "grapesjs"
import { TemplateResult, html, render } from "lit"
import { Ref, createRef, ref } from 'lit/directives/ref.js'

import { StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { DataTree } from "../model/DataTree"
import { DataSourceEditor, StateId } from ".."
import { StoredState, getState, getStateIds, removeState, setState } from "../model/state"
import { renderExpression, setOptionsFormStyles } from "../utils"
import { Item, States } from "./States"

type PropsNames = 
  'innerHTML'
  | 'title'
  | 'className'
  | 'style'
  | 'src'
  | 'href'
  | 'alt'
  | 'condition'
  | '__data'

interface StateItem extends Item {
  stateId: StateId
  component: Component
  storedState: StoredState
}

export class Properties {

  private propsSelectorRefs: Map<PropsNames, Ref<StepsSelector>> = new Map([
    ['innerHTML', createRef<StepsSelector>()],
    ['title', createRef<StepsSelector>()],
    ['className', createRef<StepsSelector>()],
    ['style', createRef<StepsSelector>()],
    ['src', createRef<StepsSelector>()],
    ['href', createRef<StepsSelector>()],
    ['alt', createRef<StepsSelector>()],
    ['condition', createRef<StepsSelector>()],
    ['__data', createRef<StepsSelector>()],
  ])

  private statesSelectorRefs: Map<StateId, Ref<StepsSelector>> = new Map()
  private statesUi: States<StateItem>
  private currentComponent: Component | undefined

  // Constructor
  constructor(private editor: DataSourceEditor, private options: ViewOptions, private wrapper: HTMLElement) {
    setOptionsFormStyles(options.optionsStyles ?? '')
    this.statesUi = new States<StateItem>({
      renderItem: item => this.renderCustomState(item),
      createItem: () => this.createCustomState(),
      renameItem: item => this.renameCustomState(item),
      onChange: items => this.updateCustomStates(items),
    })
  }

  /**
   * Render a custom state
   */
  renderCustomState(item: StateItem): TemplateResult {
    return renderExpression(
      item.component,
      this.editor.DataSourceManager.getDataTree(),
      item.stateId,
      item.storedState.label || item.stateId,
      true,
      this.statesSelectorRefs.get(item.stateId)!,
      true,
      'text',
    )
  }

  /**
   * Rename a custom state
   */
  renameCustomState(item: StateItem): StateItem {
    const label = prompt('Rename this state', item.storedState.label)
    return {
      ...item,
      storedState: {
        ...item.storedState,
        label: label || item.storedState.label,
      }
    }
  }

  /**
   * Update the custom states, in the order of the list
   */
  updateCustomStates(items: StateItem[]) {
    if (!this.currentComponent) return
    const component = this.currentComponent
    const stateIds = getStateIds(this.currentComponent, true)
    // Remove all states
    stateIds.forEach(stateId => {
      removeState(component, stateId, true)
    })
    // Add states in the order of the list
    items.forEach(item => {
      setState(item.component, item.stateId, item.storedState, true)
    })
  }
  
  /**
   * Create a new custom state
   */
  createCustomState(): StateItem | null {
    if (!this.currentComponent) throw new Error('No current component')
    const label = prompt('Name this state', 'New state')
    if (!label) return null
    if (getStateIds(this.currentComponent).includes(label)) {
      alert('A state with this name already exists')
      return null
    }
    const stateId = `${this.currentComponent.getId()}-${Math.random().toString(36)}`
    const storedState: StoredState = {
      label,
      expression: [],
    }
    setState(this.currentComponent, stateId, storedState, true)
    return { stateId, storedState, component: this.currentComponent }
  }

  /**
   * Update the custom states UI
   */
  updateCustomStatesUi(component: Component, wrapper: HTMLElement) {
    this.currentComponent = component
    const stateIds = getStateIds(component, true)
    stateIds.forEach(stateId => {
      if (!this.statesSelectorRefs.has(stateId)) {
        this.statesSelectorRefs.set(stateId, createRef<StepsSelector>())
      }
    })
    this.statesUi.setData(stateIds
      .map(stateId => ({
        stateId,
        component,
        storedState: getState(component, stateId, true),
      }))
      .map(item => ({
        ...item,
        hide: item.storedState.hidden,
      }))
    , wrapper)
  }

  /**
   * Update the UI
   */
  updateUi(component: Component | undefined, dataTree: DataTree) {
    if(!component) return
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Custom States</div>
        </div>
        <main>
          <div
            ${ref(el => {
              if(!el) return
              this.updateCustomStatesUi(component, el as HTMLElement)
            })}
            ></div>
        </main>
      </section>
      ${ component.get('tagName') === 'body' ? '' : html`
        <section class="ds-section">
          <div>
            <div class="gjs-traits-label">Element Properties</div>
          </div>
          <details class="ds-states__help">
            <summary>Help</summary>
            Elements properties are expressions that can replace the HTML attributes of the element or it's whole content (innerHTML).
            <a target="_blank" href="https://docs.silex.me/en/user/cms#element-properties">Learn more about element properties</a>
          </details>
          <main>
            ${renderExpression(component, dataTree, 'innerHTML', 'Content', true, this.propsSelectorRefs.get('innerHTML')!, false, 'text')}
            ${renderExpression(component, dataTree, 'title', 'title', true, this.propsSelectorRefs.get('title')!, false, 'text')}
            ${renderExpression(component, dataTree, 'className', 'className', true, this.propsSelectorRefs.get('className')!, false, 'text')}
            ${renderExpression(component, dataTree, 'style', 'style', true, this.propsSelectorRefs.get('style')!, false, 'text')}
            ${renderExpression(component, dataTree, 'src', 'src', true, this.propsSelectorRefs.get('src')!, false, 'url')}
            ${renderExpression(component, dataTree, 'href', 'href', true, this.propsSelectorRefs.get('href')!, false, 'url')}
            ${renderExpression(component, dataTree, 'alt', 'alt', true, this.propsSelectorRefs.get('alt')!, false, 'text')}
          </main>
        </section>
        <section class="ds-section">
          <div>
            <div class="gjs-traits-label">Visibility</div>
          </div>
          <main>
            ${renderExpression(component, dataTree, 'condition', 'condition', false, this.propsSelectorRefs.get('condition')!, false)}
          </main>
        </section>
        <section class="ds-section">
          <div>
            <label class="gjs-traits-label ds-label">Loop</label>
          </div>
          <main>
            ${renderExpression(component, dataTree, '__data', 'data', false, this.propsSelectorRefs.get('__data')!, false)}
          </main>
        </section>
      ` }
    `, this.wrapper)
  }
}
