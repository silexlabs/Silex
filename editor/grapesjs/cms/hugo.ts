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

import type { Editor, Page } from 'grapesjs'
import { getPageQuery } from '@silexlabs/grapesjs-data-source'
import { ClientSideFileType, ClientSideFileWithContent, Initiator, PublicationData } from '~/common/types'
import { getPageSlug } from '~/common/page'
import { transformPermalink } from '../../publication-transformers'
import type { Ssg } from './ssg'
import { dataSourceVariable, getGoExpression, goSyntax, stateVariable } from './gotmpl'
import { getHugoFilters } from './hugo-filters'
import { cmsSsg, getEndpoint, getPageData, getPermalinkExpression, isCmsPage } from './cms-page'

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

// Hugo gives a meaning to some layout names, like baseof, list or single
function getLayout(slug: string): string {
  return `silex-${slug}`
}

function getQueryCalls(slug: string, queries: Record<string, string>): string {
  return Object.keys(queries)
    .map(dataSourceId => `{{ ${dataSourceVariable(dataSourceId)} := partial "silex/graphql.html" (dict "endpoint" ${JSON.stringify(getEndpoint(dataSourceId, 'hugo'))} "query" "silex/${slug}-${dataSourceId}.graphql") -}}\n`)
    .join('')
}

// The item of the page is given by the content adapter
function getItemState(page: Page): string {
  return `{{ ${stateVariable(page.getMainComponent(), 'item')} := .Params.item -}}\n`
}

function getContentAdapter(page: Page, slug: string, queries: Record<string, string>): string {
  const body = page.getMainComponent()
  const permalink = getPermalinkExpression(page)
  return `${getQueryCalls(slug, queries)}{{ range $index, $item := ${getGoExpression(body, getPageData(page))} -}}
{{ ${stateVariable(body, 'item')} := $item -}}
{{ $.AddPage (dict "path" (string $index) "url" ${getGoExpression(body, permalink)} "layout" ${JSON.stringify(getLayout(slug))} "params" (dict "item" $item)) -}}
{{ end -}}
`
}

function transformFiles(editor: Editor, data: PublicationData) {
  if (!data.files) throw new Error('No files in publication data')
  const cmsPages = editor.Pages.getAll().filter(page => isCmsPage(page))
  cmsPages.forEach(page => {
    const slug = getPageSlug(page.getName())
    const queries = getPageQuery(page, editor)
    const layout = data.files!.find(file => file.path === `/layouts/${getLayout(slug)}.html`) as ClientSideFileWithContent | undefined
    if (!layout) throw new Error(`No file for page "${page.getName()}"`)
    const isCollection = getPageData(page).length > 0
    layout.content = getQueryCalls(slug, queries) + (isCollection ? getItemState(page) : '') + layout.content
    const url = transformPermalink(editor, `/${slug}.html`, ClientSideFileType.HTML, Initiator.HTML)
    if (isCollection) {
      data.files!.push({
        type: ClientSideFileType.OTHER,
        path: `/content/${slug}/_index.md`,
        content: '---\nbuild:\n  render: never\n  list: never\n---\n',
      } as ClientSideFileWithContent, {
        type: ClientSideFileType.OTHER,
        path: `/content/${slug}/_content.gotmpl`,
        content: getContentAdapter(page, slug, queries),
      } as ClientSideFileWithContent)
    } else {
      data.files!.push({
        type: ClientSideFileType.OTHER,
        // The home page of a Hugo site is content/_index.md, a section with the same URL would be ignored
        path: url === '/' ? '/content/_index.md' : `/content/${slug}/_index.md`,
        content: `---\nurl: ${JSON.stringify(url)}\nlayout: ${JSON.stringify(getLayout(slug))}\n---\n`,
      } as ClientSideFileWithContent)
    }
    data.files!.push(...Object.entries(queries).map(([dataSourceId, query]) => ({
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
  return cmsSsg(editor, {
    ssgId: 'hugo',
    syntax: goSyntax,
    filters: getHugoFilters(editor),
    templatePath: slug => `/layouts/${getLayout(slug)}.html`,
    transformFiles: data => transformFiles(editor, data),
  })
}
