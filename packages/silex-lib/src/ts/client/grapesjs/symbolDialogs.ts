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

export const cmdPromptAddSymbol = 'symbol-prompt-add'

export default (editor, opts) => {
  function getNext(prefix) {
    let idx = 1
    while(editor.Symbols.find(s => s.get('label') === prefix + idx)) {
      idx++
    }
    return prefix + idx
  }
  editor.Commands.add(cmdPromptAddSymbol, {
    run: (_, sender) => {
      const label = prompt('Label', getNext('Symbol '))
      const icon = 'fa-gem'
      editor.runCommand('symbols:add', { label, icon })
    }
  })
}
