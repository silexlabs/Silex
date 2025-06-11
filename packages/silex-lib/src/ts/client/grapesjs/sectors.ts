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
 * @fileoverview
 *
 */

export type SectorConfig = {
  name: string
  props: any[]
  shouldShow: (comp: Component) => boolean
}

export function registerSector(editor: Editor, config: SectorConfig, at?: number) {
  const sm = editor.StyleManager
  let sector = sm.getSector(config.name)
  if (!sector) {
    sector = sm.addSector(config.name, { name: config.name, open: false, visible: false }, { at })
  }

  // Add props if not already present
  const existingProps = sector.get('properties')//.map(p => p.get('property'))
  config.props.forEach(p => {
    if (!existingProps.includes(p.property)) {
      sector.addProperty(p, {})
    }
  })

  // Keep sector in sync with internal visibility state
  sector.on('change:visible', () => {
    const shouldBeVisible = sector.get('visible')
    if (shouldBeVisible !== config.shouldShow(editor.getSelected() as Component)) {
      sector.set('visible', !shouldBeVisible)
    }
  })

  editor.on('component:selected', comp => {
    const shouldShow = config.shouldShow(comp)
    if (sector.get('visible') !== shouldShow) {
      sector.set('visible', shouldShow)
    }
  })
}
