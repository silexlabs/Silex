/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview Silex config
 */


goog.provide('silex.Config');
goog.require('silex.utils.Shortcut');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');

// display an apple on mac and ctrl on windows and linux
// var ctrlKeyMacDisplay = goog.userAgent.MAC ? '⌘' : '';
var altKeyMacDisplay = goog.userAgent.MAC ? '⌥' : '';
var ctrlKeyPCDisplay = goog.userAgent.MAC ? '' : 'Ctrl+';
// var altKeyPCDisplay = goog.userAgent.MAC ? '' : 'Alt+';
var ctrlKeyDisplay = goog.userAgent.MAC ? '⌘' : 'Ctrl+';
var altKeyDisplay = goog.userAgent.MAC ? '⌥' : 'Alt+';
// for shortcuts, use "apple key" on mac and ctrl on windows and linux
// var ctrlKeyMac = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.META : null;
var altKeyMac = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.ALT : null;
var ctrlKeyPC = goog.userAgent.MAC ? null : goog.ui.KeyboardShortcutHandler.Modifiers.CTRL;
// var altKeyPC = goog.userAgent.MAC ? null : goog.ui.KeyboardShortcutHandler.Modifiers.ALT;
// same shortcuts on mac and other
var ctrlKeyModifyer = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.META : goog.ui.KeyboardShortcutHandler.Modifiers.CTRL;
var altKeyModifyer = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.ALT : goog.ui.KeyboardShortcutHandler.Modifiers.ALT;


/**
 * The debug data
 * @struct
 */
silex.Config.debug = {
  /**
   * true if the app is in debug mode
   * if false then all other params are not used
   * debug mode is set to true in debug.html (src/html/debug.jade)
   * @type {boolean}
   */
  debugMode: false,
  /**
   * @type {boolean}
   */
  preventQuit: false
};


/**
 * Link of the menu
 * @const
 */
silex.Config.WIKI_SILEX = 'https://github.com/silexlabs/Silex/wiki';


/**
 * Link in property tool dialog
 * this is also hard coded in property-tool.jade
 * @const
 */
silex.Config.WIKI_SILEX_CUSTOM_CSS_CLASS = 'https://github.com/silexlabs/Silex/wiki/Silex-CSS-editor#custom-css-classes';


/**
 * Link of the menu
 * @const
 */
silex.Config.CROWD_FUNDING = 'http://crowdfunding.silex.me/';


/**
 * Link of the menu
 * @const
 */
silex.Config.ISSUES_SILEX = 'https://github.com/silexlabs/Silex/issues?state=open';


/**
 * Link of the menu
 * @const
 */
silex.Config.DOWNLOADS_TEMPLATE_SILEX = 'https://github.com/silexlabs/Silex/issues?labels=template&state=open';


/**
 * Link of the menu
 * @const
 */
silex.Config.DOWNLOADS_WIDGET_SILEX = 'https://github.com/silexlabs/Silex/issues?labels=widget&state=open';


/**
 * Link of the menu
 * @const
 */
silex.Config.ABOUT_SILEX_LABS = 'http://www.silexlabs.org/';


/**
 * Link of the menu
 * @const
 */
silex.Config.SUBSCRIBE_SILEX_LABS = 'http://eepurl.com/F48q5';


/**
 * Link of the menu
 * @const
 */
silex.Config.SOCIAL_DIASPORA = 'https://diasp.org/people/f37438103a9b013250aa2a0000053625';


/**
 * Link of the menu
 * @const
 */
silex.Config.SOCIAL_TWITTER = 'http://twitter.com/silexlabs';


/**
 * Link of the menu
 * @const
 */
silex.Config.SOCIAL_FB = 'http://www.facebook.com/silexlabs';


/**
 * Link of the menu
 * @const
 */
silex.Config.FORK_CODE = 'https://github.com/silexlabs/Silex';


/**
 * Link of the menu
 * @const
 */
silex.Config.CONTRIBUTE = 'https://github.com/silexlabs/Silex/wiki/Contribute';


/**
 * The main application menu
 */
silex.Config.menu = {
  names: [
    {
      label: 'File',
      className: 'menu-item-file'
    },
    {
      label: 'Edit',
      className: 'menu-item-edit'
    },
    {
      label: 'View',
      className: 'menu-item-view'
    },
    {
      label: 'Insert',
      className: 'menu-item-insert'
    },
    {
      label: 'Help',
      className: 'menu-item-help'
    }
  ],
  /** @type {Array<Array<silex.utils.MenuShortcut>>} */
  options: [
    [
      {
        label: 'New File',
        id: 'file.new',
        className: 'menu-item-file-new',
        key: 'n',
        altKey: true,
        tooltip: altKeyDisplay + 'n',
      },
      {
        label: 'Open File...',
        id: 'file.open',
        className: 'menu-item-file-open',
        key: 'o',
        ctrlKey: true,
        tooltip: ctrlKeyDisplay + 'o',
      },
      {
        label: 'Save File',
        id: 'file.save',
        className: 'menu-item-file-save',
        key: 's',
        ctrlKey: true,
        tooltip: ctrlKeyDisplay + 's',
      },
      {
        label: 'Save As...',
        id: 'file.saveas',
        className: 'menu-item-file-saveas'
      },
      null,
      {
        label: 'Publish',
        id: 'file.publish',
        className: 'menu-item-file-publish',
        key: 'p',
        ctrlKey: true,
        tooltip: ctrlKeyDisplay + 'P',
      },
      {
        label: 'Settings...',
        id: 'file.publish.settings',
        className: 'menu-item-file-publish-settings'
      }
    ],
    [
      {
        label: 'Copy',
        id: 'edit.copy.selection',
        className: 'menu-item-edit-copy-selection',
        key: 'c',
        ctrlKey: true,
        input: false,
        tooltip: ctrlKeyDisplay + 'C',
      },
      {
        label: 'Paste',
        id: 'edit.paste.selection',
        className: 'menu-item-edit-paste-selection',
        key: 'v',
        ctrlKey: true,
        input: false,
        tooltip: ctrlKeyDisplay + 'V',
      },
      {
        label: 'Undo',
        id: 'edit.undo',
        className: 'menu-item-edit-undo',
        key: 'z',
        ctrlKey: true,
        tooltip: ctrlKeyDisplay + 'Z',
      },
      {
        label: 'Redo',
        id: 'edit.redo',
        className: 'menu-item-edit-redo',
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        tooltip: ctrlKeyDisplay + '⇧ Z'
      },
     {
        label: 'Delete selection',
        id: 'edit.delete.selection',
        className: 'menu-item-edit-delete-selection',
        key: 'Delete',
        input: false,
        tooltip: 'suppr',
      },
      null,
      {
        label: 'Edit selection',
        id: 'view.open.editor',
        className: 'menu-item-view-open-textEditor',
        tooltip: '↵'
      },
      {
        label: 'Bring to front',
        id: 'edit.move.to.top',
        className: 'menu-item-edit-move-to-top',
        // handled in stage: key: 'ArrowUp',
        // altKey: true,
        // shiftKey: true,
        tooltip: altKeyDisplay + 'Left'
      },
      {
        label: 'Bring forward',
        id: 'edit.move.up',
        className: 'menu-item-edit-move-up',
        // altKey: true,
        // handled in stage: key: 'ArrowUp',
        tooltip: altKeyDisplay + 'Up',
      },
      {
        label: 'Bring backward',
        id: 'edit.move.down',
        className: 'menu-item-edit-move-down',
        // altKey: true,
        // handled in stage: key: 'ArrowDown',
        tooltip: altKeyDisplay + 'Down',
      },
      {
        label: 'Send to back',
        id: 'edit.move.to.bottom',
        className: 'menu-item-edit-move-to-bottom',
        // altKey: true,
        // shiftKey: true,
        // handled in stage: key: 'ArrowDown',
        tooltip: altKeyDisplay + 'Right'
      },
      null,
      {
        label: 'Rename page',
        id: 'edit.rename.page',
        className: 'menu-item-edit-rename-page'
      },
      {
        label: 'Delete page',
        id: 'edit.delete.page',
        className: 'menu-item-edit-delete-page'
      }
    ],
    [
      {
        label: 'Preview',
        id: 'view.file',
        className: 'menu-item-view-file',
        key: 'v',
        altKey: true,
        tooltip: altKeyDisplay + 'V',
      },
      {
        label: 'Preview in Responsize',
        id: 'view.file.responsize',
        className: 'menu-item-view-file-responsize',
        key: 'v',
        shiftKey: true,
        altKey: true,
        tooltip: altKeyDisplay + '⇧ V'
      },
      null,
      {
        label: 'Apollo mode',
        id: 'tools.advanced.activate',
        className: 'menu-item-tools-advanced-activate',
        checkable: true,
        key: 'a',
        shiftKey: true,
        altKey: true,
        tooltip: ctrlKeyDisplay + altKeyDisplay + '⇧ A',
      },
      {
        label: 'Mobile editor',
        id: 'tools.mobile.mode',
        className: 'menu-item-tools-mobile-mode',
        checkable: true,
        key: 'm',
        altKey: true,
        tooltip: ctrlKeyDisplay + altKeyDisplay + 'M',
      },
      null,
      {
        label: 'HTML <head> editor',
        id: 'view.open.htmlHeadEditor',
        className: 'menu-item-view-open-htmlHeadEditor',
        key: 'e',
        altKey: true,
        tooltip: altKeyDisplay + 'E',
      },
      {
        label: 'JS scripts editor',
        id: 'view.open.jsEditor',
        className: 'menu-item-view-open-jsEditor',
        key: 'j',
        altKey: true,
        tooltip: altKeyDisplay + 'J',
      },
      {
        label: 'CSS styles editor',
        id: 'view.open.cssEditor',
        className: 'menu-item-view-open-cssEditor',
        key: 'd',
        altKey: true,
        tooltip: altKeyDisplay + 'D',
      },
      {
        label: 'Open file browser',
        id: 'view.open.fileExplorer',
        className: 'menu-item-view-open-fileExplorer'
      }
    ],
    [
      {
        label: 'Text box',
        id: 'insert.text',
        className: 'menu-item-insert-text',
        key: 't',
        altKey: true,
        tooltip: altKeyDisplay + 'T',
      },
      {
        label: 'Image...',
        id: 'insert.image',
        className: 'menu-item-insert-image',
        key: 'i',
        altKey: true,
        tooltip: altKeyDisplay + 'I',
      },
      {
        label: 'Container',
        id: 'insert.container',
        className: 'menu-item-insert-container',
        key: 'c',
        altKey: true,
        tooltip: altKeyDisplay + 'C',
      },
      {
        label: 'HTML box',
        id: 'insert.html',
        className: 'menu-item-insert-html',
        key: 'h',
        altKey: true,
        tooltip: altKeyDisplay + 'H',
      },
      {
        label: 'Section',
        id: 'insert.section',
        key: 's',
        altKey: true,
        tooltip: altKeyDisplay + 'S'
      },
      null,
      {
        label: 'New page',
        id: 'insert.page',
        className: 'menu-item-insert-page',
        key: 'p',
        altKey: true,
        tooltip: altKeyDisplay + 'P',
      }
    ],
    [
      {
        label: 'About Silex',
        id: 'help.about',
        className: 'menu-item-help-about'
      },
      {
        label: 'Report a bug or ask a question',
        id: 'help.issues',
        className: 'menu-item-help-issues'
      },
      {
        label: 'Download templates',
        id: 'help.downloads.template',
        className: 'menu-item-help-downloads-template'
      },
      {
        label: 'Download widgets',
        id: 'help.downloads.widget',
        className: 'menu-item-help-downloads-widget'
      },
      null,
      {
        label: 'Silex Labs foundation',
        id: 'help.aboutSilexLabs',
        className: 'menu-item-help-aboutSilexLabs'
      },
      {
        label: 'News letter subscription',
        id: 'help.newsLetter',
        className: 'menu-item-help-newsLetter'
      },
      null,
      {
        label: 'Twitter',
        id: 'help.twitter',
        className: 'menu-item-help-twitter'
      },
      {
        label: 'Google+',
        id: 'help.googlPlus',
        className: 'menu-item-help-googlPlus'
      },
      {
        label: 'Facebook',
        id: 'help.facebook',
        className: 'menu-item-help-facebook'
      },
      null,
      {
        label: 'Give 5 minutes of your time!',
        id: 'help.contribute',
        className: 'menu-item-help-contribute'
      },
      {
        label: 'Source code and download Silex',
        id: 'help.forkMe',
        className: 'menu-item-help-forkMe'
      }
    ]
  ]
};
