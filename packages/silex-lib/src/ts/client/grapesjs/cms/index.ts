import dataSourcePlugin, { DataSourceEditorOptions, DATA_SOURCE_ERROR, IDataSource } from '@silexlabs/grapesjs-data-source'
import { ClientConfig } from '../../config'
import { getZeroConfig } from './config'
import publication from './publication'
import pageSettings from './page-settings'
import siteSettings from './site-settings'
import states from './states'
import DataSource from './DataSource'
import merge from 'deepmerge'
import { WebsiteSettings } from '../../../types'
import blocks from './blocks'
import buttons from './buttons'
import traits from './traits'
import collectionPages from './collection-pages'
import { Editor } from 'grapesjs'
import { eleventyFilters } from './filters'

export const CMS_SETTINGS_SECTION_ID = 'CMS_SETTINGS_SECTION_ID'

export interface EleventyPluginOptions extends DataSourceEditorOptions {
  // Enable the publication to 11ty version > 2
  // Default: true
  esModule?: boolean,
  // Enable the publication to 11ty
  // If false, the publication will not publish to 11ty and do not display 11ty data
  // Default: true
  enable11ty?: boolean,
  // Add cache buster to graphql queries
  // Default: false
  cacheBuster?: boolean,
  // 11ty fetch plugin options
  // https://www.11ty.dev/docs/plugins/fetch/
  fetchPluginSettings?: object | false,
  // Internationalization plugin enabled to add specific filters
  // https://www.11ty.dev/docs/plugins/i18n/
  i18nPlugin?: boolean,
  // Publication paths based on 11ty file structure
  dir?: {
    // Directory for 11ty input files
    // Silex will publish in /_silex/ in this directory
    // E.g. content
    // Default: ''
    input?: string,
    // Directory for the HTML pages relative to the input directory
    // Silex will add HTML pages to this directory
    // Default: ''
    html?: string,
    // Directory for the assets relative to the input directory
    // Silex will add assets to this directory
    // Default assets
    assets?: string,
    // Directory for the CSS files relative to the input directory
    // Silex will add CSS files to this directory
    // Default css
    css?: string,
  },
  urls?: {
    // URL where the CSS files will be accessible to the front end
    // Default: css
    css?: string,
    // URL where the assets will be accessible to the front end
    // Default: assets
    assets?: string,
  },
}

export interface Silex11tyPluginWebsiteSettings extends WebsiteSettings {
  eleventyPageData?: string,
  eleventyPermalink?: string,
  eleventyPageSize?: string,
  silexLanguagesList?: string,
  silexLanguagesDefault?: string,
  eleventyNavigationKey?: string,
  eleventyNavigationTitle?: string,
  eleventyNavigationOrder?: string,
  eleventyNavigationParent?: string,
  eleventyNavigationUrl?: string,
  // SEO
  eleventySeoTitle?: string,
  eleventySeoDescription?: string,
  eleventyFavicon?: string,
  // Social
  eleventyOGImage?: string,
  eleventyOGTitle?: string,
  eleventyOGDescription?: string,
  // Client side settings
  eleventyI18n?: boolean,
  eleventyFetch?: boolean,
  eleventyImage?: boolean,
}

export default function (editor: Editor, options: Partial<EleventyPluginOptions> = {}) {
  const filters = [
    ...eleventyFilters,
    'liquid',
    ...(options.filters ?? []),
  ]

  // Options with default
  const opts = merge(
    getZeroConfig(editor) as EleventyPluginOptions,
    options,
    { arrayMerge: (_, sourceArray) => sourceArray }, // Do not merge arrays by concatenation, just replace if present
  ) as EleventyPluginOptions

  dataSourcePlugin(editor, {
    ...opts,
    filters,
  } as DataSourceEditorOptions)

  DataSource(editor, opts)
  pageSettings(editor, opts)
  siteSettings(editor, opts)
  collectionPages(editor, opts)
  states(editor)
  publication(editor, opts)
  blocks(editor)
  buttons(editor)
  traits(editor)

  // Add styles on the editor to override the default colors
  document.head.insertAdjacentHTML('beforeend', `<style>
    :root {
      --ds-lowlight: #292929 !important;
      --tertiary-color: #a291ff !important;
      --ds-highlight: #a291ff !important;
    }
  </style>`)

  // Handle data source connection errors (for registered data sources, e.g. on load/refresh)
  // Only show the dialog for the first 10 seconds after editor load
  function handleDataSourceError(message: string, dataSource: IDataSource) {
    console.error('[Silex CMS] Data source connection error:', message, dataSource)

    const content = document.createElement('div')
    content.innerHTML = `
      <p><strong>${dataSource?.label || 'Data source'}</strong></p>
      <p>${message}</p>
      <hr>
      <footer>
        <button class="silex-button silex-button--primary" data-action="settings">Go to Settings</button>
        <button class="silex-button silex-button--secondary" data-action="close">Close</button>
      </footer>
    `

    content.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
      editor.Modal.close()
      editor.runCommand('open-settings', { sectionId: CMS_SETTINGS_SECTION_ID })
    })
    content.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      editor.Modal.close()
    })

    editor.Modal.open({
      title: 'Data Source Error',
      content,
    })
  }

  // Only display this error at load time
  editor.on(DATA_SOURCE_ERROR, handleDataSourceError)
  setTimeout(() => {
    editor.off(DATA_SOURCE_ERROR, handleDataSourceError)
  }, 10000)

  return editor
}
