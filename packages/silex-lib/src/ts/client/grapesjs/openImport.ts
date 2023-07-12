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

/**
 * @fileoverview Import feature
 * Let the user import HTML code when she creates a new page
 *
 */
// from https://github.com/artf/grapesjs-preset-webpage/blob/3e5a9e12998c9a32b6f1199953084163678e6c17/src/commands/openImport.js
export default function openImport(editor, config) {
  const pfx = editor.getConfig('stylePrefix')
  const modal = editor.Modal
  const codeViewer = editor.CodeManager.getViewer('CodeMirror').clone()
  const container = document.createElement('div')
  const importLabel = config.modalImportLabel
  const importCnt = config.modalImportContent
  let viewerEditor = codeViewer.editor

  // Init import button
  const btnImp = document.createElement('button')
  btnImp.type = 'button'
  btnImp.innerHTML = config.modalImportButton
  btnImp.className = `${pfx}btn-prim ${pfx}btn-import`
  btnImp.onclick = e => {
    editor.setComponents(viewerEditor.getValue().trim())
    modal.close()
  }

  // Init code viewer
  codeViewer.set({ ...{
    codeName: 'htmlmixed',
    theme: 'hopscotch',
    readOnly: 0
  }, ...config.importViewerOptions})

  return {
    run(_) {
      if (!viewerEditor) {
        const txtarea = document.createElement('textarea')

        if (importLabel) {
          const labelEl = document.createElement('div')
          labelEl.className = `${pfx}import-label`
          labelEl.innerHTML = importLabel
          container.appendChild(labelEl)
        }

        container.appendChild(txtarea)
        container.appendChild(btnImp)
        codeViewer.init(txtarea)
        viewerEditor = codeViewer.editor
      }

      modal.setTitle(config.modalImportTitle)
      modal.setContent(container)
      const cnt = typeof importCnt === 'function' ? importCnt(editor) : importCnt
      codeViewer.setContent(cnt || '')
      modal.open().getModel()
        .once('change:open', () => editor.stopCommand(this.id))
      viewerEditor.refresh()
    },

    stop() {
      modal.close()
    }
  }
}
