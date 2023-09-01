import { Component } from "grapesjs"
import { DataEditor, DataSource, DynamicDataOptions, Schema, Type } from ".."
import { html, render } from "lit-html"
import { DynamicProperty } from "./DynamicProperty"

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
  .ds-select__name::before {
    content: '▼';
  }
  .ds-select__name.last::before {
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

const dynamicProperties: DynamicProperty[] = [
  //new DynamicProperty({
  //  name: 'classname',
  //  displayName: 'CSS classes',
  //  //isAvailable: (component: Component) => true,
  //  //getValue: (component: Component) => component.get('classes')?.models.map(c => c.id) || [],
  //  //setValue: (component: Component, value: string[]) => { component.get('classes')?.add(value.map(id => ({ id, label: id }))) },
  //}),
  new DynamicProperty({
    name: 'innerHTML',
    displayName: 'Content',
    //isAvailable: (component: Component) => true,
  }),
  new DynamicProperty({
    name: 'background-image',
    displayName: 'Background image',
    //isAvailable: (component: Component) => true,
  }),
]

async function wait(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async (editor: DataEditor, opts: DynamicDataOptions = {}) => {
  const options: DynamicDataOptions = {
    styles: defaultStyles,
    ...opts,
  }
  async function getSchemas(): Promise<Record<string, Type>> {
    const schemas = await Promise.all(editor.DataSourceManager.getAll().map(ds => ds.getSchema()))
    return schemas
      .reduce((acc, schema) => {
        schema.types.forEach(type => {
          acc[type.name] = type
        })
        return acc
      }, {} as Record<string, Type>)
  }
  const baseContext = { 
    ...await getSchemas(),
  }
  function getContext(component: Component): Record<string, Type> {
    return {
      ...baseContext,
    }
  }
  //// Add the new trait to all component types
  //editor.DomComponents.getTypes().map(type => {
  //  const originalType = editor.DomComponents.getType(type.id)
  //  if(!originalType) throw new Error(`Type ${type.id} not found`)
  //  editor.DomComponents.addType(type.id, {
  //    model: {
  //      defaults: {
  //        traits: [
  //          // Keep the type original traits
  //          ...originalType.model.prototype.defaults.traits,
  //          // Add the new trait
  //          {
  //            label: false,
  //            type: dsTraitType,
  //            name: 'datasource',
  //          },
  //        ]
  //      }
  //    }
  //  })
  //})
  // Get the container element for the UI
  if(!options.appendTo) {
    throw new Error('appendTo option is required')
  } else if(typeof options.appendTo === 'string') {
    if(!document.querySelector(options.appendTo)) throw new Error(`Element ${options.appendTo} not found`)
  } else if(!(options.appendTo instanceof HTMLElement) && typeof options.appendTo !== 'function') {
    throw new Error(`appendTo option must be a string or an HTMLElement or a function`)
  }

  //// Add a sector
  //const sector = editor.StyleManager.addSector('ds', {
  //  name: 'Dynamic Data',
  //  open: true,
  //})
  //console.log('sector', sector)

  const appendTo: HTMLElement | null = typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : typeof options.appendTo === 'function' ? options.appendTo() : options.appendTo
  if(!appendTo) throw new Error(`Element ${options.appendTo} not found`)

  // create a wrapper for our UI
  const wrapper = document.createElement('section')
  wrapper.classList.add('gjs-one-bg', 'ds-wrapper')
  appendTo.appendChild(wrapper)

  // Update the UI when a page is added/renamed/removed
  editor.on('page', () => load())

  // Update the UI on component selection change
  editor.on('component:selected', () => load())
  
  // Update the UI on component change
  editor.on('component:update', () => load())

  // Log events
  editor.on('page', () => console.log('EVENT page'))
  editor.on('component:selected', () => console.log('EVENT component:selected'))
  editor.on('component:update', () => console.log('EVENT component:update'))
  
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

  // Update the UI
  function load(component: Component | undefined = editor.getSelected()) {
    if(!component) return
    const dsData = component.get(dsAttribute) || {}
    render(html`
      <style>
        ${options.styles}
      </style>
      <div>
        <div class="gjs-traits-label">Dynamic Data</div>
      </div>
      <main>
      ${dynamicProperties.map(property => {
        property.onChange = (value: any) => {
          component.set(dsAttribute, {
            ...component.get(dsAttribute),
            [property.name]: value,
          })
        }
        return property.toHtmlForm(dsData[property.name] ?? [], getContext(component))
      })}
      </main>
    `, wrapper)
  }

  //function applyChanges(component: Component, data?: any) {
  //  // Store the new values
  //  if (!!data) {
  //    component.set(dsAttribute, data)
  //  } else {
  //    component.set(dsAttribute)
  //  }
  //}

  //editor.TraitManager.addType(dsTraitType, {
  //  // Create UI wrapper for the trait
  //  createInput({ trait }) {
  //    // Create a new element container and add some content
  //    const el = document.createElement('div')
  //    el.classList.add('gjs-one-bg')
  //    // update the UI when a page is added/renamed/removed
  //    editor.on('page', () => doRender(el))
  //    doRender(el)
  //    // this will be the element passed to onEvent and onUpdate
  //    return el
  //  },
  //  // Update the component based on UI changes
  //  // `elInput` is the result HTMLElement you get from `createInput`
  //  onEvent({ elInput, component, event }) {
  //    // applyChanges(component)
  //    console.log('onEvent', elInput, component, event)
  //    doRender(elInput)
  //  },
  //  // Update UI on the component change
  //  onUpdate({ elInput, component }) {
  //    console.log('onUpdate', elInput, component)
  //    doRender(elInput)
  //  },
  //})
}