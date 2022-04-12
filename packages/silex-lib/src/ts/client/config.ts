import * as blocksBasicPlugin from 'grapesjs-blocks-basic/dist/grapesjs-blocks-basic.min.js'
import * as headerPlugin from 'grapesjs-plugin-header/dist/grapesjs-plugin-header.min.js'

import { pagePanelPlugin } from './grapesjs/page-panel';
import { newPageDialog, cmdOpenNewPageDialog } from './grapesjs/new-page-dialog'
import { projectBarPlugin } from './grapesjs/project-bar'
import { settingsDialog, cmdOpenSettings } from './grapesjs/settings'

/**
 * @fileoverview Silex config overridable from index.pug
 */

const catBasic = 'Containers'
const catText = 'Texts'
const projectId = new URL(location.href).searchParams.get('projectId')
const loadEndpoint = `/website/?projectId=${projectId}`
const uploadEndpoint = `/assets/?projectId=${projectId}`

// reference to avoid removal by typescript
blocksBasicPlugin
headerPlugin
projectBarPlugin
pagePanelPlugin
newPageDialog
settingsDialog

export const defaultConfig = {

  /**
   * debug mode
   */
  debug: false,

  /**
   * Grapesjs config
   */
  editor: {
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
      // stepsBeforeSave: 3,
      // autoload: true,
      // autosave: true,
      // For custom parameters/headers on requests
      // params: { _some_token: '....' },
      // headers: { Authorization: 'Basic ...' },
    },

    // storageManager: {
    //   type: 'remote',
    //   options: {
    //     remote: {
    //       // call editor.Storage.get('remote').store(data, editor.Storage.getConfig().options.remote)
    //       urlLoad: projectEndpoint,
    //       urlStore: projectEndpoint,
    //       onStore: data => data,
    //       onLoad: result => result,
    //       autoload: true,
    //       autosave: true,
    //       // stepsBeforeSave: 1, // If autosave is enabled, indicates how many changes are necessary before the store method is triggered
    //     },
    //   },
    // },
    container: '#gjs',

    plugins: [
      'grapesjs-plugin-header',
      'gjs-blocks-basic',
      'project-bar',
      'page-panel',
      'new-page-dialog',
      'settings-dialog',
    ],
    pluginsOpts: {
      'gjs-blocks-basic': {
        category: catBasic,
        flexGrid: true,
      },
      'grapesjs-plugin-header': {
        category: catText,
        labelN1: 'Heading 1 (H1)',
        labelN2: 'Heading 2 (H2)',
        labelN3: 'Heading 3 (H3)',
        labelN4: 'Heading 4 (H4)',
        labelN5: 'Heading 5 (H5)',
        labelN6: 'Heading 6 (H6)',
      },
      'project-bar': {
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
            command: 'open-pages',
          }, {
            id: 'settings-dialog-btn',
            className: 'page-panel-btn fa fa-fw fa-cog',
            attributes: { title: 'Settings' },
            command: 'open-settings',
          },
        ],
      },
      'page-panel': {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      }
    },
  },
}
