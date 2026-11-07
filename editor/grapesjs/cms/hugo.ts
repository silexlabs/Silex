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
import { Expression, FIXED_TOKEN_ID, GraphQLOptions, fixedText, getDataSource, getPageExpressions, getPageQuery, toExpression } from '@silexlabs/grapesjs-data-source'
import { ClientSideFileType, ClientSideFileWithContent, Initiator, PublicationData } from '~/common/types'
import { getPageSlug } from '~/common/page'
import { transformPermalink } from '../../publication-transformers'
import type { Ssg } from './ssg'
import { clearRenderCache, renderComponent, withNotification } from './render'
import { dataSourceVariable, goSyntax } from './gotmpl'
import type { Silex11tyPluginWebsiteSettings } from './index'
import { EleventyDataSourceId } from './DataSource'

const GRAPHQL_PARTIAL = `{{- $body := dict "query" (resources.Get .query).Content | jsonify }}
{{- $opts := dict "method" "post" "body" $body "headers" (dict "Content-Type" "application/json") }}
{{- $res := dict }}
{{- with try (resources.GetRemote .endpoint $opts) }}
  {{- with .Err }}{{ errorf "Unable to reach the CMS (%s): %s" $.endpoint . }}{{ end }}
  {{- $res = .Value.Content | transform.Unmarshal }}
{{- end }}
{{- with $res.errors }}{{ errorf "GraphQL error (%s): %s" $.endpoint (index . 0).message }}{{ end }}
{{- return $res.data }}
`

function getDataSettings(page: Page): string[] {
  return Object.entries(page.get('settings') ?? {})
    .filter(([, value]) => !!toExpression(value) && fixedText(toExpression(value)) === null)
    .map(([key]) => key)
}

function isCmsPage(page: Page): boolean {
  return getPageExpressions(page).length > 0 || getDataSettings(page).length > 0
}

function findPage(editor: Editor, path: string): Page | undefined {
  return editor.Pages.getAll().find(page => `/${getPageSlug(page.getName())}.html` === path)
}

function usesEleventyData([token]: Expression): boolean {
  return token?.type === 'property' && token.fieldId !== FIXED_TOKEN_ID && (!token.dataSourceId || token.dataSourceId === EleventyDataSourceId)
}

function checkSupported(page: Page) {
  const settings = (page.get('settings') ?? {}) as Silex11tyPluginWebsiteSettings
  if (settings.silexLanguagesList?.split(',').some(lang => lang.trim())) throw new Error(`Page "${page.getName()}" has several languages, which publishing with Hugo does not support`)
  const [setting] = getDataSettings(page)
  if (setting) throw new Error(`Page "${page.getName()}" uses data in its setting "${setting}", which publishing with Hugo does not support yet`)
  const filtered = getPageExpressions(page).find(({ expression }) => expression.some(token => token.type === 'filter'))
  if (filtered) throw new Error(`Page "${page.getName()}" uses a filter in the element "${filtered.component.getName()}", which publishing with Hugo does not support yet`)
  const eleventyData = getPageExpressions(page).find(({ expression }) => usesEleventyData(expression))
  if (eleventyData) throw new Error(`Page "${page.getName()}" uses data given by Eleventy in the element "${eleventyData.component.getName()}", which publishing with Hugo does not support yet`)
}

function getEndpoint(dataSourceId: string): string {
  const dataSource = getDataSource(dataSourceId)
  if (!dataSource) throw new Error(`No data source for id ${dataSourceId}`)
  const options = (dataSource as GraphQLOptions).serverToServer ?? dataSource
  const headers = Object.keys(options.headers ?? {}).filter(key => key.toLowerCase() !== 'content-type')
  if (headers.length) throw new Error(`The data source "${dataSource.label}" needs headers (${headers.join(', ')}), publishing with Hugo only supports public GraphQL APIs`)
  return options.url
}

function getLayout(slug: string, queries: Record<string, string>, html: string): string {
  const calls = Object.keys(queries)
    .map(dataSourceId => `{{ ${dataSourceVariable(dataSourceId)} := partial "silex/graphql.html" (dict "endpoint" ${JSON.stringify(getEndpoint(dataSourceId))} "query" "silex/${slug}-${dataSourceId}.graphql") -}}\n`)
    .join('')
  return calls + html
}

function transformFiles(editor: Editor, data: PublicationData) {
  if (!data.files) throw new Error('No files in publication data')
  const cmsPages = editor.Pages.getAll().filter(page => isCmsPage(page))
  cmsPages.forEach(page => {
    const slug = getPageSlug(page.getName())
    const queries = getPageQuery(page, editor)
    const layout = data.files!.find(file => file.path === `/layouts/${slug}.html`) as ClientSideFileWithContent | undefined
    if (!layout) throw new Error(`No file for page "${page.getName()}"`)
    layout.content = getLayout(slug, queries, layout.content)
    const url = transformPermalink(editor, `/${slug}.html`, ClientSideFileType.HTML, Initiator.HTML)
    data.files!.push({
      type: ClientSideFileType.OTHER,
      // The home page of a Hugo site is content/_index.md, a section with the same URL would be ignored
      path: url === '/' ? '/content/_index.md' : `/content/${slug}/_index.md`,
      content: `---\nurl: ${JSON.stringify(url)}\nlayout: ${JSON.stringify(slug)}\n---\n`,
    } as ClientSideFileWithContent, ...Object.entries(queries).map(([dataSourceId, query]) => ({
      type: ClientSideFileType.OTHER,
      path: `/assets/silex/${slug}-${dataSourceId}.graphql`,
      content: query,
    } as ClientSideFileWithContent)))
  })
  if (cmsPages.length) {
    data.files.push({
      type: ClientSideFileType.OTHER,
      path: '/layouts/_partials/silex/graphql.html',
      content: GRAPHQL_PARTIAL,
    } as ClientSideFileWithContent)
  }
}

export function hugo(editor: Editor): Ssg {
  return {
    onStart: () => withNotification(() => editor.Pages.getAll().filter(page => isCmsPage(page)).forEach(checkSupported), editor, null),
    renderComponent: (component: Component, toHtml: () => string) => withNotification(() => renderComponent(editor, goSyntax, component, toHtml), editor, component.getId()),
    // Hugo copies static/ as is to the root of the website, pages with data become templates
    transformPath: (path, type) => {
      if (type !== ClientSideFileType.HTML) return `/static${path}`
      const page = findPage(editor, path)
      if (page && isCmsPage(page)) return `/layouts/${getPageSlug(page.getName())}.html`
      const url = transformPermalink(editor, path, ClientSideFileType.HTML, Initiator.HTML)
      return `/static${url.endsWith('/') ? `${url}index.html` : url}`
    },
    onData: data => withNotification(() => transformFiles(editor, data), editor, null),
    onEnd: clearRenderCache,
  }
}
