import { Component } from "grapesjs"
import { Context, DataEditor, DataSource, DataOptions, Schema, ComponentData } from ".."
import { html, render } from "lit"
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { DynamicProperty } from "./DynamicProperty"

import '@silexlabs/steps-selector/steps-selector.js'
import { Step, StepsSelector } from "@silexlabs/steps-selector/steps-selector.js"

const dsAttribute = 'ds-data'
const defaultStyles = `
  .ds-wrapper {
    margin-top: 20px;
  }
  .ds-container {
    display: flex;
    flex-direction: column;
    padding: 10px 0;
    margin: 10px 0;
    border-bottom: 1px solid rgba(0,0,0,.2);;
  }
  .ds-label {
    text-align: left;
    margin: 0 10px;
  }
  .ds-select__wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .ds-select__type {
    margin: 0 2px;
    min-height: 15px;
  }
  .ds-select__name {
    position: relative;
    margin: 2px;
    padding: 10px;
  }
  .ds-select__name::after {
    content: '▼';
  }
  .ds-select__name.last::after {
    content: '+';
  }
  .ds-field {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: center;
    margin: 2px 10px;
  }
  .ds-field select.ds-select {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .ds-button {
    width: 20px;
    height: 20px;
    padding: 0;
    padding-bottom: 3px;
    border: none;
  }
  .ds-button.ds-remove {
    background-color: rgba(255, 255, 255, 0.25);
    color: white;
    margin: 0 5px;
  }
  .ds-button.ds-add {
    margin-left: auto;
    margin-top: 5px;
  }
  .ds-container .cm-editor {
    width: 100%;
    height: 100%;
    text-align: left;
  }
  .ds-container .cm-cursor {
    border-left-color: #ddd;
  }
  .ds-container .cm-tooltip-autocomplete {
    color: black;
  }
`

export default async (editor: DataEditor, opts: DataOptions = {}) => {
  const options: DataOptions = {
    styles: defaultStyles,
    ...opts,
  }
  // Selectors
  const innerHTMLSelector = createRef<StepsSelector>()

  // Data
  async function getDef(ds: DataSource): Promise<Type> {
    const schema = await ds.getSchema()
    return {
      name: ds.id,
      kind: 'OBJECT',
      fields: schema.types
        .find(type => type.name === 'Query')?.fields ?? []
    }
  }

  const defs = await Promise.all(editor.DataSourceManager.getAll().map(ds => getDef(ds)))
  const baseContext = defs
    .reduce((acc, def) => {
      acc[def.name] = {
        types: [def],
      }
      return acc
    }, {} as Context)
  function getContext(component: Component): Context {
    return {
      ...baseContext,
    }
  }
  // Get the container element for the UI
  if(!options.appendTo) {
    throw new Error('appendTo option is required')
  } else if(typeof options.appendTo === 'string') {
    if(!document.querySelector(options.appendTo)) throw new Error(`Element ${options.appendTo} not found`)
  } else if(!(options.appendTo instanceof HTMLElement) && typeof options.appendTo !== 'function') {
    throw new Error(`appendTo option must be a string or an HTMLElement or a function`)
  }

  const appendTo: HTMLElement | null = typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : typeof options.appendTo === 'function' ? options.appendTo() : options.appendTo
  if(!appendTo) throw new Error(`Element ${options.appendTo} not found`)

  // create a wrapper for our UI
  const wrapper = document.createElement('section')
  wrapper.classList.add('gjs-one-bg', 'ds-wrapper')
  appendTo.appendChild(wrapper)

  // Update the UI when a page is added/renamed/removed
  editor.on('page', () => updateUi())

  // Update the UI on component selection change
  editor.on('component:selected', () => updateUi())
  
  // Update the UI on component change
  editor.on('component:update', () => updateUi())

  // Show the UI when the button is clicked
  if(options.button) {
    const button = typeof options.button === 'function' ? options.button() : options.button
    if(!button) throw new Error(`Element ${options.button} not found`)
    button.on('change', () => {
      if(button.active) {
        // Move at the bottom
        appendTo.appendChild(wrapper)
        // Show the UI
        wrapper.style.display = 'block'
      } else {
        // Hide the UI
        wrapper.style.display = 'none'
      }
    })
    wrapper.style.display = button.active ? 'block' : 'none'
  }

  function initStepsSelector(stepsSelector: StepsSelector, steps: Step[]) {
    stepsSelector.steps = steps
    //stepsSelector.completion = (steps: Step[]) => {
    //  return getContext()
    //}
  }

  function chagedStepsSelector(component: Component, name: string, stepsSelector: StepsSelector) {
    component.set(dsAttribute, {
      ...component.get(dsAttribute),
      [name]: stepsSelector.steps,
    })
  }

  // Update the UI
  function updateUi(component: Component | undefined = editor.getSelected()) {
    if(!component) return
    const dsData = component.get(dsAttribute) || {} as ComponentData
    const { innerHTML } = dsData
    const fixed = !innerHTML?.length || innerHTML?.length === 1 && innerHTML[0].type === 'fixed'
    if(innerHTMLSelector.value) {
      initStepsSelector(innerHTMLSelector.value, innerHTML ?? [])

    }
    console.log({fixed})
    render(html`
      <style>
        ${options.styles}
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
        //return property.toHtmlForm(dsData[property.getName()] ?? [], getContext(component))
        //})
      }
        <steps-selector
          ${ref(innerHTMLSelector)}
          allow-fixed
          @onload=${(e: CustomEvent) => initStepsSelector(e.detail, innerHTML ?? [])}
          @change=${(e: SubmitEvent) => chagedStepsSelector(component, 'innerHTML', e.target as StepsSelector)}
          .fixed=${fixed}
          >
          innerHTML
        </steps-selector>
      </main>
    `, wrapper)
  }
}
