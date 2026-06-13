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
import { Component, Editor } from 'grapesjs'

/**
 * @fileoverview This plugin adds CSS properties for the UL, OL and LI elements
 *
 */

const FLEX_PROPS = [
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-content',
  'row-gap',
  'column-gap',
]

const FLEX_ITEM_PROPS = [
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'order',
  'align-self',
]

export default (editor: Editor) => {
  editor.on('load', () => {
    const sector = editor.StyleManager.getSector('flex')

    let showSector = false
    let visibleProps: string[] = []

    // Update visibility depending on selected component
    function updateVisibility(comp: Component) {
      const computedDisplay = comp?.view?.el && getComputedStyle(comp.view.el)['display'] as string || ''
      const isFlex = computedDisplay === 'flex' || computedDisplay === 'inline-flex'
      const parent = comp.parent()
      const parentComputedDisplay = parent?.view?.el && getComputedStyle(parent.view.el)['display'] as string || ''
      const parentIsFlex = parentComputedDisplay === 'flex' || parentComputedDisplay === 'inline-flex'

      // Determine which props should be visible
      const newVisibleProps: string[] = []
      if (isFlex) newVisibleProps.push(...FLEX_PROPS)
      if (parentIsFlex) newVisibleProps.push(...FLEX_ITEM_PROPS)

      // Set sector visibility
      showSector = parentIsFlex || isFlex
      sector.set('visible', showSector)

      // Set property visibility
      visibleProps = newVisibleProps
      sector.getProperties().forEach(p => {
        p.set('visible', visibleProps.includes(p.getId()))
      })
    }

    // Listen to the events that should trigger a visibility check
    editor.on('component:selected', (comp: Component) => {
      if (!comp) return
      updateVisibility(comp)
    })

    // `style:property:update` is useful for instantly display the flex sector when selecting display: inline-flex;
    editor.on('style:property:update', () => {
      const comp = editor.getSelected()
      if (comp) updateVisibility(comp)
    })

    // Watch changes made by grapesjs and revert them if needed
    function doubleCheckSector() {
      if (sector.get('visible') !== showSector) {
        sector.off('change:visible', doubleCheckSector)
        sector.set('visible', showSector)
        sector.on('change:visible', doubleCheckSector)
      }
    }
    sector.on('change:visible', doubleCheckSector)

    // Watch property visibility changes
    sector.getProperties().forEach(p => {
      function doubleCheckProp() {
        const shouldBeVisible = visibleProps.includes(p.getId())
        if (p.get('visible') !== shouldBeVisible) {
          p.off('change:visible', doubleCheckProp)
          p.set('visible', shouldBeVisible)
          p.on('change:visible', doubleCheckProp)
        }
      }
      p.on('change:visible', doubleCheckProp)
    })
  })
}
