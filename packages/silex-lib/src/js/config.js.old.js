
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


goog.provide('silex.ConfigOLD');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');

// display an apple on mac and ctrl+shift on windows and linux
var ctrlKeyDisplay = goog.userAgent.MAC ? '⌘' + '' : 'Ctrl+⇧+';
var altKeyDisplay = goog.userAgent.MAC ? '⌥' + '' : 'Alt+⇧+';
// for shortcuts, use ctrl on mac and ctrl+shift on windows and linux
var ctrlKeyModifyer = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.META : goog.ui.KeyboardShortcutHandler.Modifiers.META + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT;
var altKeyModifyer = goog.userAgent.MAC ? goog.ui.KeyboardShortcutHandler.Modifiers.ALT : goog.ui.KeyboardShortcutHandler.Modifiers.ALT + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT;


/**
 * The debug data
 * {boolean} debugMode      true if the app is in debug mode
 *                          if false, then all other params are not used
 *                          debug mode is set to true in debug.html
 * {boolean} preventQuit
 * {function} doAfterReady  callback executed when Silex has launched and is ready
 *                          it is defined in debug.js loaded only in debug.html
 */
silex.ConfigOLD.debug = {
  debugMode: false
  , showPreventQuitMessage: false
  , doAfterReady: null
}
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.ABOUT_SILEX = 'http://www.silex.me/';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.ISSUES_SILEX = 'https://github.com/silexlabs/Silex/issues?labels=bug&state=open';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.WIDGETS_SILEX = 'https://github.com/silexlabs/Silex/issues?labels=widget&state=open';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.TEMPLATES_SILEX = 'https://github.com/silexlabs/Silex/issues?labels=template&state=open';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.ABOUT_SILEX_LABS = 'http://www.silexlabs.org/';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.SUBSCRIBE_SILEX_LABS = 'http://eepurl.com/F48q5';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.SOCIAL_GPLUS = 'https://plus.google.com/communities/107373636457908189681';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.SOCIAL_TWITTER = 'http://twitter.com/silexlabs';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.SOCIAL_FB = 'http://www.facebook.com/silexlabs';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.FORK_CODE = 'https://github.com/silexlabs/Silex';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.CONTRIBUTE = 'https://github.com/silexlabs/Silex/blob/master/docs/contribute.md';
/**
 * Link of the menu
 * @const constant
 */
silex.ConfigOLD.CONTRIBUTORS = 'https://github.com/silexlabs/Silex/blob/master/docs/contributors.md';
/**
 * The main application menu
 */
silex.ConfigOLD.menu = {
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
      }

    ]
    , [
      {
        label: 'Copy'
        , id: 'edit.copy.selection'
        , className: 'menu-item-edit-copy-selection'
      }
    ]
  ]
};


/**
 * The list of fonts the user can select
 */
silex.ConfigOLD.fonts = {


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
