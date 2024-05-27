import {Editor, PluginOptions} from 'grapesjs'
import {cmdOpenFonts} from '@silexlabs/grapesjs-fonts'
import {cmdToggleBlocks, cmdToggleLayers, cmdToggleNotifications, cmdToggleSymbols} from './index'
import {cmdTogglePages} from './page-panel'
import {cmdOpenSettings} from './settings'
import {isTextOrInputField, selectBody} from '../utils'
import {PublishableEditor} from './PublicationManager'
import {cmdPublish} from './PublicationUi'

function getPanelCommandIds (): string[] {
  return [
    cmdToggleBlocks,
    cmdToggleLayers,
    cmdToggleNotifications,
    cmdToggleSymbols,
    cmdTogglePages,
    cmdOpenSettings,
    cmdOpenFonts
  ]
}

// Utility functions

/**
 * Toggles a stateful command.
 * @param editor The editor.
 * @param name The command name.
 */
function toggleCommand (editor: Editor, name: string): void {
  const cmd = editor.Commands

  if (!cmd.isActive(name)) {
    resetPanel(editor)
    cmd.run(name)
  } else {
    cmd.stop(name)
  }
}

/**
 * Opens the Traits Manager panel.
 * @param editor The editor.
 */
function openTraitsManager(editor: Editor): void {
  editor.Panels.getButton('views', 'open-tm').set('active', true)
}

/**
 * Opens the Style Manager panel.
 * @param editor The editor.
 */
function openStyleManager(editor: Editor): void {
  editor.Panels.getButton('views', 'open-sm').set('active', true)
}

/**
 * Opens the Publish dialog and publishes the website.
 * @param editor The editor.
 */
function publish(editor: Editor): void {
  editor.runCommand(cmdPublish)
  editor.runCommand('publish')
}

/**
 * Closes any open left panel.
 * @param editor The editor.
 */
function resetPanel(editor: Editor): void {
  getPanelCommandIds().forEach(p => editor.Commands.stop(p))
}

/**
 * Escapes the current context in this order : modal, Publish dialog, left panel.
 * If none of these are open, it selects the body.
 * @param editor The editor.
 */
function escapeContext(editor: Editor): void {
  const publishDialog = (editor as PublishableEditor).PublicationManager.dialog

  if (editor.Modal.isOpen()) {
    editor.Modal.close()
  } else if (publishDialog && publishDialog.isOpen) {
    publishDialog.closeDialog()
  } else if (getPanelCommandIds().some(cmd => editor.Commands.isActive(cmd))) {
    resetPanel(editor)
  } else {
    selectBody(editor)
  }
}

// Constants

export const cmdSelectBody = 'select-body'
export const cmdDuplicateSelection = 'duplicate-selection'
export let prefixKey = 'shift'

export const defaultKms = {
  kmOpenSettings: {
    id: 'general:open-settings',
    keys: 'alt+s',
    handler: editor => toggleCommand(editor, cmdOpenSettings)
  },
  kmOpenPublish: {
    id: 'general:open-publish',
    keys: 'alt+p',
    handler: cmdPublish
  },
  kmOpenFonts: {
    id: 'general:open-fonts',
    keys: 'alt+f',
    handler: editor => toggleCommand(editor, cmdOpenFonts)
  },
  kmPreviewMode: {
    id: 'general:preview-mode',
    keys: 'tab',
    handler: editor => toggleCommand(editor, 'preview'),
    options: {prevent: true}
  },
  kmLayers: {
    id: 'panels:layers',
    keys: prefixKey + '+l',
    handler: editor => toggleCommand(editor, cmdToggleLayers)
  },
  kmBlocks: {
    id: 'panels:blocks',
    keys: prefixKey + '+a',
    handler: editor => toggleCommand(editor, cmdToggleBlocks)
  },
  kmNotifications: {
    id: 'panels:notifications',
    keys: prefixKey + '+n',
    handler: editor => toggleCommand(editor, cmdToggleNotifications)
  },
  kmPages: {
    id: 'panels:pages',
    keys: prefixKey + '+p',
    handler: editor => toggleCommand(editor, cmdTogglePages)
  },
  kmSymbols: {
    id: 'panels:symbols',
    keys: prefixKey + '+s',
    handler: editor => toggleCommand(editor, cmdToggleSymbols)
  },
  kmStyleManager: {
    id: 'panels:style-manager',
    keys: 'r',
    handler: openStyleManager
  },
  kmTraitsManager: {
    id: 'panels:traits',
    keys: 't',
    handler: openTraitsManager
  },
  kmClosePanel: {
    id: 'panels:close-panel',
    keys: 'escape',
    handler: escapeContext
  },
  kmSelectBody: {
    id: 'workflow:select-body',
    keys: prefixKey + '+b',
    handler: cmdSelectBody
  },
  kmDuplicateSelection: {
    id: 'workflow:duplicate-selection',
    keys: 'ctrl+d',
    handler: 'tlb-clone',
    options: {prevent: true}
  },
  kmPublish: {
    id: 'workflow:publish',
    keys: 'ctrl+alt+p',
    handler: publish
  }
}

// Main part

export function keymapsPlugin(editor: Editor, opts: PluginOptions): void {
  // Commands
  editor.Commands.add(cmdSelectBody, selectBody)

  if (opts.disableKeymaps) return
  if (opts.prefixKey) prefixKey = opts.prefixKey

  const km = editor.Keymaps

  // Default keymaps
  for (const keymap in defaultKms) {
    km.add(defaultKms[keymap].id, defaultKms[keymap].keys, defaultKms[keymap].handler, defaultKms[keymap].options)
  }

  // Handling the Escape keymap during text edition
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === defaultKms.kmClosePanel.keys) {
      const target = event.target as HTMLElement | null
      const rte = editor.getEditing()

      if (rte) { // If in Rich Text edition...
        // TODO: Close the Rich Text edition and un-focus the text field
      } else if (target) { // If target exists...
        if (target.tagName === 'INPUT' && target.getAttribute('type') === 'submit') { // If it's a submit button...
          escapeContext(editor)
        } else if (isTextOrInputField(target)) { // If it's a text field...
          target.blur()
        }
      }
    }
  })
}
