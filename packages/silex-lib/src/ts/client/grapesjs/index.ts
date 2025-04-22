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

import grapesjs, { Editor, EditorConfig } from 'grapesjs'
import openImport from './openImport'

/**
 * @fileoverview This is where grapes config gets created
 * Handle plugins, options and initialization of the editor
 */

const notificationContainer = document.createElement('div')

// ////////////////////
// Plugins
// ////////////////////
import blocksBasicPlugin from 'grapesjs-blocks-basic'
import styleFilterPlugin from 'grapesjs-style-filter'
import formPlugin from 'grapesjs-plugin-forms'
import codePlugin from 'grapesjs-custom-code'
import filterStyles from '@silexlabs/grapesjs-filter-styles'
import symbolsPlugin from '@silexlabs/grapesjs-symbols'
import loadingPlugin from '@silexlabs/grapesjs-loading'
import fontsDialogPlugin from '@silexlabs/grapesjs-fonts'
import selectorPlugin from '@silexlabs/grapesjs-advanced-selector'
import symbolDialogsPlugin, { cmdPromptAddSymbol } from './symbolDialogs'
import loginDialogPlugin, { LoginDialogOptions, cmdLogout } from './LoginDialog'
import footerPlugin from './footer'
import breadcrumbsPlugin from './breadcrumbs'
import imgPlugin from './img'
import cssPropsPlugin from './css-props'
import rateLimitPlugin from '@silexlabs/grapesjs-storage-rate-limit'
import borderPugin from 'grapesjs-style-border'
import backgroundPlugin from 'grapesjs-style-bg'
import resizePanelPlugin from './resize-panel'
import notificationsPlugin, { NotificationEditor } from '@silexlabs/grapesjs-notifications'
import keymapsDialogPlugin, { cmdKeymapsDialog } from '@silexlabs/grapesjs-keymaps-dialog'

import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './new-page-dialog'
import { PROJECT_BAR_PANEL_ID, projectBarPlugin } from './project-bar'
import { settingsDialog, cmdOpenSettings } from './settings'
import { blocksPlugin } from './blocks'
import { semanticPlugin } from './semantic'
import { orderedList, richTextPlugin, unorderedList } from './rich-text'
import { internalLinksPlugin } from './internal-links'
import {defaultKms, keymapsPlugin} from './keymaps'
import publicationManagerPlugin, { PublicationManagerOptions } from './PublicationManager'
import ViewButtons from './view-buttons'
import { storagePlugin } from './storage'
import { API_PATH, API_WEBSITE_ASSETS_WRITE, API_WEBSITE_PATH } from '../../constants'
import { ClientConfig } from '../config'
import { titleCase } from '../utils'
import uploadProgress from './upload-progress'

const plugins = [
  {name: './project-bar', value: projectBarPlugin}, // has to be before panels and dialogs
  {name: 'grapesjs-style-bg', value: backgroundPlugin},
  {name: './settings', value: settingsDialog},
  {name: '@silexlabs/grapesjs-fonts', value: fontsDialogPlugin},
  {name: '@silexlabs/grapesjs-advanced-selector', value: selectorPlugin},
  {name: './new-page-dialog', value: newPageDialog},
  {name: './page-panel', value: pagePanelPlugin},
  {name: 'grapesjs-blocks-basic', value: blocksBasicPlugin},
  {name: './blocks', value: blocksPlugin},
  {name: './view-buttons', value: ViewButtons},
  {name: './semantic', value: semanticPlugin},
  {name: './rich-text', value: richTextPlugin},
  {name: 'grapesjs-style-filter', value: styleFilterPlugin},
  {name: 'grapesjs-plugin-forms', value: formPlugin},
  {name: 'grapesjs-custom-code', value: codePlugin},
  {name: './internal-links', value: internalLinksPlugin},
  {name: './keymaps', value: keymapsPlugin},
  {name: '@silexlabs/grapesjs-filter-styles', value: filterStyles},
  {name: './symbolDialogs', value: symbolDialogsPlugin},
  {name: '@silexlabs/grapesjs-symbols', value: symbolsPlugin},
  {name: './PublicationManager', value: publicationManagerPlugin},
  {name: './storage', value: storagePlugin},
  {name: './LoginDialog', value: loginDialogPlugin},
  {name: '@silexlabs/grapesjs-loading', value: loadingPlugin},
  {name: './breadcrumbs', value: breadcrumbsPlugin},
  {name: './img', value: imgPlugin},
  {name: './css-props', value: cssPropsPlugin},
  {name: './footer', value: footerPlugin},
  {name: '@silexlabs/grapesjs-storage-rate-limit', value: rateLimitPlugin},
  {name: 'grapesjs-style-border', value: borderPugin},
  {name: './resize-panel', value: resizePanelPlugin},
  {name: '@silexlabs/grapesjs-notifications', value: notificationsPlugin},
  {name: '@silexlabs/grapesjs-keymaps-dialog', value: keymapsDialogPlugin},
  {name: './upload-progress', value: uploadProgress},
]
// Check that all plugins are loaded correctly
plugins
  .filter(p => typeof p.value !== 'function')
  .forEach(p => {
    throw new Error(`Plugin ${p.name} could not be loaded correctly (${p.value})`)
  })

// Constants
const PRIMARY_COLOR = '#333333'
const SECONDARY_COLOR = '#ddd'
const TERTIARY_COLOR = '#8873FE'
const QUATERNARY_COLOR = '#A291FF'
const DARKER_PRIMARY_COLOR = '#363636'
const LIGHTER_PRIMARY_COLOR = '#575757'

// Commands
export const cmdToggleLayers = 'open-layers'
export const cmdToggleBlocks = 'open-blocks'
export const cmdToggleSymbols = 'open-symbols'
export const cmdToggleNotifications = 'open-notifications'

// ////////////////////
// Config
// ////////////////////
const catBasic = 'Containers'
const catComponents = 'Components'

export function getEditorConfig(config: ClientConfig): EditorConfig {
  const { websiteId, storageId, rootUrl } = config
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
      upload: `${rootUrl}${API_PATH}${API_WEBSITE_PATH}${API_WEBSITE_ASSETS_WRITE}/?websiteId=${websiteId}${ storageId ? `&connectorId=${storageId}` : ''}`,
    },

    storageManager: {
      autoload: false,
      type: 'connector',
      options: {
        connector: {
          id: websiteId,
          connectorId: storageId,
        },
      },
    },

    cssIcons: './css/all.min.css',

    richTextEditor: {
      // @ts-ignore
      actions: ['bold', 'italic', 'underline', 'strikethrough', 'link', 'wrap', orderedList, unorderedList],
    },

    selectorManager: {
      custom: true, // This should not be needed, check index.js
      escapeName: (name) => `${name}`,
    },

    plugins: plugins.map(p => p.value),

    pluginsOpts: {
      [blocksBasicPlugin.toString()]: {
        blocks: ['text', 'image', 'video', 'map'],
        category: catBasic,
        //flexGrid: true,
      },
      [projectBarPlugin.toString()]: {
        panels: [
          {
            id: 'dash',
            className: 'logo',
            attributes: { title: 'Dashboard' },
            command: () => {
              window.location.href = '/'
            },
          }, {
            id: 'block-manager-btn',
            className: 'block-manager-btn fa fa-fw fa-plus',
            name: 'Blocks',
            attributes: { title: `Blocks (${titleCase(defaultKms.kmBlocks.keys, '+')})`, containerClassName: 'block-manager-container', },
            command: cmdToggleBlocks,
          }, {
            id: 'symbols-btn',
            className: 'symbols-btn fa-regular fa-gem',
            name: 'Symbols',
            attributes: { title: `Symbols (${titleCase(defaultKms.kmSymbols.keys, '+')})`, containerClassName: 'symbols-list-container', },
            command: cmdToggleSymbols,
            buttons: [
              {
                id: 'symbol-create-button',
                className: 'gjs-pn-btn',
                command: cmdPromptAddSymbol,
                text: '\u271A',
              },
            ],
          }, {
            id: 'page-panel-btn',
            className: 'page-panel-btn fa fa-fw fa-file',
            name: 'Pages',
            attributes: { title: `Pages (${titleCase(defaultKms.kmPages.keys, '+')})`, containerClassName: 'page-panel-container', },
            command: cmdTogglePages,
            buttons: [{
              className: 'gjs-pn-btn',
              command: cmdAddPage,
              text: '\u271A',
            }],
          }, {
            id: 'layer-manager-btn',
            className: 'layer-manager-btn fa-solid fa-layer-group',
            name: 'Layers',
            attributes: { title: `Layers (${titleCase(defaultKms.kmLayers.keys, '+')})`, containerClassName: 'layer-manager-container', },
            command: cmdToggleLayers,
          }, {
            id: 'font-dialog-btn',
            className: 'font-manager-btn fa-solid fa-font',
            name: 'Fonts',
            attributes: { title: `Fonts (${titleCase(defaultKms.kmOpenFonts.keys, '+')})` },
            command: () => {
              editor.runCommand('open-fonts')
            },
          }, {
            id: 'settings-dialog-btn',
            className: 'page-panel-btn fa-solid fa-gears',
            name: 'Settings',
            attributes: { title: `Settings (${titleCase(defaultKms.kmOpenSettings.keys, '+')})` },
            command: cmdOpenSettings,
          }, {
            id: 'spacer',
            attributes: {},
            className: 'project-bar-spacer',
          }, {
            id: 'keymaps-btn',
            className: 'keymaps-btn fa-solid fa-keyboard',
            name: 'Shortcuts',
            attributes: { title: 'Keyboard Shortcuts (Shift+H)' },
            command: cmdKeymapsDialog,
          }, {
            id: 'notifications-btn',
            className: 'notifications-btn fa-regular fa-bell',
            name: 'Notifications',
            attributes: { title: `Notifications (${titleCase(defaultKms.kmNotifications.keys, '+')})`, containerClassName: 'notifications-container', },
            command: cmdToggleNotifications,
            buttons: [{
              className: 'gjs-pn-btn',
              command: 'notifications:clear',
              text: '\u2716',
            }],
          }, {
            id: 'dash2',
            className: 'fa-solid fa-house',
            attributes: { title: 'Dashboard' },
            command: () => {
              window.location.href = '/'
            },
          }, {
            id: 'help',
            className: 'fa fa-fw fa-question-circle',
            attributes: { title: 'Documentation' },
            command: () => {
              window.open('https://docs.silex.me/', '_blank')
            },
          }, {
            id: 'logout-button',
            className: 'page-panel-btn fa fa-fw fa-sign-out',
            attributes: { title: 'Sign out' },
            command: cmdLogout,
          },
        ],
      },
      [publicationManagerPlugin.toString()]: {
        appendTo: 'options',
        websiteId,
      } as PublicationManagerOptions,
      [pagePanelPlugin.toString()]: {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      },
      [filterStyles.toString()]: {
        appendBefore: '.gjs-sm-sectors',
      },
      [internalLinksPlugin.toString()]: {
        // FIXME: warn the user about links in error
        onError: (errors) => console.warn('Links errors:', errors),
      },
      [keymapsPlugin.toString()]: {
        disableKeymaps: false,
      },
      [codePlugin.toString()]: {
        blockLabel: 'HTML',
        blockCustomCode: {
          category: catComponents,
        },
        codeViewOptions: {
          autoFormat: false,
        },
      },
      [symbolsPlugin.toString()]: {
        appendTo: '.symbols-list-container',
        emptyText: 'No symbol yet.',
        primaryColor: PRIMARY_COLOR,
        secondaryColor: SECONDARY_COLOR,
        highlightColor: TERTIARY_COLOR,
      },
      [fontsDialogPlugin.toString()]: {
        api_key: config.fontsApiKey,
        server_url: config.fontsServerUrl,
        api_url: config.fontsApiUrl,
      },
      [loginDialogPlugin.toString()]: {
        id: websiteId,
      } as LoginDialogOptions,
      [rateLimitPlugin.toString()]: {
        time: 5000,
      },
      [imgPlugin.toString()]: {
        replacedElements: config.replacedElements,
      },
      [notificationsPlugin.toString()]: {
        container: notificationContainer,
        reverse: true,
      },
      [keymapsDialogPlugin.toString()]: {
        longPressDuration: null,
        shortcut: 'shift+h',
      },
    },
  }
}

// ////////////////////
// Initialize editor
// ////////////////////
// Keep a ref to the editor singleton
let editor: Editor
export async function initEditor(config: EditorConfig) {
  if(editor) throw new Error('Grapesjs editor already created')
  return new Promise<Editor>((resolve, reject) => {
    try {
      /* @ts-ignore */
      editor = grapesjs.init(config)
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

    // Detect loading errors
    // Display a useful notification
    const typeConfig = {
      view: {
        onRender({editor, el, model}) {
          const src = model.getAttributes().src
          el.addEventListener('error', () => {
            editor.runCommand('notifications:add', {
              type: 'error',
              group: 'Image loading error',
              message: `Error loading image: ${src}`,
              componentId: model.getId(),
            })
          })
        },
      },
    }
    editor.DomComponents.addType('image', typeConfig)
    editor.DomComponents.addType('iframe', typeConfig)

    // Adjustments to do when the editor is ready
    editor.on('load', () => {
      const views = editor.Panels.getPanel('views')

      // Remove blocks and layers buttons from the properties
      // This is because in Silex they are on the left
      views.buttons.remove(cmdToggleBlocks)
      views.buttons.remove(cmdToggleLayers)

      // Remove useless buttons
      editor.Panels.getPanel('options').buttons.remove('export-template')
      editor.Panels.getPanel('options').buttons.remove('fullscreen')

      // Render the block manager, otherwise it is empty
      editor.BlockManager.render(null)

      // Use the style filter plugin
      editor.StyleManager.addProperty('extra', { extend: 'filter' })

      // Add the notifications container
      document.body.querySelector('.notifications-container')?.appendChild(notificationContainer)
      // Mark the button as dirty when there are notifications
      // TODO: move this in the notifications plugin options
      editor.on(
        'notifications:changed',
        () => {
          const notificationButton = editor.Panels.getPanel(PROJECT_BAR_PANEL_ID).view?.el.querySelector('.notifications-btn')
          ;(editor as unknown as NotificationEditor)
            ? notificationButton?.classList.add('project-bar__dirty')
            : notificationButton?.classList.remove('project-bar__dirty')
        }
      )

      // GrapesJs editor is ready
      resolve(editor)
    })
  })
}

export function getEditor() {
  return editor
}
