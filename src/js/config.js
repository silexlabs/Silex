
//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview Silex config
 */


goog.provide('silex.Config');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');

var ctrlKeyDisplay = goog.userAgent.MAC ? '⌘' + '' : 'Ctrl+';
var altKeyDisplay = goog.userAgent.MAC ? '⌥' + '' : 'Alt+';


/**
 * The debug data
 * {boolean} debugMode      true if the app is in debug mode
 *                          if false, then all other params are not used
 *                          debug mode is set to true in debug.html
 * {boolean} preventQuit
 * {function} doAfterReady  callback executed when Silex has launched and is ready
 *                          it is defined in debug.js loaded only in debug.html
 */
silex.Config.debug = {
  debugMode: false
  , showPreventQuitMessage: false
  , doAfterReady: null
}
/**
 * Link of the menu
 * @const constant
 */
silex.Config.ABOUT_SILEX = 'http://www.silexlabs.org/silex/';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.ABOUT_SILEX_LABS = 'http://www.silexlabs.org/';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.SUBSCRIBE_SILEX_LABS = 'http://eepurl.com/F48q5';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.SOCIAL_GPLUS = 'https://plus.google.com/communities/107373636457908189681';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.SOCIAL_TWITTER = 'http://twitter.com/silexlabs';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.SOCIAL_FB = 'http://www.facebook.com/silexlabs';
/**
 * Link of the menu
 * @const constant
 */
silex.Config.FORK_CODE = 'https://github.com/silexlabs/Silex';
/**
 * The main application menu
 */
silex.Config.menu = {
  names: [
    {
      label: 'File'
      , className: 'menu-item-file'
    }
    , {
      label: 'Edit'
      , className: 'menu-item-edit'
    }
    , {
      label: 'View'
      , className: 'menu-item-view'
    }
    , {
      label: 'Insert'
      , className: 'menu-item-insert'
    }
    , {
      label: 'Tools'
      , className: 'menu-item-tools'
    }
    , {
      label: 'Help'
      , className: 'menu-item-help'
    }
  ]
  , options: [
    [
      {
        label: 'New File'
        , id: 'file.new'
        , className: 'menu-item-file-new'
        , globalKey: goog.events.KeyCodes.N
        , shortcut: [[goog.events.KeyCodes.N, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'n'
        , mnemonic: goog.events.KeyCodes.N
        , accelerator: 'n'
      }
      , {
        label: 'Open File...'
        , id: 'file.open'
        , className: 'menu-item-file-open'
        , globalKey: goog.events.KeyCodes.O
        , shortcut: [[goog.events.KeyCodes.O, goog.ui.KeyboardShortcutHandler.Modifiers.META]]
        , tooltip: ctrlKeyDisplay + 'o'
        , mnemonic: goog.events.KeyCodes.O
        , accelerator: 'o'
      }
      , {
        label: 'Save File'
        , id: 'file.save'
        , className: 'menu-item-file-save'
        , globalKey: goog.events.KeyCodes.S
        , shortcut: [[goog.events.KeyCodes.S, goog.ui.KeyboardShortcutHandler.Modifiers.META]]
        , tooltip: ctrlKeyDisplay + 's'
        , mnemonic: goog.events.KeyCodes.S
        , accelerator: 's'
      }
      , {
        label: 'Save As...'
        , id: 'file.saveas'
        , className: 'menu-item-file-saveas'
        , globalKey: goog.events.KeyCodes.S
        , shortcut: [[goog.events.KeyCodes.S, goog.ui.KeyboardShortcutHandler.Modifiers.META + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]]
        , tooltip: ctrlKeyDisplay + '⇧S'
      }
      , null
      , {
        label: 'Rename...'
        , id: 'file.rename'
        , className: 'menu-item-file-rename'
      }
      , {
        label: 'Publish'
        , id: 'file.publish'
        , className: 'menu-item-file-publish'
        , globalKey: goog.events.KeyCodes.P
        , shortcut: [[goog.events.KeyCodes.P, goog.ui.KeyboardShortcutHandler.Modifiers.META]]
        , tooltip: ctrlKeyDisplay + 'P'
        , mnemonic: goog.events.KeyCodes.P
        , accelerator: 'p'
      }
      , {
        label: 'Settings...'
        , id: 'file.publish.settings'
        , className: 'menu-item-file-publish-settings'
      }
      , null
      , {
        label: 'Close File'
        , id: 'file.close'
        , className: 'menu-item-file-close'
        , globalKey: goog.events.KeyCodes.W
        , shortcut: [[goog.events.KeyCodes.W, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'w'
        , mnemonic: goog.events.KeyCodes.W
        , accelerator: 'w'
      }
    ]
    , [
      {
        label: 'Delete selection'
        , id: 'edit.delete.selection'
        , className: 'menu-item-edit-delete-selection'
        , shortcut: [[goog.events.KeyCodes.DELETE], [goog.events.KeyCodes.BACKSPACE]]
        , tooltip: 'suppr'
        , mnemonic: goog.events.KeyCodes.R
        , accelerator: 'r'
      }
      , null
      , {
        label: 'Edit selection'
        , id: 'view.open.editor'
        , className: 'menu-item-view-open-textEditor'
        , tooltip: '↵'
      }
      , null
      , {
        label: 'Rename page'
        , id: 'edit.rename.page'
        , className: 'menu-item-edit-rename-page'
      }
      , {
        label: 'Delete page'
        , id: 'edit.delete.page'
        , className: 'menu-item-edit-delete-page'
      }
    ]
    , [
      {
        label: 'View in new window'
        , id: 'view.file'
        , className: 'menu-item-view-file'
        , globalKey: goog.events.KeyCodes.V
        , shortcut: [[goog.events.KeyCodes.V, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'V'
        , mnemonic: goog.events.KeyCodes.V
        , accelerator: 'v'
      }
      , null
      , {
        label: 'JS scripts editor'
        , id: 'view.open.jsEditor'
        , className: 'menu-item-view-open-jsEditor'
        , globalKey: goog.events.KeyCodes.J
        , shortcut: [[goog.events.KeyCodes.J, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'J'
        , mnemonic: goog.events.KeyCodes.J
        , accelerator: 'j'
      }
      , {
        label: 'CSS styles editor'
        , id: 'view.open.cssEditor'
        , className: 'menu-item-view-open-cssEditor'
        , globalKey: goog.events.KeyCodes.D
        , shortcut: [[goog.events.KeyCodes.D, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'D'
        , mnemonic: goog.events.KeyCodes.D
        , accelerator: 'd'
      }
      , {
        label: 'Open file browser'
        , id: 'view.open.fileExplorer'
        , className: 'menu-item-view-open-fileExplorer'
      }
    ]
    , [
      {
        label: 'Text box'
        , id: 'insert.text'
        , className: 'menu-item-insert-text'
        , globalKey: goog.events.KeyCodes.T
        , shortcut: [[goog.events.KeyCodes.T, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'T'
        , mnemonic: goog.events.KeyCodes.T
        , accelerator: 't'
      }
      , {
        label: 'Image...'
        , id: 'insert.image'
        , className: 'menu-item-insert-image'
        , globalKey: goog.events.KeyCodes.I
        , shortcut: [[goog.events.KeyCodes.I, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'I'
        , mnemonic: goog.events.KeyCodes.I
        , accelerator: 'i'
      }
      , {
        label: 'Container'
        , id: 'insert.container'
        , className: 'menu-item-insert-container'
        , globalKey: goog.events.KeyCodes.C
        , shortcut: [[goog.events.KeyCodes.C, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'C'
        , mnemonic: goog.events.KeyCodes.C
        , accelerator: 'c'
      }
      , null
      , {
        label: 'HTML box'
        , id: 'insert.html'
        , className: 'menu-item-insert-html'
        , globalKey: goog.events.KeyCodes.H
        , shortcut: [[goog.events.KeyCodes.H, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'H'
        , mnemonic: goog.events.KeyCodes.H
        , accelerator: 'h'
      }
      , null
      , {
        label: 'New page'
        , id: 'insert.page'
        , className: 'menu-item-insert-page'
        , globalKey: goog.events.KeyCodes.P
        , shortcut: [[goog.events.KeyCodes.P, goog.ui.KeyboardShortcutHandler.Modifiers.ALT]]
        , tooltip: altKeyDisplay + 'P'
        , mnemonic: goog.events.KeyCodes.P
        , accelerator: 'p'
      }
    ]
    , [
      {
        label: 'Apollo mode'
        , id: 'tools.advanced.activate'
        , className: 'menu-item-tools-advanced.activate'
        , checkable: true
      }
    ]
    , [
      {
        label: 'About Silex'
        , id: 'help.about'
        , className: 'menu-item-help-about'
      }
      , {
        label: 'About Silex Labs'
        , id: 'help.aboutSilexLabs'
        , className: 'menu-item-help-aboutSilexLabs'
      }
      , {
        label: 'Silex Labs news by email'
        , id: 'help.newsLetter'
        , className: 'menu-item-help-newsLetter'
      }
      , null
      , {
        label: 'Talk with us on twitter'
        , id: 'help.twitter'
        , className: 'menu-item-help-twitter'
      }
      , {
        label: 'Talk with us on Google+'
        , id: 'help.googlPlus'
        , className: 'menu-item-help-googlPlus'
      }
      , {
        label: 'Talk with us on Facebook'
        , id: 'help.facebook'
        , className: 'menu-item-help-facebook'
      }
      , null
      , {
        label: 'Fork me on github!'
        , id: 'help.forkMe'
        , className: 'menu-item-help-forkMe'
      }
    ]
  ]
};


/**
 * The list of fonts the user can select
 */
silex.Config.fonts = {


  'Roboto Condensed' : {
    //the url to load the font file
    href: 'http://fonts.googleapis.com/css?family=Roboto+Condensed:300italic,400italic,700italic,400,300,700',
    //the value for the CSS font-family value
    value: 'Roboto Condensed'
  },
  'Roboto' : {

    href: 'http://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic',

    value: 'Roboto'
  },
  'Days One' : {

    href: 'http://fonts.googleapis.com/css?family=Days+One',

    value: 'Days One'
  },
  'Sintony' : {

    href: 'http://fonts.googleapis.com/css?family=Sintony:400,700',

    value: 'Sintony'
  },
  'Junge' : {

    href: 'http://fonts.googleapis.com/css?family=Junge',

    value: 'Junge'
  },
  'Istok Web' : {

    href: 'http://fonts.googleapis.com/css?family=Istok+Web:400,700,400italic,700italic',

    value: 'Istok Web'
  },
  'Oswald' : {

    href: 'http://fonts.googleapis.com/css?family=Oswald:400,300,700',

    value: 'Oswald'
  },
  'Cantata' : {

    href: 'http://fonts.googleapis.com/css?family=Cantata+One',

    value: 'Cantata'
  },
  'Oranienbaum' : {

    href: 'http://fonts.googleapis.com/css?family=Oranienbaum',

    value: 'Oranienbaum'
  },
  'Londrina Solid' : {

    href: 'http://fonts.googleapis.com/css?family=Londrina+Solid',

    value: 'Londrina Solid'
  },
  'Noticia Text' : {

    href: 'http://fonts.googleapis.com/css?family=Noticia+Text:400,400italic,700,700italic',

    value: 'Noticia Text'
  },
  'Codystar' : {

    href: 'http://fonts.googleapis.com/css?family=Codystar:300,400',

    value: 'Codystar'
  },
  'Titillium Web' : {

    href: 'http://fonts.googleapis.com/css?family=Titillium+Web:400,200,200italic,300,300italic,400italic,600,600italic,700,700italic,900',

    value: 'Titillium Web'
  },
  'Sarina' : {

    href: 'http://fonts.googleapis.com/css?family=Sarina',

    value: 'Sarina'
  },
  'Bree Serif' : {

    href: 'http://fonts.googleapis.com/css?family=Bree+Serif',

    value: 'Bree Serif'
  },
  'Arial Black' : {
    value: 'Arial Black, Gadget, sans-serif'
  },

  'Impact' : {
    value: 'Impact, Charcoal, sans-serif'
  },

  'Lucida Console' : {
    value: 'Lucida Console, Monaco, monospace'
  },

  'Lucida Sans' : {
    value: 'Lucida Sans Unicode, Lucida Grande, sans-serif'
  },

  'Palatino' : {
    value: 'Palatino Linotype, Book Antiqua, Palatino, serif'
  },

  'Tahoma' : {
    value: 'Tahoma, Geneva, sans-serif'
  }
};
