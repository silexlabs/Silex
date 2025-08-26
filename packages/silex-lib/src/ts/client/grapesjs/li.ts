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
  const sectorConfigs: SectorConfig[] = [
    {
      id: 'list',
      name: 'List',
      props: [
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
      ],
      shouldShow: comp => comp && ['ul', 'ol', 'li'].includes(comp.get('tagName')?.toLowerCase() || ''),
    },
  ]

  editor.on('load', () => {
    sectorConfigs.forEach(sectorConfig => registerSector(editor, sectorConfig))
  })
}
