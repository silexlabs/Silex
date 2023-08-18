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

import { Editor } from 'grapesjs'

/**
 * @fileoverview This plugin adds CSS properties object-fit and object-position to the image component.
 */

export default (editor: Editor, opts) => {
  opts = {
    labelSrc: 'Image URL',
    placeholderSrc: 'https://example.com/image.jpg',
    ...opts,
  }
  // Add src trait in the properties
  editor.TraitManager.addType('src', {
    events: {
      'change': 'onChange',
    },
    templateInput() {
      return `
        <div class="gjs-field gjs-field-trad">
          <label class="gjs-label">${opts.labelSrc}</label>
          <input type="text" class="gjs-field" placeholder="${opts.placeholderSrc}" />
        </div>
      `
    },
    getInputEl() {
      if (!this.inputEl) {
        this.inputEl = this.templateInput()
      }
      return this.inputEl
    },
    onValueChange() {
      this.setValue(this.getInputEl().value)
    },
    setValue(value) {
      this.getInputEl().value = value
    },
    getValue() {
      return this.getInputEl().value
    },
  })

  // Add the trait to the image component
  editor.DomComponents.addType('image', {
    model: {
      defaults: {
        ...editor.DomComponents.getType('image').model.prototype.defaults,
        traits: [
          ...editor.DomComponents.getType('image').model.prototype.defaults.traits
          // Remove href and tagName trait becase images have to keep the img tag, not become links
          // Remove tag-name trait which is added by the semantic plugin
          // Also remove src trait in case it exists already
            .filter((trait) => !['href', 'tag-name', 'src'].includes(trait.name)),
          'src',
        ],
      },
    },
  })

  // Wait for the editor to be ready
  editor.on('load', () => {
    // Add a sector to the style manager
    const sector = editor.StyleManager.addSector('image', {
      name: 'Image',
      open: false,
      properties: [{
        label: 'object-fit',
        property: 'object-fit',
        type: 'select',
        default: '',
        /* @ts-ignore */
        options: [
          { id: '', label: '' },
          { id: 'fill', label: 'fill' },
          { id: 'contain', label: 'contain' },
          { id: 'cover', label: 'cover' },
          { id: 'none', label: 'none' },
          { id: 'scale-down', label: 'scale-down' },
          { id: 'initial', label: 'initial' },
          { id: 'inherit', label: 'inherit' },
          { id: 'auto', label: 'auto' },
        ],
      }, {
        label: 'object-position',
        property: 'object-position',
        type: 'select',
        default: '',
        /* @ts-ignore */
        options: [
          { id: '', label: '' },
          { id: 'left top', label: 'left top' },
          { id: 'left center', label: 'left center' },
          { id: 'left bottom', label: 'left bottom' },
          { id: 'right top', label: 'right top' },
          { id: 'right center', label: 'right center' },
          { id: 'right bottom', label: 'right bottom' },
          { id: 'center top', label: 'center top' },
          { id: 'center center', label: 'center center' },
          { id: 'center bottom', label: 'center bottom' },
          { id: 'initial', label: 'initial' },
          { id: 'inherit', label: 'inherit' },
          { id: 'unset', label: 'unset' },
        ],
      }],
    }, {
      at: 1,
    })
    let showSector = false
    // It shows up when the selection is an image
    editor.on('component:selected', (model) => {
      if (model && model.get('type') === 'image') {
        // Not necessary, grapesjs does it automatically
        // sector.set('visible', true);
        showSector = true
      } else {
        showSector = false
        sector.set('visible', false)
      }
    })
    // Watch automatic changes and revert them if needed
    sector.on('change:visible', (model, open) => {
      if(sector.get('visible') !== showSector) sector.set('visible', showSector)
    })
  })
}
