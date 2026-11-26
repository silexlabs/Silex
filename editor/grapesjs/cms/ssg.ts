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

import type { Block, Component, Editor, Page } from 'grapesjs'
import { html, render } from 'lit-html'
import { DataSourceId, Expression, Filter, IDataSource, StoredToken, addDataSource, getAllDataSources, NOTIFICATION_GROUP, getFilters, findToken, getPageExpressions, getPersistantId, removeDataSource, setFilters, toExpression } from '@silexlabs/grapesjs-data-source'
import type { ClientConfig } from '../../config'
import { ClientEvent } from '../../events'
import { ClientSideFileType, type PublicationData, type SsgId, type WebsiteSettings } from '~/common/types'
import { linkToPermalink } from '~/editor/grapesjs/permalink'
import { PAGE_ITEM_LABEL, isPageState, type PageStateId } from './states'
import { getSettingLabel } from './settings-keys'
import { openCmsSettingsDialog } from './index'

const MISSING_FILTERS_GROUP = 'Filters missing in the generator'

export interface Problem {
  message: string
  componentId: string | null
}

// What a static site generator needs, the rest of the CMS is the same for all of them
export interface Ssg {
  pageStates: readonly PageStateId[]
  // What this SSG can not publish, checked before the publication starts
  check?(): Problem[]
  // Replace the filters of the editor
  filters?: Filter[]
  // Removed from the editor with another SSG
  dataSources?: IDataSource[]
  blocks?: string[]
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

function isMissingFilter(token: StoredToken, filterIds: string[]): token is Extract<StoredToken, { type: 'filter' }> {
  return token.type === 'filter' && !filterIds.includes(token.id)
}

function findUnavailable(expression: Expression, { filterIds, dataSourceIds, pageStates, bodyId }: Available): StoredToken | undefined {
  return findToken(expression, token =>
    (token.type === 'property' && !!token.dataSourceId && !dataSourceIds.includes(token.dataSourceId))
    || (token.type === 'state' && token.componentId === bodyId && isPageState(token.storedStateId) && !pageStates.includes(token.storedStateId))
    || isMissingFilter(token, filterIds))
}

function getCheckedExpressions(page: Page): { expression: Expression, where: string, componentId: string | null }[] {
  const settings = Object.entries(page.get('settings') ?? {})
    .map(([key, value]) => ({ expression: toExpression(value) ?? [], where: `its setting "${getSettingLabel(key)}"`, componentId: null }))
  const elements = getPageExpressions(page)
    // Hidden states are copies of the page settings
    .filter(({ hidden }) => !hidden)
    .map(({ expression, component }) => ({ expression, where: `the element "${component.getName()}"`, componentId: component.getId() }))
  return [...settings, ...elements]
}

function checkAvailable(editor: Editor, ssgId: SsgId, pageStates: readonly PageStateId[]): Problem[] {
  const filterIds = getFilters().map(({ id }) => id)
  const dataSourceIds = getAllDataSources().map(({ id }) => id)
  return editor.Pages.getAll().flatMap(page => {
    const available = { filterIds, dataSourceIds, pageStates, bodyId: getPersistantId(page.getMainComponent()) }
    return getCheckedExpressions(page).flatMap(({ expression, where, componentId }) => {
      const token = findUnavailable(expression, available)
      if (!token) return []
      const hint = token.type === 'state' && pageStates.includes('item') ? `, use "${PAGE_ITEM_LABEL}" instead` : ''
      return [{ message: `Page "${page.getName()}" uses "${token.label || ('id' in token ? token.id : '') || ('fieldId' in token ? token.fieldId : '')}" in ${where}, which is not available with ${ssgId}${hint}`, componentId }]
    })
  })
}

function findMissingFilters(editor: Editor): (Problem & { filter: string })[] {
  const filterIds = getFilters().map(({ id }) => id)
  return editor.Pages.getAll().flatMap(page => getCheckedExpressions(page).flatMap(({ expression, where, componentId }) => {
    const filters: string[] = []
    findToken(expression, token => {
      if (isMissingFilter(token, filterIds)) filters.push(token.label || token.id)
      return false
    })
    return filters.map(filter => ({ filter, message: `Page "${page.getName()}" uses the filter "${filter}" in ${where}`, componentId }))
  }))
}

function openMissingFiltersDialog(editor: Editor, ssgId: SsgId, filters: string[]) {
  const content = document.createElement('div')
  render(html`
    <p>This website uses filters that ${ssgName(ssgId)} does not have: ${filters.join(', ')}. The notifications list the elements which use them.</p>
    <p>To keep these filters, choose Eleventy in the site settings.</p>
  `, content)
  openCmsSettingsDialog(editor, `Filters missing in ${ssgName(ssgId)}`, content)
}

// Notifications are rendered as HTML, and these names come from the website
function escapeHtml(text: string): string {
  const element = document.createElement('div')
  element.textContent = text
  return element.innerHTML
}

// A block that only other SSGs declare can not be published with this one
function checkBlocks(editor: Editor, ssgId: SsgId, ssgs: Record<SsgId, Ssg>, blockLabel: (id: string) => string): Problem[] {
  const own = ssgs[ssgId].blocks ?? []
  const others = Object.values(ssgs).flatMap(({ blocks }) => blocks ?? []).filter(id => !own.includes(id))
  return editor.Pages.getAll().flatMap(page => others.flatMap(id => page.getMainComponent().findType(id).map(component => ({
    message: `Page "${page.getName()}" uses the block "${blockLabel(id)}" in the element "${component.getName()}", which publishing with ${ssgName(ssgId)} does not support`,
    componentId: component.getId(),
  }))))
}

export function ssgName(ssgId: SsgId): string {
  return ssgId.charAt(0).toUpperCase() + ssgId.slice(1)
}

function report(editor: Editor, ssgId: SsgId, found: Problem[]) {
  const problems = found.filter((problem, index) => found.findIndex(({ message }) => message === problem.message) === index)
  // The id replaces the notification of the previous publication
  problems.forEach(({ message, componentId }) => editor.runCommand('notifications:add', { type: 'error', message, group: NOTIFICATION_GROUP, componentId, id: message }))
  if (problems.length === 1) throw new Error(problems[0].message)
  if (problems.length > 1) throw new Error(`${problems.length} problems prevent publishing with ${ssgId}, see the notifications`)
}

export function getSsgId(editor: Editor, config: ClientConfig): SsgId {
  return (editor.getModel().get('settings') as WebsiteSettings | undefined)?.ssg ?? config.ssg
}

export default function (editor: Editor, config: ClientConfig, ssgs: Record<SsgId, Ssg>) {
  // Kept after the publication: a second click on publish ends with an error while the first one still renders
  let ssg: Ssg | undefined
  let editorFilters: Filter[] | null = null
  // Kept to put them back when the SSG changes again
  const ssgBlocks = new Map<string, Block>()

  editor.on(`${ClientEvent.SETTINGS_SAVE_END} storage:end:load`, () => {
    const ssgId = getSsgId(editor, config)
    const own = ssgs[ssgId].dataSources ?? []
    const others = Object.values(ssgs).flatMap(({ dataSources }) => dataSources ?? []).filter(dataSource => !own.includes(dataSource))
    others.filter(dataSource => getAllDataSources().includes(dataSource)).forEach(removeDataSource)
    own.filter(dataSource => !getAllDataSources().includes(dataSource)).forEach(dataSource => addDataSource(dataSource))
    const ownBlocks = ssgs[ssgId].blocks ?? []
    Object.values(ssgs).flatMap(({ blocks }) => blocks ?? []).forEach(id => {
      const block = editor.Blocks.get(id) ?? ssgBlocks.get(id)
      if (!block) return
      ssgBlocks.set(id, block)
      if (!ownBlocks.includes(id)) editor.Blocks.remove(id)
      else if (!editor.Blocks.get(id)) editor.Blocks.getAll().add(block)
    })
    // The block manager view does not remove a category left empty
    editor.Blocks.render()
    const filters = ssgs[ssgId].filters
    if (filters) {
      editorFilters ??= getFilters()
      setFilters(filters)
    } else if (editorFilters) {
      setFilters(editorFilters)
      editorFilters = null
    }
  })

  // notifications:remove needs the instances, which notifications:list does not give
  const warnings: unknown[] = []
  editor.on('notifications:added', (notification: { group: string | null }) => {
    if (notification.group === MISSING_FILTERS_GROUP) warnings.push(notification)
  })
  function warnMissingFilters(): string[] {
    warnings.splice(0).forEach(notification => editor.runCommand('notifications:remove', { notification }))
    if ((editor.getModel().get('settings') as WebsiteSettings | undefined)?.ssg || !ssgs[config.ssg].filters) return []
    const missing = findMissingFilters(editor)
    missing.forEach(({ message, componentId }) => editor.runCommand('notifications:add', { type: 'warning', message: escapeHtml(message), group: MISSING_FILTERS_GROUP, componentId, id: `${message}:${componentId}` }))
    return [...new Set(missing.map(({ filter }) => filter))]
  }
  editor.on(ClientEvent.SETTINGS_SAVE_END, warnMissingFilters)
  config.on(ClientEvent.STARTUP_END, () => {
    const filters = warnMissingFilters()
    if (filters.length) openMissingFiltersDialog(editor, getSsgId(editor, config), filters)
  })

  editor.on(ClientEvent.PUBLISH_START, ({ siteSettings }: { siteSettings: WebsiteSettings }) => {
    const ssgId = getSsgId(editor, config)
    ssg = ssgs[ssgId]
    report(editor, ssgId, [...checkAvailable(editor, ssgId, ssg.pageStates), ...checkBlocks(editor, ssgId, ssgs, id => (editor.Blocks.get(id) ?? ssgBlocks.get(id))?.getLabel() ?? id), ...(ssg.check?.() ?? [])])
    siteSettings.ssg = ssgId
  })
  config.addPublicationTransformers({
    renderComponent: (component: Component, toHtml: () => string) => ssg?.renderComponent?.(component, toHtml),
    transformPath: (path: string, type: ClientSideFileType) => ssg?.transformPath?.(path, type) ?? path,
    transformPermalink: (link: string, type: ClientSideFileType) => type === ClientSideFileType.HTML ? linkToPermalink(editor, link) : link,
  })
  editor.on(ClientEvent.PUBLISH_PAGE, data => ssg?.onPage?.(data))
  editor.on(ClientEvent.PUBLISH_DATA, ({ data }: { data: PublicationData }) => ssg?.onData?.(data))
  editor.on(ClientEvent.PUBLISH_END, () => ssg?.onEnd?.())
}
