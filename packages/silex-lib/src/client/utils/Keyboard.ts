import {SilexNotification} from '../utils/notification';

export type Shortcut = {
  label?: string,
  id?: string,
  key: string,
  altKey?: boolean,
  ctrlKey?: boolean,
  shiftKey?: boolean,
  modifiers?: boolean,
  input?: boolean,
};

type ShortcutItem = {
  s: Shortcut,
  cbk: (e: KeyboardEvent) => void,
}

/**
 * @class Keyboard
 */
export class Keyboard {
  shortcuts: Map<string, ShortcutItem[]>;

  static isInput(target: HTMLElement) {
    return !target.tagName ||
        // this is in-iframe forwarding case
        target.tagName.toUpperCase() === 'INPUT' ||
        target.tagName.toUpperCase() === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true';
  }

  constructor(doc: Document) {
    this.shortcuts = new Map();
    doc.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  addShortcut(s: Shortcut, cbk: (p1: Event) => void) {
    const key = s.key.toLowerCase();
    if (!cbk || !key) {
      throw new Error('Can not add shortcut, callback and key are required');
    }
    if (!this.shortcuts.has(key)) {
      this.shortcuts.set(key, []);
    }
    this.shortcuts.get(key).push({s, cbk});
  }

  handleKeyDown(e) {
    if(!e.defaultPrevented) {
      const shortcuts = this.getShortcutsFromEvent(e);
      if (shortcuts.length > 0 &&
          // not while in a modal alert
          !SilexNotification.isActive) {
        shortcuts.forEach((shortcut) => {
          shortcut.cbk(e);
        });
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  getShortcutsFromEvent(e): ShortcutItem[] {
    const key = e.key.toLowerCase();
    if (!this.shortcuts.has(key)) {
      return [];
    }
    const shortcuts = this.shortcuts.get(key);
    return shortcuts.filter((shortcut) => {
      return (
        // accept all modifiers if modifiers is set to false
        shortcut.s.modifiers === false || (
        // otherwise check the modifiers
        !!(shortcut.s.shiftKey) === !!(e.shiftKey) &&
        !!(shortcut.s.altKey) === !!(e.altKey) &&
        !!(shortcut.s.ctrlKey) === !!(e.ctrlKey)) &&
        // not when in an input field
        (shortcut.s.input !== false || !Keyboard.isInput(e.target as HTMLElement))
      );
    });
  }
}
