import grapesjs from 'grapesjs'
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
import * as symbolsPlugin from '@silexlabs/grapesjs-symbols' // Why is this not working without *?
import loadingPlugin from '@silexlabs/grapesjs-loading'
import fontsDialogPlugin, { cmdOpenFonts } from '@silexlabs/grapesjs-fonts'
import symbolDialogsPlugin, { cmdPromptAddSymbol } from './symbolDialogs'

import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './new-page-dialog'
import { projectBarPlugin } from './project-bar'
import { settingsDialog, cmdOpenSettings } from './settings'
import { blocksPlugin } from './blocks'
import { semanticPlugin } from './semantic'
import { richTextPlugin } from './rich-text'
import { internalLinksPlugin } from './internal-links'
import { publishPlugin } from './publish'
import { templatePlugin } from './template'
import { eleventyPlugin } from './eleventy'

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
  {name: '@silexlabs/grapesjs-loading', value: loadingPlugin},
]
// Check that all plugins are loaded correctly
plugins
  .filter(p => !p.value)
  .forEach(p => {
    throw new Error(`Plugin ${p.name} could not be loaded correctly`)
  })

// ////////////////////
// Config
// ////////////////////
const catBasic = 'Containers'
const catComponents = 'Components'

export function getEditorConfig(id: string, rootUrl: string) {
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
      upload: `${rootUrl}assets/`,
    },

    storageManager: {
      autoload: true,
      type: 'remote',
      options: {
        remote: {
          urlStore: `${rootUrl}website/?id=${id}`,
          urlLoad: `${rootUrl}website/?id=${id}`,
        },
      },
    },

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
        id,
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
    },
  }
}

// ////////////////////
// Initialize editor
// ////////////////////
// Expose grapes for plugins
// window['grapesjs'] = grapesjs

// Keep a ref to the editor singleton
let editor

export function initEditor(config, grapesJsPlugins) {
  if(editor) throw new Error('Grapesjs editor already created')

  editor = grapesjs.init({
    plugins: [
      ...grapesJsPlugins,
      ...config.plugins,
    ],
    ...config,
  })

  // customize the editor
  ;['text']
    .forEach(id => editor.Blocks.get(id)?.set('category', 'Basics'))
  ;['image', 'video']
    .forEach(id => editor.Blocks.get(id)?.set('category', 'Media'))
  ;['map']
    .forEach(id => editor.Blocks.get(id)?.set('category', 'Components'))
  editor.Blocks.render()

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
    setTimeout(() => {
      editor.Panels.getPanel('views').buttons.remove('open-blocks')
      editor.Panels.getPanel('views').buttons.remove('open-layers')
      editor.Panels.getPanel('views').view.el.firstChild.style.justifyContent = 'initial' // align left
      editor.Panels.getPanel('options').buttons.remove('export-template')
    })

    // use the style filter plugin
    editor.StyleManager.addProperty('extra',{ extend: 'filter' })
  })

  editor.StorageManager.onError = (type: string, err: Error) => {
    editor.Modal.open(type === 'load' ? {
      title: 'Error loading website',
      content: `This website could not be loaded.<br><hr>Error: ${err.message}`,
    } : {
      title: 'Error saving website',
      content: `This website could not be saved.<br><hr>Error: ${err.message}`,
    })
  }
}

export function getEditor() {
  return editor
}
