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
import { ensureLeadingAndTrailingSlash } from './permalink'

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

// gqlfreez only fills Mustache tags with fields of the item
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

// The address of each item, in Mustache for gqlfreez, with Eleventy's slashes
function getItemPath(page: Page): string | null {
  const parts = getPathParts(page.getMainComponent(), getPermalinkExpression(page))
  if (!parts) return null
  return ensureLeadingAndTrailingSlash(parts.map(part => 'text' in part ? part.text : `{{item.${part.field.join('.')}}}`).join(''))
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
    const [first, ...fields] = getPageData(page)
    if (first.type !== 'property' || !first.dataSourceId || fields.some(token => token.type !== 'property')) problems.push(`Page "${name}" has Page data made of something else than fields of a data source, which publishing with Zola does not support yet`)
    if (path?.endsWith('.html')) problems.push(`Page "${name}" has a Permalink which ends with .html, publishing with Zola would put each item in a folder of this name. ${toChange}`)
  } else if (getTemplate(slug) !== NOT_FOUND_TEMPLATE && getUrl(editor, slug).endsWith('.html')) {
    problems.push(`Page "${name}" has an address which ends with .html, publishing with Zola would put it in a folder of this name. ${toChange}`)
  }
  return problems.map(message => ({ message, componentId: null }))
}

function getSection(slug: string): string {
  return `content/${slug}`
}

// gqlfreez writes a page in content/ for each item of the list
function getCollection(slug: string, page: Page, list: string[]): string {
  const path = getItemPath(page)!
  return [
    `    ${slug}.graphql:`,
    `      list: ${JSON.stringify(list.join('.'))}`,
    // Relative to the folder of the config, in the folder of the data source
    `      dir: ${JSON.stringify(`${'../'.repeat(DATA_FOLDER.split('/').length + 1)}${getSection(slug)}`)}`,
    '      file: "{{index}}.md"',
    '      frontMatter:',
    `        template: ${JSON.stringify(getTemplate(slug))}`,
    `        path: ${JSON.stringify(path)}`,
    '        extra:',
    '          item: "{{item}}"',
  ].map(line => `${line}\n`).join('')
}

function file(path: string, content: string): ClientSideFileWithContent {
  return { type: ClientSideFileType.OTHER, path, content }
}

function transformFiles(editor: Editor, data: PublicationData) {
  if (!data.files) throw new Error('No files in publication data')
  const dataSourceIds = new Set<string>()
  const collections = new Map<string, string>()
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
      const { dataSourceId, fields } = getList(page)
      collections.set(dataSourceId, (collections.get(dataSourceId) ?? '') + getCollection(slug, page, fields))
      data.files!.push(file(`/${getSection(slug)}/_index.md`, '+++\nrender = false\n+++\n'))
    } else if (getTemplate(slug) !== NOT_FOUND_TEMPLATE) {
      const url = getUrl(editor, slug)
      // The home page of a Zola site is the section content/_index.md
      data.files!.push(url === '/'
        ? file('/content/_index.md', `+++\ntemplate = ${JSON.stringify(getTemplate(slug))}\n+++\n`)
        : file(`/content/${slug}.md`, `+++\ntemplate = ${JSON.stringify(getTemplate(slug))}\npath = ${JSON.stringify(url)}\n+++\n`))
    }
  })
  // Read by gqlfreez, and by the editors of the .graphql files
  dataSourceIds.forEach(dataSourceId => {
    const found = collections.get(dataSourceId)
    const extensions = found ? `extensions:\n  collections:\n${found}` : ''
    data.files!.push(file(`/${DATA_FOLDER}/${dataSourceId}/.graphqlrc.yml`, `schema: ${JSON.stringify(getEndpoint(dataSourceId, 'zola'))}\n${extensions}`))
  })
  // Zola builds nothing without a templates folder, which a website without data has no file for
  if (!data.files.some(({ path }) => path.startsWith('/templates/'))) data.files.push(file('/templates/.gitkeep', ''))
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
