import { Button } from 'grapesjs'
import { DataSourceEditor } from ".."
import { PROPERTY_STYLES } from './defaultStyles'
import { PropertiesUi } from './PropertiesUi'

export interface ViewOptions {
  appendTo?: string | HTMLElement | (() => HTMLElement)
  button?: Button | (() => Button)
  styles?: string
}

export default (editor: DataSourceEditor, opts: Partial<ViewOptions> = {}) => {
  if (opts.appendTo) {
    const options: ViewOptions = {
      styles: PROPERTY_STYLES,
      ...opts,
    }

    // Get the container element for the UI
    if (!options.appendTo) {
      throw new Error('appendTo option is required')
    } else if (typeof options.appendTo === 'string') {
      if (!document.querySelector(options.appendTo)) throw new Error(`Element ${options.appendTo} not found`)
    } else if (!(options.appendTo instanceof HTMLElement) && typeof options.appendTo !== 'function') {
      throw new Error(`appendTo option must be a string or an HTMLElement or a function`)
    }

    // create a wrapper for our UI
    const wrapper = document.createElement('section')
    wrapper.classList.add('gjs-one-bg', 'ds-wrapper')
    const propertiesUi = new PropertiesUi(editor, options, wrapper)

    // Data tree
    const dataTree = editor.DataSourceManager.getDataTree()

    // The options appendTo and button can be functions which use editor so they need to be called asynchronously
    let appendTo: HTMLElement
    editor.onReady(() => {
      // Append the wrapper to the container
      appendTo = (typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : typeof options.appendTo === 'function' ? options.appendTo() : options.appendTo) as HTMLElement
      if (!appendTo) throw new Error(`Element ${options.appendTo} not found`)
      appendTo.appendChild(wrapper)

      // Show the UI when the button is clicked
      if (options.button) {
        const button = typeof options.button === 'function' ? options.button() : options.button
        if (!button) throw new Error(`Element ${options.button} not found`)
        button.on('change', () => {
          if (button.active) {
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
    })

    // Update the UI when a page is added/renamed/removed
    editor.on('page', () => propertiesUi.updateUi(editor.getSelected(), dataTree))

    // Update the UI on component selection change
    editor.on('component:selected', () => propertiesUi.updateUi(editor.getSelected(), dataTree))

    // Update the UI on component change
    editor.on('component:update', () => propertiesUi.updateUi(editor.getSelected(), dataTree))

  } else {
    console.warn('Dynamic data UI not enabled, please set the appendTo option to enable it')
  }
}
