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

import {html, render} from 'lit-html'
import {map} from 'lit-html/directives/map.js'

// constants
const pluginName = 'semantic'

const tags = [
  'DIV',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'SPAN',
  'MAIN',
  'ASIDE',
  'SECTION',
  'ADDRESS',
  'ARTICLE',
  'BUTTON',
  'NAV',
  'HEADER',
  'FOOTER',
  'DETAILS',
  'SUMMARY',
  'PRE',
  'BLOCKQUOTE',
]

// plugin code
export const semanticPlugin = (editor, opts) => {
  // Add the new trait to all component types
  editor.DomComponents.getTypes().map(type => {
    editor.DomComponents.addType(type.id, {
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...editor.DomComponents.getType(type.id).model.prototype.defaults.traits,
            // Add the new trait
            {
              label: 'Tag name',
              type: 'tag-name',
            },
          ]
        }
      }
    })
  })

  function doRender(el: HTMLElement, tagName: string) {
    const tagsWithCurrent = tags.includes(tagName.toUpperCase()) ? tags : tags.concat(tagName.toUpperCase())
    render(html`
      <label for="semantic__select" class="gjs-one-bg silex-label">Type</label>
      <select id="semantic__select" @change=${event => doRender(el, event.target.value)}>
        ${map<string>(tagsWithCurrent, tag => html`
          <option value="${tag}" ?selected=${tagName.toUpperCase() === tag}>${tag}</option>
        `)}
      </select>
    `, el)
  }
  function doRenderCurrent(el: HTMLElement) {
    doRender(el, editor.getSelected()?.get('tagName') || '')
  }

  // Add semantic traits
  // inspired by https://github.com/olivmonnier/grapesjs-plugin-header/blob/master/src/components.js
  editor.TraitManager.addType('tag-name', {
    createInput({ trait }) {
      // Create a new element container and add some content
      const el = document.createElement('div')
      // update the UI when a page is added/renamed/removed
      editor.on('page', () => doRenderCurrent(el))
      doRenderCurrent(el)
      // this will be the element passed to onEvent and onUpdate
      return el
    },
    // Update the component based on UI changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const value = elInput.querySelector('#semantic__select').value
      if(component.get('tagName').toUpperCase() === value.toUpperCase()){
        // Already done
      } else {
        component.set('tagName', value)
      }
    },
    // Update UI on the component change
    onUpdate({ elInput, component }) {
      const tagName = component.get('tagName')
      doRender(elInput, tagName)
    },
  })
}
