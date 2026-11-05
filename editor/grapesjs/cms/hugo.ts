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

import type { Editor, Page } from 'grapesjs'
import { fixedText, getPageExpressions, toExpression } from '@silexlabs/grapesjs-data-source'
import { ClientSideFileType, Initiator } from '~/common/types'
import { transformPermalink } from '../../publication-transformers'
import type { PublicationTarget } from './targets'

function usesData(page: Page): boolean {
  return getPageExpressions(page).length > 0 || Object.values(page.get('settings') ?? {})
    .some(value => fixedText(toExpression(value)) === null && !!toExpression(value))
}

export function hugo(editor: Editor): PublicationTarget {
  return {
    // Hugo copies static/ as is to the root of the website
    transformPath: (path, type) => {
      if (type !== ClientSideFileType.HTML) return `/static${path}`
      const url = transformPermalink(editor, path, ClientSideFileType.HTML, Initiator.HTML)
      return `/static${url.endsWith('/') ? `${url}index.html` : url}`
    },
    onData: () => {
      const page = editor.Pages.getAll().find(usesData)
      if (page) throw new Error(`Page "${page.getName()}" uses a data source, which publishing with Hugo does not support yet`)
    },
  }
}
