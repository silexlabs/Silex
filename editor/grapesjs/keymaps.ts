import {Editor, PluginOptions} from 'grapesjs'
import {isTextOrInputField, selectBody} from '../utils'
import {PublishableEditor} from './PublicationManager'
import {cmdOpenSettings} from './settings'

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
 * Escapes the current context in this order : preview mode, modal, Publish dialog, left panel.
 * If none of these are open, it selects the body.
 * @param editor The editor.
 */
function escapeContext(editor: Editor): void {
  const publishDialog = (editor as PublishableEditor).PublicationManager.dialog
  const projectBarPanel = editor.Panels.getPanel('project-bar-panel')

  if (editor.Commands.isActive('preview')) {
    editor.stopCommand('preview')
  } else if (editor.Modal.isOpen()) {
    editor.Modal.close()
  } else if (publishDialog && publishDialog.isOpen) {
    publishDialog.closeDialog()
  } else if (projectBarPanel.buttons.some(b => b.get('active'))) {
    resetPanel(editor)
  } else {
    selectBody(editor)
  }
}

/**
 * Returns the element which really has the focus, looking inside the canvas iframe and inside shadow roots.
 */
function getDeepActiveElement(): Element | null {
  let el: Element | null = document.activeElement
  while (el) {
    if (el instanceof HTMLIFrameElement) {
      el = el.contentDocument?.activeElement ?? null
    } else if (el.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement
    } else {
      return el
    }
  }
  return el
}

const NON_TEXT_INPUT_TYPES = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']

/**
 * Checks if the element is a field where the browser has its own text undo (text inputs, textarea, contenteditable).
 * Not isTextOrInputField from utils: it also matches selects, buttons and checkboxes, which have no native undo.
 */
function isTextField(el: Element | null): boolean {
  if (!el) return false
  if ((el as HTMLElement).isContentEditable) return true
  if (el.tagName === 'TEXTAREA') return true
  return el.tagName === 'INPUT' && !NON_TEXT_INPUT_TYPES.includes((el as HTMLInputElement).type)
}

/**
 * Undo / redo the editor from anywhere in the UI, not only from the canvas.
 * GrapesJS skips its undo keymaps as soon as something outside the canvas has the focus
 * (the layer manager, a select of the style manager...), so we take over and only leave the
 * shortcut to the browser when the user is editing text (native text undo).
 */
function undoRedoHandler(command: string) {
  return (editor: Editor, sender: unknown, opts: { event?: KeyboardEvent } = {}) => {
    // Covers the rich text edition (editing = the text view) and the layer renaming (editing = true)
    if (editor.getModel().isEditing()) return
    // Do not undo the canvas behind a dialog
    if (editor.Modal.isOpen()) return
    if ((editor as PublishableEditor).PublicationManager?.dialog?.isOpen) return
    if (editor.Commands.isActive(cmdOpenSettings)) return
    if (isTextField(getDeepActiveElement())) return
    if (opts.event) {
      // Like GrapesJS does, also prevent the original event when it comes from the canvas iframe
      const canvasView = editor.Canvas.getCanvasView()
      if (canvasView) canvasView.preventDefault(opts.event)
      else opts.event.preventDefault()
    }
    editor.runCommand(command)
  }
}

function isUndoRedoShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.key?.toLowerCase() === 'z'
}

const UNDO_REDO_FILTER = '__silexUndoRedoFilter'

/**
 * Keymaster ignores key strokes in all inputs and selects, let undo / redo through when it is not a text field.
 * Keymaster is a singleton shared by all the editors, so wrap its filter only once and restore it on destroy.
 */
function patchKeymasterFilter(editor: Editor): void {
  const keymaster = editor.Keymaps.keymaster
  if (keymaster.filter[UNDO_REDO_FILTER]) return
  const defaultFilter = keymaster.filter
  const filter = (event: KeyboardEvent) => defaultFilter(event)
    || (isUndoRedoShortcut(event) && !isTextField(event.target as Element))
  filter[UNDO_REDO_FILTER] = true
  keymaster.filter = filter
  editor.on('destroy', () => {
    if (keymaster.filter === filter) keymaster.filter = defaultFilter
  })
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

  // Undo / redo wherever the focus is, except in text fields
  // GrapesJS registers its default keymaps after the plugins, so change their config
  // The handler prevents the event itself, only when it runs: with force, GrapesJS' `prevent` would also
  // block the native undo in contenteditable (rich text edition, layer renaming)
  const { defaults } = km.getConfig()
  for (const id of ['core:undo', 'core:redo']) {
    if (defaults?.[id]) defaults[id] = { ...defaults[id], handler: undoRedoHandler(id), opts: { ...defaults[id].opts, force: true, prevent: false } }
  }
  patchKeymasterFilter(editor)

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
