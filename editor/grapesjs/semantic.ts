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
    tags: ['ADDRESS', 'BLOCKQUOTE', 'PRE', 'TIME'],
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

// Tag-specific attribute traits
const conditionalTraits = [
  {
    attrName: 'for',
    tagName: 'LABEL',
    label: 'For',
    type: 'for-trait',
    placeholder: 'ID of input',
  },
  {
    attrName: 'datetime',
    tagName: 'TIME',
    label: 'Datetime',
    type: 'datetime-trait',
    placeholder: 'YYYY-MM-DD or date/time string',
  },
]

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
    ...conditionalTraits.map(t => ({
      label: t.label,
      name: t.attrName,
      type: t.type,
      placeholder: t.placeholder,
    })),
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

  // Render tag select
  function renderTagSelect(el: HTMLElement, opts: { tagName?: string }) {
    const tagName = (opts.tagName || '').toUpperCase()
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
      <select @change=${(event: Event) => renderTagSelect(el, { tagName: (event.target as HTMLSelectElement).value })}>
        ${map(categoriesWithCurrent, cat => html`
          <optgroup label="${cat.label}">
            ${map(cat.tags, tag => html`
              <option value="${tag}" ?selected=${tagName === tag}>${tag}</option>
            `)}
          </optgroup>
        `)}
      </select>
    `, el)
  }

  function doRenderCurrentTag(el: HTMLElement) {
    renderTagSelect(el, { tagName: editor.getSelected()?.get('tagName') || '' })
  }

  // Add tag-name trait
  editor.TraitManager.addType('tag-name', {
    createInput() {
      const el = document.createElement('div')
      editor.on('page', () => doRenderCurrentTag(el))
      doRenderCurrentTag(el)
      return el
    },
    onEvent({ component, event }) {
      const value = (event.target as HTMLSelectElement).value
      if (component.get('tagName').toUpperCase() !== value.toUpperCase()) {
        component.set('tagName', value)
      }
    },
    onUpdate({ elInput, component }) {
      const tagName = component.get('tagName')
      renderTagSelect(elInput, { tagName })
    },
  })

  // Register all conditional tag-specific attribute traits
  conditionalTraits.forEach(traitDef => {
    const { attrName, tagName: targetTag, type, placeholder } = traitDef

    function renderInput(el: HTMLElement, opts: { tagName?: string; attrVal?: string }) {
      const tagName = (opts.tagName || '').toUpperCase()
      const wrapper = el.closest(`.gjs-trt-trait__wrp-${attrName}`) as HTMLElement
      if (tagName !== targetTag) {
        if (wrapper) wrapper.style.display = 'none'
        render(html``, el)
      } else {
        if (wrapper) wrapper.style.display = 'initial'
        render(html`
          <input type="text" placeholder="${placeholder}" value="${opts.attrVal || ''}"
            @input=${(event: Event) => renderInput(el, { attrVal: (event.target as HTMLInputElement).value, tagName })}
          >
        `, el)
      }
    }

    function doRender(el: HTMLElement) {
      const selected = editor.getSelected()
      renderInput(el, {
        tagName: selected?.get('tagName') || '',
        attrVal: selected?.getAttributes()[attrName] || '',
      })
    }

    editor.TraitManager.addType(type, {
      createInput() {
        const el = document.createElement('div')
        editor.on('page component:update', () => doRender(el))
        doRender(el)
        return el
      },
      onEvent({ component, event }) {
        const value = (event.target as HTMLInputElement).value
        if (component.getAttributes()[attrName] !== value) {
          component.addAttributes({ [attrName]: value })
        }
      },
      onUpdate({ elInput, component }) {
        const attrVal = component.getAttributes()[attrName] || ''
        const tagName = component.get('tagName') || ''
        renderInput(elInput, { attrVal, tagName })
      },
    })
  })
}
