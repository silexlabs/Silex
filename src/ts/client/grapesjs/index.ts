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

import grapesjs, { Editor } from 'grapesjs'
import openImport from './openImport'

/**
 * @fileoverview This is where grapes config gets created
 * Handle plugins, options and initialization of the editor
 */

// ////////////////////
// Plugins
// ////////////////////
import blocksBasicPlugin from 'grapesjs-blocks-basic'
import styleFilterPlugin from 'grapesjs-style-filter'
import formPlugin from 'grapesjs-plugin-forms'
import codePlugin from 'grapesjs-custom-code'
import uiSuggestClasses from '@silexlabs/grapesjs-ui-suggest-classes'
import symbolsPlugin from '@silexlabs/grapesjs-symbols'
import loadingPlugin from '@silexlabs/grapesjs-loading'
import fontsDialogPlugin, { cmdOpenFonts } from '@silexlabs/grapesjs-fonts'
import symbolDialogsPlugin, { cmdPromptAddSymbol } from './symbolDialogs'
import loginDialogPlugin, { LoginDialogOptions } from './LoginDialog'

import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './new-page-dialog'
import { projectBarPlugin } from './project-bar'
import { settingsDialog, cmdOpenSettings } from './settings'
import { blocksPlugin } from './blocks'
import { semanticPlugin } from './semantic'
import { richTextPlugin } from './rich-text'
import { internalLinksPlugin } from './internal-links'
import publicationManagerPlugin, { PublicationManagerOptions } from './PublicationManager'
import { templatePlugin } from './template'
import { eleventyPlugin } from './eleventy'
import { storagePlugin } from './storage'
import { API_WEBSITE_READ, API_WEBSITE_WRITE } from '../../constants'
import { ConnectorId, WebsiteId } from '../../types'
import { ApiError } from '../api'

const plugins = [
  {name: './project-bar', value: projectBarPlugin}, // has to be before panels and dialogs
  {name: './settings', value: settingsDialog},
  {name: '@silexlabs/grapesjs-fonts', value: fontsDialogPlugin},
  {name: './new-page-dialog', value: newPageDialog},
  {name: './page-panel', value: pagePanelPlugin},
  {name: 'grapesjs-blocks-basic', value: blocksBasicPlugin},
  {name: './blocks', value: blocksPlugin},
  {name: './semantic', value: semanticPlugin},
  {name: './rich-text', value: richTextPlugin},
  {name: 'grapesjs-style-filter', value: styleFilterPlugin},
  {name: 'grapesjs-plugin-forms', value: formPlugin},
  {name: 'grapesjs-custom-code', value: codePlugin},
  {name: './internal-links', value: internalLinksPlugin},
  {name: '@silexlabs/grapesjs-ui-suggest-classes', value: uiSuggestClasses},
  {name: './symbolDialogs', value: symbolDialogsPlugin},
  {name: '@silexlabs/grapesjs-symbols', value: symbolsPlugin},
  {name: './PublicationManager', value: publicationManagerPlugin},
  {name: './template', value: templatePlugin},
  {name: './eleventy', value: eleventyPlugin},
  {name: './storage', value: storagePlugin},
  {name: './LoginDialog', value: loginDialogPlugin},
  {name: '@silexlabs/grapesjs-loading', value: loadingPlugin},
]
// Check that all plugins are loaded correctly
plugins
  .filter(p => typeof p.value !== 'function')
  .forEach(p => {
    throw new Error(`Plugin ${p.name} could not be loaded correctly (${p.value})`)
  })

// ////////////////////
// Config
// ////////////////////
const catBasic = 'Containers'
const catComponents = 'Components'

export function getEditorConfig(id: WebsiteId, connectorId: ConnectorId, rootUrl: string) {
  return {
    container: '#gjs',
    height: '100%',
    showOffsets: true,
    showDevices: true,

    //pageManager: {},

    layerManager: {
      appendTo: '.layer-manager-container',
    },

    blockManager: {
      appendTo: '.block-manager-container',
    },

    assetManager: {
      upload: `${rootUrl}/assets/?id=${id}`,
    },

    storageManager: {
      autoload: true,
      //type: 'remote',
      type: 'connector',
      options: {
        connector: {
          id,
          connectorId,
        },
        //remote: {
        //  urlStore: `${rootUrl}/${API_WEBSITE_WRITE}?id=${id}`,
        //  urlLoad: `${rootUrl}/${API_WEBSITE_READ}?id=${id}`,
        //},
      },
    },

    cssIcons: '/css/all.min.css',

    plugins: plugins.map(p => p.value),

    pluginsOpts: {
      [blocksBasicPlugin as any]: {
        blocks: ['text', 'image', 'video', 'map'],
        category: catBasic,
        //flexGrid: true,
      },
      [projectBarPlugin as any]: {
        panels: [
          {
            id: 'dash',
            className: 'logo',
            attributes: { title: 'Go to your dashboard' },
            link: '/',
            command: 'open-dash',
          }, {
            id: 'block-manager-btn',
            className: 'block-manager-btn fa fa-fw fa-plus',
            attributes: { title: 'Blocks', containerClassName: 'block-manager-container', },
            command: 'open-blocks',
          }, {
            id: 'symbols-btn',
            className: 'symbols-btn fa-regular fa-gem',
            attributes: { title: 'Symbols', containerClassName: 'symbols-list-container', },
            command: 'open-symbols',
            buttons: [
              {
                id: 'symbol-create-button',
                className: 'pages__add-page fa-solid fa-plus',
                label: 'Create symbol from selection',
                command: cmdPromptAddSymbol,
              },
            ],
          }, {
            id: 'page-panel-btn',
            className: 'page-panel-btn fa fa-fw fa-file',
            attributes: { title: 'Pages', containerClassName: 'page-panel-container', },
            command: cmdTogglePages,
            buttons: [{
              className: 'pages__add-page fa fa-file',
              command: cmdAddPage,
              text: '+',
            }],
          }, {
            id: 'layer-manager-btn',
            className: 'layer-manager-btn fa-solid fa-layer-group',
            attributes: { title: 'Layers', containerClassName: 'layer-manager-container', },
            command: 'open-layers',
          }, {
            id: 'font-dialog-btn',
            className: 'font-manager-btn fa-solid fa-font',
            attributes: { title: 'Fonts' },
            command: cmdOpenFonts,
          }, {
            id: 'settings-dialog-btn',
            className: 'page-panel-btn fa-solid fa-gears',
            attributes: { title: 'Settings' },
            command: cmdOpenSettings,
          }, {
            id: 'spacer',
            attributes: {},
            className: 'project-bar-spacer',
          }, {
            id: 'logout-button',
            className: 'page-panel-btn fa fa-fw fa-sign-out',
            attributes: { title: 'Sign out' },
            command: 'relogin',
          },
        ],
      },
      [publicationManagerPlugin as any]: {
        appendTo: 'options',
        websiteId: id,
      } as PublicationManagerOptions,
      [pagePanelPlugin as any]: {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      },
      [uiSuggestClasses as any]: {
        enableCount: false,
        enablePerformance: false,
      },
      [internalLinksPlugin as any]: {
        // FIXME: warn the user about links in error
        onError: (errors) => console.log('Links errors:', errors),
      },
      [codePlugin as any]: {
        blockLabel: 'HTML',
        blockCustomCode: {
          category: catComponents,
        }
      },
      [symbolsPlugin as any]: {
        appendTo: '.symbols-list-container',
      },
      [fontsDialogPlugin as any]: {
        api_key: 'AIzaSyAdJTYSLPlKz4w5Iqyy-JAF2o8uQKd1FKc',
      },
      [loginDialogPlugin as any]: {
        id,
      } as LoginDialogOptions,
    },
  }
}

// ////////////////////
// Initialize editor
// ////////////////////
// Keep a ref to the editor singleton
let editor: Editor
export async function initEditor(config, grapesJsPlugins) {
  if(editor) throw new Error('Grapesjs editor already created')
  return new Promise<Editor>((resolve, reject) => {
    try {
      editor = grapesjs.init({
        plugins: [
          ...grapesJsPlugins,
          ...config.plugins,
        ],
        ...config,
      })
    } catch(e) {
      console.error('Error initializing GrapesJs with plugins:', plugins, e)
      reject(e)
    }

    // customize the editor
    ['text']
      .forEach(id => editor.Blocks.get(id)?.set('category', 'Basics'))
    ;['image', 'video']
      .forEach(id => editor.Blocks.get(id)?.set('category', 'Media'))
    ;['map']
      .forEach(id => editor.Blocks.get(id)?.set('category', 'Components'))
    editor.Blocks.render([])

    editor.Commands.add('gjs-open-import-webpage', openImport(editor, {
      modalImportLabel: '',
      modalImportContent: 'Paste a web page HTML code here.',
      modalImportButton: 'Import',
      modalImportTitle: 'Import from website',
    }))

    editor.on('load', () => {
      // // move the options panel to the sidebar
      // const optionsEl = editor.Panels.getPanel('options').view.el
      // editor.Panels.getPanel('project-bar-panel').view.el
      // .appendChild(options)
      // options.style.width = 0
      // options.style.position = 'static'

      // remove blocks and layers buttons from the properties
      editor.Panels.getPanel('views').buttons.remove('open-blocks')
      editor.Panels.getPanel('views').buttons.remove('open-layers')
      editor.Panels.getPanel('views').view.el.firstChild.style.justifyContent = 'initial' // align left
      editor.Panels.getPanel('options').buttons.remove('export-template')

      editor.BlockManager.render(null)

      // use the style filter plugin
      editor.StyleManager.addProperty('extra',{ extend: 'filter' })

      // GrapesJs editor is ready
      resolve(editor)
    })
  })
}

export function getEditor() {
  return editor
}
