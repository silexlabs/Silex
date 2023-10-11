import { Component } from "grapesjs"
import { html, render } from "lit"
import { Ref, createRef, ref } from 'lit/directives/ref.js';

import '@silexlabs/steps-selector'
import { Step, StepsSelector } from "@silexlabs/steps-selector"
import { ViewOptions } from "."
import { getState, removeState, setState } from "../model/state"
import { DataTree } from "../model/DataTree"
import { Expression, Token, Type, TypeId, TypeKind } from "../types"

type PropsNames = 
  'innerHTML'
  | 'title'
  | 'class'
  | 'style'
  | 'src'
  | 'href'
  | 'alt'
  | 'condition'
  | 'data'
  | 'loopIndex'
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
    ['loopIndex', createRef<StepsSelector>()],
    ['data', createRef<StepsSelector>()],
    ['sort', createRef<StepsSelector>()],
    ['limit', createRef<StepsSelector>()],
    ['offset', createRef<StepsSelector>()],
  ])
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
    return kind === 'list' ? `${typeId} [ ]` : kind === 'object' ? `${typeId} { }` : typeId
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
      const token = step.meta?.token ?? this.getFixedToken(step.options?.value ?? '')
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
    }, false)
  }

  getFixedToken(value: number | string): Token {
    return {
      type: 'filter',
      id: 'fixed',
      name: 'Fixed value',
      outputType: () => 'String' as TypeId,
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
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Element Properties</div>
        </div>
        <main>
          ${this.renderProp(component, dataTree, 'innerHTML', 'String', true)}
          ${this.renderProp(component, dataTree, 'title', 'String', true)}
          ${this.renderProp(component, dataTree, 'class', 'String', true)}
          ${this.renderProp(component, dataTree, 'style', 'String', true)}
          ${this.renderProp(component, dataTree, 'src', 'String', true)}
          ${this.renderProp(component, dataTree, 'href', 'String', true)}
          ${this.renderProp(component, dataTree, 'alt', 'String', true)}
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
                    typeId: 'Int',
                    expression: [this.getFixedToken(0)], // TODO: let the user choose this
                  }, true)
                } else {
                  removeState(component, 'loopIndex', true)
                }
              }}
            ></label>
        </div>
        <main>
          ${ getState(component, 'loopIndex', true) ? html`
            ${this.renderProp(component, dataTree, 'data', 'any', false)}
            ${this.renderProp(component, dataTree, 'sort', 'String', true)}
            ${this.renderProp(component, dataTree, 'limit', 'Int', true)}
            ${this.renderProp(component, dataTree, 'offset', 'Int', true)}
          ` : ''}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${this.renderProp(component, dataTree, 'condition', 'Boolean', true)}
        </main>
      </section>
    `, this.wrapper)
  }

  renderProp(component: Component, dataTree: DataTree, name: PropsNames, typeId: TypeId, allowFixed: boolean) {
    const state = getState(component, name, false) ?? {expression: [], typeId}
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
        allow-fixed
        @load=${(e: CustomEvent) => {
          const stepsSelector = e.target as StepsSelector
          stepsSelector.steps = steps
          this.setCompletion(dataTree, component, stepsSelector)
        }}
        @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, dataTree, name, typeId, e.target as StepsSelector)}
        .fixed=${fixed}
        >
        ${name}
      </steps-selector>
    `
  }
}
