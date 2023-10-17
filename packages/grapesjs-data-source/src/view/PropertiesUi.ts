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
import { Ref, createRef, ref } from 'lit/directives/ref.js';

import '@silexlabs/steps-selector'
import { Step, StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { getOrCreatePersistantId, getState, removeState, setState } from "../model/state"
import { DataTree } from "../model/DataTree"
import { Expression, Token, Type, TypeId, FieldKind } from "../types"
import { DataSourceEditor } from ".."

type PropsNames = 
  'innerHTML'
  | 'title'
  | 'class'
  | 'style'
  | 'src'
  | 'href'
  | 'alt'
  | 'loopIndex'
  | 'condition'
  | 'data'
  | 'sort'
  | 'limit'
  | 'offset'

export class PropertiesUi {
  protected propsSelectorRefs: Map<PropsNames, Ref<StepsSelector>> = new Map([
    ['innerHTML', createRef<StepsSelector>()],
    ['title', createRef<StepsSelector>()],
    ['class', createRef<StepsSelector>()],
    ['style', createRef<StepsSelector>()],
    ['src', createRef<StepsSelector>()],
    ['href', createRef<StepsSelector>()],
    ['alt', createRef<StepsSelector>()],
    ['condition', createRef<StepsSelector>()],
    ['data', createRef<StepsSelector>()],
    ['sort', createRef<StepsSelector>()],
    ['limit', createRef<StepsSelector>()],
    ['offset', createRef<StepsSelector>()],
  ])
  // Constructor
  constructor(protected editor: DataSourceEditor, protected options: ViewOptions, protected wrapper: HTMLElement) {}

  setCompletion(dataTree: DataTree, component: Component, stepsSelector: StepsSelector) {
    stepsSelector.completion = (steps: Step[]): Step[] => {
      // Current expression
      const expression = steps.map(step => step.meta.token)
      // Get the completion, which is a context
      // It is a list of tokens, each one can be added at the end of the expression
      const tokens = dataTree.getCompletion(component, expression)
      // Get the type for each token
      // The filters output types are resolved
      const types = tokens
        .map(token => dataTree.getExpressionResultType(tokens.concat(token)))
      // Convert the context to steps
      return types
      .map((type, index) => {
        if(!tokens[index]) {
          console.error('Unknown type (completion)', tokens[index])
          throw new Error(`Unknown type`)
        }
        // if(!type) {
        //   // Happens when a filter returns no type
        // }
        return this.toStep(dataTree, type, tokens[index])
      })
    }
  }

  getDisplayType(typeIds: TypeId[], kind: FieldKind | null): string {
    const typeLabel = typeIds.join(', ')
    return kind === 'list' ? `${typeLabel} [ ]` : kind === 'object' ? `${typeLabel} { }` : typeLabel
  }

  /**
   * Convert an expression to steps
   * This will resolve the types of filters
   */
  toSteps(dataTree: DataTree, expression: Expression): Step[] {
    return dataTree.expressionToFields(expression)
      .map((type, index) => {
        const token = expression[index]
        if (!type) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        return this.toStep(dataTree, type, token)
      })
  }

  /**
   * Convert a token to a step
   * This will resolve the types of filters
   * @param type can be null, this happens when token is a filter with output resolving to null
   */
  toStep(dataTree: DataTree, type: Type | null, token: Token): Step {
    switch (token.type) {
      case 'property':
        if(!type) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        switch (token.propType) {
          case 'type': return {
            name: type.id,
            icon: '',
            type: this.getDisplayType([type.dataSourceId as string ?? 'Type'], null), // FIXME: use a data source option as a name
            meta: { token, type }
          }
          case 'field': return {
            name: token.fieldId,
            icon: '',
            type: this.getDisplayType(token.typeIds, token.kind),
            meta: { token, type }
          }
          default:
            console.error('Unknown property type (reading propType)', token)
            throw new Error(`Unknown property type`)
        }
      case 'filter':
        // Here type may be null
        return {
          name: token.name,
          icon: '',
          type: 'Filter',
          options: token.options,
          optionsForm: token.optionsForm ?? undefined,
          meta: { token, type }
        }
      case 'state': {
        //const component = this.editor.Components.getById(token.componentId)
        //const state = getState(component, token.id, token.exposed)
        //const othertype = dataTree.getTypeFromExpression(state?.expression ?? [])
        return {
          name: token.id,
          icon: '',
          type: type?.name ?? 'Unknown',
          meta: { token, type }
        }
      }
      default:
        console.error('Unknown token type (reading type)', token)
        throw new Error(`Unknown token type`)
    }
  }

  chagedStepsSelector(component: Component, name: string, stepsSelector: StepsSelector) {
    // Check input
    if(!component) throw new Error('Component is required')
    if(!name) throw new Error('Name is required')
    // Update the tokens with new options values
    const steps = stepsSelector.steps.map(step => {
      const token = step.meta?.token ?? this.getFixedToken(step.options?.value ?? '', 'String') // Add a fixed string if the token is not found
      token.options = step.options
      token.optionsForm = step.optionsForm
      return {
        ...step,
        meta: {
          ...step.meta,
          token,
        }
      }
    })
    // Update the state
    setState(component, name, {
      expression: steps.map(step => step.meta.token),
    }, false)
  }

  getFixedToken(value: string | number | boolean, typeId: TypeId): Token {
    return {
      type: 'filter',
      id: 'fixed',
      name: 'Fixed value',
      output: () => typeId,
      validate: () => true,
      apply: () => value,
      options: {
        value,
      },
      optionsForm: `
        <form>
          <label>Value
            <input type="text" name="value" value="${value.toString()}">
            <button type="submit">Done</button>
          </label>
        </form>
      `
    }
  }

  // Update the UI
  updateUi(component: Component | undefined, dataTree: DataTree) {
    if(!component) return
    const dataStateType: Type | undefined = dataTree.getExpressionResultType(getState(component, 'data', false)?.expression ?? []) ?? undefined
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Element Properties</div>
        </div>
        <main>
          ${this.renderExpressionUi(component, dataTree, 'innerHTML', true)}
          ${this.renderExpressionUi(component, dataTree, 'title', true)}
          ${this.renderExpressionUi(component, dataTree, 'class', true)}
          ${this.renderExpressionUi(component, dataTree, 'style', true)}
          ${this.renderExpressionUi(component, dataTree, 'src', true)}
          ${this.renderExpressionUi(component, dataTree, 'href', true)}
          ${this.renderExpressionUi(component, dataTree, 'alt', true)}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop
            <input
              type="checkbox"
              name="loop"
              .checked=${!!getState(component, 'loopIndex', true)}
              @change=${(e: InputEvent) => {
                if((e.target as HTMLInputElement).checked) {
                  setState(component, 'loopIndex', {
                    expression: [{
                      type: 'property',
                      propType: 'type',
                      typeId: 'Int',
                      dataSourceId: null,
                    }],
                  }, true)
                  setState(component, 'loopItem', {
                    expression: [{
                      type: 'state',
                      id: 'data',
                      componentId: getOrCreatePersistantId(component),
                      exposed: false,
                    }],
                  }, true)
                } else {
                  removeState(component, 'loopIndex', true)
                  removeState(component, 'loopItem', true)
                }
              }}
            ></label>
        </div>
        <main>
          ${ getState(component, 'loopIndex', true) ? html`
            ${this.renderExpressionUi(component, dataTree, 'data', false)}
            ${this.renderPropertyUi(component, dataTree, 'sort', dataStateType)}
            ${this.renderExpressionUi(component, dataTree, 'limit', true)}
            ${this.renderExpressionUi(component, dataTree, 'offset', true)}
          ` : ''}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${this.renderExpressionUi(component, dataTree, 'condition', true)}
        </main>
      </section>
    `, this.wrapper)
  }

  renderExpressionUi(component: Component, dataTree: DataTree, name: PropsNames, allowFixed: boolean, maxSteps?: number): TemplateResult {
    const state = getState(component, name, false) ?? {expression: []}
    const steps = this.toSteps(dataTree, state.expression)
    const fixed = allowFixed && !state.expression.length || state.expression.length === 1 && steps[0].meta?.type?.id === 'String'
    const reference = this.propsSelectorRefs.get(name)
    const stepsSelector = this.propsSelectorRefs.get(name)?.value
    if(stepsSelector) {
      // This will not happen for the first render
      // The first render will use onload
      stepsSelector.steps = steps
      this.setCompletion(dataTree, component, stepsSelector)
    }
    return html`
      <steps-selector
        ${ref(reference)}
        ?allow-fixed=${allowFixed}
        max-steps=${maxSteps ?? -1}
        @load=${(e: CustomEvent) => {
          const stepsSelector = e.target as StepsSelector
          stepsSelector.steps = steps
          this.setCompletion(dataTree, component, stepsSelector)
        }}
        @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, name, e.target as StepsSelector)}
        .fixed=${fixed}
        >
        ${name}
      </steps-selector>
    `
  }

  renderPropertyUi(component: Component, dataTree: DataTree, name: PropsNames, type: Type | undefined): TemplateResult {
    const state = getState(component, name, false) ?? {expression: []}
    if(state?.expression.length !== 0 && state?.expression.length !== 1) {
      console.error('Invalid state', state)
      throw new Error('Invalid state')
    }
    if(!type) {
      return html`
        <label class="ds-label ds-label--disabled">
          ${name}
          <div class="ds-label__message">No data source</div>
        </label>
      `
    }
    //const steps = this.toSteps(dataTree, )
    //const fixed = allowFixed && !state.expression.length || state.expression.length === 1 && steps[0].meta?.type?.id === 'String'
    const reference = this.propsSelectorRefs.get(name)
    const stepsSelector = this.propsSelectorRefs.get(name)?.value
    const completion = (): Step[] => {
      return type.fields
        .filter(field => field.kind === 'scalar')
        .map(field => {
          const token = {
            type: 'property',
            propType: 'field',
            dataSourceId: field.dataSourceId,
            kind: field.kind,
            typeId: field.typeIds,
            fieldId: field.id,
          }
          return {
            name: field.name,
            icon: '',
            type: this.getDisplayType(field.typeIds, field.kind),
            meta: {
              token,
              type,
            },
          }
        })
    }
    const steps = state.expression.length === 1 ? [this.toStep(dataTree, type, state.expression[0])] : []
    if(stepsSelector) {
      // This will not happen for the first render
      // The first render will use onload
      stepsSelector.steps = steps
      stepsSelector.completion = completion
    }

    return html`
      <steps-selector
        ${ref(reference)}
        max-steps="1"
        @load=${(e: CustomEvent) => {
          const stepsSelector = e.target as StepsSelector
          stepsSelector.steps = steps
          stepsSelector.completion = completion
        }}
        @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, name, e.target as StepsSelector)}
        >
        ${name}
      </steps-selector>
    `
  }
}
