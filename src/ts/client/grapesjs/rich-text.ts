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

import { RichTextEditorAction } from 'grapesjs'

const pluginName = 'richText'

export const orderedList: RichTextEditorAction = {
  name: 'orderedList',
  icon: '1.',
  attributes: { title: 'Ordered List' },
  result: rte => rte.exec('insertOrderedList'),
}

export const unorderedList: RichTextEditorAction = {
  name: 'unorderedList',
  icon: '•',
  //icon: '<i class="fa fa-list-ul"></i>',
  attributes: { title: 'Unordered List' },
  result: rte => rte.exec('insertUnorderedList'),
}

export const richTextPlugin = (editor, opts) => {
  // This doesn't work, it is now added in the editor config
  //editor.RichTextEditor.add('orderedList', orderedList)
  //editor.RichTextEditor.add('unorderedList', unorderedList)
}
