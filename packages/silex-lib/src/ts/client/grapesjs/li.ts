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

/**
 * @fileoverview This plugin adds CSS properties for the UL, OL and LI elements
 * 
 */

export default (editor: Editor, opts) => {
  const domc = editor.DomComponents

  // Ensure types exist, or register them if missing
  if (!domc.getType('ul')) {
    domc.addType('ul', {
      model: {},
      view: {},
    })
  }
  if (!domc.getType('ol')) {
    domc.addType('ol', {
      model: {},
      view: {},
    })
  }
  if (!domc.getType('li')) {
    domc.addType('li', {
      model: {},
      view: {},
    })
  }

  // Only these CSS properties
  const listProps = [
    {
      id: 'list-style-type',
      name: 'List Style Type',
      property: 'list-style-type',
      type: 'select',
      options: [
        { id: '', label: '' },
        { id: 'disc', label: 'disc' },
        { id: 'circle', label: 'circle' },
        { id: 'square', label: 'square' },
        { id: 'decimal', label: 'decimal' },
        { id: 'decimal-leading-zero', label: 'decimal-leading-zero' },
        { id: 'lower-roman', label: 'lower-roman' },
        { id: 'upper-roman', label: 'upper-roman' },
        { id: 'lower-alpha', label: 'lower-alpha' },
        { id: 'upper-alpha', label: 'upper-alpha' },
        { id: 'none', label: 'none' },
      ],
      defaults: '',
    },
    {
      id: 'list-style-position',
      name: 'List Style Position',
      property: 'list-style-position',
      type: 'select',
      options: [
        { id: '', label: '' },
        { id: 'outside', label: 'outside' },
        { id: 'inside', label: 'inside' },
      ],
      defaults: '',
    },
    {
      id: 'list-style-image',
      name: 'List Style Image',
      property: 'list-style-image',
      type: 'text',
      defaults: '',
    },
  ]

  let sector
  let showSector = false
  let initialized = false

  function addPropsToStyleManager(props, name = 'List') {
    const sm = editor.StyleManager
    sector = sm.getSector(name)
    if (!sector) {
      sector = sm.addSector(name, { name, open: true })
      sector.on('change:visible', () => {
        if (sector.get('visible') !== showSector) sector.set('visible', showSector)
      })
    }
    // Only add properties if not already present
    const existingProps = sector.get('properties').map(p => p.get('property'))
    props.forEach(prop => {
      if (!existingProps.includes(prop.property)) {
        sector.addProperty(prop, {})
      }
    })
  }

  editor.on('load', () => {
    addPropsToStyleManager(listProps)
    initialized = true
  })

  // Listen for selection and update visibility only if needed
  editor.on('component:selected', comp => {
    if (!initialized || !sector) return
    const tag = comp.get('tagName')?.toLowerCase()
    const shouldShow = tag === 'ul' || tag === 'ol' || tag === 'li'
    if (showSector !== shouldShow) {
      showSector = shouldShow
      sector.set('visible', showSector)
    }
  })
}
