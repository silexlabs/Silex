import { Editor } from 'grapesjs'
import { KeymapsDialogManager } from './KeymapsDialogManager'

export const cmdKeymapsDialog = 'open-keymaps-dialog'

export const defaultOptions = {
  longPressKey: 'shift',
  longPressDuration: 800,
  shortcut: 'shift+k',
  css: null
}

export default (editor: Editor, opts = {}): void => {
  const options = {
    ...defaultOptions,
    ...opts
  }

  const manager = new KeymapsDialogManager(editor, options)

  // Command
  editor.Commands.add(cmdKeymapsDialog, {
    run(editor: Editor) {
      manager.openDialog()
    },
    stop(editor: Editor) {
      manager.closeDialog()
    }
  })

  // Shortcut triggering the command
  let isShortcutActive = false
  if (options.shortcut) {
    editor.Keymaps.add('general:toggle-shortcuts-help', options.shortcut, () => {
      if (editor.Commands.isActive(cmdKeymapsDialog)) {
        isShortcutActive = false
        editor.stopCommand(cmdKeymapsDialog)
      } else {
        isShortcutActive = true
        editor.runCommand(cmdKeymapsDialog)
      }
    })
  }

  if (options.longPressDuration && options.longPressKey) {
    let longPressTimeout: NodeJS.Timeout | undefined = undefined

    document.addEventListener('keydown', event => {
      // Handle long press of the longPressKey
      if (event.key.toLowerCase() === options.longPressKey) {
        if (!longPressTimeout) {
          longPressTimeout = setTimeout(() => {
            editor.runCommand(cmdKeymapsDialog)
          }, options.longPressDuration)
        }
      }
    })

    document.addEventListener('keyup', event => {
      // Clear the long press timeout if the key is released (and close the dialog)
      if (event.key.toLowerCase() === options.longPressKey && !isShortcutActive) {
        if (longPressTimeout) {
          clearTimeout(longPressTimeout)
          longPressTimeout = undefined
        }
        editor.stopCommand(cmdKeymapsDialog)
      }
    })
  }
}