import dedent from 'dedent'
import { Component, Page, Editor } from 'grapesjs'
import { BinaryOperator, Filter, GraphQLOptions, IDataSource, NOTIFICATION_GROUP, Properties, Property, State, StateId, StoredState, Token, UnariOperator, fromStored, getAllDataSources, getDataSource, getPageQuery, getPersistantId, getState, getStateIds, getStateVariableName, toExpression } from '@silexlabs/grapesjs-data-source'
import { assignBlock, echoBlock, echoBlock1line, getPaginationData, ifBlock, loopBlock } from './liquid'
import { EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { PublicationTransformer } from '../../publication-transformers'
import { ClientConfig } from '../../config'
import { UNWRAP_ID } from './traits'
import { EleventyDataSourceId } from './DataSource'
import { ClientEvent } from '../../events'
import { WebsiteSettings } from '../../../types'
import { ClientSideFile, ClientSideFileType, ClientSideFileWithContent, PublicationData } from '@silexlabs/silex/src/ts/types'

const ATTRIBUTE_MULTIPLE_VALUES = ['class', 'style']

/**
 * A memoization mechanism to avoid rendering the same component multiple times
 * The cache is cleared every time the publication is done
 * This is a workaround because grapesjs editor.getHtml will call each component's toHtml method multiple times
 */
const cache = new Map<string, string>()

/**
 * A state with the real tokens instead of the stored tokens
 */
interface RealState {
  stateId: StateId,
  label?: string,
  tokens: Token[]
}

function getFetchPluginOptions(options: EleventyPluginOptions, settings: Silex11tyPluginWebsiteSettings): object | false {
  if(typeof options.fetchPluginSettings !== 'undefined') {
    return options.fetchPluginSettings
  }
  return settings.eleventyFetch ? { duration: '1s' } : false
}

export default function (editor: Editor, options: EleventyPluginOptions) {
  editor.on(ClientEvent.STARTUP_END, ({ config }) => {
    console.log('PUBLI INIT', {config})
    // Generate the liquid when the site is published
    config.addPublicationTransformers({
      // Render the components when they are published
      // Will run even with enable11ty = false in order to enable HTML attributes
      renderComponent: (component: Component, toHtml: () => string) => withNotification(() => renderComponent(editor, component, toHtml), editor, component.getId()),
      // Transform the paths to be published according to options.urls
      transformPermalink: options.enable11ty ? (path: string, type: string) => withNotification(() => transformPermalink(editor, path, type, options), editor, null) : undefined,
      // Transform the paths to be published according to options.dir
      transformPath: options.enable11ty ? (path: string, type: string) => withNotification(() => transformPath(editor, path, type, options), editor, null) : undefined,
      // Transform the files content
      //transformFile: (file) => transformFile(file),
    })

    if (options.enable11ty) {
      // Generate 11ty data files
      // FIXME: should this be in the publication transformers
      editor.on('silex:publish:page', data => withNotification(() => transformPage(editor, data), editor, null))
      editor.on('silex:publish:data', ({ data/*, preventDefault, publicationManager */ }) => withNotification(() => transformFiles(editor, options, data), editor, null))
      editor.on('silex:publish:end', () => cache.clear())
    }
  })
}

/**
 * Check if the 11ty publication is enabled
 */
function enable11ty(): boolean {
  return getAllDataSources()
    .filter(ds => ds.id !== EleventyDataSourceId)
    .length > 0
}

/**
 * Make html attribute
 * Quote strings, no values for boolean
 */
function makeAttribute(key: string, value: string | boolean): string {
  switch (typeof value) {
  case 'boolean': return value ? key : ''
  default: return `${key}="${value}"`
  }
}

/**
 * Comes from silex but didn't manage to import
 * FIXME: expose this from silex
 */
function transformPaths(editor: Editor, path: string, type: ClientSideFileType): string {
  const config = editor.getModel().get('config')
  return config.publicationTransformers.reduce((result: string, transformer: PublicationTransformer) => {
    try {
      return transformer.transformPath ? transformer.transformPath(result, type) ?? result : result
    } catch (e) {
      console.error('Publication transformer: error transforming path', result, e)
      return result
    }
  }, path)
}

/**
 * Transform the file name to be published
 */
function slugify(text: string | number) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export function getPermalink(page: Page, permalink: Token[], isCollectionPage: boolean, slug: string): string | null {
  const isHome = slug === 'index'
  // User provided a permalink explicitely
  if (permalink && permalink.length > 0) {
    const body = page.getMainComponent() as Component
    return echoBlock1line(body, permalink.map(token => {
      // Replace states which will be one from ./states.ts
      if(token.type === 'state') {
        const state = getState(body, token.storedStateId, true)
        if(!state) throw new Error('State not found on body')
        return {
          ...state.expression[0],
          dataSourceId: undefined,
          fieldId: token.label,
        } as Property
      }
      return token
    }))
  } else if (isCollectionPage) {
    // Let 11ty handle the permalink
    return null
  } else if (isHome) {
    // Normal home page
    return '/index.html'
  } else {
    // Use the page name
    return `/${slug}/index.html`
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
      ${settings.eleventyPageReverse ? 'reverse: true' : ''}
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
  // Do nothing if there is no data source, just a static site
  if(!enable11ty()) return

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
  // Do nothing if there is no data source, just a static site
  if(!enable11ty()) return

  editor.Pages.getAll().forEach(page => {
    // Get the page properties
    const slug = slugify(page.getName() || 'index')
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
    const path = transformPaths(editor, `/${slug}.html`, ClientSideFileType.HTML)
    const pageData = data.files.find(file => file.path === path) as ClientSideFileWithContent | undefined
    if (!pageData) throw new Error(`No file for path ${path}`)
    if (pageData.type !== ClientSideFileType.HTML) throw new Error(`File for path ${path} is not HTML`)
    const dataFile = Object.keys(query).length > 0 ? {
      type: ClientSideFileType.OTHER,
      path: transformPaths(editor, `/${slugify(page.getName() || 'index')}.11tydata.mjs`, ClientSideFileType.HTML),
      //path: `/${page.getName() || 'index'}.11tydata.mjs`,
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

/**
 * Make stored states into real states
 * Filter out hidden states and empty expressions
 */
function getRealStates(states: { stateId: StateId, state: StoredState }[]): { stateId: StateId, label: string, tokens: State[] }[] {
  return states
    .filter(({ state }) => !state.hidden)
    .filter(({ state }) => state.expression.length > 0)
    // From expression of stored tokens to tokens (with methods not only data)
    .map(({ stateId, state }) => ({
      stateId,
      label: state.label || stateId,
      tokens: state.expression.map(token => {
        const componentId = state.expression[0].type === 'state' ? state.expression[0].componentId : null
        return fromStored(token, componentId)
      }),
    }))
}

/**
 * Check if a state is an attribute
 * Exported for unit tests
 */
export function isAttribute(label: string): boolean {
  if (!label) return false
  return !Object.values(Properties).includes(label as Properties)
}

/**
 * Build the attributes string for a given component
 * Handle attributes which appear multiple times (class, style)
 * Append to the original attributes
 * Exported for unit tests
 */
export function buildAttributes(originalAttributes: Record<string, string>, attributeStates: { stateId: StateId, label: string, value: string }[]): string {
  const attributesArr = Object.entries(originalAttributes)
    // Start with the original attributes
    .map(([label, value]) => ({
      stateId: label,
      label,
      value,
    }))
    // Override or add state attributes
    .concat(attributeStates)
    // Handle attributes which appear multiple times
    .reduce((final, { stateId, label, value }) => {
      const existing = final.find(({ label: existingLabel }) => existingLabel === label)
      if (existing) {
        if (ATTRIBUTE_MULTIPLE_VALUES.includes(label)) {
          // Add to the original value
          existing.value += ' ' + value
        } else {
          // Override the original value
          existing.value = value
        }
      } else {
        // First time we see this attribute
        final.push({
          stateId,
          label,
          value,
        })
      }
      // Return the original array
      return final
    }, [] as ({ stateId: StateId, value: string | boolean, label: string })[])
  // Build final result
  return attributesArr
    // Convert to key="value" string
    .map(({ label, value }) => makeAttribute(label, value))
    // Back to string
    .join(' ')
}

function withNotification<T>(cbk: () => T, editor: Editor, componentId: string | null): T {
  try {
    return cbk()
  } catch (e) {
    editor.runCommand('notifications:add', {
      type: 'error',
      message: `Error rendering component: ${e.message}`,
      group: NOTIFICATION_GROUP,
      componentId,
    })
    throw e
  }
}

/**
 * Render the components when they are published
 */
function renderComponent(editor: Editor, component: Component, toHtml: () => string): string | undefined {
  if(cache.has(component.getId())) {
    return cache.get(component.getId())
  }

  const statesPrivate = withNotification(() => getRealStates(getStateIds(component, false)
    .map(stateId => ({
      stateId,
      state: getState(component, stateId, false)!,
    }))), editor, component.getId())

  const statesPublic = withNotification(() => getRealStates(getStateIds(component, true)
    .map(stateId => ({
      stateId,
      state: getState(component, stateId, true)!,
    }))), editor, component.getId())

  const unwrap = component.get(UNWRAP_ID)

  if (statesPrivate.length > 0 || statesPublic.length > 0 || unwrap) {
    const tagName = component.get('tagName')?.toLowerCase()
    if (tagName) {
      // Convenience key value object
      const statesObj = statesPrivate
        // Filter out attributes, keep only properties
        .filter(({ label }) => !isAttribute(label))
        // Add states
        .concat(statesPublic)
        .reduce((final, { stateId, label, tokens }) => ({
          ...final,
          [stateId]: {
            stateId,
            label,
            tokens,
          },
        }), {} as Record<Properties, RealState>)

      const hasInnerHtml = !!statesObj.innerHTML?.tokens.length
      const hasCondition = !!statesObj.condition?.tokens.length
      const hasData = !!statesObj.__data?.tokens.length

      // Style attribute
      const innerHtml = hasInnerHtml ? echoBlock(component, statesObj.innerHTML.tokens) : component.getInnerHTML()
      const operator = component.get('conditionOperator') ?? UnariOperator.TRUTHY
      const binary = operator && Object.values(BinaryOperator).includes(operator)
      const [ifStart, ifEnd] = hasCondition ? ifBlock(component, binary ? {
        expression: statesObj.condition.tokens,
        expression2: statesObj.condition2?.tokens ?? [],
        operator,
      } : {
        expression: statesObj.condition.tokens,
        operator,
      }) : []
      const [forStart, forEnd] = hasData ? loopBlock(component, statesObj.__data.tokens) : []
      const states = statesPublic
        .map(({ stateId, tokens }) => assignBlock(stateId, component, tokens))
        .join('\n')
      const before = (states ?? '') + (forStart ?? '') + (ifStart ?? '')
      const after = (ifEnd ?? '') + (forEnd ?? '')

      // Attributes
      const originalAttributes = component.get('attributes') as Record<string, string>
      // Add css classes
      originalAttributes.class = component.getClasses().join(' ')
      // Make the list of attributes
      const attributes = buildAttributes(originalAttributes, statesPrivate
        // Filter out properties, keep only attributes
        .filter(({ label }) => isAttribute(label))
        // Make tokens a string
        .map(({ stateId, tokens, label }) => ({
          stateId,
          label,
          value: echoBlock(component, tokens),
        }))
      )
      if (unwrap) {
        const html = `${before}${innerHtml}${after}`
        cache.set(component.getId(), html)
        return html
      } else {
        const html = `${before}<${tagName}${attributes ? ` ${attributes}` : ''}>${innerHtml}</${tagName}>${after}`
        cache.set(component.getId(), html)
        return html
      }
    } else {
      // Not a real component
      // FIXME: understand why
      throw new Error('Why no tagName?')
    }
  } else {
    const html = toHtml()
    cache.set(component.getId(), html)
    return html
  }
}

function toPath(path: (string | undefined)[]) {
  return '/' + path
    .filter(p => !!p)
    .map(p => p?.replace(/(^\/|\/$)/g, ''))
    .join('/')
}

function transformPermalink(editor: Editor, path: string, type: string, options: EleventyPluginOptions): string {
  // Do nothing if there is no data source, just a static site
  if(!enable11ty()) return path

  switch (type) {
  case 'html':
    return toPath([
      path
    ])
  case 'asset':
    return toPath([
      options.urls?.assets,
      path.replace(/^\/?assets\//, ''),
    ])
  case 'css': {
    return toPath([
      options.urls?.css,
      path.replace(/^\.?\/?css\//, ''),
    ])
  }
  default:
    console.warn('Unknown file type in transform permalink:', type)
    return path
  }
}

function transformPath(editor: Editor, path: string, type: string, options: EleventyPluginOptions): string {
  // Do nothing if there is no data source, just a static site
  if(!enable11ty()) return path

  switch (type) {
  case 'html':
    return toPath([
      options.dir?.input,
      options.dir?.silex,
      options.dir?.html,
      path,
    ])
  case 'css':
    return toPath([
      options.dir?.input,
      options.dir?.silex,
      options.dir?.css,
      path.replace(/^\/?css\//, ''),
    ])
  case 'asset':
    return toPath([
      options.dir?.input,
      options.dir?.silex,
      options.dir?.assets,
      path.replace(/^\/?assets\//, ''),
    ])
  default:
    console.warn('Unknown file type in transform path:', type)
    return path
  }
}

//function transformFile(file: ClientSideFile/*, options: EleventyPluginOptions*/): ClientSideFile {
//  //const fileWithContent = file as ClientSideFileWithContent
//  switch (file.type) {
//  case 'html':
//  case 'css':
//  case 'asset':
//    return file
//  default:
//    console.warn('Unknown file type in transform file:', file.type)
//    return file
//  }
//}
