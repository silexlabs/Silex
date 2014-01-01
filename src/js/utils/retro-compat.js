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
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.RetroCompat');

/**
 * @constructor
 * @struct
 * @param {string} name
 * @param {string} displayName
 */
silex.utils.RetroCompat = function() {
  throw('this is a static class and it canot be instanciated');
}


/**
 * handle retrocompatibility issues
 * retrocompatibility process takes place after opening a file
 */
silex.utils.RetroCompat.process = function(bodyElement, headElement) {
  var that = this;
  // handle older style system
  $('[data-style-normal]', bodyElement).each(function() {
    this.setAttribute('style', this.getAttribute('data-style-normal'));
    this.removeAttribute('data-style-normal');
  });
  // handle older page system
  $('meta[name="page"]', headElement).each(function() {
    // old fashion way to get the name
    var pageName = this.getAttribute('content');
    // create a page object
    var page = new silex.model.Page(
        pageName,
        that.workspace,
        that.menu,
        that.stage,
        that.pageTool,
        that.propertyTool,
        that.textEditor,
        that.fileExplorer
        );
    console.warn('retro compat in action', this, page);
    // add in new page system
    page.attach();
    // remove the old tag
    $(this).remove();
  });

  // todo: retorcompat silex-sub-type
  // todo: retorcompat silex links with #!

};
