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
import { Expression, FIXED_TOKEN_ID, getPageQuery, getPersistantId, toExpression } from '@silexlabs/grapesjs-data-source'
import { ClientSideFileType, ClientSideFileWithContent, Initiator, PublicationData } from '~/common/types'
import { getPageSlug, getPageUrl } from '~/common/page'
import { transformPermalink } from '../../publication-transformers'
import type { Problem, Ssg } from './ssg'
import { dataSourceVariable, resetTeraVariables, stateVariable, teraString, teraSyntax } from './tera'
import { getTeraFilters } from './tera-filters'
import { cmsSsg, getEndpoint, getPageData, getPermalinkExpression, isCmsPage } from './cms-page'

// Frozen by gqlfreez before the build, next to the queries
const DATA_FOLDER = 'data/silex'
// Zola renders its error page from this template, a page in content/ would go to 404.html/index.html
const NOT_FOUND_TEMPLATE = '404.html'

type PathPart = { text: string } | { field: string[] }

function getTemplate(slug: string): string {
  return getPageUrl(slug) === '/404.html' ? NOT_FOUND_TEMPLATE : `silex-${slug}.html`
}

function getDataFile(slug: string, dataSourceId: string): string {
  return `${DATA_FOLDER}/${dataSourceId}/${slug}`
}

// The split script computes the address of each item, it knows fixed texts and fields of the item
function getPathParts(body: Component, expression: Expression): PathPart[] | null {
  let parts: PathPart[] = []
  let field: string[] | null = null
  for (const [index, token] of expression.entries()) {
    if (token.type === 'property' && token.fieldId === FIXED_TOKEN_ID) {
      parts = [{ text: `${token.options?.value ?? ''}` }]
    } else if (token.type === 'state' && index === 0 && token.componentId === getPersistantId(body) && token.storedStateId === 'item') {
      field = []
      parts = [{ field }]
    } else if (token.type === 'property' && field) {
      field.push(token.fieldId)
    } else if (token.type === 'filter' && (token.id === 'append' || token.id === 'prepend')) {
      const option = getPathParts(body, toExpression(token.options?.value) ?? [])
      if (!option) return null
      parts = token.id === 'append' ? [...parts, ...option] : [...option, ...parts]
      field = null
    } else {
      return null
    }
  }
  return parts
}

function textOf(part: PathPart | undefined): string | null {
  return part && 'text' in part ? part.text : null
}

// Like Eleventy, Silex adds a slash at each end of the address of an item
function getItemPath(page: Page): PathPart[] | null {
  const parts = getPathParts(page.getMainComponent(), getPermalinkExpression(page))
  if (!parts) return null
  const first = textOf(parts[0])
  const last = textOf(parts.at(-1))
  return [
    ...first?.startsWith('/') ? [] : [{ text: '/' }],
    ...parts,
    ...last?.endsWith('/') || last?.endsWith('.html') ? [] : [{ text: '/' }],
  ]
}

function getList(page: Page): { dataSourceId: string, fields: string[] } {
  const pageData = getPageData(page)
  const [first] = pageData
  return {
    dataSourceId: first?.type === 'property' ? first.dataSourceId as string : '',
    fields: pageData.map(token => token.type === 'property' ? token.fieldId : ''),
  }
}

function getUrl(editor: Editor, slug: string): string {
  return transformPermalink(editor, `/${slug}.html`, ClientSideFileType.HTML, Initiator.HTML)
}

function check(editor: Editor, page: Page): Problem[] {
  const name = page.getName()
  const slug = getPageSlug(name)
  const toChange = 'Change its address in the page settings, CMS tab, so that it does not end with .html.'
  const problems: string[] = []
  if (getPageData(page).length) {
    const path = getItemPath(page)
    if (getPermalinkExpression(page).length && !path) problems.push(`Page "${name}" has a Permalink made of something else than fixed texts and fields of the Page item, which publishing with Zola does not support yet`)
    if (textOf(path?.at(-1))?.endsWith('.html')) problems.push(`Page "${name}" has a Permalink which ends with .html, publishing with Zola would put each item in a folder of this name. ${toChange}`)
  } else if (getTemplate(slug) !== NOT_FOUND_TEMPLATE && getUrl(editor, slug).endsWith('.html')) {
    problems.push(`Page "${name}" has an address which ends with .html, publishing with Zola would put it in a folder of this name. ${toChange}`)
  }
  return problems.map(message => ({ message, componentId: null }))
}

function file(path: string, content: string): ClientSideFileWithContent {
  return { type: ClientSideFileType.OTHER, path, content }
}

function transformFiles(editor: Editor, data: PublicationData) {
  if (!data.files) throw new Error('No files in publication data')
  const dataSourceIds = new Set<string>()
  editor.Pages.getAll().filter(page => isCmsPage(page)).forEach(page => {
    const slug = getPageSlug(page.getName())
    const queries = getPageQuery(page, editor)
    const template = data.files!.find(({ path }) => path === `/templates/${getTemplate(slug)}`) as ClientSideFileWithContent | undefined
    if (!template) throw new Error(`No file for page "${page.getName()}"`)
    const isCollection = getPageData(page).length > 0
    const loads = Object.keys(queries)
      .map(dataSourceId => `{% set ${dataSourceVariable(dataSourceId)} = load_data(path=${teraString(`${getDataFile(slug, dataSourceId)}.json`)}) %}\n`)
      .join('')
    const item = isCollection ? `{% set ${stateVariable(page.getMainComponent(), 'item')} = page.extra.item %}\n` : ''
    template.content = loads + item + template.content
    Object.entries(queries).forEach(([dataSourceId, query]) => {
      dataSourceIds.add(dataSourceId)
      data.files!.push(file(`/${getDataFile(slug, dataSourceId)}.graphql`, query))
    })
    if (isCollection) {
      const list = getList(page)
      data.files!.push(
        file(`/content/${slug}/_index.md`, '+++\nrender = false\n+++\n'),
        file(`/${DATA_FOLDER}/${slug}.split.json`, JSON.stringify({
          data: `${getDataFile(slug, list.dataSourceId)}.json`,
          list: list.fields,
          path: getItemPath(page),
          template: getTemplate(slug),
          folder: `content/${slug}`,
        }, null, 2)),
      )
    } else if (getTemplate(slug) !== NOT_FOUND_TEMPLATE) {
      const url = getUrl(editor, slug)
      // The home page of a Zola site is the section content/_index.md
      data.files!.push(url === '/'
        ? file('/content/_index.md', `+++\ntemplate = ${JSON.stringify(getTemplate(slug))}\n+++\n`)
        : file(`/content/${slug}.md`, `+++\ntemplate = ${JSON.stringify(getTemplate(slug))}\npath = ${JSON.stringify(url)}\n+++\n`))
    }
  })
  // Read by gqlfreez, and by the editors of the .graphql files
  dataSourceIds.forEach(dataSourceId => data.files!.push(file(`/${DATA_FOLDER}/${dataSourceId}/.graphqlrc.yml`, `schema: ${JSON.stringify(getEndpoint(dataSourceId, 'zola'))}\n`)))
}

export function zola(editor: Editor): Ssg {
  return cmsSsg(editor, {
    ssgId: 'zola',
    syntax: teraSyntax,
    filters: getTeraFilters(),
    templatePath: slug => `/templates/${getTemplate(slug)}`,
    check: page => check(editor, page),
    transformFiles: data => transformFiles(editor, data),
    onEnd: resetTeraVariables,
  })
}
