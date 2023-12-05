import { Component } from "grapesjs"
import { Expression, Field, FieldKind, Options, StateId, Token, TypeId } from "./types"
import { DataTree } from "./model/DataTree"
import { getParentByPersistentId, getState, getStateLabel, setState } from "./model/state"
import { FixedType, Step, StepsSelector } from "@silexlabs/steps-selector"
import { OPTIONS_STYLES } from "./view/defaultStyles"
import { DataSourceEditor } from "."
import { TemplateResult, html } from "lit"
import { Ref, ref } from "lit/directives/ref.js"

/**
 * Get the display type of a field
 */
function getDisplayType(typeIds: TypeId[], kind: FieldKind | null): string {
  const typeLabel = typeIds.join(', ')
  return kind === 'list' ? `${typeLabel} [ ]` : kind === 'object' ? `${typeLabel} { }` : typeLabel
}

/**
 * Add css styles to options forms
 */
let _styles = ''
export function setOptionsFormStyles(styles: string) {
  _styles = styles
}
function addStyles(optionsForm: TemplateResult | null): TemplateResult {
  if(!optionsForm) return html``
  return html`
    <style>
      ${OPTIONS_STYLES}
      ${_styles}
    </style>
    ${optionsForm}
  `
}

/**
 * Create a "fixed" token
 * It is a hard coded content with which you can start an expression
 */
export const FIXED_TOKEN_ID = 'fixed'
export function getFixedToken(value: string | number | boolean, typeId: TypeId, inputType: FixedType = 'text'): Token {
  return {
    type: 'property',
    propType: 'field',
    fieldId: FIXED_TOKEN_ID,
    label: 'Fixed value',
    kind: 'scalar',
    typeIds: [typeId],
    options: {
      value,
    },
    optionsForm: () => addStyles(html`
      <form>
        <label>Value
          <input type=${inputType} name="value" value=${value.toString()}>
        </label>
        ${ optionsFormButtons() }
      </form>
    `),
  }
}

/**
 * Set the completion function of a steps selector
 */
export function setCompletion(dataTree: DataTree, component: Component, stepsSelector: StepsSelector) {
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
      return toStep(dataTree, field, prev, tokens[index], component)
    })
  }
}

/**
 * Handle the change event of a steps selector
 */
export function chagedStepsSelector(component: Component, name: string, label: string, stepsSelector: StepsSelector, exposed: boolean) {
  // Check input
  if(!component) throw new Error('Component is required')
  if(!name) throw new Error('Name is required')
  // Update the tokens with new options values
  const steps = enrichSteps(stepsSelector.steps)
  // Update the state
  setState(component, name, {
    label,
    expression: steps.map(step => step.meta.token),
  }, exposed)
  stepsSelector.steps = steps
}

/**
 * Handle the "fixed" value case and the step meta
 */
function enrichSteps(steps: Step[]): Step[] {
  return steps
    .map(step => {
      const token = step.type === 'fixed' ? getFixedToken(step.options?.value ?? '', 'String', step.options?.inputType)
        : step.meta?.token ?? getFixedToken(step.options?.value ?? '', 'String', step.options?.inputType) // Add a fixed string if the token is not found
      token.options = step.options
      return {
        ...step,
        meta: {
          ...step.meta,
          token,
        }
      }
    })
}

/**
 * Convert an expression to steps
 * This will resolve the types of filters
 */
export function toSteps(dataTree: DataTree, expression: Expression, component: Component): Step[] {
  const fields = dataTree.expressionToFields(expression, component)
  return fields
    .map((type, index) => {
      const token = dataTree.fromStored(expression[index])
      if (!type) {
        console.error('Unknown type (reading type)', token)
        throw new Error(`Unknown type`)
      }
      const prev = index > 0 ? fields[index - 1] : null
      return toStep(dataTree, type, prev, token, component)
    })
}

/**
 * Render an expression with the steps-selector web component
 */
export function renderExpression(component: Component, dataTree: DataTree, stateId: StateId, label: string, allowFixed: boolean, reference: Ref<StepsSelector>, exposed: boolean, inputType?: FixedType, maxSteps?: number) {
  const state = getState(component, stateId, exposed) ?? {expression: []}
  const steps = toSteps(dataTree, state.expression, component)
  const fixed = allowFixed && !state.expression.length || state.expression.length === 1 && steps[0].meta?.type?.id === 'String'
  const stepsSelector = reference?.value
  if(stepsSelector) {
    // This will not happen for the first render
    // The first render will use onload
    stepsSelector.steps = steps
    setCompletion(dataTree, component, stepsSelector)
  }

  return html`
    <steps-selector
      ${ref(reference)}
      name=${stateId}
      group-by-category
      ?allow-fixed=${allowFixed}
      max-steps=${maxSteps ?? -1}
      input-type=${inputType}
      @load=${(e: CustomEvent) => {
        const stepsSelector = e.target as StepsSelector
        stepsSelector.steps = steps
        setCompletion(dataTree, component, stepsSelector)
      }}
      @change=${(e: SubmitEvent) => chagedStepsSelector(component, stateId, label, e.target as StepsSelector, exposed)}
      fixed=${fixed}
      >
      ${label}
    </steps-selector>
  `
}

/**
 * Render an option of a filter with the steps-selector web component
 * Takes an expression of tokens and calls onChange with the updated expression
 */
export function renderOption(opts: {
    component: Component,
    dataTree: DataTree,
    expression: Expression,
    name: string,
    label: string,
    allowFixed: boolean,
    reference: Ref<StepsSelector>,
    maxSteps?: number,
    inputType?: FixedType,
}): TemplateResult {
  const { component, dataTree, expression, label, name, allowFixed, reference, maxSteps, inputType } = opts
  const steps = toSteps(dataTree, expression, component)
  const fixed = allowFixed && expression.length || expression.length === 1 && steps[0].options?.value === 'String'
  const stepsSelector = reference?.value
  if(stepsSelector) {
    // This will not happen for the first render
    // The first render will use onload
    stepsSelector.steps = steps
    setCompletion(dataTree, component, stepsSelector)
  }
  const value = JSON.stringify(expression)
  return html`
    <steps-selector
      value=${value}
      name=${name}
      input-type=${inputType}
      ${ref(reference)}
      group-by-category
      ?allow-fixed=${allowFixed}
      max-steps=${maxSteps ?? -1}
      @load=${(e: CustomEvent) => {
        const stepsSelector = e.target as StepsSelector
        stepsSelector.steps = steps
        setCompletion(dataTree, component, stepsSelector)
      }}
      @change=${(e: SubmitEvent) => {
        const stepsSelector = e.target as StepsSelector
        stepsSelector.steps = enrichSteps(stepsSelector.steps)
          .map(step => {
            const token = step.meta?.token
            console.log('XXXXXX', {token, step})
            if(!token) throw new Error('Token not found')
            return {
              ...step,
              meta: {
                ...step.meta,
                token,
              }
            }
          })
        //reference.value?.dispatchEvent(new InputEvent('change'))
      }}
      fixed=${fixed}
      >
      ${label}
    </steps-selector>
  `
}

/**
 * Convert a token to a step
 * This will resolve the types of filters
 * @param field can be null, this happens when token is a filter with output resolving to null
 */
export function toStep(dataTree: DataTree, field: Field | null, prev: Field | null, token: Token, component: Component): Step {
  switch (token.type) {
    case 'property':
      if(!field) {
        console.error('Unknown type (reading type)', token)
        throw new Error(`Unknown type`)
      }
      return {
        name: token.label,
        icon: '',
        type: getDisplayType(token.typeIds, token.kind),
        meta: { token, type: field },
        options: token.options,
        optionsForm: token.optionsForm ? addStyles(token.optionsForm(prev, token.options ?? {})) ?? null : null,
        category: token.dataSourceId as string | undefined,
      }
    case 'filter':
      return {
        name: token.label,
        icon: '',
        type: 'Filter',
        options: token.options,
        optionsForm: token.optionsForm ? addStyles(token.optionsForm(prev, token.options ?? {})) ?? null : null,
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
        name: getStateLabel(parent, token),
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

export function convertKind(field: Field | null, from: FieldKind, to: FieldKind): Field | null {
  if (!field) {
    return null
  }
  if (field.kind !== from) {
    console.error(`Field is not a ${from}`, field)
    throw new Error(`Field ${field.label} is not a ${from}`)
  }
  return {
    ...field,
    kind: to,
  }
}
export function getFieldType(editor: DataSourceEditor, field: Field | null, key: string | undefined): Field | null {
  const dataTree = editor.DataSourceManager.getDataTree()
  if (!field || !key) return null
  const types = field.typeIds.map(typeId => dataTree.findType(typeId))
  const fields = types.map(type => type?.fields.find(field => field.label === key))
  switch (fields.length) {
    case 0: return null
    case 1: return fields[0]!
    default: return {
      id: `${field.id}.${key}`,
      label: `${field.label}.${key}`,
      typeIds: fields.reduce((typeIds, field) => typeIds
        // Add typeIds of the field if not already present
        .concat(field!.typeIds.filter(t => !typeIds.includes(t)))
        , [] as string[]),
      kind: 'object',
    }
  }
}
export function optionsFormButtons(): TemplateResult {
  return html`
      <div class="buttons">
        <input type="reset" value="Cancel" />
        <input type="submit" value="Apply" />
      </div>
    `
}
export function optionsFormKeySelector(editor: DataSourceEditor, field: Field | null, options: Options, name: string): TemplateResult {
  const dataTree = editor.DataSourceManager.getDataTree()
  if (!field) return html`
      <label>${name}
        <input type="text" name=${name} />
      </label>
    `
  return html`
      <select name=${name}>
        <option value="">Select a ${name}</option>
        ${field ? field.typeIds
      .flatMap(typeId => dataTree.findType(typeId)!.fields)
      .map(f => html`<option value=${f.label} ${f.label === options.key ? 'selected' : ''}>${f.label}</option>`)
      : html``
    }
      </select>
    `
}
export function optionsFormStateSelector(editor: DataSourceEditor, options: Options, name: string, reference: Ref<StepsSelector>, label: string = name): TemplateResult {
  const dataTree = editor.DataSourceManager.getDataTree()
  const component = editor.getSelected()
  if(!component) throw new Error('No component selected')
  const expression = JSON.parse(options[name] as string || '[]') as Expression
  return renderOption({
    component,
    dataTree,
    expression,
    label,
    name,
    allowFixed: true,
    reference,
  })

  //return `
  //        <select name="${name}">
  //          <option value="">Select a ${label}</option>
  //          ${
  //            dataTree.getContext()
  //    .filter(token => token.type === 'state' && token.exposed)
  //    .map(token => {
  //      const state = token as State
  //      const value = getStateVariableName(state.componentId, state.storedStateId)
  //      const component = (() => {
  //        let c = editor.getSelected()
  //        while (c) {
  //          if (getPersistantId(c) === state.componentId) return c
  //          c = c.parent()
  //        }
  //        return null
  //      })()
  //      if (!component) {
  //        console.warn(`Could not find component with persistent ID ${state.componentId}`, { state })
  //        return ''
  //      }
  //      return `<option${options[name] === value ? ' selected' : ''} value="${value}">${getStateLabel(component, state)}</option>`
  //    })
  //    .join('\n')
  //  }
  //        </select>
  //        `
}