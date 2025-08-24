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

import { DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_END, DataSourceEditorOptions, DataSourceEditorViewOptions, Properties } from '../types'
import { PROPERTY_STYLES } from './defaultStyles'

import { PropertiesEditor } from './properties-editor'
import { CustomStatesEditor } from './custom-states-editor'

import settings from './settings'
import { Editor } from 'grapesjs'

import '@silexlabs/expression-input'
import './properties-editor'
import './custom-states-editor'
import canvas from './canvas'
import { getElementFromOption } from '../utils'

export default (editor: Editor, opts: DataSourceEditorOptions) => {
  const options: DataSourceEditorViewOptions = {
    styles: PROPERTY_STYLES,
    defaultFixed: false,
    disableStates: false,
    disableAttributes: false,
    disableProperties: false,
    previewDebounceDelay: 100,
    previewRefreshEvents: `
      ${DATA_SOURCE_CHANGED}
      ${DATA_SOURCE_DATA_LOAD_END}
      style:change
      storage:after:load
      component
      component:add
      component:remove
    `,
    ...opts.view,
  }

  if (opts.view.el) {
    // create a wrapper for our UI
    const wrapper = document.createElement('section')
    wrapper.classList.add('gjs-one-bg', 'ds-wrapper')

    // Add the web components
    const states = options.disableStates ? '' : `
      <custom-states-editor
        class="ds-states"
        title="States"
        default-fixed=${options.defaultFixed}
        create-prompt="Create a new state"
        rename-prompt="Rename the state"
        default-name="New state"
        reserved-names=${Object.keys(Properties).join(',')}
        hide-loop-data
        help-text="
          Custom states are used to store data in the component.\n
          They are useful to store data that is not displayed in the page, but that is used in the expressions everywhere inside the element.
        "
        help-link="https://docs.silex.me/en/user/cms-concepts#states"
        >
        <style>
          ${options.styles}
        </style>
      </custom-states-editor>
    `
    const attributes = options.disableAttributes ? '' : `
      <custom-states-editor
        class="ds-attributes"
        private-state
        title="Attributes"
        default-fixed=${options.defaultFixed}
        create-prompt="Name of the attribute"
        rename-prompt="Rename the attribute"
        default-name="New attribute"
        reserved-names=${Object.keys(Properties).join(',')}
        help-text="
          HTML attributes of the element.\n
          For example you can set the 'href' attribute of a link, or the 'src' attribute of an image.
        "
        help-link="https://docs.silex.me/en/user/cms-concepts#attributes"
        >
        <style>
          ${options.styles}
        </style>
      </custom-states-editor>
    `
    const properties = options.disableProperties ? '' : `
      <properties-editor
        class="ds-properties"
        default-fixed=${options.defaultFixed}
      >
        <style>
          ${options.styles}
        </style>
      </properties-editor>
    `
    wrapper.innerHTML = `
      ${states}
      ${attributes}
      ${properties}
    `

    // Build the settings view
    settings(editor, options)

    // The options el and button can be functions which use editor so they need to be called asynchronously
    editor.onReady(() => {
      // Get the container element for the UI
      const el = getElementFromOption(options.el, 'options.el')

      // Append the wrapper to the container
      el.appendChild(wrapper)

      // Get references to the web components
      const propertiesUi = wrapper.querySelector('properties-editor.ds-properties') as PropertiesEditor
      const statesUi = wrapper.querySelector('custom-states-editor.ds-states') as CustomStatesEditor
      const attributesUi = wrapper.querySelector('custom-states-editor.ds-attributes') as CustomStatesEditor

      // Init web components
      propertiesUi?.setEditor(editor)
      statesUi?.setEditor(editor)
      attributesUi?.setEditor(editor)

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
            propertiesUi?.removeAttribute('disabled')
            statesUi?.removeAttribute('disabled')
            attributesUi?.removeAttribute('disabled')
          } else {
            // Hide the UI
            wrapper.style.display = 'none'
            // Change web components state
            propertiesUi?.setAttribute('disabled', '')
            statesUi?.setAttribute('disabled', '')
            attributesUi?.setAttribute('disabled', '')
          }
        })
        wrapper.style.display = button.active ? 'block' : 'none'
      }
    })
  } else {
    console.warn('Dynamic data UI not enabled, please set the el option to enable it')
  }
  canvas(editor, options)
}
