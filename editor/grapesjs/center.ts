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

const CENTER_COMMAND = 'silex:center-h'

export default (editor: Editor) => {
  editor.Commands.add(CENTER_COMMAND, () => {
    const cmp = editor.getSelected()
    if (!cmp) return

    const style = cmp.getStyle()
    const isCentered =
        style['margin-left'] === 'auto' &&
        style['margin-right'] === 'auto'

    if (isCentered) {
      const {
        ['margin-left']: _marginLeft,
        ['margin-right']: _marginRight,
        ...newStyle
      } = style

      cmp.setStyle(newStyle)
      return
    }

    cmp.setStyle({
      ...style,
      'margin-left': 'auto',
      'margin-right': 'auto',
    })
  })

  editor.on('component:selected', component => {
    if (component.toolbar.some(item => item.command === CENTER_COMMAND)) {
      return
    }

    component.set('toolbar', [
      ...component.toolbar,
      {
        attributes: {
          class: 'fa-solid fa-align-center',
          title: 'Center horizontally',
          'aria-label': 'Center horizontally',
        },
        command: CENTER_COMMAND,
      },
    ])
  })
}
