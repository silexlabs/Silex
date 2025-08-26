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
    // Add missing sectors
    // FIXME: this makes grapesjs bug, all other props disappear
    // FLEX_PROPS
    //   .concat(FLEX_ITEM_PROPS)
    //   .forEach(id => {
    //     if (!sector.getProperty(id)) {
    //       editor.StyleManager.addProperty('flex', {
    //         id,
    //       })
    //     }
    //   })
    // Listen to the events that should trigger a visibility check
    editor.on('component:selected', comp => applyVisibility(comp))
    // `change:visible` is a workaround grapesjs behavior: https://github.com/GrapesJS/grapesjs/issues/3123
    editor.on('change:visible', applyVisibility)
    // `style:property:update` is useful for instantly display the flex sector when selecting display: inline-flex;
    editor.on('style:property:update', () => applyVisibility())
    function applyVisibility(comp: Component = editor.getSelected()) {
      editor.off('change:visible', applyVisibility) // Avoid infinite loop
      requestAnimationFrame(() => {
        if(!comp) return // No selection yet
        const computedDisplay = comp?.view?.el && getComputedStyle(comp.view.el)['display'] as string || ''
        const isFlex = computedDisplay === 'flex' || computedDisplay === 'inline-flex'
        const parent = comp.parent()
        const parentComputedDisplay = parent?.view?.el && getComputedStyle(parent.view.el)['display'] as string || ''
        const parentIsFlex = parentComputedDisplay === 'flex' || parentComputedDisplay === 'inline-flex'
        if (parentIsFlex || isFlex) {
          sector.set('visible', true)
        }
        if (parentIsFlex && isFlex) {
          sector.getProperties()
            .forEach(p => p.set('visible', true))
        } else if (isFlex) {
          sector.getProperties()
            .forEach(p => p.set('visible', FLEX_PROPS.includes(p.getId())))
        } else if (parentIsFlex) {
          sector.getProperties()
            .forEach(p => p.set('visible', FLEX_ITEM_PROPS.includes(p.getId())))
        }
        editor.on('change:visible', applyVisibility)
      })
    }
  })
}
