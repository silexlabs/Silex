import dedent from 'dedent'
import { Component, Page, Editor } from 'grapesjs'
import { Filter, GraphQLOptions, IDataSource, Property, State, Token, getDataSource, getPageQuery, getPersistantId, getState, getStateVariableName, toExpression } from '@silexlabs/grapesjs-data-source'
import { assignBlock, echoBlock, echoBlock1line, getPaginationData, ifBlock, loopBlock } from './liquid'
import { EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { getPageSlug, getPageUrl } from '~/common/page'
import type { Ssg } from './ssg'
import { clearRenderCache, renderComponent, withNotification, type TemplateSyntax } from './render'
import { ensureLeadingAndTrailingSlash } from './permalink'
import { WebsiteSettings, ClientSideFileType, ClientSideFileWithContent, PublicationData  } from '~/common/types'

function getFetchPluginOptions(options: EleventyPluginOptions, settings: Silex11tyPluginWebsiteSettings): object | false {
  if(typeof options.fetchPluginSettings !== 'undefined') {
    return options.fetchPluginSettings
  }
  return settings.eleventyFetch ? { duration: '1s' } : false
}

const liquidSyntax: TemplateSyntax = {
  echo: echoBlock,
  assign: assignBlock,
  loop: loopBlock,
  if: ifBlock,
}

export function eleventy(editor: Editor, options: EleventyPluginOptions): Ssg {
  return {
    renderComponent: (component: Component, toHtml: () => string) => withNotification(() => renderComponent(editor, liquidSyntax, component, toHtml), editor, component.getId()),
    onPage: data => withNotification(() => transformPage(editor, data), editor, null),
    // Generate 11ty data files
    onData: data => withNotification(() => transformFiles(editor, options, data), editor, null),
    onEnd: clearRenderCache,
  }
}

export function getPermalink(page: Page, permalink: Token[], isCollectionPage: boolean, slug: string): string | null {
  // User provided a permalink explicitely
  if (permalink && permalink.length > 0) {
    const body = page.getMainComponent() as Component
    const transformedTokens = permalink.map(token => {
      // Replace states which will be one from ./states.ts
      // For permalink, we need to use the actual 11ty variable names, not state references
      if(token.type === 'state') {
        // Map known 11ty pagination states to their variable names
        const stateToFieldId: Record<string, string> = {
          'pagination': 'pagination',
          'items': 'pagination.items',
          'pages': 'pagination.pages',
        }
        const fieldId = stateToFieldId[token.storedStateId]
        if (fieldId) {
          // Create a clean Property token for known 11ty pagination states
          return {
            type: 'property',
            propType: 'field',
            fieldId,
            label: token.storedStateId,
            dataSourceId: undefined, // No data source, this is an 11ty variable
            typeIds: [],
            kind: 'object',
            options: {},
          } as Property
        }
        // For other states, use the existing logic
        const state = getState(body, token.storedStateId, true)
        if(!state) throw new Error('State not found on body')
        return {
          ...state.expression[0],
          dataSourceId: undefined,
          fieldId: token.label,
        } as Property
      }
      return token
    })
    return ensureLeadingAndTrailingSlash(echoBlock1line(body, transformedTokens))
  } else if (isCollectionPage) {
    // Let 11ty handle the permalink
    return null
  }
  switch (slug) {
  case 'index': return '/index.html'
  case '404': return getPageUrl(slug)
  default: return `/${slug}/index.html`
  }
}

/**
 * Get the front matter for a given page
 */
export function getFrontMatter(page: Page, settings: Silex11tyPluginWebsiteSettings, slug: string, collection: string, lang = ''): string {
  const data = (function() {
    if(!settings.eleventyPageData) return undefined
    const expression = toExpression(settings.eleventyPageData)
    if(expression) {
      if(expression.filter(token => token.type !== 'property').length > 0) {
        console.warn('Expression for pagination data has to contain only properties', expression.map(token => token.type))
      }
      return getPaginationData(expression as Property[])
    } else {
      // Probably not JSON (backward compat)
      return settings.eleventyPageData
    }
  })()

  const isCollectionPage = !!data && data.length > 0
  const permalinkExpression = toExpression(settings.eleventyPermalink)
  // Here permalinkExpression contains filters and properties. It contains 11ty data source states too
  const permalink = getPermalink(page, permalinkExpression as (Property | Filter)[], isCollectionPage, slug)
    // Escape quotes in permalink
    // because it is in double quotes in the front matter
    ?.replace(/"/g, '\\"')

  return dedent`---
    ${data && data.length > 0 ? `pagination:
      addAllPagesToCollections: true
      data: ${data}
      size: ${settings.eleventyPageSize ? settings.eleventyPageSize : '1'}
    ` : ''}
    ${permalink ? `permalink: "${permalink}"` : ''}
    ${lang ? `lang: "${lang}"` : ''}
    ${collection ? `collection: "${collection}"` : ''}
    ${settings?.eleventyNavigationKey ? `eleventyNavigation:
      key: ${settings.eleventyNavigationKey}
      ${settings.eleventyNavigationTitle ? `title: ${settings.eleventyNavigationTitle}` : ''}
      ${settings.eleventyNavigationOrder ? `order: ${settings.eleventyNavigationOrder}` : ''}
      ${settings.eleventyNavigationParent ? `parent: ${settings.eleventyNavigationParent}` : ''}
      ${settings.eleventyNavigationUrl ? `url: ${settings.eleventyNavigationUrl}` : ''}
    ` : ''}
  `
    // Prettify
    .split('\n')
    .filter(line => line.trim().length > 0)
    .concat(['', '---', ''])
    .join('\n')
}

/**
 * Get the body states for a given page
 */
export function getBodyStates(page: Page): string {
  // Render the body states
  const body = page.getMainComponent() as Component
  const pagination = getState(body, 'pagination', true)
  if (pagination && pagination.expression.length > 0) {
    //const block = getLiquidBlock(body, pagination.expression)
    const bodyId = getPersistantId(body)
    if (bodyId) {
      return dedent`
        {% assign ${getStateVariableName(bodyId, 'pagination')} = pagination %}
        {% assign ${getStateVariableName(bodyId, 'items')} = pagination.items %}
        {% assign ${getStateVariableName(bodyId, 'pages')} = pagination.pages %}
      `
    } else {
      console.error('body has no persistant ID => do not add liquid for 11ty data')
    }
  }
  return ''
}

export function transformPage(editor: Editor, data: { page: Page, siteSettings: WebsiteSettings, pageSettings: Silex11tyPluginWebsiteSettings }): void {
  const { pageSettings, page } = data
  const body = page.getMainComponent()
  if (pageSettings.eleventySeoTitle) {
    const expression = toExpression(pageSettings.eleventySeoTitle)
    if (expression && expression.length) pageSettings.title = echoBlock(body, expression)
  }
  if (pageSettings.eleventySeoDescription) {
    const expression = toExpression(pageSettings.eleventySeoDescription)
    if (expression && expression.length) pageSettings.description = echoBlock(body, expression)
  }
  if (pageSettings.eleventyFavicon) {
    const expression = toExpression(pageSettings.eleventyFavicon)
    if (expression && expression.length) pageSettings.favicon = echoBlock(body, expression)
  }
  if (pageSettings.eleventyOGImage) {
    const expression = toExpression(pageSettings.eleventyOGImage)
    if (expression && expression.length) pageSettings['og:image'] = echoBlock(body, expression)
  }
  if (pageSettings.eleventyOGTitle) {
    const expression = toExpression(pageSettings.eleventyOGTitle)
    if (expression && expression.length) pageSettings['og:title'] = echoBlock(body, expression)
  }
  if (pageSettings.eleventyOGDescription) {
    const expression = toExpression(pageSettings.eleventyOGDescription)
    if (expression && expression.length) pageSettings['og:description'] = echoBlock(body, expression)
  }
}

/**
 * Transform the files to be published
 * This hook is called just before the files are written to the file system
 * Exported for unit tests
 */
export function transformFiles(editor: Editor, options: EleventyPluginOptions, data: PublicationData): void {
  editor.Pages.getAll().forEach(page => {
    // Get the page properties
    const slug = getPageSlug(page.getName())
    const settings = (page.get('settings') ?? {}) as Silex11tyPluginWebsiteSettings
    const languages = settings.silexLanguagesList?.split(',').map(lang => lang.trim()).filter(lang => !!lang)

    // Create the data file for this page
    const query = getPageQuery(page, editor)
    // Remove empty data source queries
    Object.entries(query).forEach(([key, value]) => {
      if (value.length === 0) {
        delete query[key]
      }
    })

    // Find the page in the published data
    if (!data.files) throw new Error('No files in publication data')
    const path = `/${slug}.html`
    const pageData = data.files.find(file => file.path === path) as ClientSideFileWithContent | undefined
    if (!pageData) throw new Error(`No file for path ${path}`)
    if (pageData.type !== ClientSideFileType.HTML) throw new Error(`File for path ${path} is not HTML`)
    const dataFile = Object.keys(query).length > 0 ? {
      type: ClientSideFileType.OTHER,
      path: `/${slug}.11tydata.mjs`,
      content: getDataFile(editor, page, null, query, options),
    } : null

    if (languages && languages.length > 0) {
      const pages: ClientSideFileWithContent[] = languages.flatMap(lang => {
        // Change the HTML
        const frontMatter = getFrontMatter(page, settings, slug, page.getName(), lang)
        const bodyStates = getBodyStates(page)
        const pageFile = {
          type: ClientSideFileType.HTML,
          path: path.replace(/\.html$/, `-${lang}.html`),
          content: frontMatter + bodyStates + pageData.content,
        }

        // Create the data file for this page
        if (dataFile) {
          return [pageFile, {
            ...dataFile,
            path: dataFile.path.replace(/\.11tydata\.mjs$/, `-${lang}.11tydata.mjs`),
            content: getDataFile(editor, page, lang, query, options),
          }] // It is important to keep pageFile first, see bellow
        }
        return pageFile
      })

      // Update the existing page
      const [existingPage, ...newPages] = pages
      pageData.content = existingPage.content
      pageData.path = existingPage.path

      // Add the other pages
      data.files.push(...newPages)
    } else {
      // Change the HTML
      const frontMatter = getFrontMatter(page, settings, slug, page.getName())
      const bodyStates = getBodyStates(page)

      // Update the page before it is published
      const content = frontMatter + bodyStates + pageData.content
      pageData.content = content

      // Add the data file
      if (dataFile) {
        // There is at least 1 query in this page
        data.files.push(dataFile)
      }
    }
  })
}

/**
 * Generate the data file for a given silex page
 * This file will be used by 11ty to generate the final website's page
 * 11ty will use this file to get the data from the data sources
 * - Language
 * - Native fetch or 11ty-fetch plugin
 * - esModule or commonjs
 * - Cache buster
 *
 */
function getDataFile(editor: Editor, page: Page, lang: string | null, query: Record<string, string>, options: EleventyPluginOptions): string {
  const esModule = options.esModule === true || typeof options.esModule === 'undefined'
  const fetchPlugin = getFetchPluginOptions(options, editor.getModel().get('settings') || {})
  const fetchImportStatement = fetchPlugin ? (esModule ? 'import EleventyFetch from \'@11ty/eleventy-fetch\'' : 'const EleventyFetch = require(\'@11ty/eleventy-fetch\')') : ''
  const exportStatement = esModule ? 'export default' : 'module.exports ='

  const content = Object.entries(query).map(([dataSourceId, queryStr]) => {
    const dataSource = getDataSource(dataSourceId)
    if (dataSource) {
      return queryToDataFile(dataSource, queryStr, options, page, lang, fetchPlugin)
    } else {
      console.error('No data source for id', dataSourceId)
      throw new Error(`No data source for id ${dataSourceId}`)
    }
  }).join('\n')
  return `
${fetchImportStatement}
${exportStatement} async function (configData) {
  const data = {
    ...configData,
    lang: '${lang || ''}',
  }
  const result = {}
  ${content}
  return result
}
  `
}

/**
 * Exported for unit tests
 */
export function queryToDataFile(dataSource: IDataSource, queryStr: string, options: EleventyPluginOptions, page: Page, lang: string | null, fetchPlugin: object | false): string {
  if (dataSource.type !== 'graphql') {
    console.info('not graphql', dataSource)
    return ''
  }
  const s2s = (dataSource as GraphQLOptions).serverToServer
  const url = s2s ? s2s.url : dataSource.url
  const urlWithCacheBuster = options.cacheBuster ? `${url}${url.includes('?') ? '&' : '?'}page_id_for_cache=${page.getId()}${lang ? `-${lang}` : ''}` : url
  const method = s2s ? s2s.method : dataSource.method
  const headers = s2s ? s2s.headers : dataSource.headers
  if (headers && !Object.keys(headers).find(key => key.toLowerCase() === 'content-type')) {
    console.warn('11ty plugin for Silex: no content-type in headers of the graphql query. I will set it to application/json for you. To avoid this warning, add a header with key "content-type" and value "application/json" in silex config.')
    headers['content-type'] = 'application/json'
  }
  const headersStr = headers ? Object.entries(headers).map(([key, value]) => `'${key}': \`${value}\`,`).join('\n') : ''

  const fetchOptions = {
    key: dataSource.id as string,
    method: method || 'POST',
    url: urlWithCacheBuster,
    headers: headersStr,
    query: `JSON.stringify({
      query: \`${queryStr}\`,
    })`, // Let 11ty interpolate the query wich let us add variables in the plugin config
  }
  return fetchPlugin ? makeFetchCallEleventy(fetchOptions, fetchPlugin) : makeFetchCall(fetchOptions)
}

export function makeFetchCall(options: {key: string, url: string, method: string, headers: string, query: string}): string {
  return dedent`
  try {
    const response = await fetch(\`${options.url}\`, {

    headers: {
      ${options.headers}
    },
    method: '${options.method}',
    body: ${options.query}
    })

    if (!response.ok) {
      throw new Error(\`Error fetching graphql data: HTTP status code \${response.status}, HTTP status text: \${response.statusText}\`)
    }

    const json = await response.json()

    if (json.errors) {
      throw new Error(\`GraphQL error: \\n> \${json.errors.map(e => e.message).join('\\n> ')}\`)
    }

    result['${options.key}'] = json.data
  } catch (e) {
    console.error('11ty plugin for Silex: error fetching graphql data', e, '${options.key}', '${options.url}')
    throw e
  }
`
}

export function makeFetchCallEleventy(options: {key: string, url: string, method: string, headers: string, query: string}, fetchPlugin: object): string {
  return dedent`
  try {
    const json = await EleventyFetch(\`${options.url}\`, {
    ...${JSON.stringify(fetchPlugin)},
    type: 'json',
    fetchOptions: {
      headers: {
        ${options.headers}
      },
      method: '${options.method}',
      body: ${options.query},
    }
    })

    if (json.errors) {
      throw new Error(\`GraphQL error: \\n> \${json.errors.map(e => e.message).join('\\n> ')}\`)
    }

    result['${options.key}'] = json.data
  } catch (e) {
    console.error('11ty plugin for Silex: error fetching graphql data', e, '${options.key}', '${options.url}')
    throw e
  }
`
}
