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

import { DataSourceEditor, DataSourceEditorViewOptions } from ".."
import { PROPERTY_STYLES } from './defaultStyles'

import { PropertiesEditor } from './properties-editor'
import { CustomStatesEditor } from './custom-states-editor'

import '@silexlabs/expression-input/dist/popin-form.js'
import './properties-editor'
import './custom-states-editor'

export default (editor: DataSourceEditor, opts: Partial<DataSourceEditorViewOptions> = {}) => {
  if (opts.el) {
    const options: DataSourceEditorViewOptions = {
      styles: PROPERTY_STYLES,
      ...opts,
    }

    // create a wrapper for our UI
    const wrapper = document.createElement('section')
    wrapper.classList.add('gjs-one-bg', 'ds-wrapper')

    // Add the web components
    wrapper.innerHTML = `
      <custom-states-editor
        type="states"
        title="States"
        >
        <style>
          ${options.styles}
        </style>
      </custom-states-editor>
      <custom-states-editor
        type="attributes"
        title="Attributes"
        >
        <style>
          ${options.styles}
        </style>
      </custom-states-editor>
      <properties-editor>
        <style>
          ${options.styles}
        </style>
      </properties-editor>
    `

    // The options el and button can be functions which use editor so they need to be called asynchronously
    let el: HTMLElement
    editor.onReady(() => {
      // Get the container element for the UI
      if (typeof options.el === 'undefined') {
        // This should never happen as we set a default value in /index.ts
        throw new Error(`el option must be set`)
      } else if (typeof options.el === 'string') {
        if (!document.querySelector(options.el)) throw new Error(`Element ${options.el} not found`)
      } else if (!(options.el instanceof HTMLElement) && typeof options.el !== 'function') {
        throw new Error(`el option must be a string or an HTMLElement or a function`)
      }

      // Append the wrapper to the container
      el = (typeof options.el === 'string' ? document.querySelector(options.el) : typeof options.el === 'function' ? options.el() : options.el) as HTMLElement
      if (!el) throw new Error(`Element ${options.el} not found`)
      el.appendChild(wrapper)

      // Get references to the web components
      const propertiesUi = wrapper.querySelector('properties-editor') as PropertiesEditor
      const statesUi = wrapper.querySelector('custom-states-editor[type="states"]') as CustomStatesEditor
      const attributesUi = wrapper.querySelector('custom-states-editor[type="attributes"]') as CustomStatesEditor

      // Init web components
      propertiesUi.setEditor(editor)
      statesUi.setEditor(editor)
      attributesUi.setEditor(editor)


      // Show the UI when the button is clicked
      if (options.button) {
        const button = typeof options.button === 'function' ? options.button() : options.button
        if (!button) throw new Error(`Element ${options.button} not found`)
        button.on('change', () => {
          if (button.active) {
            // Move at the bottom
            el.appendChild(wrapper)
            // Show the UI
            wrapper.style.display = 'block'
            // Change web components state
            propertiesUi.removeAttribute('disabled')
            statesUi.removeAttribute('disabled')
            attributesUi.removeAttribute('disabled')
          } else {
            // Hide the UI
            wrapper.style.display = 'none'
            // Change web components state
            propertiesUi.setAttribute('disabled', '')
            statesUi.setAttribute('disabled', '')
            attributesUi.setAttribute('disabled', '')
          }
        })
        wrapper.style.display = button.active ? 'block' : 'none'
      }
    })
  } else {
    console.warn('Dynamic data UI not enabled, please set the el option to enable it')
  }
}
