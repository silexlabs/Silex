/**
 * Plugin options configuration for all GrapesJS plugins
 */

import { EditorConfig } from 'grapesjs'
import { PluginDefinition } from './dynamic-plugins'
import { staticPlugins, cmdPromptAddSymbol, cmdTogglePages, cmdAddPage, cmdOpenSettings, PROJECT_BAR_PANEL_ID, cmdOpenNewPageDialog } from './static-plugins'
import { NotificationEditor } from '@silexlabs/grapesjs-notifications'
import { cmdKeymapsDialog } from '@silexlabs/grapesjs-keymaps-dialog'
// Commands will be imported from the main index file
export const cmdToggleLayers = 'open-layers'
export const cmdToggleBlocks = 'open-blocks'
export const cmdToggleSymbols = 'open-symbols'
export const cmdToggleNotifications = 'open-notifications'
import { ClientConfig } from '../config'
import { titleCase } from '../utils'
import { defaultKms } from './keymaps'

// Constants
const PRIMARY_COLOR = '#333333'
const SECONDARY_COLOR = '#ddd'
const TERTIARY_COLOR = '#8873FE'
const QUATERNARY_COLOR = '#A291FF'
const catBasic = 'Containers'
const catComponents = 'Components'

// Create notification container
const notificationContainer = document.createElement('div')

/**
 * Get plugin options for static plugins
 */
export function getStaticPluginOptions(config: ClientConfig) {
  const { websiteId, storageId } = config
  
  const projectBarPluginValue = staticPlugins.find(p => p.name === './project-bar')?.value
  const imgPluginValue = staticPlugins.find(p => p.name === './img')?.value
  const pagePanelPluginValue = staticPlugins.find(p => p.name === './page-panel')?.value
  const internalLinksPluginValue = staticPlugins.find(p => p.name === './internal-links')?.value
  const keymapsPluginValue = staticPlugins.find(p => p.name === './keymaps')?.value
  const loginDialogPluginValue = staticPlugins.find(p => p.name === './LoginDialog')?.value

  return {
    [projectBarPluginValue?.toString()]: {
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
            // @ts-ignore - editor will be available at runtime
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
        }, {
          id: 'logout-btn',
          className: 'logout-btn fa fa-fw fa-power-off',
          name: 'Logout',
          attributes: { title: 'Logout' },
          command: () => {
            // @ts-ignore - editor will be available at runtime
            editor.runCommand('logout')
          },
        }],
    },
    ...(pagePanelPluginValue && {
      [pagePanelPluginValue.toString()]: {
        cmdOpenNewPageDialog,
        cmdOpenSettings,
        appendTo: '.page-panel-container',
      }
    }),
    ...(internalLinksPluginValue && {
      [internalLinksPluginValue.toString()]: {
        // FIXME: warn the user about links in error
        onError: (errors: any) => console.warn('Links errors:', errors),
      }
    }),
    ...(keymapsPluginValue && {
      [keymapsPluginValue.toString()]: {
        disableKeymaps: false,
      }
    }),
    ...(loginDialogPluginValue && {
      [loginDialogPluginValue.toString()]: {
        id: websiteId,
      }
    }),
    ...(imgPluginValue && {
      [imgPluginValue.toString()]: {
        replacedElements: config.replacedElements,
        websiteId,
        storageId,
      }
    }),
  }
}

/**
 * Get plugin options for dynamic plugins
 */
export function getDynamicPluginOptions(dynamicPlugins: PluginDefinition[], config: ClientConfig) {
  const options: any = {}

  dynamicPlugins.forEach(plugin => {
    const pluginKey = plugin.value.toString()
    
    switch (plugin.name) {
    case 'grapesjs-blocks-basic':
      options[pluginKey] = {
        blocks: ['text', 'image', 'video', 'map'],
        category: catBasic,
      }
      break
        
    case '@silexlabs/grapesjs-fonts':
      options[pluginKey] = {
        api_key: (config as any).fontsApiKey || 'dummy-key-for-development',
        server_url: (config as any).fontsServerUrl,
        api_url: (config as any).fontsApiUrl,
      }
      break
        
    case '@silexlabs/grapesjs-filter-styles':
      options[pluginKey] = {
        appendBefore: '.gjs-sm-sectors',
      }
      break
        
    case 'grapesjs-custom-code':
      options[pluginKey] = {
        blockLabel: 'HTML',
        blockCustomCode: {
          category: catComponents,
        },
        codeViewOptions: {
          autoFormat: false,
        },
      }
      break
        
    case '@silexlabs/grapesjs-symbols':
      options[pluginKey] = {
        appendTo: '.symbols-list-container',
        emptyText: 'No symbol yet.',
        primaryColor: PRIMARY_COLOR,
        secondaryColor: SECONDARY_COLOR,
        highlightColor: TERTIARY_COLOR,
      }
      break
        
    case '@silexlabs/grapesjs-storage-rate-limit':
      options[pluginKey] = {
        time: 5000,
      }
      break
        
    case '@silexlabs/grapesjs-notifications':
      options[pluginKey] = {
        container: notificationContainer,
        reverse: true,
      }
      break
        
    case '@silexlabs/grapesjs-keymaps-dialog':
      options[pluginKey] = {
        longPressDuration: null,
        shortcut: 'shift+h',
      }
      break
    }
  })

  return options
}

export { notificationContainer }