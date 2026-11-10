/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
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

export const cmdPromptAddSymbol = 'symbol-prompt-add'

export default (editor: Editor) => {
  function getNext(prefix: string) {
    let idx = 1
    while(
      editor.Components.getSymbols()
        .find((symbol: Component) => symbol.get('custom-name') === prefix + idx)
    ) {
      idx++
    }
    return prefix + idx
  }
  // The body (wrapper) is selected when clicking an empty canvas, it can not be a symbol
  function hasValidSelection() {
    const selected = editor.getSelected()
    return !!selected && selected !== editor.getWrapper()
  }
  function updateCreateButton() {
    const hasSelection = hasValidSelection()
    document.querySelectorAll<HTMLElement>('.symbol-create-button').forEach(button => {
      button.classList.toggle('project-bar__panel-header-button--disabled', !hasSelection)
      button.setAttribute('aria-disabled', String(!hasSelection))
      button.setAttribute('title', hasSelection ? 'Create a symbol' : 'Select an element to create a symbol')
    })
  }
  editor.on('load component:toggled', updateCreateButton)
  // Deleting a component or a symbol, or switching page, can clear the selection
  // without a component:toggled event, wait for GrapesJS to update the selection
  editor.on('component:remove page:select', () => setTimeout(updateCreateButton))
  editor.Commands.add(cmdPromptAddSymbol, {
    run: (_) => {
      if (!hasValidSelection()) {
        return
      }
      if (editor.getSelectedAll().length > 1) {
        alert('Select only one element to create a symbol.')
        return
      }
      const label = prompt('Label', getNext('Symbol '))?.trim()
      if (!label) {
        return
      }
      editor.runCommand('symbols:add', { label })
    }
  })
}
