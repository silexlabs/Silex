
goog.provide('silex.utils.Keyboard');
goog.provide('silex.utils.Shortcut');
goog.provide('silex.utils.MenuShortcut');

/**
 * @typedef {{
 *   input: (boolean|undefined),
 *   key: (string|undefined),
 *   altKey: (boolean|undefined),
 *   shiftKey: (boolean|undefined),
 *   ctrlKey: (boolean|undefined),
 * }}
 */
silex.utils.Shortcut = null;

/**
 * it extends {silex.utils.Shortcut}
 * @typedef {{
 *   checkable: (boolean|undefined),
 *   id: string,
 *   tooltip: (goog.events.KeyCodes.<number>|undefined),
 *   input: (boolean|undefined),
 *   key: (string|undefined),
 *   altKey: (boolean|undefined),
 *   shiftKey: (boolean|undefined),
 *   ctrlKey: (boolean|undefined),
 * }}
 */
silex.utils.MenuShortcut = null;

/**
 * @class Keyboard
 */
silex.utils.Keyboard = class {
  /**
   * @param {EventTarget|Element} target
   */
  static isInput(target) {
    return !target.tagName || // this is in-iframe forwarding case
      target.tagName.toUpperCase() === 'INPUT' ||
      target.tagName.toUpperCase() === 'TEXTAREA' ||
      target.getAttribute('contenteditable') === 'true';
  };
  /**
   * @param {Document} doc
   */
  constructor(doc) {
    this.shortcuts = new Map();
    doc.addEventListener('keydown', e => this.handleKeyDown(e));
  }
  /**
   * @param {silex.utils.Shortcut} s
   * @param {function(Event)} cbk
   */
  addShortcut(s, cbk) {
    const { ctrlKey, altKey, shiftKey } = s;
    const key = s.key.toLowerCase();
    if(!cbk || !key) throw new Error('Can not add shortcut, callback and key are required');
    if(!this.shortcuts.has(key)) this.shortcuts.set(key, []);
    this.shortcuts.get(key).push({
      s: s,
      cbk: cbk,
    });
  }
  handleKeyDown(e) {
    const { target, shiftKey, ctrlKey, altKey, metaKey } = e;
    const key = e.key.toLowerCase();
    const shortcuts = this.getShortcuts(e);
    if (shortcuts.length > 0 &&
      // not while in a modal alert
      !silex.utils.Notification.isActive
    ) {
      shortcuts.forEach(shortcut => {
        if(!e.defaultPrevented)
          shortcut.cbk(e);
        else console.log('event prevented, do not call shortcut callback');
      });
      e.preventDefault();
    }
  }
  getShortcuts(e) {
    const key = e.key.toLowerCase();
    if(!this.shortcuts.has(key)) return [];
    const shortcuts = this.shortcuts.get(key);
    return shortcuts.filter(shortcut => {
      return (
        // accept all modifiers if modifiers is set to false
        shortcut.s.modifiers === false ||
        // otherwise check the modifiers
        (!!shortcut.s.shiftKey === e.shiftKey &&
        !!shortcut.s.altKey === e.altKey &&
        !!shortcut.s.ctrlKey === e.ctrlKey)
      ) && (
        // not when in an input field
        shortcut.s.input !== false ||
        !silex.utils.Keyboard.isInput(e.target)
      );
    });
  }
}

