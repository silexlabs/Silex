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

import '@silexlabs/steps-selector' // For the web component to work
import { Step, StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { getParentByPersistentId, getState, getStateLabel, setState } from "../model/state"
import { DataTree } from "../model/DataTree"
import { Expression, Token, TypeId, FieldKind, Field } from "../types"
import { DataSourceEditor } from ".."
import { OPTIONS_STYLES } from "./defaultStyles"

type PropsNames = 
  'innerHTML'
  | 'title'
  | 'class'
  | 'style'
  | 'src'
  | 'href'
  | 'alt'
  | 'condition'
  | '__data'
  | '__sort'
  | '__limit'
  | '__offset'

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
    ['__data', createRef<StepsSelector>()],
    ['__sort', createRef<StepsSelector>()],
    ['__limit', createRef<StepsSelector>()],
    ['__offset', createRef<StepsSelector>()],
  ])

  // Constructor
  constructor(protected editor: DataSourceEditor, protected options: ViewOptions, protected wrapper: HTMLElement) {}

  /**
   * Set the completion function of a steps selector
   */
  setCompletion(dataTree: DataTree, component: Component, stepsSelector: StepsSelector) {
    stepsSelector.completion = (steps: Step[]): Step[] => {
      // Current expression
      const expression = steps.map(step => step.meta.token)
      // Get the completion, which is a context
      // It is a list of tokens, each one can be added at the end of the expression
      const tokens = dataTree.getCompletion(component, expression)
      // Get the type for each token
      // The filters output types are resolved
      const fields = tokens
        .map(token => dataTree.getExpressionResultType(tokens.concat(token), component))
      // Convert the context to steps
      return fields
      .map((field, index) => {
        const prev = index > 0 ? fields[index - 1] : null
        return this.toStep(dataTree, field, prev, tokens[index], component)
      })
    }
  }

  /**
   * Get the display type of a field
   */
  getDisplayType(typeIds: TypeId[], kind: FieldKind | null): string {
    const typeLabel = typeIds.join(', ')
    return kind === 'list' ? `${typeLabel} [ ]` : kind === 'object' ? `${typeLabel} { }` : typeLabel
  }

  /**
   * Add css styles to options form
   */
  addStyles(optionsForm: string | null): string {
    if(!optionsForm) return ''
    return `
      <style>
        ${OPTIONS_STYLES}
        ${this.options.optionsStyles ?? ''}
      </style>
      ${optionsForm}
    `
  }

  /**
   * Convert an expression to steps
   * This will resolve the types of filters
   */
  toSteps(dataTree: DataTree, expression: Expression, component: Component): Step[] {
    const fields = dataTree.expressionToFields(expression, component)
    return fields
      .map((type, index) => {
        const token = expression[index]
        if (!type) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        const prev = index > 0 ? fields[index - 1] : null
        return this.toStep(dataTree, type, prev, token, component)
      })
  }

  /**
   * Convert a token to a step
   * This will resolve the types of filters
   * @param field can be null, this happens when token is a filter with output resolving to null
   */
  toStep(dataTree: DataTree, field: Field | null, prev: Field | null, token: Token, component: Component): Step {
    switch (token.type) {
      case 'property':
        if(!field) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        switch (token.propType) {
          //case 'type': return {
          //  name: type.id,
          //  icon: '',
          //  type: this.getDisplayType([type.dataSourceId as string ?? 'Type'], null), // FIXME: use a data source option as a name
          //  meta: { token, type }
          //}
          case 'field': return {
            name: token.label,
            icon: '',
            type: this.getDisplayType(token.typeIds, token.kind),
            meta: { token, type: field },
            options: token.options,
            optionsForm: token.optionsForm ? this.addStyles(token.optionsForm(prev, token.options ?? {})) ?? undefined : undefined,
            category: token.dataSourceId as string,
          }
          default:
            console.error('Unknown property type (reading propType)', token)
            throw new Error(`Unknown property type`)
        }
      case 'filter':
        return {
          name: token.label,
          icon: '',
          type: 'Filter',
          options: token.options,
          optionsForm: token.optionsForm ? this.addStyles(token.optionsForm(prev, token.options ?? {})) ?? undefined : undefined,
          meta: { token, type: field },
          category: 'Filters',
        }
      case 'state': {
        const parent = getParentByPersistentId(token.componentId, component)
        if(!parent) {
          console.warn('Component not found', token.componentId)
          // TODO: notification
        }
        return {
          name: getStateLabel(parent, token.label),
          icon: '',
          type: token.forceKind ?? field?.label ?? 'Unknown',
          meta: { token, type: field },
          category: 'States',
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
    stepsSelector.steps = steps
  }

  getFixedToken(value: string | number | boolean, typeId: TypeId): Token {
    return {
      type: 'filter',
      id: 'fixed',
      label: 'Fixed value',
      output: () => ({
        id: 'fixed_value',
        label: 'Fixed value',
        kind: 'scalar',
        typeIds: [typeId],
      }),
      validate: field => !field,
      apply: () => value,
      options: {
        value,
      },
      optionsForm: () => this.addStyles(`
        <form>
          <label>Value
            <input type="text" name="value" value="${value.toString()}">
            <div class="buttons">
              <input type="submit" value="Apply"/>
              <input type="reset" value="Cancel"/>
            </div>
          </label>
        </form>
      `),
    }
  }

  // Update the UI
  updateUi(component: Component | undefined, dataTree: DataTree) {
    if(!component) return
    const dataStateType: Field | undefined = dataTree.getExpressionResultType(getState(component, '__data', false)?.expression ?? [], component) ?? undefined
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Element Properties</div>
        </div>
        <main>
          ${this.renderExpressionUi(component, dataTree, 'innerHTML', 'Content', true)}
          ${this.renderExpressionUi(component, dataTree, 'title', 'title', true)}
          ${this.renderExpressionUi(component, dataTree, 'class', 'class', true)}
          ${this.renderExpressionUi(component, dataTree, 'style', 'style', true)}
          ${this.renderExpressionUi(component, dataTree, 'src', 'src', true)}
          ${this.renderExpressionUi(component, dataTree, 'href', 'href', true)}
          ${this.renderExpressionUi(component, dataTree, 'alt', 'alt', true)}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${this.renderExpressionUi(component, dataTree, 'condition', 'condition', true)}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop
            <input
              type="checkbox"
              name="loop"
              .checked=${component.has('dsLoop')}
              @change=${(e: InputEvent) => {
                if((e.target as HTMLInputElement).checked) {
                  component.set('dsLoop', true)
                } else {
                  component.unset('dsLoop')
                }
              }}
            ></label>
        </div>
        <main>
          ${ component.has('dsLoop') ? html`
            ${this.renderExpressionUi(component, dataTree, '__data', 'data', false)}
            ${this.renderPropertyUi(component, dataTree, '__sort', 'sort', dataStateType)}
            ${this.renderExpressionUi(component, dataTree, '__limit', 'limit', true)}
            ${this.renderExpressionUi(component, dataTree, '__offset', 'offset', true)}
          ` : ''}
        </main>
      </section>
    `, this.wrapper)
  }

  renderExpressionUi(component: Component, dataTree: DataTree, name: PropsNames, label: string, allowFixed: boolean, maxSteps?: number): TemplateResult {
    const state = getState(component, name, false) ?? {expression: []}
    const steps = this.toSteps(dataTree, state.expression, component)
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
        group-by-category
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
        ${label}
      </steps-selector>
    `
  }

  renderPropertyUi(component: Component, dataTree: DataTree, name: PropsNames, label: string, field: Field | undefined): TemplateResult {
    const state = getState(component, name, false) ?? {expression: []}
    if(state?.expression.length !== 0 && state?.expression.length !== 1) {
      console.error('Invalid state', state)
      throw new Error('Invalid state')
    }
    if(!field) {
      return html`
        <label class="ds-label ds-label--disabled">
          ${label}
          <div class="ds-label__message">No data source</div>
        </label>
      `
    }
    //const steps = this.toSteps(dataTree, )
    //const fixed = allowFixed && !state.expression.length || state.expression.length === 1 && steps[0].meta?.type?.id === 'String'
    const reference = this.propsSelectorRefs.get(name)
    const stepsSelector = this.propsSelectorRefs.get(name)?.value
    // From fields to types (all the types for the current field)
    const types = field.typeIds
      .map(typeId => {
        const type = dataTree.findType(typeId)
        if(!type) {
          console.error('Unknown type', typeId)
          throw new Error(`Unknown type ${typeId}`)
        }
        return type
      })
    // From type to fields (the fields of the given type)
    const completion = (): Step[] => {
      return types
        .flatMap(type => type.fields)
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
            name: field.label,
            icon: '',
            type: this.getDisplayType(field.typeIds, field.kind),
            meta: {
              token,
              type: field,
            },
          }
        })
    }
    const steps = state.expression.length === 1 ? [this.toStep(dataTree, field, null, state.expression[0], component)] : []
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
        ${label}
      </steps-selector>
    `
  }
}
