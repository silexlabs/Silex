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
  options: [
    [
      {
        label: 'New File',
        id: 'file.new',
        className: 'menu-item-file-new',
        globalKey: goog.events.KeyCodes.N,
        shortcut: [[goog.events.KeyCodes.N, altKeyModifyer]],
        tooltip: altKeyDisplay + 'n',
        mnemonic: goog.events.KeyCodes.N,
        accelerator: 'n'
      },
      {
        label: 'Open File...',
        id: 'file.open',
        className: 'menu-item-file-open',
        globalKey: goog.events.KeyCodes.O,
        shortcut: [[goog.events.KeyCodes.O, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 'o',
        mnemonic: goog.events.KeyCodes.O,
        accelerator: 'o'
      },
      {
        label: 'Save File',
        id: 'file.save',
        className: 'menu-item-file-save',
        globalKey: goog.events.KeyCodes.S,
        shortcut: [[goog.events.KeyCodes.S, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 's',
        mnemonic: goog.events.KeyCodes.S,
        accelerator: 's'
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
        globalKey: goog.events.KeyCodes.P,
        shortcut: [[goog.events.KeyCodes.P, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 'P',
        mnemonic: goog.events.KeyCodes.P,
        accelerator: 'p'
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
        shortcut: [[goog.events.KeyCodes.C, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 'C',
        mnemonic: goog.events.KeyCodes.C,
        accelerator: 'c'
      },
      {
        label: 'Paste',
        id: 'edit.paste.selection',
        className: 'menu-item-edit-paste-selection',
        shortcut: [[goog.events.KeyCodes.V, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 'V',
        mnemonic: goog.events.KeyCodes.V,
        accelerator: 'v'
      },
      {
        label: 'Undo',
        id: 'edit.undo',
        className: 'menu-item-edit-undo',
        shortcut: [[goog.events.KeyCodes.Z, ctrlKeyModifyer]],
        tooltip: ctrlKeyDisplay + 'Z',
        mnemonic: goog.events.KeyCodes.Z,
        accelerator: 'z'
      },
      {
        label: 'Redo',
        id: 'edit.redo',
        className: 'menu-item-edit-redo',
        shortcut: [[goog.events.KeyCodes.Z, ctrlKeyModifyer + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]],
        tooltip: ctrlKeyDisplay + '⇧ Z'
      },
     {
        label: 'Delete selection',
        id: 'edit.delete.selection',
        className: 'menu-item-edit-delete-selection',
        shortcut: [[goog.events.KeyCodes.DELETE], [goog.events.KeyCodes.BACKSPACE]],
        tooltip: 'suppr',
        mnemonic: goog.events.KeyCodes.R,
        accelerator: 'r'
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
        shortcut: [[goog.events.KeyCodes.UP, altKeyModifyer + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]],
        tooltip: altKeyDisplay + '⇧ Up'
      },
      {
        label: 'Bring forward',
        id: 'edit.move.up',
        className: 'menu-item-edit-move-up',
        shortcut: [[goog.events.KeyCodes.UP, altKeyModifyer]],
        tooltip: altKeyDisplay + 'Up',
        mnemonic: goog.events.KeyCodes.UP
      },
      {
        label: 'Bring backward',
        id: 'edit.move.down',
        className: 'menu-item-edit-move-down',
        shortcut: [[goog.events.KeyCodes.DOWN, altKeyModifyer]],
        tooltip: altKeyDisplay + 'Down',
        mnemonic: goog.events.KeyCodes.DOWN
      },
      {
        label: 'Send to back',
        id: 'edit.move.to.bottom',
        className: 'menu-item-edit-move-to-bottom',
        shortcut: [[goog.events.KeyCodes.DOWN, altKeyModifyer + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]],
        tooltip: altKeyDisplay + '⇧ Down'
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
        shortcut: [[goog.events.KeyCodes.V, altKeyModifyer]],
        tooltip: altKeyDisplay + 'V',
        mnemonic: goog.events.KeyCodes.V,
        accelerator: 'v'
      },
      {
        label: 'Preview in Responsize',
        id: 'view.file.responsize',
        className: 'menu-item-view-file-responsize',
        shortcut: [[goog.events.KeyCodes.V, altKeyModifyer + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]],
        tooltip: altKeyDisplay + '⇧ V'
      },
      null,
      {
        label: 'Apollo mode',
        id: 'tools.advanced.activate',
        className: 'menu-item-tools-advanced-activate',
        checkable: true,
        shortcut: [[goog.events.KeyCodes.A, altKeyModifyer + ctrlKeyModifyer + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]],
        tooltip: ctrlKeyDisplay + altKeyDisplay + '⇧ A',
        mnemonic: goog.events.KeyCodes.A,
        accelerator: 'a'
      },
      {
        label: 'Mobile editor',
        id: 'tools.mobile.mode',
        className: 'menu-item-tools-mobile-mode',
        checkable: true,
        shortcut: [[goog.events.KeyCodes.M, altKeyModifyer]],
        tooltip: ctrlKeyDisplay + altKeyDisplay + 'M',
        mnemonic: goog.events.KeyCodes.M,
        accelerator: 'm'
      },
      null,
      {
        label: 'HTML <head> editor',
        id: 'view.open.htmlHeadEditor',
        className: 'menu-item-view-open-htmlHeadEditor',
        globalKey: goog.events.KeyCodes.E,
        shortcut: [[goog.events.KeyCodes.E, altKeyModifyer]],
        tooltip: altKeyDisplay + 'E',
        mnemonic: goog.events.KeyCodes.E,
        accelerator: 'e'
      },
      {
        label: 'JS scripts editor',
        id: 'view.open.jsEditor',
        className: 'menu-item-view-open-jsEditor',
        globalKey: goog.events.KeyCodes.J,
        shortcut: [[goog.events.KeyCodes.J, altKeyModifyer]],
        tooltip: altKeyDisplay + 'J',
        mnemonic: goog.events.KeyCodes.J,
        accelerator: 'j'
      },
      {
        label: 'CSS styles editor',
        id: 'view.open.cssEditor',
        className: 'menu-item-view-open-cssEditor',
        globalKey: goog.events.KeyCodes.D,
        shortcut: [[goog.events.KeyCodes.D, altKeyModifyer]],
        tooltip: altKeyDisplay + 'D',
        mnemonic: goog.events.KeyCodes.D,
        accelerator: 'd'
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
        globalKey: goog.events.KeyCodes.T,
        shortcut: [[goog.events.KeyCodes.T, altKeyModifyer]],
        tooltip: altKeyDisplay + 'T',
        mnemonic: goog.events.KeyCodes.T,
        accelerator: 't'
      },
      {
        label: 'Image...',
        id: 'insert.image',
        className: 'menu-item-insert-image',
        globalKey: goog.events.KeyCodes.I,
        shortcut: [[goog.events.KeyCodes.I, altKeyModifyer]],
        tooltip: altKeyDisplay + 'I',
        mnemonic: goog.events.KeyCodes.I,
        accelerator: 'i'
      },
      {
        label: 'Container',
        id: 'insert.container',
        className: 'menu-item-insert-container',
        shortcut: [[goog.events.KeyCodes.C, altKeyModifyer]],
        tooltip: altKeyDisplay + 'C',
        mnemonic: goog.events.KeyCodes.C,
        accelerator: 'c'
      },
      {
        label: 'HTML box',
        id: 'insert.html',
        className: 'menu-item-insert-html',
        globalKey: goog.events.KeyCodes.H,
        shortcut: [[goog.events.KeyCodes.H, altKeyModifyer]],
        tooltip: altKeyDisplay + 'H',
        mnemonic: goog.events.KeyCodes.H,
        accelerator: 'h'
      },
      {
        label: 'Section',
        id: 'insert.section',
        shortcut: [[goog.events.KeyCodes.S, altKeyModifyer]],
        tooltip: altKeyDisplay + 'S'
      },
      null,
      {
        label: 'New page',
        id: 'insert.page',
        className: 'menu-item-insert-page',
        globalKey: goog.events.KeyCodes.P,
        shortcut: [[goog.events.KeyCodes.P, altKeyModifyer]],
        tooltip: altKeyDisplay + 'P',
        mnemonic: goog.events.KeyCodes.P,
        accelerator: 'p'
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


/**
 * The list of fonts the user can select
 */
silex.Config.fonts = {


  'Roboto Condensed': {
    //the url to load the font file
    href: 'http://fonts.googleapis.com/css?family=Roboto+Condensed:300italic,400italic,700italic,400,300,700',
    //the value for the CSS font-family value
    value: 'Roboto Condensed'
  },
  'Roboto': {

    href: 'http://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic',

    value: 'Roboto'
  },
  'Days One': {

    href: 'http://fonts.googleapis.com/css?family=Days+One',

    value: 'Days One'
  },
  'Sintony': {

    href: 'http://fonts.googleapis.com/css?family=Sintony:400,700',

    value: 'Sintony'
  },
  'Junge': {

    href: 'http://fonts.googleapis.com/css?family=Junge',

    value: 'Junge'
  },
  'Istok Web': {

    href: 'http://fonts.googleapis.com/css?family=Istok+Web:400,700,400italic,700italic',

    value: 'Istok Web'
  },
  'Oswald': {

    href: 'http://fonts.googleapis.com/css?family=Oswald:400,300,700',

    value: 'Oswald'
  },
  'Cantata': {

    href: 'http://fonts.googleapis.com/css?family=Cantata+One',

    value: 'Cantata'
  },
  'Oranienbaum': {

    href: 'http://fonts.googleapis.com/css?family=Oranienbaum',

    value: 'Oranienbaum'
  },
  'Londrina Solid': {

    href: 'http://fonts.googleapis.com/css?family=Londrina+Solid',

    value: 'Londrina Solid'
  },
  'Noticia Text': {

    href: 'http://fonts.googleapis.com/css?family=Noticia+Text:400,400italic,700,700italic',

    value: 'Noticia Text'
  },
  'Codystar': {

    href: 'http://fonts.googleapis.com/css?family=Codystar:300,400',

    value: 'Codystar'
  },
  'Titillium Web': {

    href: 'http://fonts.googleapis.com/css?family=Titillium+Web:400,200,200italic,300,300italic,400italic,600,600italic,700,700italic,900',

    value: 'Titillium Web'
  },
  'Sarina': {

    href: 'http://fonts.googleapis.com/css?family=Sarina',

    value: 'Sarina'
  },
  'Bree Serif': {

    href: 'http://fonts.googleapis.com/css?family=Bree+Serif',

    value: 'Bree Serif'
  }
};
