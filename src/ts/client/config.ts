import blocksBasicPlugin from 'grapesjs-blocks-basic/dist/grapesjs-blocks-basic.min.js'
import headerPlugin from 'grapesjs-plugin-header/dist/grapesjs-plugin-header.min.js'
import sliderPlugin from 'grapesjs-lory-slider/dist/grapesjs-lory-slider.min.js'
import touchPlugin from 'grapesjs-touch/dist/grapesjs-touch.min.js'
import styleFilterPlugin from 'grapesjs-style-filter'
import formPlugin from 'grapesjs-plugin-forms/dist/grapesjs-plugin-forms.min.js'
import codePlugin from 'grapesjs-custom-code/dist/grapesjs-custom-code.min.js'

import { pagePanelPlugin, cmdTogglePages } from './grapesjs/page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './grapesjs/new-page-dialog'
import { projectBarPlugin } from './grapesjs/project-bar'
import { settingsDialog, cmdOpenSettings } from './grapesjs/settings'
import { blocksPlugin } from './grapesjs/blocks'
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
      newPageDialog,
      pagePanelPlugin,
      headerPlugin,
      blocksBasicPlugin,
      blocksPlugin,
      sliderPlugin,
      touchPlugin,
      styleFilterPlugin,
      formPlugin,
      codePlugin,
      internalLinksPlugin,
    ],
    importWebpage: {
      modalImportLabel: '',
      modalImportContent: 'Paste a web page HTML code here.',
      modalImportButton: 'Import',
      modalImportTitle: 'Import from website',
    },
    pluginsOpts: {
      [blocksBasicPlugin]: {
        category: catBasic,
        flexGrid: true,
      },
      [headerPlugin]: {
        category: catText,
        labelN1: 'Heading 1 (H1)',
        labelN2: 'Heading 2 (H2)',
        labelN3: 'Heading 3 (H3)',
        labelN4: 'Heading 4 (H4)',
        labelN5: 'Heading 5 (H5)',
        labelN6: 'Heading 6 (H6)',
      },
      [projectBarPlugin]: {
        panels: [
          {
            id: 'dash',
            className: 'logo',
            attributes: { title: 'Go to your dashboard' },
            link: '/',
            command: 'open-dash',
          }, {
            id: 'block-manager-btn',
            className: 'block-manager-btn fa fa-fw fa-plus-square',
            attributes: { title: 'Insert new elements', containerClassName: 'block-manager-container', },
            command: 'open-blocks',
          }, {
            id: 'layer-manager-btn',
            className: 'layer-manager-btn fa fa-fw fa-list',
            attributes: { title: 'Layers', containerClassName: 'layer-manager-container', },
            command: 'open-layers',
          }, {
            id: 'page-panel-btn',
            className: 'page-panel-btn fa fa-fw fa-file',
            attributes: { title: 'Pages', containerClassName: 'page-panel-container', },
            command: cmdTogglePages,
          }, {
            id: 'settings-dialog-btn',
            className: 'page-panel-btn fa fa-fw fa-cog',
            attributes: { title: 'Settings' },
            command: cmdOpenSettings,
          },
        ],
      },
      [pagePanelPlugin]: {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      },

      [sliderPlugin]: {
        sliderBlock: {
          category: catMedia,
        },
      },
      [codePlugin]: {
        blockLabel: 'HTML',
        blockCustomCode: {
          category: catComponents,
        }
      },
    },
  },
}
