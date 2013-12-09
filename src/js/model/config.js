
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


goog.provide('silex.model.Config');

function getAllCombinations(menu, option){
  return [
    'ctrl+' + option
    , 'alt+' + option
    , 'command+' + option
    , 'ctrl+shift+' + option
    , 'alt+shift+' + option
    , 'command+shift+' + option
    , 'ctrl+' + menu + ' ctrl+' + option
    , 'alt+' + menu + ' alt+' + option
    , 'command+' + menu + ' command+' + option
    , 'ctrl+shift+' + menu + ' ctrl+shift+' + option
    , 'alt+shift+' + menu + ' alt+shift+' + option
    , 'command+shift+' + menu + ' command+shift+' + option
  ];
}
/**
 * The main application menu
 */
silex.model.Config.menu = {
  names: [
    {
      label: 'File'
      , className: 'menu-item-file'
      , shortcut: ['mod+shift+f']
      , tooltip: 'ctrl+⇪+f'
    }
    , {
      label: 'Edit'
      , className: 'menu-item-edit'
      , shortcut: ['mod+shift+e']
      , tooltip: 'ctrl+⇪+e'
    }
    , {
      label: 'View'
      , className: 'menu-item-view'
      , shortcut: ['mod+shift+v']
      , tooltip: 'ctrl+⇪+v'
    }
    , {
      label: 'Insert'
      , className: 'menu-item-insert'
      , shortcut: ['mod+shift+i']
      , tooltip: 'ctrl+⇪+i'
    }
    , {
      label: 'Tools'
      , className: 'menu-item-tools'
      , shortcut: ['mod+shift+t']
      , tooltip: 'ctrl+⇪+t'
    }
    , {
      label: 'Help'
      , className: 'menu-item-help'
      , shortcut: ['mod+shift+h']
      , tooltip: 'ctrl+⇪+h'
    }
  ]
  , options: [
    [
      {
        label: 'New File'
        , id: 'file.new'
        , className: 'menu-item-file-new'
        , shortcut: getAllCombinations('f', 'n')
        , tooltip: 'ctrl+fn'
      }
      , {
        label: 'Open File...'
        , id: 'file.open'
        , className: 'menu-item-file-open'
        , shortcut: getAllCombinations('f', 'o')
        , tooltip: 'ctrl+fo'
      }
      , {
        label: 'Save File'
        , id: 'file.save'
        , className: 'menu-item-file-save'
        , shortcut: getAllCombinations('f', 's')
        , tooltip: 'ctrl+fs'
      }
      , {
        label: 'Save As...'
        , id: 'file.saveas'
        , className: 'menu-item-file-saveas'
        , shortcut: getAllCombinations('f', 's')
        , tooltip: 'ctrl+⇪+fs'
      }
      , null
      , {
        label: 'Publish'
        , id: 'file.publish'
        , className: 'menu-item-file-publish'
        , shortcut: getAllCombinations('f', 'p')
        , tooltip: 'ctrl+⇪+fp'
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
        , shortcut: getAllCombinations('f', 'w')
        , tooltip: 'ctrl+fw'
      }
    ]
    , [
      {
        label: 'Delete selection'
        , id: 'edit.delete.selection'
        , className: 'menu-item-edit-delete-selection'
        , shortcut: ['del', 'backspace']
        , tooltip: 'suppr'
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
        , shortcut: getAllCombinations('v', 'n')
        , tooltip: 'ctrl+⇪+vn'
      }
      , null
      , {
        label: 'Open text editor'
        , id: 'view.open.textEditor'
        , className: 'menu-item-view-open-textEditor'
        , shortcut: ['enter']
        , tooltip: '↵'
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
        , shortcut: getAllCombinations('i', 't')
        , tooltip: 'ctrl+⇪+it'
      }
      , {
        label: 'Image...'
        , id: 'insert.image'
        , className: 'menu-item-insert-image'
        , shortcut: getAllCombinations('i', 'i')
        , tooltip: 'ctrl+⇪+ii'
      }
      , {
        label: 'Container'
        , id: 'insert.container'
        , className: 'menu-item-insert-container'
        , shortcut: getAllCombinations('i', 'c')
        , tooltip: 'ctrl+⇪+ic'
      }
      , null
      , {
        label: 'HTML box'
        , id: 'insert.html'
        , className: 'menu-item-insert-html'
        , shortcut: getAllCombinations('i', 'h')
        , tooltip: 'ctrl+⇪+ih'
      }
      , null
      , {
        label: 'New page'
        , id: 'insert.page'
        , className: 'menu-item-insert-page'
        , shortcut: getAllCombinations('i', 'n')
        , tooltip: 'ctrl+⇪+in'
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
        label: 'Questions and answers'
        , id: 'help.forums'
        , className: 'menu-item-help-forums'
      }
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
silex.model.Config.fonts = {


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
