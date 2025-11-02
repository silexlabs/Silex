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

import { Editor } from 'grapesjs'

const pasteBtnClass = 'fa fa-fw fa-paste silex-button'
const undoBtnClass = 'fa fa-fw fa-rotate-left silex-button'
const redoBtnClass = 'fa fa-fw fa-rotate-right silex-button'
const disabledClass = ' disabled'

export default function(editor: Editor) {
  // Add undo/redo and copy/paste buttons in the top bar
  // Add undo/redo and copy/paste buttons in the top bar
  editor.Panels.addButton('options', [{
    id: 'undo',
    className: undoBtnClass + disabledClass,
    command: () => editor.UndoManager.undo(),
    attributes: { title: 'Undo (Ctrl+Z)' },
  }, {
    id: 'redo',
    className: redoBtnClass + disabledClass,
    command: () => editor.UndoManager.redo(),
    attributes: { title: 'Redo (Ctrl+Shift+Z)' },
  }, {
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

  // Get buttons after creation
  const undoBtn = editor.Panels.getButton('options', 'undo')
  const redoBtn = editor.Panels.getButton('options', 'redo')
  const pasteBtn = editor.Panels.getButton('options', 'paste')

  // Update undo/redo button states based on UndoManager
  const updateUndoRedoButtons = () => {
    const hasUndo = editor.UndoManager.hasUndo()
    const hasRedo = editor.UndoManager.hasRedo()
    undoBtn.set('className', undoBtnClass + (hasUndo ? '' : disabledClass))
    redoBtn.set('className', redoBtnClass + (hasRedo ? '' : disabledClass))
  }

  // Listen for changes in the undo stack
  editor.on('change:changesCount', updateUndoRedoButtons)
  editor.on('undo', updateUndoRedoButtons)
  editor.on('redo', updateUndoRedoButtons)

  // Initial state
  updateUndoRedoButtons()

  // Disable paste button if clipboard is empty
  editor.EditorModel.on('change:clipboard', (model, value) => {
    const hasClipboard = value && value.length > 0
    pasteBtn.set('className', pasteBtnClass + (hasClipboard ? '' : disabledClass))
  })
}
