import {Editor, PluginOptions} from 'grapesjs'
import {cmdPublish} from './PublicationUi'
import {cmdOpenFonts} from '@silexlabs/grapesjs-fonts'
import {cmdToggleBlocks, cmdToggleLayers, cmdToggleNotifications, cmdToggleSymbols} from './index'
import {cmdTogglePages} from './page-panel'
import {cmdOpenSettings} from './settings'
import {selectBody} from '../utils'

export const cmdSelectBody = 'select-body'
export let prefixKey = 'Shift'
export const defaultKms = {
  kmOpenSettings: prefixKey + '+Alt+S',
  kmOpenPublish: prefixKey + '+Alt+P',
  kmOpenFonts: prefixKey + '+Alt+F',
  kmPreviewMode: 'tab',
  kmLayers: prefixKey + '+L',
  kmBlocks: prefixKey + '+A',
  kmNotifications: prefixKey + '+N',
  kmPages: prefixKey + '+P',
  kmSymbols: prefixKey + '+S',
  kmClosePanel: 'Escape'
}

// Utility functions

const toggleCommand = (editor: Editor, name: string): void => {
  const cmd = editor.Commands

  if (!cmd.isActive(name)) {
    resetPanel(editor)
    cmd.run(name)
  } else {
    cmd.stop(name)
  }
}

const resetPanel = (editor: Editor): void => {
  const panels: string[] = [
    cmdToggleBlocks,
    cmdToggleLayers,
    cmdToggleNotifications,
    cmdToggleSymbols,
    cmdTogglePages,
    cmdOpenSettings,
    cmdOpenFonts
  ]
  panels.forEach(p => editor.Commands.stop(p))
}

// Main part

export const keymapsPlugin = (editor: Editor, opts: PluginOptions): void => {
  // Commands
  editor.Commands.add(cmdSelectBody, selectBody)

  if (opts.disableKeymaps) return
  if (opts.prefixKey) prefixKey = opts.prefixKey

  const km = editor.Keymaps

  // Panels
  km.add('general:open-settings', defaultKms.kmOpenSettings.toLowerCase(), editor => toggleCommand(editor, cmdOpenSettings))
  km.add('general:open-publish', defaultKms.kmOpenPublish.toLowerCase(), editor => toggleCommand(editor, cmdPublish))
  km.add('general:open-fonts', defaultKms.kmOpenFonts.toLowerCase(), editor => toggleCommand(editor, cmdOpenFonts))
  km.add('general:preview-mode', defaultKms.kmPreviewMode.toLowerCase(), editor => toggleCommand(editor, 'preview'), {prevent: true})
  km.add('panels:layers', defaultKms.kmLayers.toLowerCase(), editor => toggleCommand(editor, cmdToggleLayers))
  km.add('panels:blocks', defaultKms.kmBlocks.toLowerCase(), editor => toggleCommand(editor, cmdToggleBlocks))
  km.add('panels:notifications', defaultKms.kmNotifications.toLowerCase(), editor => toggleCommand(editor, cmdToggleNotifications))
  km.add('panels:pages', defaultKms.kmPages.toLowerCase(), editor => toggleCommand(editor, cmdTogglePages))
  km.add('panels:symbols', defaultKms.kmSymbols.toLowerCase(), editor => toggleCommand(editor, cmdToggleSymbols))
  km.add('panels:close-panel', defaultKms.kmClosePanel.toLowerCase(), resetPanel)
  // TODO: Add a keymap to close the left panel on Escape

  // Workflow-specific keymaps
  km.add('workflow:select-body', prefixKey + '+b', cmdSelectBody)
}
