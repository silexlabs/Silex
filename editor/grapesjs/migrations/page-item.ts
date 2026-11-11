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
import { Expression, State, StoredState, StoredToken, findToken, getPersistantId, toExpression } from '@silexlabs/grapesjs-data-source'
import { getItemLabel, pageItemState, PageStateId } from '../cms/states'
import { PAGE_DATA_KEY } from '../cms/settings-keys'
import { t } from '../../i18n'

const PAGINATION_ITEMS: PageStateId = 'items'

// Label of the Page item of each page, by the id of its body
type Labels = Map<string | null, string>

function isPaginationItems(token: StoredToken | undefined, labels: Labels): token is State {
  return token?.type === 'state' && token.storedStateId === PAGINATION_ITEMS && token.exposed && labels.has(token.componentId)
}

// The options of the filters are expressions too, stored as JSON
function upgradeExpression(expression: Expression, labels: Labels, onReplace: () => void): Expression {
  const [items, first, ...rest] = expression
  const isItemsFirst = isPaginationItems(items, labels) && first?.type === 'filter' && first.id === 'first'
  if (isItemsFirst) onReplace()
  const tokens = isItemsFirst ? [pageItemState(items.componentId, labels.get(items.componentId)!), ...rest] : expression
  return tokens.map(token => token.type === 'filter' && token.options
    ? { ...token, options: Object.fromEntries(Object.entries(token.options).map(([key, value]) => [key, upgradeJson(value, labels, onReplace)])) }
    : token)
}

function upgradeJson(value: unknown, labels: Labels, onReplace: () => void): unknown {
  const expression = typeof value === 'string' ? toExpression(value) : null
  return expression ? JSON.stringify(upgradeExpression(expression, labels, onReplace)) : value
}

// In Eleventy, Page item is pagination.items[0] and Pagination items is pagination.items, whatever the page size
// The models are changed in place: loadProjectData fails on some projects with symbols (GrapesJS 0.23)
export function upgradeToPageItem({ editor }: { editor: Editor }): string {
  const pages = editor.Pages.getAll()
  const labels: Labels = new Map(pages.map(page => [
    getPersistantId(page.getMainComponent()),
    getItemLabel(toExpression((page.get('settings') as Record<string, unknown> | undefined)?.[PAGE_DATA_KEY]) ?? []),
  ]))
  let count = 0
  const onReplace = () => count++
  const usesPaginationItems = (value: unknown) => !!findToken(value, token => isPaginationItems(token, labels))
  editor.UndoManager.skip(() => {
    pages.forEach(page => {
      const settings = page.get('settings') as Record<string, unknown> | undefined
      if (settings && usesPaginationItems(settings)) {
        page.set('settings', Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, upgradeJson(value, labels, onReplace)])))
      }
    })
    ;[...pages.map(page => page.getMainComponent()), ...editor.Components.getSymbols()]
      .forEach(root => root.onAll(component => ['privateStates', 'publicStates'].forEach(key => {
        const states = component.get(key) as StoredState[] | undefined
        if (states && usesPaginationItems(states)) {
          component.set(key, states.map(state => ({ ...state, expression: upgradeExpression(state.expression, labels, onReplace) })))
        }
      })))
  })
  return count ? t(editor, '"Pagination items | first" replaced with "Page item" in {count} expressions', { count }) : ''
}
