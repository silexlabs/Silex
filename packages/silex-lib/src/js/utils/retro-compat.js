silex-sub-type



//////////////////////////////////////////////////////////////////
// retrocompatibility process
// called after opening a file
//////////////////////////////////////////////////////////////////
/**
 * handle retrocompatibility issues
 */
silex.model.File.prototype.handleRetrocompatibility = function() {
  var that = this;
  // handle older page system
  $('meta[name="page"]', this.stage.headElement).each(function() {
    // old fashion way to get the name
    var pageName = this.getAttribute('content');
    // create a page object
    var page = new silex.model.Page(
        pageName,
        that.workspace,
        that.menu,
        that.stage,
        that.pageTool,
        that.propertiesTool,
        that.textEditor,
        that.fileExplorer
        );
    console.warn('retro compat in action', this, page);
    // add in new page system
    page.attach();
    // remove the old tag
    $(this).remove();
  });
};
