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
  const labelDecorative = opts.labelDecorative || 'Decorative image'

  // Clearing the field drops alt: only the checkbox may publish alt="" (decorative).
  const altTrait = {
    type: 'altText',
    name: 'alt',
    label: 'alt',
    setValue({ value, component, emitUpdate }: { value: string, component: Component, emitUpdate: () => void }) {
      if (value === '') component.removeAttributes('alt')
      else component.addAttributes({ alt: value })
      emitUpdate()
    },
  }

  editor.TraitManager.addType('altText', {
    getInputEl() {
      const input = document.createElement('input')
      input.type = 'text'
      const placeholder = this.model.get('placeholder') || this.model.get('default') || ''
      if (placeholder) input.placeholder = placeholder
      const value = this.getModelValue()
      if (value !== undefined) input.value = value
      return input
    },
    onUpdate() {
      const input = this.getInputElem()
      if (input instanceof HTMLInputElement) input.disabled = this.target.getAttributes()?.alt === ''
    },
  })

  // '' and a missing alt both read as '' for the alt trait, so unchecking does
  // not update it: find its input in the panel and switch it here.
  const setAltFieldDisabled = (el: HTMLElement, disabled: boolean) => {
    const panel = el.closest('.gjs-traits-cs, .gjs-traits')
    const input = panel?.querySelector('.gjs-trt-trait__wrp-alt input')
    if (input instanceof HTMLInputElement) input.disabled = disabled
  }

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

  // Screen readers skip an image whose alt is "": the state is that attribute
  // itself, so nothing extra is stored and it survives storage round-trips.
  editor.TraitManager.addType('decorative', {
    createInput() {
      // Same markup as the "Unwrap content" trait, whose icon stands in for the
      // checkbox input that GrapesJS hides.
      const el = document.createElement('div')
      const label = document.createElement('label')
      label.className = 'gjs-field gjs-field-checkbox silex-label'
      const input = document.createElement('input')
      input.type = 'checkbox'
      const icon = document.createElement('i')
      icon.className = 'gjs-chk-icon'
      icon.setAttribute('style', 'position: absolute; z-index: 1;')
      label.append(input, icon)
      el.append(label)
      return el
    },
    onEvent({ component, event }) {
      const checked = (event.target as HTMLInputElement).checked
      if (checked) component.addAttributes({ alt: '' })
      else component.removeAttributes('alt')
      const el = (event.target as HTMLElement).closest('label')
      if (el instanceof HTMLElement) setAltFieldDisabled(el, checked)
    },
    onUpdate({ elInput, component }) {
      const decorative = (component as Component).getAttributes()?.alt === ''
      const input = elInput.querySelector('input')
      if (input instanceof HTMLInputElement) input.checked = decorative
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
          // Also remove src and alt, re-added or replaced below
            .filter((trait) => trait !== 'alt' && !['href', 'tag-name', 'src'].includes(trait.name)),
          altTrait,
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
