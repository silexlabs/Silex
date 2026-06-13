/**
 * @fileoverview DataSource configuration with defaults
 */

import DataSourcePlugin from '@silexlabs/grapesjs-data-source'
import { EleventyPluginOptions } from './index'
import { Editor, EditorConfig } from 'grapesjs'

const settingsEl = document.createElement('div')

/**
 * Default for the data source plugin to work without config
 */
export function getZeroConfig(editor: Editor): EleventyPluginOptions {
  return {
    view: {
      el: () => editor.Panels.getPanel('views-container')?.view.el,
      button: () => editor.Panels.getPanel('views')!.get('buttons')!.get('open-tm'),
      settingsEl: () => settingsEl,
      defaultFixed: true,
      // Show all editors by default
      disableStates: false,
      disableAttributes: false,
      disableProperties: false,
    },
    previewActive: true,
    // Liquid filters - will be set by optionsToGrapesJsConfig
    filters: [],
    // Default data source
    dataSources: [],
    // Enable 11ty publication and filters
    enable11ty: true,
    // 11ty plugins
    // fetchPlugin: { cache: 'no-cache' },
    // i18nPlugin: true,
    // Default publication paths
    dir: {
      input: '',
      assets: 'assets',
      css: 'css',
    },
    urls: {
      assets: '/assets',
      css: '/css',
    },
  }
}
