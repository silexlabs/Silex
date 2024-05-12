import {Editor, PluginOptions} from 'grapesjs'
import {cmdPublish} from './PublicationUi'
import {cmdOpenFonts} from '@silexlabs/grapesjs-fonts'
import {cmdToggleBlocks, cmdToggleLayers, cmdToggleNotifications, cmdToggleSymbols} from './index'
import {cmdTogglePages} from './page-panel'
import {cmdOpenSettings} from './settings'
import {selectBody} from '../utils'

export const cmdSelectBody = 'select-body'

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

  const km = editor.Keymaps

  // Panels
  km.add('general:open-settings', 'shift+alt+s', editor => toggleCommand(editor, cmdOpenSettings))
  km.add('general:open-publish', 'shift+alt+p', editor => toggleCommand(editor, cmdPublish))
  km.add('general:open-fonts', 'shift+alt+f', editor => toggleCommand(editor, cmdOpenFonts))
  km.add('panel:preview', 'space', editor => toggleCommand(editor, 'preview'))
  km.add('panel:layers', 'shift+l', editor => toggleCommand(editor, cmdToggleLayers))
  km.add('panel:blocks', 'shift+a', editor => toggleCommand(editor, cmdToggleBlocks))
  km.add('panel:notifications', 'shift+n', editor => toggleCommand(editor, cmdToggleNotifications))
  km.add('panel:pages', 'shift+p', editor => toggleCommand(editor, cmdTogglePages))
  km.add('panel:symbols', 'shift+s', editor => toggleCommand(editor, cmdToggleSymbols))
  km.add('panel:close', 'tab', resetPanel)
  // TODO: Add a keymap to close the left panel on Escape

  // Workflow-specific keymaps
  km.add('workflow:select-body', 'shift+b', cmdSelectBody)
}
