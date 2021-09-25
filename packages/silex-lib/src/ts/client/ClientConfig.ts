/**
 * @fileoverview Silex config available to index.pug as silex.config
 */

export const config = {

  /**
   * debug mode
   */
  debug: false,

  /**
   * Link of the menu
   */
  WIKI_SILEX: 'https://github.com/silexlabs/Silex/wiki',

  /**
   * Link in property tool dialog
   * this is also hard coded in property-tool.pug
   */
  WIKI_SILEX_CUSTOM_CSS_CLASS: 'https://github.com/silexlabs/Silex/wiki/Silex-CSS-editor#custom-css-classes',

  /**
   * Link of the menu
   */
  CROWD_FUNDING: 'http://crowdfunding.silex.me/',

  /**
   * Link of the menu
   */
  ISSUES_SILEX: 'https://github.com/silexlabs/Silex/issues?state=open',

  /**
   * Link of the menu
   */
  DOWNLOADS_TEMPLATE_SILEX: 'https://github.com/silexlabs/Silex/issues?labels=template&state=open',

  /**
   * Link of the menu
   */
  DOWNLOADS_WIDGET_SILEX: 'https://github.com/silexlabs/Silex/issues?labels=widget&state=open',

  /**
   * Link of the menu
   */
  ABOUT_SILEX_LABS: 'http://www.silexlabs.org/',

  /**
   * Link of the menu
   */
  SUBSCRIBE_SILEX_LABS: 'http://eepurl.com/F48q5',

  /**
   * Link of the menu
   */
  SOCIAL_DIASPORA: 'https://diasp.org/people/f37438103a9b013250aa2a0000053625',

  /**
   * Link of the menu
   */
  SOCIAL_TWITTER: 'http://twitter.com/silexlabs',

  /**
   * Link of the menu
   */
  SOCIAL_FB: 'http://www.facebook.com/silexlabs',

  /**
   * Link of the menu
   */
  FORK_CODE: 'https://github.com/silexlabs/Silex',

  /**
   * Link of the menu
   */
  CONTRIBUTE: 'https://github.com/silexlabs/Silex/wiki/Contribute',

  /**
   * Single site mode, skip the dashboard and get the site from the URL
   * Option to be provided by the client side
   */
  singleSiteMode: false,
  componentFolders: ['./prodotype/components'],

  /**
   * The main application menu
   */
  shortcuts: [
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
      label: 'Move Up',
      id: 'edit.position.up',
      key: 'ArrowUp',
      modifiers: false,
      input: false,
    },
    {
      label: 'Move Down',
      id: 'edit.position.down',
      key: 'ArrowDown',
      modifiers: false,
      input: false,
    },
    {
      label: 'Move Left',
      id: 'edit.position.left',
      key: 'ArrowLeft',
      modifiers: false,
      input: false,
    },
    {
      label: 'Move Right',
      id: 'edit.position.right',
      key: 'ArrowRight',
      modifiers: false,
      input: false,
    },
    {
      label: 'Move Up in the DOM',
      id: 'edit.move.up',
      key: 'ArrowUp',
      altKey: true,
      input: false,
    },
    {
      label: 'Move Down in the DOM',
      id: 'edit.move.down',
      key: 'ArrowDown',
      altKey: true,
      input: false,
    },
    {
      label: 'Move Top',
      id: 'edit.move.to.top',
      key: 'ArrowUp',
      shiftKey: true,
      altKey: true,
      input: false,
    },
    {
      label: 'Move Bottom',
      id: 'edit.move.to.bottom',
      key: 'ArrowDown',
      shiftKey: true,
      altKey: true,
      input: false,
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
      label: 'Duplicate',
      id: 'edit.duplicate.selection',
      key: 'D',
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
    {
      label: 'Empty selection',
      id: 'edit.empty.selection',
      key: 'Escape',
      input: false,
    },
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
    {
      label: 'Next tab in the property tool',
      id: 'tools.next.property',
      key: 'l',
      altKey: true,
    },
    {
      label: 'Previous tab in the property tool',
      id: 'tools.prev.property',
      key: 'l',
      shiftKey: true,
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
  ],
}
