import { Component } from "grapesjs"
import { html, render } from "lit"
import { createRef, ref } from 'lit/directives/ref.js';

import '@silexlabs/steps-selector'
import { Step, StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { getState, setState } from "../model/state"
import { DataTree } from "../model/DataTree"
import { Expression, Token, Type, TypeId, TypeKind } from "../types"

export class PropertiesUi {
  protected innerHTMLSelector = createRef<StepsSelector>()

  // Constructor
  constructor(protected options: ViewOptions, protected wrapper: HTMLElement) {}

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
        .map(token => dataTree.getTypeFromExpression(tokens.concat(token)))
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
        return this.toStep(type, tokens[index])
      })
    }
  }

  getDisplayType(typeId: TypeId, kind: TypeKind) {
    return kind === 'list' ? `${typeId} [ ]` : kind === 'object' ? `{ ${typeId} }` : typeId
  }

  /**
   * Convert an expression to steps
   * This will resolve the types of filters
   */
  toSteps(dataTree: DataTree, expression: Expression): Step[] {
    return dataTree.getAllTypesFromExpression(expression)
      .map((type, index) => {
        const token = expression[index]
        if (!type) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        return this.toStep(type, token)
      })
  }

  /**
   * Convert a token to a step
   * This will resolve the types of filters
   * @param type can be null, this happens when token is a filter with output resolving to null
   */
  toStep(type: Type | null, token: Token): Step {
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
            type: this.getDisplayType(type.dataSourceId as string ?? 'Type', type.kind), // FIXME: use the data source option as a name
            meta: { token, type }
          }
          case 'field': return {
            name: token.fieldId,
            icon: '',
            type: this.getDisplayType(type.name, type.kind),
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
      case 'state': 
        if(!type) {
          console.error('Unknown type (reading type)', token)
          throw new Error(`Unknown type`)
        }
        return {
          name: token.id,
          icon: '',
          type: type.name,
          meta: { token, type }
        }
      default:
        console.error('Unknown token type (reading type)', token)
        throw new Error(`Unknown token type`)
    }
  }

  chagedStepsSelector(component: Component, dataTree: DataTree, name: string, typeId: TypeId, stepsSelector: StepsSelector) {
    // Check input
    if(!component) throw new Error('Component is required')
    if(!name) throw new Error('Name is required')
    if(!typeId) throw new Error('Type id is required')
    // Update the tokens with new options values
    const steps = stepsSelector.steps.map(step => {
      const token = step.meta?.token ?? this.getFixedToken(dataTree, step.options?.value ?? '')
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
      typeId,
      expression: steps.map(step => step.meta.token),
    })
  }

  getFixedToken(dataTree: DataTree, value: string): Token {
    return {
      type: 'filter',
      id: 'fixed',
      name: 'Fixed value',
      outputType: () => dataTree.findType('String'),
      validate: () => true,
      apply: () => value,
      options: {
        value,
      },
      optionsForm: `
        <form>
          <label>Value
            <input type="text" name="value" value="${value}">
            <button type="submit">Done</button>
          </label>
        </form>
      `
    }
  }

  // Update the UI
  updateUi(component: Component | undefined, dataTree: DataTree) {
    if(!component) return
    const innerHTML = getState(component, 'innerHTML') ?? {expression: [], typeId: 'String'}
    //const innerHTMLSteps = innerHTML?.expression.map((token, index) => this.toStep(dataTree, token, index > 0 ? innerHTML.expression[index-1] : undefined))
    const innerHTMLSteps = this.toSteps(dataTree, innerHTML?.expression)
    const fixed = !innerHTML?.expression.length || innerHTML?.expression.length === 1 && innerHTMLSteps[0].meta?.type?.id === 'String'
    if(this.innerHTMLSelector.value) {
      // This will not happen for the first render
      // The first render will use onload
      this.innerHTMLSelector.value.steps = innerHTMLSteps
      this.setCompletion(dataTree, component, this.innerHTMLSelector.value)
    }
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <div>
        <div class="gjs-traits-label">Dynamic Data</div>
      </div>
      <main>
        <steps-selector
          ${ref(this.innerHTMLSelector)}
          allow-fixed
          @onload=${(e: CustomEvent) => {
            e.detail.steps = innerHTMLSteps
            this.setCompletion(dataTree, component, e.detail)
          }}
          @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, dataTree, 'innerHTML', 'String', e.target as StepsSelector)}
          .fixed=${fixed}
          >
          innerHTML
        </steps-selector>
      </main>
    `, this.wrapper)
  }
}
