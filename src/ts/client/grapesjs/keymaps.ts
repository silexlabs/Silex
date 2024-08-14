import {Editor, PluginOptions} from 'grapesjs'
import {isTextOrInputField, selectBody} from '../utils'
import {PublishableEditor} from './PublicationManager'

// Utility functions

function setButton(editor: Editor, panel_id: string, btn_id: string, active?: boolean): void {
  const button = editor.Panels.getButton(panel_id, btn_id)
  button.set('active', active ?? !button.get('active'))
}

/**
 * Opens the Publish dialog and publishes the website.
 * @param editor The editor.
 */
function publish(editor: Editor): void {
  setButton(editor, 'options', 'publish-button', true)
  editor.runCommand('publish')
}

/**
 * Closes any open left panel.
 * @param editor The editor.
 */
function resetPanel(editor: Editor): void {
  const projectBarBtns = editor.Panels.getPanels().get('project-bar-panel').buttons
  projectBarBtns.forEach(button => button.set('active', false))
}

/**
 * Escapes the current context in this order : modal, Publish dialog, left panel.
 * If none of these are open, it selects the body.
 * @param editor The editor.
 */
function escapeContext(editor: Editor): void {
  const publishDialog = (editor as PublishableEditor).PublicationManager.dialog
  const projectBarPanel = editor.Panels.getPanel('project-bar-panel')

  if (editor.Modal.isOpen()) {
    editor.Modal.close()
  } else if (publishDialog && publishDialog.isOpen) {
    publishDialog.closeDialog()
  } else if (projectBarPanel.buttons.some(b => b.get('active'))) {
    resetPanel(editor)
  } else {
    selectBody(editor)
  }
}

function whenNoFocus(editor: Editor, cbk: () => void): void {
  if(editor.getEditing()) return
  if(editor.Modal.isOpen()) return
  const target = document.activeElement as HTMLElement | null
  if (target && target.tagName === 'INPUT' && target.getAttribute('type') === 'submit') return
  if (target && isTextOrInputField(target)) return
  cbk()
}

// Constants

export const cmdSelectBody = 'select-body'
export let prefixKey = 'shift'

export const defaultKms = {
  kmOpenSettings: {
    id: 'general:open-settings',
    keys: 'alt+s',
    handler: editor => setButton(editor, 'project-bar-panel', 'settings-dialog-btn')
  },
  kmOpenPublish: {
    id: 'general:open-publish',
    keys: 'alt+p',
    handler: editor => setButton(editor, 'options', 'publish-button')
  },
  kmOpenFonts: {
    id: 'general:open-fonts',
    keys: 'alt+f',
    handler: editor => setButton(editor, 'project-bar-panel', 'font-dialog-btn')
  },
  kmPreviewMode: {
    id: 'general:preview-mode',
    keys: 'tab',
    handler: editor => whenNoFocus(editor, () => setButton(editor, 'options', 'preview'))
  },
  kmLayers: {
    id: 'panels:layers',
    keys: prefixKey + '+l',
    handler: editor => setButton(editor, 'project-bar-panel', 'layer-manager-btn')
  },
  kmBlocks: {
    id: 'panels:blocks',
    keys: prefixKey + '+a',
    handler: editor => setButton(editor, 'project-bar-panel', 'block-manager-btn')
  },
  kmNotifications: {
    id: 'panels:notifications',
    keys: prefixKey + '+n',
    handler: editor => setButton(editor, 'project-bar-panel', 'notifications-btn')
  },
  kmPages: {
    id: 'panels:pages',
    keys: prefixKey + '+p',
    handler: editor => setButton(editor, 'project-bar-panel', 'page-panel-btn')
  },
  kmSymbols: {
    id: 'panels:symbols',
    keys: prefixKey + '+s',
    handler: editor => setButton(editor, 'project-bar-panel', 'symbols-btn')
  },
  kmStyleManager: {
    id: 'panels:style-manager',
    keys: 'r',
    handler: editor => setButton(editor, 'views', 'open-sm', true)
  },
  kmTraitsManager: {
    id: 'panels:traits',
    keys: 't',
    handler: editor => setButton(editor, 'views', 'open-tm', true)
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
  },
  kmPublish: {
    id: 'workflow:publish',
    keys: 'ctrl+alt+p',
    handler: publish
  },
  kmAddPage: {
    id: 'pages:add-page',
    keys: 'ctrl+alt+n',
    handler: 'pages:add'
  },
  kmRemovePage: {
    id: 'pages:remove-page',
    keys: 'ctrl+alt+backspace',
    handler: 'pages:remove'
  },
  kmClonePage: {
    id: 'pages:clone-page',
    keys: 'ctrl+alt+d',
    handler: 'pages:clone'
  },
  kmSelectNextPage: {
    id: 'pages:select-next',
    keys: 'ctrl+alt+j',
    handler: 'pages:select-next'
  },
  kmSelectPrevPage: {
    id: 'pages:select-previous',
    keys: 'ctrl+alt+k',
    handler: 'pages:select-prev'
  },
  kmSelectFirstPage: {
    id: 'pages:select-first',
    keys: 'ctrl+alt+h',
    handler: 'pages:select-first'
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
    km.add(defaultKms[keymap].id, defaultKms[keymap].keys, defaultKms[keymap].handler, {
      prevent: true,
      ...defaultKms[keymap].options
    })
  }

  // Handling the Escape keymap during text edition
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === defaultKms.kmClosePanel.keys) {
      const target = event.target as HTMLElement | null
      if(editor.getEditing()) return // Close the rich text edition
      if(editor.Modal.isOpen()) {
        editor.Modal.close()
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
