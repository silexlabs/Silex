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

import { Editor, Page } from 'grapesjs'

/** The page an agent names by its id, or the selected one */
export function pageOf(editor: Editor, id?: string): Page {
  if (!id) return editor.Pages.getSelected()!
  const page = editor.Pages.get(id)
  if (!page) throw new Error(`No page "${id}". Pages: ${editor.Pages.getAll().map(p => `${p.id} (${p.getName() || 'home, no name'})`).join(', ')}.`)
  return page
}
