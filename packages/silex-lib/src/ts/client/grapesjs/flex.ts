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
import { SectorConfig, registerSector } from './sectors'

/**
 * @fileoverview This plugin adds CSS properties for the UL, OL and LI elements
 *
 */

export default (editor: Editor) => {
  const sectorConfigs: SectorConfig[] = [{
    name: 'Flex Item',
    props: [
      {
        id: 'order',
        name: 'Order',
        property: 'order',
        type: 'integer',
        defaults: 0,
      },
      {
        id: 'flex-grow',
        name: 'Flex Grow',
        property: 'flex-grow',
        type: 'integer',
        defaults: 0,
      },
      {
        id: 'flex-shrink',
        name: 'Flex Shrink',
        property: 'flex-shrink',
        type: 'integer',
        defaults: 1,
      },
      {
        id: 'flex-basis',
        name: 'Flex Basis',
        property: 'flex-basis',
        type: 'text',
        defaults: 'auto',
      },
      {
        id: 'align-self',
        name: 'Align Self',
        property: 'align-self',
        type: 'select',
        options: [
          { id: '', label: '' },
          { id: 'auto', label: 'auto' },
          { id: 'flex-start', label: 'flex-start' },
          { id: 'flex-end', label: 'flex-end' },
          { id: 'center', label: 'center' },
          { id: 'baseline', label: 'baseline' },
          { id: 'stretch', label: 'stretch' },
        ],
      },
    ],
    shouldShow: comp => {
      const parent = comp.parent()
      const display = parent?.getStyle()['display'] as string || ''
      return display.includes('flex')
    }
  }]

  editor.on('load', () => {
    sectorConfigs.forEach(sectorConfig => registerSector(editor, sectorConfig, 2))
  })
}
