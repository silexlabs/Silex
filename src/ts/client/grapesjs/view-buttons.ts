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
 *
 */

const pasteBtnClass = 'fa fa-fw fa-paste silex-button'
const disabledClass = ' disabled'

export default function(editor) {
  // Add copy/paste buttons in the top bar
  const [copyBtn, pasteBtn] = editor.Panels.addButton('options', [{
    id: 'copy',
    className: 'fa fa-fw fa-copy',
    command: 'core:copy',
    attributes: { title: 'Copy (Ctrl+C)' },
  }, {
    id: 'paste',
    className: pasteBtnClass + disabledClass,
    command: 'core:paste',
    attributes: { title: 'Paste (Ctrl+V)' },
    active: false,
  }])

  // Disable paste button if clipboard is empty
  editor.EditorModel.on('change:clipboard', (model, value) => {
    const hasClipboard = value && value.length > 0
    pasteBtn.set('className', pasteBtnClass + (hasClipboard ? '' : disabledClass))
  })
}
