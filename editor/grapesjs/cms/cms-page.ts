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

import type { Component, Editor, Page } from 'grapesjs'
import { Expression, FIXED_TOKEN_ID, Filter, findToken, GraphQLOptions, fixedText, getDataSource, getPageExpressions, getPersistantId, getState, toExpression } from '@silexlabs/grapesjs-data-source'
import { ClientSideFileType, Initiator, PublicationData, SsgId } from '~/common/types'
import { getPageSlug } from '~/common/page'
import { transformPermalink } from '../../publication-transformers'
import { ssgName, type Problem, type Ssg } from './ssg'
import { clearRenderCache, renderComponent, withNotification, type TemplateSyntax } from './render'
import type { Silex11tyPluginWebsiteSettings } from './index'
import { PAGE_DATA_KEY, PAGE_SIZE_KEY, PERMALINK_KEY, SEO_OVERRIDES, applySeoOverrides, getSettingLabel } from './settings-keys'
import { isPageState } from './states'

const SEO_KEYS: string[] = SEO_OVERRIDES.map(({ key }) => key)
const COLLECTION_SETTINGS = [PAGE_DATA_KEY, PERMALINK_KEY]

export function getPageData(page: Page): Expression {
  return toExpression((page.get('settings') as Silex11tyPluginWebsiteSettings | undefined)?.[PAGE_DATA_KEY]) ?? []
}

export function getPermalinkExpression(page: Page): Expression {
  return toExpression((page.get('settings') as Silex11tyPluginWebsiteSettings | undefined)?.[PERMALINK_KEY]) ?? []
}

function getDataSettings(page: Page): string[] {
  const isCollection = getPageData(page).length > 0
  return Object.entries(page.get('settings') ?? {})
    .filter(([key]) => !SEO_KEYS.includes(key) && (!isCollection || !COLLECTION_SETTINGS.includes(key)))
    .filter(([, value]) => !!toExpression(value) && fixedText(toExpression(value)) === null)
    .map(([key]) => key)
}

export function isCmsPage(page: Page): boolean {
  return getPageExpressions(page).length > 0 || getDataSettings(page).length > 0
}

function findPage(editor: Editor, path: string): Page | undefined {
  return editor.Pages.getAll().find(page => `/${getPageSlug(page.getName())}.html` === path)
}

function usesDataWithoutSource(expression: Expression): boolean {
  return !!findToken(expression, (token, index) => index === 0 && token.type === 'property' && token.fieldId !== FIXED_TOKEN_ID && !token.dataSourceId)
}

function usesHiddenBodyState(expression: Expression, page: Page): boolean {
  const body = page.getMainComponent()
  return !!findToken(expression, token => token.type === 'state' && token.componentId === getPersistantId(body) && !isPageState(token.storedStateId) && !!getState(body, token.storedStateId, true)?.hidden)
}

function checkSupported(page: Page, ssgId: SsgId): Problem[] {
  const ssg = ssgName(ssgId)
  const settings = (page.get('settings') ?? {}) as Silex11tyPluginWebsiteSettings
  const name = page.getName()
  const problems: string[] = []
  if (settings.silexLanguagesList?.split(',').some(lang => lang.trim())) problems.push(`Page "${name}" has several languages, which publishing with ${ssg} does not support`)
  if (getPageData(page).length) {
    if (parseInt(settings[PAGE_SIZE_KEY] || '1') > 1) problems.push(`Page "${name}" shows several items per page, which publishing with ${ssg} does not support yet`)
    if (!getPermalinkExpression(page).length) problems.push(`Page "${name}" has Page data but no Permalink. Publishing with ${ssg} needs a Permalink to give each page its address. Set it in the page settings, CMS tab.`)
  }
  problems.push(...getDataSettings(page).map(setting => `Page "${name}" uses data in its setting "${getSettingLabel(setting)}", which publishing with ${ssg} does not support yet`))
  const bodyId = getPersistantId(page.getMainComponent())
  SEO_OVERRIDES.forEach(({ key }) => {
    const expression = toExpression(settings[key]) ?? []
    const where = `its setting "${getSettingLabel(key)}"`
    if (usesDataWithoutSource(expression)) problems.push(`Page "${name}" uses data from no data source in ${where}, which publishing with ${ssg} does not support yet`)
    // The head is rendered before the states of the body are assigned
    const state = findToken(expression, token => token.type === 'state' && !(isPageState(token.storedStateId) && token.componentId === bodyId))
    if (state) problems.push(`Page "${name}" uses "${state.label}" in ${where}, which publishing with ${ssg} does not support yet`)
  })
  return [
    ...problems.map(message => ({ message, componentId: null })),
    ...getPageExpressions(page)
      .filter(({ hidden }) => !hidden)
      .flatMap(({ expression, component }) => [
        ...usesDataWithoutSource(expression) ? [`Page "${name}" uses data from no data source in the element "${component.getName()}", which publishing with ${ssg} does not support yet`] : [],
        ...usesHiddenBodyState(expression, page) ? [`Page "${name}" uses a page setting in the element "${component.getName()}", which publishing with ${ssg} does not support yet`] : [],
      ].map(message => ({ message, componentId: component.getId() }))),
  ]
}

export function getEndpoint(dataSourceId: string, ssgId: SsgId): string {
  const dataSource = getDataSource(dataSourceId)
  if (!dataSource) throw new Error(`No data source for id ${dataSourceId}`)
  const options = (dataSource as GraphQLOptions).serverToServer ?? dataSource
  const headers = Object.keys(options.headers ?? {}).filter(key => key.toLowerCase() !== 'content-type')
  if (headers.length) throw new Error(`The data source "${dataSource.label}" needs headers (${headers.join(', ')}), publishing with ${ssgName(ssgId)} only supports public GraphQL APIs`)
  return options.url
}

interface CmsSsg {
  ssgId: SsgId
  syntax: TemplateSyntax
  filters: Filter[]
  templatePath(slug: string): string
  check?(page: Page): Problem[]
  transformFiles(data: PublicationData): void
  onEnd?(): void
}

// An SSG which builds the pages with data from templates, the other pages are copied as they are
export function cmsSsg(editor: Editor, { ssgId, syntax, filters, templatePath, check, transformFiles, onEnd }: CmsSsg): Ssg {
  return {
    pageStates: ['item'],
    filters,
    check: () => editor.Pages.getAll().filter(page => isCmsPage(page)).flatMap(page => [...checkSupported(page, ssgId), ...check?.(page) ?? []]),
    renderComponent: (component: Component, toHtml: () => string) => withNotification(() => renderComponent(editor, syntax, component, toHtml), editor, component.getId()),
    transformPath: (path, type) => {
      if (type !== ClientSideFileType.HTML) return `/static${path}`
      const page = findPage(editor, path)
      if (page && isCmsPage(page)) return templatePath(getPageSlug(page.getName()))
      const url = transformPermalink(editor, path, ClientSideFileType.HTML, Initiator.HTML)
      return `/static${url.endsWith('/') ? `${url}index.html` : url}`
    },
    onPage: ({ page, pageSettings }) => withNotification(() => applySeoOverrides(syntax, page, pageSettings), editor, null),
    onData: data => withNotification(() => transformFiles(data), editor, null),
    onEnd: () => {
      clearRenderCache()
      onEnd?.()
    },
  }
}
