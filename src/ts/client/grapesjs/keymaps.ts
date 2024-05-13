import {Editor, Keymap, PluginOptions} from 'grapesjs'
import {cmdPublish} from './PublicationUi'
import {cmdOpenFonts} from '@silexlabs/grapesjs-fonts'
import {cmdToggleBlocks, cmdToggleLayers, cmdToggleNotifications, cmdToggleSymbols} from './index'
import {cmdTogglePages} from './page-panel'
import {cmdOpenSettings} from './settings'
import {selectBody} from '../utils'

export const cmdSelectBody = 'select-body'
export let prefixKey = 'shift'

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
  km.add('general:open-settings', prefixKey + '+alt+s', editor => toggleCommand(editor, cmdOpenSettings))
  km.add('general:open-publish', prefixKey + '+alt+p', editor => toggleCommand(editor, cmdPublish))
  km.add('general:open-fonts', prefixKey + '+alt+f', editor => toggleCommand(editor, cmdOpenFonts))
  km.add('panels:preview-mode', 'space', editor => toggleCommand(editor, 'preview'))
  km.add('panels:layers', prefixKey + '+l', editor => toggleCommand(editor, cmdToggleLayers))
  km.add('panels:blocks', prefixKey + '+a', editor => toggleCommand(editor, cmdToggleBlocks))
  km.add('panels:notifications', prefixKey + '+n', editor => toggleCommand(editor, cmdToggleNotifications))
  km.add('panels:pages', prefixKey + '+p', editor => toggleCommand(editor, cmdTogglePages))
  km.add('panels:symbols', prefixKey + '+s', editor => toggleCommand(editor, cmdToggleSymbols))
  km.add('panels:close-panel', 'escape', resetPanel)
  // TODO: Add a keymap to close the left panel on Escape

  // Workflow-specific keymaps
  km.add('workflow:select-body', prefixKey + '+b', cmdSelectBody)
}
