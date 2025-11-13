/**
 * Static plugin definitions for internal GrapesJS plugins
 * These are bundled with the main application
 */

import symbolDialogsPlugin, { cmdPromptAddSymbol } from './symbolDialogs'
import loginDialogPlugin, { LoginDialogOptions, cmdLogout } from './LoginDialog'
import footerPlugin from './footer'
import breadcrumbsPlugin from './breadcrumbs'
import imgPlugin from './img'
import liPlugin from './li'
import flexPlugin from './flex'
import cssPropsPlugin from './css-props'
import resizePanelPlugin from './resize-panel'
import { pagePanelPlugin, cmdTogglePages, cmdAddPage } from './page-panel'
import { newPageDialog, cmdOpenNewPageDialog } from './new-page-dialog'
import { PROJECT_BAR_PANEL_ID, projectBarPlugin } from './project-bar'
import { settingsDialog, cmdOpenSettings } from './settings'
import { blocksPlugin } from './blocks'
import { lottiePlugin } from './lottie'
import ViewButtons from './view-buttons'
import { semanticPlugin } from './semantic'
import { richTextPlugin } from './rich-text'
import { internalLinksPlugin } from './internal-links'
import { keymapsPlugin } from './keymaps'
import publicationManagerPlugin from './PublicationManager'
import { storagePlugin } from './storage'
import uploadProgress from './upload-progress'

export interface PluginDefinition {
  name: string
  value: any
}

export const staticPlugins: PluginDefinition[] = [
  { name: './symbolDialogs', value: symbolDialogsPlugin },
  { name: './LoginDialog', value: loginDialogPlugin },
  { name: './footer', value: footerPlugin },
  { name: './breadcrumbs', value: breadcrumbsPlugin },
  { name: './img', value: imgPlugin },
  { name: './li', value: liPlugin },
  { name: './flex', value: flexPlugin },
  { name: './css-props', value: cssPropsPlugin },
  { name: './resize-panel', value: resizePanelPlugin },
  { name: './page-panel', value: pagePanelPlugin },
  { name: './new-page-dialog', value: newPageDialog },
  { name: './project-bar', value: projectBarPlugin },
  { name: './settings', value: settingsDialog },
  { name: './blocks', value: blocksPlugin },
  { name: './lottie', value: lottiePlugin },
  { name: './view-buttons', value: ViewButtons },
  { name: './semantic', value: semanticPlugin },
  { name: './rich-text', value: richTextPlugin },
  { name: './internal-links', value: internalLinksPlugin },
  { name: './keymaps', value: keymapsPlugin },
  { name: './PublicationManager', value: publicationManagerPlugin },
  { name: './storage', value: storagePlugin },
  { name: './upload-progress', value: uploadProgress },
]

// Validate all static plugins are loaded correctly
staticPlugins
  .filter(p => typeof p.value !== 'function')
  .forEach(p => {
    throw new Error(`Plugin ${p.name} could not be loaded correctly (${p.value})`)
  })

// Export named functions for use in plugin options
export {
  cmdPromptAddSymbol,
  cmdLogout,
  cmdTogglePages,
  cmdAddPage,
  cmdOpenNewPageDialog,
  PROJECT_BAR_PANEL_ID,
  cmdOpenSettings,
}