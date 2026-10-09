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

import { Component, ComponentView, Editor } from 'grapesjs'
import { displayedToStored, storedToDisplayed } from '../assetUrl'

/**
 * @fileoverview This plugin adds CSS properties object-fit and object-position to the image component.
 */

export default (editor: Editor, opts) => {
  opts = {
    // Default options
    labelSrc: 'Image URL',
    placeholderSrc: '/assets/placeholder.png',
    // These default values will never be used,
    // as there is default values in config
    replacedElements: ['img', 'li', 'video'],
    // Override with provided config
    ...opts,
  }
  // Label for the "decorative image" checkbox trait (#1891)
  const labelDecorative = opts.labelDecorative || 'Decorative image'

  const domc = editor.DomComponents
  const imgType = domc.getType('image')

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

  // A decorative image is published with an empty alt attribute (screen
  // readers skip it). The state is derived from the alt attribute itself, so
  // nothing extra is stored and it survives storage round-trips as-is.
  // Grey out the alt text field while decorative is on. Best effort: the alt
  // trait input lives in the same traits panel.
  const setAltDisabled = (el: HTMLElement, disabled: boolean) => {
    const panel = el.closest('.gjs-traits-cs, .gjs-traits')
    const input = panel?.querySelector('.gjs-trt-trait__wrp-alt input')
    if (input instanceof HTMLInputElement) input.disabled = disabled
  }
  editor.TraitManager.addType('decorative', {
    createInput() {
      const el = document.createElement('label')
      const input = document.createElement('input')
      input.type = 'checkbox'
      el.append(input, document.createTextNode(labelDecorative))
      return el
    },
    onEvent({ component, event }) {
      const checked = (event.target as HTMLInputElement).checked
      // Checked: publish alt="". Unchecked: leave the alt attribute alone so
      // the field keeps working as before.
      if (checked) component.addAttributes({ alt: '' })
      const el = (event.target as HTMLElement).closest('label')
      if (el instanceof HTMLElement) setAltDisabled(el, checked)
    },
    onUpdate({ elInput, component }) {
      const decorative = (component as Component).getAttributes()?.alt === ''
      const input = elInput.querySelector('input')
      if (input instanceof HTMLInputElement) input.checked = decorative
      setAltDisabled(elInput, decorative)
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
          {
            type: 'decorative',
            name: 'decorative',
            label: labelDecorative,
          },
        ],
      },
    },
  })

  // Wait for the editor to be ready
  editor.on('load', () => {
    // Add a sector to the style manager
    const sector = editor.StyleManager.addSector('object', {
      name: 'Object',
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
      if (model && opts.replacedElements.includes(model.get('tagName')?.toLowerCase())) {
        showSector = true
        sector.set('visible', true)
      } else {
        showSector = false
        sector.set('visible', false)
      }
    })
    // Watch changes made by grapesjs and revert them if needed
    function doubleCheck() {
      if(sector.get('visible') !== showSector){
        sector.off('change:visible', doubleCheck)
        sector.set('visible', showSector)
        sector.on('change:visible', doubleCheck)
      }
    }
    sector.on('change:visible', doubleCheck)

    // Add a new image type that handles the storage URL vs displayed URL
    domc.addType('image', {
      ...imgType,
      view: {
        ...imgType.view,
        onRender() {
          const view = this as ComponentView
          imgType.view.onRender && imgType.view.onRender.call(this) // call original
          const el = view.el
          const elImg = view.el as HTMLImageElement
          const src = this.model.getAttributes().src
          if (src && !src.startsWith('http')) {
            elImg.src = storedToDisplayed(src, opts.websiteId, opts.storageId)
          }
        },
      },
      model: {
        ...imgType.model,
        init() {
          const model = this as Component
          imgType.model.init && imgType.model.init.call(this) // call original
          // Handle changes by the AssetManager
          model.on('change', () => {
            if (model.get('src')) {
              const newSrc = displayedToStored(model.get('src'))
              if (newSrc !== model.get('src')) {
                model.set('src', newSrc)
                model.view.render()
              }
            }
          })
        },
      },
    })

  })
}
