import {Notification} from '../components/Notification'

export interface Shortcut {
  label?: string
  id?: string
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  modifiers?: boolean
  input?: boolean
}

interface ShortcutItem {
  s: Shortcut
  id: any
  cbk: (e: KeyboardEvent) => void
}

/**
 * @class Keyboard
 */
export class Keyboard {

  static isInput(target: HTMLElement) {
    return !target.tagName ||
        // this is in-iframe forwarding case
        target.tagName.toUpperCase() === 'INPUT' ||
        target.tagName.toUpperCase() === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true'
  }

  private shortcuts: Map<string, ShortcutItem[]>
  private nextId = 0

  constructor(doc: Document) {
    this.shortcuts = new Map()
    this.attach(doc)
  }

  attach(doc: Document) {
    const cbk = (e) => this.handleKeyDown(e)
    doc.addEventListener('keydown', cbk)
    return () => {
      doc.removeEventListener('keydown', cbk)
    }
  }

  /**
   * Ads a shortcut
   * @param shortcut shortcut object
   * @param cbk callback to call on shortcut
   * @returns a function to call to remove this shortcut
   */
  addShortcut(shortcut: Shortcut, cbk: (p1: Event) => void): () => void {
    const key = shortcut.key.toLowerCase()
    if (!cbk || !key) {
      throw new Error('Can not add shortcut, callback and key are required')
    }
    if (!this.shortcuts.has(key)) {
      this.shortcuts.set(key, [])
    }
    const id = this.nextId++
    this.shortcuts.get(key).push({s: shortcut, cbk, id})

    return () => {
      const arr = this.shortcuts.get(key)
      const pos = arr.findIndex((s) => s.id === id)
      if (pos >= 0) {
        arr.splice(pos, 1)
      }
    }
  }

  handleKeyDown(e) {
    if (!e.defaultPrevented) {
      if (Notification.isActive) {
        if (e.key === 'Enter') Notification.close(true, e)
        if (e.key === 'Escape') Notification.close(false, e)
      } else {
        const shortcuts = this.getShortcutsFromEvent(e)
        if (shortcuts.length > 0) {
          shortcuts.forEach((shortcut) => {
            if (!e.defaultPrevented) {
              shortcut.cbk(e)
            }
          })
          e.preventDefault()
        }
      }
    }
  }

  getShortcutsFromEvent(e): ShortcutItem[] {
    const key = e.key.toLowerCase()
    if (!this.shortcuts.has(key)) {
      return []
    }
    const ctrlKey = e.ctrlKey || e.metaKey
    const shortcuts = this.shortcuts.get(key)
    return shortcuts.filter((shortcut) => {
      return (
        // accept all modifiers if modifiers is set to false
        (
          shortcut.s.modifiers === false || (
            // otherwise check the modifiers
            (shortcut.s.shiftKey || false) === e.shiftKey &&
            (shortcut.s.altKey || false) === e.altKey &&
            (shortcut.s.ctrlKey || false) === ctrlKey
          )
        ) &&
        // not when in an input field
        (shortcut.s.input !== false || !Keyboard.isInput(e.target as HTMLElement))
      )
    })
  }
}
