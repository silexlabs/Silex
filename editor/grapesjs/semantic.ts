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

// Group tags by category
const tagCategories = [
  {
    label: 'Containers',
    tags: ['DIV', 'SPAN', 'P'],
  },
  {
    label: 'Headings',
    tags: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
  },
  {
    label: 'Main document structure',
    tags: ['MAIN', 'SECTION', 'ARTICLE', 'NAV', 'ASIDE', 'HEADER', 'FOOTER'],
  },
  {
    label: 'Content grouping',
    tags: ['ADDRESS', 'BLOCKQUOTE', 'PRE'],
  },
  {
    label: 'Lists',
    tags: ['UL', 'OL', 'LI'],
  },
  {
    label: 'Interactive/form',
    tags: ['BUTTON', 'LABEL', 'DETAILS', 'SUMMARY'],
  },
]

// Flatten all tags for lookup
const tags = tagCategories.flatMap(cat => cat.tags)

// plugin code
export const semanticPlugin = (editor, opts) => {
  // Helper to merge extra traits into a type's default traits
  function withExtraTraits(type, extraTraits) {
    const origTraits = editor.DomComponents.getType(type.id).model.prototype.defaults.traits
    return [
      ...origTraits,
      ...extraTraits,
    ]
  }

  // Traits to add to all components
  const extraTraits = [
    {
      label: 'Tag name',
      type: 'tag-name',
      name: 'tag-name',
    },
    {
      label: 'For',
      name: 'for',
      type: 'for-trait',
      placeholder: 'ID of input',
    }
  ]

  // Add the extra traits to all component types
  editor.DomComponents.getTypes().forEach(type => {
    editor.DomComponents.addType(type.id, {
      model: {
        defaults: {
          traits: withExtraTraits(type, extraTraits),
        }
      }
    })
  })

  // Shared render function for select and for-trait
  function renderTrait(el: HTMLElement, opts: {
    tagName?: string,
    forAttr?: string,
    type: 'tag' | 'for'
  }) {
    const tagName = (opts.tagName || '').toUpperCase()
    if (opts.type === 'tag') {
      // Render tag select
      let categoriesWithCurrent = tagCategories.map(cat => ({
        ...cat,
        tags: cat.tags.slice(),
      }))
      if (tagName && !tags.includes(tagName)) {
        categoriesWithCurrent = [
          ...categoriesWithCurrent,
          { label: 'Other', tags: [tagName] }
        ]
      }
      render(html`
        <select @change=${event => renderTrait(el, { tagName: event.target.value, type: 'tag' })}>
          ${map(categoriesWithCurrent, cat => html`
            <optgroup label="${cat.label}">
              ${map(cat.tags, tag => html`
                <option value="${tag}" ?selected=${tagName === tag}>${tag}</option>
              `)}
            </optgroup>
          `)}
        </select>
      `, el)
    } else if (opts.type === 'for') {
      // Render "for" input, hide if not LABEL
      const wrapper = el.closest('.gjs-trt-trait__wrp-for') as HTMLElement
      if (tagName !== 'LABEL') {
        if(wrapper) wrapper.style.display = 'none'
        render(html``, el)
      } else {
        if(wrapper) wrapper.style.display = 'initial'
        render(html`
          <input type="text" placeholder="ID of input" value="${opts.forAttr || ''}"
            @input=${event => renderTrait(el, { forAttr: (event.target as HTMLInputElement).value, tagName, type: 'for' })}
          >
        `, el)
      }
    }
  }

  function doRenderCurrent(el: HTMLElement) {
    renderTrait(el, { tagName: editor.getSelected()?.get('tagName') || '', type: 'tag' })
  }
  function doRenderCurrentFor(el: HTMLElement) {
    const selected = editor.getSelected()
    renderTrait(el, {
      tagName: selected?.get('tagName') || '',
      forAttr: selected?.getAttributes().for || '',
      type: 'for'
    })
  }

  // Add semantic traits
  // inspired by https://github.com/olivmonnier/grapesjs-plugin-header/blob/master/src/components.js
  editor.TraitManager.addType('tag-name', {
    createInput({ trait, component }) {
      const el = document.createElement('div')
      editor.on('page', () => doRenderCurrent(el))
      doRenderCurrent(el)
      return el
    },
    onEvent({ elInput, component, event }) {
      const value = (event.target as HTMLSelectElement).value
      if(component.get('tagName').toUpperCase() !== value.toUpperCase()){
        component.set('tagName', value)
      }
    },
    onUpdate({ elInput, component }) {
      const tagName = component.get('tagName')
      renderTrait(elInput, { tagName, type: 'tag' })
    },
  })

  editor.TraitManager.addType('for-trait', {
    createInput({ trait, component }) {
      const el = document.createElement('div')
      editor.on('page', () => doRenderCurrentFor(el))
      editor.on('component:update', () => doRenderCurrentFor(el))
      doRenderCurrentFor(el)
      return el
    },
    onEvent({ elInput, component, event }) {
      const value = (event.target as HTMLInputElement).value
      if(component.getAttributes().for !== value){
        component.setAttributes({ for: value })
      }
    },
    onUpdate({ elInput, component }) {
      const forAttr = component.getAttributes().for || ''
      const tagName = component.get('tagName') || ''
      renderTrait(elInput, { forAttr, tagName, type: 'for' })
    },
  })
}
