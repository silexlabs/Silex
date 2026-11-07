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

import type { Component, Editor, Page } from 'grapesjs'
import { DataSourceId, Expression, Filter, IDataSource, StoredToken, addDataSource, getAllDataSources, getFilters, getPageExpressions, getPersistantId, removeDataSource, setFilters, toExpression } from '@silexlabs/grapesjs-data-source'
import type { ClientConfig } from '../../config'
import { ClientEvent } from '../../events'
import { ClientSideFileType, type PublicationData, type SsgId, type WebsiteSettings } from '~/common/types'
import { setSettingsOf } from '../settings'
import { linkToPermalink } from './permalink'
import { withNotification } from './render'
import { PAGE_ITEM_LABEL, PAGE_STATE_IDS, type PageStateId } from './states'

// What a static site generator needs, the rest of the CMS is the same for all of them
export interface Ssg {
  pageStates: readonly PageStateId[]
  // Replace the filters of the editor
  filters?: Filter[]
  // Removed from the editor with another SSG
  dataSources?: IDataSource[]
  onStart?(): void
  renderComponent?(component: Component, toHtml: () => string): string | undefined
  transformPath?(path: string, type: ClientSideFileType): string | undefined
  onPage?(data: { page: Page, siteSettings: WebsiteSettings, pageSettings: WebsiteSettings }): void
  onData?(data: PublicationData): void
  onEnd?(): void
}

interface Available {
  filterIds: string[]
  dataSourceIds: DataSourceId[]
  pageStates: readonly PageStateId[]
  bodyId: string | null
}

function findUnavailable(expression: Expression, available: Available): StoredToken | undefined {
  const { filterIds, dataSourceIds, pageStates, bodyId } = available
  for (const token of expression) {
    if (token.type === 'property' && token.dataSourceId && !dataSourceIds.includes(token.dataSourceId)) return token
    if (token.type === 'state' && token.componentId === bodyId && isPageState(token.storedStateId) && !pageStates.includes(token.storedStateId)) return token
    if (token.type !== 'filter') continue
    if (!filterIds.includes(token.id)) return token
    const nested = Object.values(token.options ?? {}).map(option => findUnavailable(toExpression(option) ?? [], available)).find(Boolean)
    if (nested) return nested
  }
}

function getCheckedExpressions(page: Page): { expression: Expression, where: string }[] {
  const settings = Object.entries(page.get('settings') ?? {})
    .map(([key, value]) => ({ expression: toExpression(value) ?? [], where: `its setting "${key}"` }))
  const elements = getPageExpressions(page)
    // Hidden states are copies of the page settings
    .filter(({ hidden }) => !hidden)
    .map(({ expression, component }) => ({ expression, where: `the element "${component.getName()}"` }))
  return [...settings, ...elements]
}

function isPageState(stateId: string): stateId is PageStateId {
  return (PAGE_STATE_IDS as readonly string[]).includes(stateId)
}

function checkAvailable(editor: Editor, ssgId: SsgId, pageStates: readonly PageStateId[]) {
  const filterIds = getFilters().map(({ id }) => id)
  const dataSourceIds = getAllDataSources().map(({ id }) => id)
  for (const page of editor.Pages.getAll()) {
    const available = { filterIds, dataSourceIds, pageStates, bodyId: getPersistantId(page.getMainComponent()) }
    for (const { expression, where } of getCheckedExpressions(page)) {
      const token = findUnavailable(expression, available)
      const hint = token?.type === 'state' && pageStates.includes('item') ? `, use "${PAGE_ITEM_LABEL}" instead` : ''
      if (token) throw new Error(`Page "${page.getName()}" uses "${token.label || ('id' in token ? token.id : '') || ('fieldId' in token ? token.fieldId : '')}" in ${where}, which is not available with ${ssgId}${hint}`)
    }
  }
}

export function getSsgId(editor: Editor, config: ClientConfig): SsgId {
  return (editor.getModel().get('settings') as WebsiteSettings | undefined)?.ssg ?? config.ssg
}

export default function (editor: Editor, config: ClientConfig, ssgs: Record<SsgId, Ssg>) {
  // Kept after the publication: a second click on publish ends with an error while the first one still renders
  let ssg: Ssg | undefined
  let unsaved: SsgId | null = null
  let editorFilters: Filter[] | null = null

  editor.on(`${ClientEvent.SETTINGS_SAVE_END} storage:end:load`, () => {
    const ssgId = getSsgId(editor, config)
    const own = ssgs[ssgId].dataSources ?? []
    const others = Object.values(ssgs).flatMap(({ dataSources }) => dataSources ?? []).filter(dataSource => !own.includes(dataSource))
    others.filter(dataSource => getAllDataSources().includes(dataSource)).forEach(removeDataSource)
    own.filter(dataSource => !getAllDataSources().includes(dataSource)).forEach(dataSource => addDataSource(dataSource))
    const filters = ssgs[ssgId].filters
    if (filters) {
      editorFilters ??= getFilters()
      setFilters(filters)
    } else if (editorFilters) {
      setFilters(editorFilters)
      editorFilters = null
    }
  })

  editor.on(ClientEvent.PUBLISH_START, ({ siteSettings }: { siteSettings: WebsiteSettings }) => {
    const ssgId = siteSettings.ssg ?? config.ssg
    ssg = ssgs[ssgId]
    withNotification(() => checkAvailable(editor, ssgId, ssgs[ssgId].pageStates), editor, null)
    ssg.onStart?.()
    if (!siteSettings.ssg) {
      siteSettings.ssg = ssgId
      unsaved = ssgId
    }
  })
  config.addPublicationTransformers({
    renderComponent: (component: Component, toHtml: () => string) => ssg?.renderComponent?.(component, toHtml),
    transformPath: (path: string, type: ClientSideFileType) => ssg?.transformPath?.(path, type) ?? path,
    transformPermalink: (link: string, type: ClientSideFileType) => type === ClientSideFileType.HTML ? linkToPermalink(editor, link) : link,
  })
  editor.on(ClientEvent.PUBLISH_PAGE, data => ssg?.onPage?.(data))
  editor.on(ClientEvent.PUBLISH_DATA, ({ data }: { data: PublicationData }) => ssg?.onData?.(data))
  editor.on(ClientEvent.PUBLISH_END, ({ success }: { success: boolean }) => {
    ssg?.onEnd?.()
    // The website keeps the SSG its repository and CI were made for, whatever the default becomes
    if (success && unsaved) setSettingsOf(editor, editor.getModel(), { ssg: unsaved })
    unsaved = null
  })
}
