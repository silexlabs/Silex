import blocksBasicPlugin from 'grapesjs-blocks-basic'
import styleFilterPlugin from 'grapesjs-style-filter'
import formPlugin from 'grapesjs-plugin-forms'
import codePlugin from 'grapesjs-custom-code'
import uiSuggestClasses from '@silexlabs/grapesjs-ui-suggest-classes'
import symbolsPlugin from '@silexlabs/grapesjs-symbols/src'
import directusPlugin from '@silexlabs/grapesjs-directus-storage'
import loadingPlugin from '@silexlabs/grapesjs-loading'
import fontsDialogPlugin, { cmdOpenFonts } from '@silexlabs/grapesjs-fonts'
import symbolDialogsPlugin, { cmdPromptAddSymbol } from './grapesjs/symbolDialogs'

import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './grapesjs/page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './grapesjs/new-page-dialog'
import { projectBarPlugin } from './grapesjs/project-bar'
import { settingsDialog, cmdOpenSettings } from './grapesjs/settings'
import { blocksPlugin } from './grapesjs/blocks'
import { semanticPlugin } from './grapesjs/semantic'
import { richTextPlugin } from './grapesjs/rich-text'
import { internalLinksPlugin } from './grapesjs/internal-links'
import { publishPlugin } from './grapesjs/publish'
import { templatePlugin } from './grapesjs/template'
import { eleventyPlugin } from './grapesjs/eleventy'

/**
 * @fileoverview Silex config overridable from index.pug
 */

// Get env var from webpack (see plugin in webpack.config.js)
declare const DIRECTUS_URL: string

const plugins = [
  {name: './grapesjs/project-bar', value: projectBarPlugin}, // has to be before panels and dialogs
  {name: './grapesjs/settings', value: settingsDialog},
  {name: '@silexlabs/grapesjs-fonts', value: fontsDialogPlugin},
  {name: './grapesjs/new-page-dialog', value: newPageDialog},
  {name: './grapesjs/page-panel', value: pagePanelPlugin},
  {name: 'grapesjs-blocks-basic', value: blocksBasicPlugin},
  {name: './grapesjs/blocks', value: blocksPlugin},
  {name: './grapesjs/semantic', value: semanticPlugin},
  {name: './grapesjs/rich-text', value: richTextPlugin},
  {name: 'grapesjs-style-filter', value: styleFilterPlugin},
  {name: 'grapesjs-plugin-forms', value: formPlugin},
  {name: 'grapesjs-custom-code', value: codePlugin},
  {name: './grapesjs/internal-links', value: internalLinksPlugin},
  {name: '@silexlabs/grapesjs-ui-suggest-classes', value: uiSuggestClasses},
  {name: './grapesjs/symbolDialogs', value: symbolDialogsPlugin},
  {name: '@silexlabs/grapesjs-symbols', value: symbolsPlugin},
  {name: './grapesjs/publish', value: publishPlugin},
  {name: './grapesjs/template', value: templatePlugin},
  {name: './grapesjs/eleventy', value: eleventyPlugin},
  {name: './grapesjs/loading', value: loadingPlugin},
]
// Optional plugins
  .concat(DIRECTUS_URL ? {name: '@silexlabs/grapesjs-directus-storage', value: directusPlugin} : [])

// Check that all plugins are loaded correctly
plugins
  .filter(p => !p.value)
  .forEach(p => {
    throw new Error(`Plugin ${p.name} could not be loaded correctly`)
  })

const catBasic = 'Containers'
const catText = 'Texts'
const catMedia = 'Media'
const catComponents = 'Components'

const projectId = new URL(location.href).searchParams.get('projectId') || 'default'
const rootUrl = '.'

export const defaultConfig = {

  /**
   * debug mode
   */
  debug: false,

  /**
   * Grapesjs config
   */
  editor: {
    container: '#gjs',
    height: '100%',
    showOffsets: 1,
    showDevices: 1,

    pageManager: true,

    layerManager: {
      appendTo: '.layer-manager-container',
    },

    blockManager: {
      appendTo: '.block-manager-container',
    },

    storageManager: {
      autoload: true,
      type: DIRECTUS_URL ? 'directus' : 'remote',
      options: {
        remote: {
          urlStore: `${ rootUrl }/website/?projectId=${projectId}`,
          urlLoad: `${ rootUrl }/website/?projectId=${projectId}`,
        },
      },
    },

    plugins: plugins.map(p => p.value),
    importWebpage: {
      modalImportLabel: '',
      modalImportContent: 'Paste a web page HTML code here.',
      modalImportButton: 'Import',
      modalImportTitle: 'Import from website',
    },
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
            className: 'symbols-btn fa fa-fw fa-diamond',
            attributes: { title: 'Symbols', containerClassName: 'symbols-list-container', },
            command: 'open-symbols',
            buttons: [
              {
                id: 'symbol-create-button',
                className: 'pages__add-page fa fa-plus',
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
            className: 'layer-manager-btn fa fa-fw fa-list',
            attributes: { title: 'Layers', containerClassName: 'layer-manager-container', },
            command: 'open-layers',
          }, {
            id: 'font-dialog-btn',
            className: 'font-manager-btn fa fa-fw fa-font',
            attributes: { title: 'Fonts' },
            command: cmdOpenFonts,
          }, {
            id: 'settings-dialog-btn',
            className: 'page-panel-btn fa fa-fw fa-cog',
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
      [publishPlugin as any]: {
        appendTo: 'options',
        rootUrl,
        projectId,
      },
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
      [directusPlugin as any]: {
        directusUrl: DIRECTUS_URL,
      },
    },
  },
}
