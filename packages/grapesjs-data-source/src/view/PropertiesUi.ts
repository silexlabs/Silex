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
import { html, render } from "lit"
import { Ref, createRef } from 'lit/directives/ref.js'

import '@silexlabs/steps-selector' // For the web component to work
import { StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { DataTree } from "../model/DataTree"
import { DataSourceEditor } from ".."
import { renderExpression, setOptionsFormStyles } from "../utils"

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

export class PropertiesUi {

  protected propsSelectorRefs: Map<PropsNames, Ref<StepsSelector>> = new Map([
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

  // Constructor
  constructor(protected editor: DataSourceEditor, protected options: ViewOptions, protected wrapper: HTMLElement) {
    setOptionsFormStyles(options.optionsStyles ?? '')
  }

  // Update the UI
  updateUi(component: Component | undefined, dataTree: DataTree) {
    if(!component) return
    //const dataStateType: Field | undefined = dataTree.getExpressionResultType(getState(component, '__data', false)?.expression ?? [], component) ?? undefined
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Element Properties</div>
        </div>
        <main>
          ${renderExpression(component, dataTree, 'innerHTML', 'Content', true, this.propsSelectorRefs.get('innerHTML')!)}
          ${renderExpression(component, dataTree, 'title', 'title', true, this.propsSelectorRefs.get('title')!)}
          ${renderExpression(component, dataTree, 'className', 'className', true, this.propsSelectorRefs.get('className')!)}
          ${renderExpression(component, dataTree, 'style', 'style', true, this.propsSelectorRefs.get('style')!)}
          ${renderExpression(component, dataTree, 'src', 'src', true, this.propsSelectorRefs.get('src')!)}
          ${renderExpression(component, dataTree, 'href', 'href', true, this.propsSelectorRefs.get('href')!)}
          ${renderExpression(component, dataTree, 'alt', 'alt', true, this.propsSelectorRefs.get('alt')!)}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${renderExpression(component, dataTree, 'condition', 'condition', true, this.propsSelectorRefs.get('condition')!)}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop</label>
        </div>
        <main>
          ${renderExpression(component, dataTree, '__data', 'data', false, this.propsSelectorRefs.get('__data')!)}
        </main>
      </section>
    `, this.wrapper)
  }

  //renderPropertyUi(component: Component, dataTree: DataTree, name: PropsNames, label: string, field: Field | undefined): TemplateResult {
  //  const state = getState(component, name, false) ?? {expression: []}
  //  if(state?.expression.length !== 0 && state?.expression.length !== 1) {
  //    console.error('Invalid state', state)
  //    throw new Error('Invalid state')
  //  }
  //  if(!field) {
  //    return html`
  //      <label class="ds-label ds-label--disabled">
  //        ${label}
  //        <div class="ds-label__message">No data source</div>
  //      </label>
  //    `
  //  }
  //  //const steps = this.toSteps(dataTree, )
  //  //const fixed = allowFixed && !state.expression.length || state.expression.length === 1 && steps[0].meta?.type?.id === 'String'
  //  const reference = this.propsSelectorRefs.get(name)
  //  const stepsSelector = this.propsSelectorRefs.get(name)?.value
  //  // From fields to types (all the types for the current field)
  //  const types = field.typeIds
  //    .map(typeId => {
  //      const type = dataTree.findType(typeId)
  //      if(!type) {
  //        console.error('Unknown type', typeId)
  //        throw new Error(`Unknown type ${typeId}`)
  //      }
  //      return type
  //    })
  //  // From type to fields (the fields of the given type)
  //  const completion = (): Step[] => {
  //    return types
  //      .flatMap(type => type.fields)
  //      .filter(field => field.kind === 'scalar')
  //      .map(field => {
  //        const token = {
  //          type: 'property',
  //          propType: 'field',
  //          dataSourceId: field.dataSourceId,
  //          kind: field.kind,
  //          typeId: field.typeIds,
  //          fieldId: field.id,
  //        }
  //        return {
  //          name: field.label,
  //          icon: '',
  //          type: this.getDisplayType(field.typeIds, field.kind),
  //          meta: {
  //            token,
  //            type: field,
  //          },
  //        }
  //      })
  //  }
  //  const steps = state.expression.length === 1 ? [this.toStep(dataTree, field, null, state.expression[0], component)] : []
  //  if(stepsSelector) {
  //    // This will not happen for the first render
  //    // The first render will use onload
  //    stepsSelector.steps = steps
  //    stepsSelector.completion = completion
  //  }

  //  return html`
  //    <steps-selector
  //      ${ref(reference)}
  //      max-steps="1"
  //      @load=${(e: CustomEvent) => {
  //        const stepsSelector = e.target as StepsSelector
  //        stepsSelector.steps = steps
  //        stepsSelector.completion = completion
  //      }}
  //      @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, name, e.target as StepsSelector)}
  //      >
  //      ${label}
  //    </steps-selector>
  //  `
  //}
}
