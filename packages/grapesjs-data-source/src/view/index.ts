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

import { Button } from 'grapesjs'
import { DataSourceEditor } from ".."
import { PROPERTY_STYLES } from './defaultStyles'

import { PropertiesEditor } from './properties-editor'
import './properties-editor'
import '@silexlabs/expression-input/dist/popin-form.js'

/**
 * 
 */
export interface ViewOptions {
  appendTo?: string | HTMLElement | (() => HTMLElement)
  button?: Button | (() => Button)
  styles?: string
  optionsStyles?: string
}

export default (editor: DataSourceEditor, opts: Partial<ViewOptions> = {}) => {
  if (opts.appendTo) {
    const options: ViewOptions = {
      styles: PROPERTY_STYLES,
      ...opts,
    }

    // create a wrapper for our UI
    const wrapper = document.createElement('section')
    wrapper.classList.add('gjs-one-bg', 'ds-wrapper')

    // Add the web components
    wrapper.innerHTML = `
      <properties-editor>
        <style>
          ${options.styles}
        </style>
      </properties-editor>
    `

    // The options appendTo and button can be functions which use editor so they need to be called asynchronously
    let appendTo: HTMLElement
    editor.onReady(() => {
      // Get the container element for the UI
      if (typeof options.appendTo === 'undefined') {
        // This should never happen as we set a default value in /index.ts
        throw new Error(`appendTo option must be set`)
      } else if (typeof options.appendTo === 'string') {
        if (!document.querySelector(options.appendTo)) throw new Error(`Element ${options.appendTo} not found`)
      } else if (!(options.appendTo instanceof HTMLElement) && typeof options.appendTo !== 'function') {
        throw new Error(`appendTo option must be a string or an HTMLElement or a function`)
      }

      // Append the wrapper to the container
      appendTo = (typeof options.appendTo === 'string' ? document.querySelector(options.appendTo) : typeof options.appendTo === 'function' ? options.appendTo() : options.appendTo) as HTMLElement
      if (!appendTo) throw new Error(`Element ${options.appendTo} not found`)
      appendTo.appendChild(wrapper)

      // Get references to the web components
      const propertiesUi = wrapper.querySelector('properties-editor') as PropertiesEditor
      propertiesUi.setEditor(editor)

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
            // Change web components state
            propertiesUi.removeAttribute('disabled')
          } else {
            // Hide the UI
            wrapper.style.display = 'none'
            // Change web components state
            propertiesUi.setAttribute('disabled', '')
          }
        })
        wrapper.style.display = button.active ? 'block' : 'none'
      }
    })
  } else {
    console.warn('Dynamic data UI not enabled, please set the appendTo option to enable it')
  }
}
