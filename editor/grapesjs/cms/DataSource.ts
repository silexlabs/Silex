import { DataSourceType, Field, IDataSource, Type, addDataSource, addFilters, removeFilters } from '@silexlabs/grapesjs-data-source'
import { EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { Editor } from 'grapesjs'
import { i18nFilters } from './filters'
import { ClientEvent } from '../../events'

//import { cmdPauseAutoSave } from '@silexlabs/silex/src/ts/client/grapesjs/storage'
const cmdPauseAutoSave = 'pause-auto-save'

export default function(editor: Editor, opts: EleventyPluginOptions): void {
  editor.on(`
    ${ ClientEvent.SETTINGS_SAVE_END }
    storage:after:load
    `, () => {
    updateFilters(editor, opts)
  })
  updateFilters(editor, opts)
  if(opts.enable11ty) {
    // Add the 11ty data source using the new functional API
    const ds = new EleventyDataSource()
    editor.runCommand(cmdPauseAutoSave)

    // Add the data source
    addDataSource(ds)

    // Wait for the next tick to avoid triggering a save
    setTimeout(() => {
      editor.stopCommand(cmdPauseAutoSave)
    })
  }
}

function updateFilters(editor: Editor, opts: EleventyPluginOptions) {
  const settings = (editor.getModel().get('settings') || {}) as Silex11tyPluginWebsiteSettings
  if(settings.eleventyI18n) {
    addFilters(i18nFilters)
  } else if (!opts.i18nPlugin) {
    removeFilters(i18nFilters)
  }
}

export const EleventyDataSourceId = 'eleventy'

export class EleventyDataSource implements IDataSource {
  /**
   * Unique identifier of the data source
   * This is used to retrieve the data source from the editor
   */
  public id = EleventyDataSourceId
  public label = 'Eleventy'
  public url = ''
  public type = 'graphql' as DataSourceType
  public method = 'POST'
  public headers = {}
  public hidden = true
  public readonly = true

  private eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {}

  // Simple event handling
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) return
    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    } else {
      this.eventListeners[event] = []
    }
  }

  trigger(event: string, ...args: unknown[]): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event].forEach(callback => callback(...args))
  }

  /**
   * Implement IDatasource
   */
  async connect(): Promise<void> {}
  isConnected(): boolean { return true }

  /**
   * Implement IDatasource
   */
  getQuery(/*expressions: Expression[]*/): string { return '' }

  /**
   * Implement IDatasource
   */
  getTypes(): Type[] {
    return [{
      id: 'string',
      label: 'String',
      dataSourceId: 'eleventy',
      fields: [],
    }, {
      id: 'number',
      label: 'Number',
      dataSourceId: 'eleventy',
      fields: [],
    }, {
      id: 'date',
      label: 'Date',
      dataSourceId: 'eleventy',
      fields: [],
    }, {
      id: 'page',
      label: 'page',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'url',
        label: 'url',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'fileSlug',
        label: 'fileSlug',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'filePathStem',
        label: 'filePathStem',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'date',
        label: 'date',
        typeIds: ['date'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'inputPath',
        label: 'inputPath',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'outputPath',
        label: 'outputPath',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'outputFileExtension',
        label: 'outputFileExtension',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'lang',
        label: 'lang',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }],
    }, {
      id: 'pagination',
      label: 'pagination',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'hrefs',
        label: 'hrefs',
        typeIds: ['string'],
        kind: 'list',
        dataSourceId: 'eleventy',
      }, {
        id: 'href',
        label: 'href',
        typeIds: ['paginationHref'],
        kind: 'object',
        dataSourceId: 'eleventy',
      }, {
        id: 'pageNumber',
        label: 'pageNumber',
        typeIds: ['number'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'pages',
        label: 'pages',
        typeIds: ['page'],
        kind: 'list',
        dataSourceId: 'eleventy',
      }],
    }, {
      id: 'paginationHref',
      label: 'paginationHref',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'next',
        label: 'next',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'previous',
        label: 'previous',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'first',
        label: 'first',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'last',
        label: 'last',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }],
    }, {
      id: 'eleventy',
      label: 'eleventy',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'version',
        label: 'version',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'generator',
        label: 'generator',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'env',
        label: 'env',
        typeIds: ['env'],
        kind: 'object',
        dataSourceId: 'eleventy',
      }]
    }, {
      id: 'env',
      label: 'env',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'root',
        label: 'root',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'config',
        label: 'config',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'source',
        label: 'source',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'runMode',
        label: 'runMode',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }],
    }, {
      id: 'locale_link',
      label: 'locale_link',
      dataSourceId: 'eleventy',
      fields: [{
        id: 'url',
        label: 'url',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'lang',
        label: 'lang',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }, {
        id: 'label',
        label: 'label',
        typeIds: ['string'],
        kind: 'scalar',
        dataSourceId: 'eleventy',
      }],
    }]
  }

  /**
   * Implement IDatasource
   */
  getQueryables(): Field[] {
    return [{
      id: 'page',
      label: 'page',
      typeIds: ['page'],
      kind: 'object',
      dataSourceId: 'eleventy',
    //}, {
    //  id: 'eleventy',
    //  label: 'eleventy',
    //  typeIds: ['eleventy'],
    //  kind: 'object',
    //  dataSourceId: 'eleventy',
    //}, {
    //  id: 'env',
    //  label: 'env',
    //  typeIds: ['env'],
    //  kind: 'object',
    //  dataSourceId: 'eleventy',
    }]
  }

  fetchValues(query: string): Promise<unknown> {
    throw new Error('not implemented yet')
  }
}

export class EleventyDataSourceTest extends EleventyDataSource {
}
