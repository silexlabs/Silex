import { Component } from "grapesjs"
import { DataEditor, DataOptions, Schema, ComponentData, Property, ExpressionItem, Expression, DataSource } from ".."
import { html, render } from "lit"
import { Ref, createRef, ref } from 'lit/directives/ref.js';
//import { DynamicProperty } from "./DynamicProperty"

import '@silexlabs/steps-selector/steps-selector.js'
import { Step, StepsSelector } from "@silexlabs/steps-selector/steps-selector.js"

const dsAttribute = 'ds-data'
const defaultStyles = `
  :root {
    --steps-selector-dirty-background-color: rgba(0,0,0,.2);
    --steps-selector-dirty-border-color: rgba(0,0,0,.2);
    --steps-selector-dirty-color: #d278c9;
    --steps-selector-active-color: #ddd;
    --steps-selector-active-background-color: rgba(255,255,255,.15);
    --popin-dialog-background: #ddd;
    --popin-dialog-color: #333;
    --popin-dialog-header-background: transparent;
    --popin-dialog-body-background: transparent;
    --popin-dialog-footer-background: transparent;
    /*
    --popin-dialog-header-color: #333;
    --popin-dialog-body-color: #666;
    --popin-dialog-footer-color: #333;
    --popin-dialog-header-border-bottom: none;
    --popin-dialog-footer-border-top: none;
    --popin-dialog-header-padding: 0;
    --popin-dialog-body-padding: 5px;
    --popin-dialog-footer-padding: 0;
    */
  }
  /*
  */
  steps-selector::part(property-container) {
    display: flex;
  }
  steps-selector::part(property-input) {
    padding: 5px;
    border: medium;
    margin: 5px;
    flex: 1 1 auto;
    background-color: rgba(0,0,0,.2);
    color: #ddd;
  }
  steps-selector::part(steps-selector-item)::part(values-li) {
    background-color: red !important;
    list-style: none;
  }
`

export type ExpressionBuilderEditor = DataEditor & {
  ExpressionBuilder: ExpressionBuilder
}

export default async (editor: ExpressionBuilderEditor, opts: DataOptions = {}) => {
  console.log('dynamic-properties', opts, editor)
  const options: DataOptions = {
    styles: defaultStyles,
    ...opts,
  }
  editor.ExpressionBuilder = new ExpressionBuilder(options, editor)
}

export class ExpressionBuilder {
  // Constants
  static readonly READY = 'expression:ready'

  // UI
  protected innerHTMLSelector = createRef<StepsSelector>()
  protected wrapper: HTMLElement = document.createElement('section')

  // Data
  protected schemas: Schema[]
  protected baseContext: Property[]

  // Constructor
  constructor(protected options: DataOptions, protected editor: ExpressionBuilderEditor) {
    this.schemas = []
    this.baseContext = []
    // Async call to init which will end by emitting the READY event
    this.init(editor)
    .then(() => editor.trigger(ExpressionBuilder.READY))
  }

  async init(editor: ExpressionBuilderEditor) {
    const dataSources = editor.DataSourceManager.getAll()
    this.schemas = await Promise.all(dataSources.map(ds => ds.getSchema()))
    this.baseContext = this.schemas
      .map((schema: Schema) => ({
        name: schema.dataSource.name,
        type: 'data_source',
        fields: schema.properties,
      } as Property))
    // Get the container element for the UI
    if (!this.options.appendTo) {
      throw new Error('appendTo option is required')
    } else if (typeof this.options.appendTo === 'string') {
      if (!document.querySelector(this.options.appendTo)) throw new Error(`Element ${this.options.appendTo} not found`)
    } else if (!(this.options.appendTo instanceof HTMLElement) && typeof this.options.appendTo !== 'function') {
      throw new Error(`appendTo option must be a string or an HTMLElement or a function`)
    }

    // create a wrapper for our UI
    this.wrapper.classList.add('gjs-one-bg', 'ds-wrapper')

    // The options appendTo and button can be functions which use editor so they need to be called asynchronously
    let appendTo: HTMLElement
    editor.onReady(() => {
      // Append the wrapper to the container
      appendTo = (typeof this.options.appendTo === 'string' ? document.querySelector(this.options.appendTo) : typeof this.options.appendTo === 'function' ? this.options.appendTo() : this.options.appendTo) as HTMLElement
      if (!appendTo) throw new Error(`Element ${this.options.appendTo} not found`)
      appendTo.appendChild(this.wrapper)

      // Show the UI when the button is clicked
      if (this.options.button) {
        const button = typeof this.options.button === 'function' ? this.options.button() : this.options.button
        if (!button) throw new Error(`Element ${this.options.button} not found`)
        button.on('change', () => {
          if (button.active) {
            // Move at the bottom
            appendTo.appendChild(this.wrapper)
            // Show the UI
            this.wrapper.style.display = 'block'
          } else {
            // Hide the UI
            this.wrapper.style.display = 'none'
          }
        })
        this.wrapper.style.display = button.active ? 'block' : 'none'
      }
    })

    // Update the UI when a page is added/renamed/removed
    editor.on('page', () => this.updateUi())

    // Update the UI on component selection change
    editor.on('component:selected', () => this.updateUi())

    // Update the UI on component change
    editor.on('component:update', () => this.updateUi())
  }

  /**
   * Get the context for the current selection
   * The context is the data sources and properties available at this component level
   */
  getContext(component: Component | null): Property[] {
    return [
      ...this.baseContext,
      // TODO: Add filters and properties here
    ]
    // Add the fixed value step to the context
    .concat({
      kind: 'scalar',
      ...StepsSelector.getFixedValueStep('DEFINE VALUE HERE'),
    } as Property)
  }
  /**
   * Get the next possible expression items
   */
  getCompletion(expression: Expression, component: Component | null) {
    if(expression.length === 0) return this.getContext(component)
    if(expression.length === 1 && expression[0].type === 'DataSource') return [
      ...this.schemas.find(schema => schema.dataSource.name === expression[0].name)?.properties ?? [],
    ]
    return [
      // The fields of the last selected type or filter for the current selection
      ...this.getFields(expression, component),
      // TODO: Add filters here
    ]
  }
  /**
   * Recursive function to find the next possible expressions
   */
  getFields(expression: Expression, component: Component | null): Property[] {
    const context = this.getContext(component)
    if(expression.length === 0) return context
    
    // First get the schema of the first item if it is a DataSource
    const firstItem: ExpressionItem = expression[0]
    if(expression.length === 1) {
      console.log('====>', {context, firstItem})
      return (
        // A property from the context or a DataSource type
        this.contextToProperties(context, firstItem as Property)
        // Defaults to no properties
        ?? [] as Property[]
      )
    }

    // Recursive call with one less expression item
    const lastProps: Property[] = this.getFields(expression.slice(0, -1), component)
    const currentProp: Property = lastProps.find(prop => prop.name === expression.slice(-1)[0].name) as Property
    if(!currentProp) throw new Error(`Property ${expression.slice(-1)[0].name} not found`)
    const fields = this.contextToProperties(context, currentProp) //schema?.properties?.filter(prop => prop.type === currentProp.type) as Property[]
    return fields
  }

  contextToProperties(context: Property[], currentProp: Property) {
    const fields = context
      .find(prop => prop.type === currentProp.type && prop.name === currentProp.name)
      ?.fields as Property[]
    if(!fields) {
      console.error(`Type ${currentProp.type} not found`, {context, currentProp})
      throw new Error(`Type ${currentProp.type} not found`)
    }
    return fields
  }

  initStepsSelector(stepsSelector: StepsSelector, steps: Step[], component: Component | null) {
    console.log('initStepsSelector', stepsSelector, steps, component, this.getContext(component))
    stepsSelector.steps = steps
    stepsSelector.completion = (steps: Step[]) => {
      console.log('completion', steps)
      const expression = steps as Expression
      const completion = this.getCompletion(expression, component)
      console.log({completion})
      return completion.map(prop => ({
        icon: '',
        ...prop,
      }))
    }
  }

  chagedStepsSelector(component: Component, name: string, stepsSelector: StepsSelector) {
    component.set(dsAttribute, {
      ...component.get(dsAttribute),
      [name]: stepsSelector.steps,
    })
  }

  // Update the UI
  updateUi(component: Component | undefined = this.editor.getSelected()) {
    if(!component) return
    const dsData = component.get(dsAttribute) || {} as ComponentData
    const { innerHTML } = dsData
    const fixed = !innerHTML?.length || innerHTML?.length === 1 && innerHTML[0].type === 'fixed'
    if(this.innerHTMLSelector.value) {
      this.initStepsSelector(this.innerHTMLSelector.value, innerHTML ?? [], component)

    }
    console.log({fixed})
    render(html`
      <style>
        ${this.options.styles}
      </style>
      <div>
        <div class="gjs-traits-label">Dynamic Data</div>
      </div>
      <main>
      ${
        ''
        //dynamicProperties.map(property => {
        //property.onChange = (value: any) => {
        //  component.set(dsAttribute, {
        //    ...component.get(dsAttribute),
        //    [property.getName()]: value,
        //  })
        //}
        //return property.toHtmlForm(dsData[property.getName()] ?? [], this.getContext(component))
        //})
      }
        <steps-selector
          ${ref(this.innerHTMLSelector)}
          allow-fixed
          @onload=${(e: CustomEvent) => this.initStepsSelector(e.detail, innerHTML ?? [], null)}
          @change=${(e: SubmitEvent) => this.chagedStepsSelector(component, 'innerHTML', e.target as StepsSelector)}
          .fixed=${fixed}
          >
          innerHTML
        </steps-selector>
      </main>
    `, this.wrapper)
  }
}
