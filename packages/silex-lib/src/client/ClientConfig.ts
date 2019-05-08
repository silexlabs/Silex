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

import { Shortcut } from './utils/Keyboard';

export class Config {

  /**
   * The debug data
   * @struct
   */
  static debug = {
    /**
     * debugMode is set by App.ts
     * true if the app is in debug mode
     * if false then all other params are not used
     * debug mode is set to true in debug.html (src/html/debug.jade)
     */
    debugMode: false,
    preventQuit: false,
    debugScript: '/js/debug.js',
  };

  /**
   * Link of the menu
   */
  static WIKI_SILEX = 'https://github.com/silexlabs/Silex/wiki';

  /**
   * Link in property tool dialog
   * this is also hard coded in property-tool.jade
   */
  static WIKI_SILEX_CUSTOM_CSS_CLASS =
      'https://github.com/silexlabs/Silex/wiki/Silex-CSS-editor#custom-css-classes';

  /**
   * Link of the menu
   */
  static CROWD_FUNDING = 'http://crowdfunding.silex.me/';

  /**
   * Link of the menu
   */
  static ISSUES_SILEX =
      'https://github.com/silexlabs/Silex/issues?state=open';

  /**
   * Link of the menu
   */
  static DOWNLOADS_TEMPLATE_SILEX =
      'https://github.com/silexlabs/Silex/issues?labels=template&state=open';

  /**
   * Link of the menu
   */
  static DOWNLOADS_WIDGET_SILEX =
      'https://github.com/silexlabs/Silex/issues?labels=widget&state=open';

  /**
   * Link of the menu
   */
  static ABOUT_SILEX_LABS = 'http://www.silexlabs.org/';

  /**
   * Link of the menu
   */
  static SUBSCRIBE_SILEX_LABS = 'http://eepurl.com/F48q5';

  /**
   * Link of the menu
   */
  static SOCIAL_DIASPORA =
      'https://diasp.org/people/f37438103a9b013250aa2a0000053625';

  /**
   * Link of the menu
   */
  static SOCIAL_TWITTER = 'http://twitter.com/silexlabs';

  /**
   * Link of the menu
   */
  static SOCIAL_FB = 'http://www.facebook.com/silexlabs';

  /**
   * Link of the menu
   */
  static FORK_CODE = 'https://github.com/silexlabs/Silex';

  /**
   * Link of the menu
   */
  static CONTRIBUTE = 'https://github.com/silexlabs/Silex/wiki/Contribute';

  /**
   * The main application menu
   */
  static shortcuts: Array<Shortcut> = [
    {
      label: 'New File',
      id: 'file.new',
      key: 'n',
      altKey: true,
    },
    {
      label: 'Open File...',
      id: 'file.open',
      key: 'o',
      ctrlKey: true,
    },
    {
      label: 'Save File',
      id: 'file.save',
      key: 's',
      ctrlKey: true,
    },
    {
      label: 'Save As...',
      id: 'file.saveas',
      key: 's',
      ctrlKey: true,
      shiftKey: true,
    },
    /////////////////////////////////////////////////
    {
      label: 'Publish',
      id: 'file.publish',
      key: 'p',
      ctrlKey: true,
    },
    {
      label: 'Settings...',
      id: 'file.publish.settings',
      key: 'o',
      altKey: true,
    },
    {
      label: 'Copy',
      id: 'edit.copy.selection',
      key: 'c',
      ctrlKey: true,
      input: false,
    },
    {
      label: 'Paste',
      id: 'edit.paste.selection',
      key: 'v',
      ctrlKey: true,
      input: false,
    },
    {
      label: 'Undo',
      id: 'edit.undo',
      key: 'z',
      ctrlKey: true,
      input: false,
    },
    {
      label: 'Redo',
      id: 'edit.redo',
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      input: false,
    },
    {
      label: 'Delete selection',
      id: 'edit.delete.selection',
      key: 'Delete',
      input: false,
    },
    /////////////////////////////////////////////////
    // handled in stage: key: 'ArrowUp',
    // {
    //   label: 'Bring to front',
    //   id: 'edit.move.to.top',
    //   altKey: true,
    //   shiftKey: true,
    // },
    // {
    //   label: 'Bring forward',
    //   id: 'edit.move.up',
    //   // altKey: true,
    //   // handled in stage: key: 'ArrowUp',
    // },
    // {
    //   label: 'Bring backward',
    //   id: 'edit.move.down',
    //   // altKey: true,
    //   // handled in stage: key: 'ArrowDown',
    // },
    // {
    //   label: 'Send to back',
    //   id: 'edit.move.to.bottom',
    //   // altKey: true,
    //   // shiftKey: true,
    //   // handled in stage: key: 'ArrowDown',
    // },
    /////////////////////////////////////////////////
    {
      label: 'Rename page',
      id: 'edit.rename.page',
      key: 'r',
      altKey: true,
    },
    // {
    //   label: 'Delete page',
    //   id: 'edit.delete.page',
    //   key: 'p',
    //   altKey: true,
    //   shiftKey: true,
    // },
    {
      label: 'Preview',
      id: 'view.file',
      key: 'v',
      altKey: true,
    },
    {
      label: 'Preview in Responsize',
      id: 'view.file.responsize',
      key: 'v',
      shiftKey: true,
      altKey: true,
    },
    /////////////////////////////////////////////////
    {
      label: 'Mobile editor',
      id: 'tools.mobile.mode',
      key: 'm',
      altKey: true,
    },
    /////////////////////////////////////////////////
    {
      label: 'HTML <head> editor',
      id: 'view.open.htmlHeadEditor',
      key: 'e',
      altKey: true,
    },
    {
      label: 'JS scripts editor',
      id: 'view.open.jsEditor',
      key: 'j',
      altKey: true,
    },
    {
      label: 'CSS styles editor',
      id: 'view.open.cssEditor',
      key: 'd',
      altKey: true,
    },
    // {
    //   label: 'Open file browser',
    //   id: 'view.open.fileExplorer',
    // },
    {
      label: 'Text box',
      id: 'insert.text',
      key: 't',
      altKey: true,
    },
    {
      label: 'Image...',
      id: 'insert.image',
      key: 'i',
      altKey: true,
    },
    {
      label: 'Container',
      id: 'insert.container',
      key: 'c',
      altKey: true,
    },
    {
      label: 'HTML box',
      id: 'insert.html',
      key: 'h',
      altKey: true,
    },
    {
      label: 'Section',
      id: 'insert.section',
      key: 's',
      altKey: true,
    },
    /////////////////////////////////////////////////
    {
      label: 'New page',
      id: 'insert.page',
      key: 'p',
      altKey: true,
    },
    // {
    //   label: 'About Silex',
    //   id: 'help.about',
    // },
    // {
    //   label: 'Report a bug or ask a question',
    //   id: 'help.issues',
    // },
    // {
    //   label: 'Download templates',
    //   id: 'help.downloads.template',
    // },
    // {
    //   label: 'Download widgets',
    //   id: 'help.downloads.widget',
    // },
    // {
    //   label: 'Silex Labs foundation',
    //   id: 'help.aboutSilexLabs',
    // },
    // {
    //   label: 'News letter subscription',
    //   id: 'help.newsLetter',
    // },
    // {
    //   label: 'Twitter',
    //   id: 'help.twitter',
    // },
    // {
    //   label: 'Google+',
    //   id: 'help.googlPlus',
    // },
    // {
    //   label: 'Facebook',
    //   id: 'help.facebook',
    // },
    // {
    //   label: 'Give 5 minutes of your time!',
    //   id: 'help.contribute',
    // },
    // {
    //   label: 'Source code and download Silex',
    //   id: 'help.forkMe',
    // }
  ];
}
