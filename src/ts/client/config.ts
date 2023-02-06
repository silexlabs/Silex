import blocksBasicPlugin from 'grapesjs-blocks-basic'
import headerPlugin from 'grapesjs-plugin-header/dist/grapesjs-plugin-header.min.js'
import sliderPlugin from 'grapesjs-lory-slider/dist/grapesjs-lory-slider.min.js'
import touchPlugin from 'grapesjs-touch/dist/grapesjs-touch.min.js'
import styleFilterPlugin from 'grapesjs-style-filter'
import formPlugin from 'grapesjs-plugin-forms'
import codePlugin from 'grapesjs-custom-code'
import uiSuggestClasses from '@silexlabs/grapesjs-ui-suggest-classes'
import symbolsPlugin from '@silexlabs/grapesjs-symbols'
import { fontsDialogPlugin, cmdOpenFonts } from '@silexlabs/grapesjs-fonts'
import symbolDialogsPlugin, { cmdPromptAddSymbol } from './grapesjs/symbolDialogs'

import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './grapesjs/page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './grapesjs/new-page-dialog'
import { projectBarPlugin } from './grapesjs/project-bar'
import { settingsDialog, cmdOpenSettings } from './grapesjs/settings'
import { blocksPlugin } from './grapesjs/blocks'
import { richTextPlugin } from './grapesjs/rich-text'
import { internalLinksPlugin } from './grapesjs/internal-links'

/**
 * @fileoverview Silex config overridable from index.pug
 */

const catBasic = 'Containers'
const catText = 'Texts'
const catMedia = 'Media'
const catComponents = 'Components'
const projectId = new URL(location.href).searchParams.get('projectId')
const loadEndpoint = `/website/?projectId=${projectId}`
const uploadEndpoint = `/assets/?projectId=${projectId}`

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

    assetManager: {
      upload: uploadEndpoint,
    },

    storageManager: {
      id: '', // do not add a prefix to the saved object
      type: 'remote',
      urlStore: loadEndpoint,
      urlLoad: loadEndpoint,
    },

    plugins: [
      projectBarPlugin, // has to be before panels and dialogs
      settingsDialog,
      fontsDialogPlugin,
      newPageDialog,
      pagePanelPlugin,
      headerPlugin,
      blocksBasicPlugin,
      blocksPlugin,
      richTextPlugin,
      sliderPlugin,
      touchPlugin,
      styleFilterPlugin,
      formPlugin,
      codePlugin,
      internalLinksPlugin,
      uiSuggestClasses,
      symbolDialogsPlugin,
      symbolsPlugin,
    ],
    importWebpage: {
      modalImportLabel: '',
      modalImportContent: 'Paste a web page HTML code here.',
      modalImportButton: 'Import',
      modalImportTitle: 'Import from website',
    },
    pluginsOpts: {
      [blocksBasicPlugin as any]: {
        category: catBasic,
        flexGrid: true,
      },
      [headerPlugin as any]: {
        category: catText,
        labelN1: 'Heading 1 (H1)',
        labelN2: 'Heading 2 (H2)',
        labelN3: 'Heading 3 (H3)',
        labelN4: 'Heading 4 (H4)',
        labelN5: 'Heading 5 (H5)',
        labelN6: 'Heading 6 (H6)',
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
          },
        ],
      },
      [pagePanelPlugin as any]: {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      },

      [sliderPlugin as any]: {
        sliderBlock: {
          category: catMedia,
        },
      },
      [codePlugin as any]: {
        blockLabel: 'HTML',
        blockCustomCode: {
          category: catComponents,
        }
      },
      [uiSuggestClasses as any]: {},
      [symbolsPlugin as any]: {
        appendTo: '.symbols-list-container',
      },
      [fontsDialogPlugin as any]: {
        api_key: 'AIzaSyAdJTYSLPlKz4w5Iqyy-JAF2o8uQKd1FKc',
      },
    },
  },
}
