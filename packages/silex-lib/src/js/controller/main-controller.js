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
 * @fileoverview The main Silex controller
 * It listens to the view elements, and updates the model.
 *
 */


goog.provide('silex.controller.MainController');

goog.require('silex.service.Tracker');

/**
 * @constructor
 * the Silex controller class
 * @param {silex.Model} model
 * @param {silex.View} view
 */
silex.controller.MainController = function(model, view) {
  // store the model and view
  this.model = model;
  this.view = view;

  // tracker
  this.tracker = new silex.service.Tracker();
  this.tracker.trackAction('controller-events', 'start', null, 2);

  // handle the "prevent leave page" mechanism
  if(!silex.Config.debug.debugMode || silex.Config.debug.preventQuit){
    function closeEditorWarning() {
      return 'Are you sure you want to leave me?';
    }
    window.onbeforeunload = closeEditorWarning;
  }
};


/**
 * {silex.service.Tracker} tracker used to pull statistics on the user actions
 * @see     silex.service.Tracker
 */
silex.controller.MainController.prototype.tracker;


/**
 * reference to the {object} view, an object with properties menu, stage...
 */
silex.controller.MainController.prototype.view;


/**
 * reference to the {object} model, an object with properties file, head, body...
 */
silex.controller.MainController.prototype.model;


////////////////////////////////////////////////////////////////
// Callback for the view events
////////////////////////////////////////////////////////////////


/**
 * rename a page
 */
silex.controller.MainController.prototype.renamePage = function(page) {
  this.getUserInputPageName(page.name, goog.bind(function(name) {
    if (name) {
      page.rename(name);
    }
    this.app.selection.getPage().open();
  }, this));
};


/**
 * remvove a page
 */
silex.controller.MainController.prototype.removePage = function(page) {
  silex.utils.Notification.confirm('I am about to delete the page "' + page.name + '", are you sure?', function(accept) {
    if (accept) {
      // update model
      page.detach();
    }
  });
};


/**
 * input a page name
 */
silex.controller.MainController.prototype.getUserInputPageName = function(defaultName, cbk) {
  silex.utils.Notification.prompt('Enter a name for your page!',
      function(accept, pageName) {
        if (accept && pageName && pageName.length > 0) {
          // cleanup the page name
          pageName = pageName.replace(/\ /g, '-')
                .replace(/\./g, '-')
                .replace(/'/g, '-')
                .replace(/"/g, '-')
                .toLowerCase();
          // check if a page with this name exists
          var pages = silex.model.Page.getPages();
          var exists = null;
          goog.array.forEach(pages, function(page) {
            if (page.name === pageName)
              exists = page;
          });
          if (exists) {
            exists.open();
          }
          else {
            cbk(pageName);
          }
        }
        cbk(null);
      }, defaultName);
};


/**
 * create a page
 */
silex.controller.MainController.prototype.createPage = function(successCbk, errorCbk) {
  this.getUserInputPageName('My new page name', goog.bind(function(pageName) {
    if (pageName) {
      // create the page model
      var page = new silex.model.Page(
          pageName,
          this.app.workspace,
          this.app.menu,
          this.app.stage,
          this.app.pageTool,
          this.app.propertiesTool,
          this.app.textEditor,
          this.app.fileExplorer
          );
      page.attach();
      this.app.selection.setPage(page);
      page.open();
      if (successCbk) successCbk();
    }
    else {
      if (errorCbk) errorCbk();
    }
  }, this));
};


/**
 * edit a component
 * take its type into account
 */
silex.controller.MainController.prototype.editSelection = function() {
  var component = this.app.selection.getComponent();
  switch (component.type) {
    case silex.model.Component.SUBTYPE_TEXT:
      this.app.textEditor.openEditor(component.getHtml());
      break;
    case silex.model.Component.SUBTYPE_HTML:
      this.app.htmlEditor.openEditor(component.getHtml());
      break;
    case silex.model.Component.SUBTYPE_IMAGE:
      this.app.fileExplorer.openDialog(
          goog.bind(function(blob) {
            this.app.propertiesTool.setImage(blob.url);
          }, this),
          ['image/*', 'text/plain'],
          goog.bind(function(error) {
            this.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
          }, this)
      );
      this.app.workspace.invalidate();
      break;
  }
};


/**
 * view this file in a new window
 */
silex.controller.MainController.prototype.view = function() {
  if (!this.app.file.getUrl()) {
    silex.utils.Notification.confirm('The file has to be saved first. Save the file now?', goog.bind(function(accept) {
      if (accept) {
        this.save(null, goog.bind(function() {
          window.open(this.app.file.getUrl());
        }, this));
      }
    }, this));
  }
  else {
    window.open(this.app.file.getUrl());
  }
};


/**
 * ask the user for a new file title
 */
silex.controller.MainController.prototype.promptTitle = function(){
  silex.utils.Notification.prompt('What is the name of your website?', goog.bind(function(accept, name) {
    if (accept) this.app.file.setTitle(name);
  }, this), this.app.menu.getWebsiteName());
}
/**
 * ask the user for a new file title
 */
silex.controller.MainController.prototype.promptTitle = function(){
  if (!this.app.file.getPublicationPath()) {
    silex.utils.Notification.alert('I do not know where to publish your site. \
      Select a folder in the settings pannel and do "publish" again. \
      <br /><br />Now I will open the publish settings.',
      goog.bind(function() {
        this.app.settingsDialog.openDialog();
        this.app.workspace.invalidate();
      }, this));
  }
  else
  {
    this.app.file.publish(
      goog.bind(function(status) {
      if (status && status.success == false) {
        console.error('Error: I did not manage to publish the file. (1)');
        this.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. <br /><br />Error message: ' + (status.message || status.code || ''));
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      }
      else {
        silex.utils.Notification.notifySuccess('I am about to publish your site. This may take several minutes.');
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
      }
      }, this),
      goog.bind(function(error) {
        console.error('Error: I did not manage to publish the file. (2)', error);
        this.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. <br /><br />Error message: ' + error);
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      }, this));
  }
}
/**
 * refresh font list in the text editor, and in the head tag
 */
silex.controller.MainController.prototype.refreshFonts = function(){
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.view.stage.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
}
/**
 * open a file
 */
silex.controller.MainController.prototype.openFile = function(url, opt_cbk){
  this.model.file.open(goog.bind(function() {
    this.tracker.trackAction('controller-events', 'success', event.type, 1);
    silex.utils.Notification.notifySuccess(this.model.file.getTitle() + ' opened.');
    this.view.propertiesTool.update();
    // update fonts
    this.refreshFonts();
  }, this),
  goog.bind(function(error) {
    this.notifyError('Error: I did not manage to open this file. <br /><br />' + (error.message || ''));
    this.tracker.trackAction('controller-events', 'error', event.type, -1);
  }, this));
}
/**
 * save or save-as
 */
silex.controller.MainController.prototype.save = function(opt_url, opt_cbk){

  if (opt_url){
    this.app.file.save(
      goog.bind(function() {
        silex.utils.Notification.notifySuccess('Your file is saved.');
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
        if (opt_cbk) opt_cbk();
      }, this),
      goog.bind(function(error) {
        this.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      }, this));
  }
  else{
    // choose a new name
    this.fileExplorer.saveAsDialog(
      goog.bind(function(url) {
        this.app.file.saveAs(
          url,
          goog.bind(function() {
            silex.utils.Notification.notifySuccess('Your file is saved.');
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
            this.workspace.invalidate();
            if (opt_cbk) opt_cbk();
          }, this),
          goog.bind(function(error) {
            this.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this));
      }, this),
      ['text/html', 'text/plain']
    );
  }
}
