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


goog.provide('silex.Controller');

goog.require('silex.service.Tracker');

/**
 * the Silex controller class
 * @constructor
 */
silex.Controller = function(app) {

  // logger
  //this.logger = new silex.Logger('silex.Controller', true);

  // tracker
  this.tracker = new silex.service.Tracker();
  this.tracker.trackAction('silex-event/controller', 'start', null, 2);

  // store references to the app
  this.app = app;

  // init selection
  this.app.selection.setComponent(this.app.file.getStageComponent());

  // attach events to the view and model
  this.app.menu.onStatus = goog.bind(this.app.menuCallback, this);
  this.app.stage.onStatus = goog.bind(this.app.stageCallback, this);
  this.app.pageTool.onStatus = goog.bind(this.app.pageToolCallback, this);
  this.app.propertiesTool.onStatus = goog.bind(this.app.propertiesToolCallback, this);
  this.app.publishSettings.onStatus = goog.bind(this.app.publishSettingsCallback, this);
  this.app.htmlEditor.onStatus = goog.bind(this.app.htmlEditorCallback, this);
  this.app.textEditor.onStatus = goog.bind(this.app.textEditorCallback, this);

  if(!silex.Config.debug.debugMode || silex.Config.debug.preventQuit){
    function closeEditorWarning() {
      return 'Are you sure?';
    }
    window.onbeforeunload = closeEditorWarning;
  }
};


/**
 * tracker
 * @see     silex.service.Tracker
 */
silex.Controller.prototype.tracker;


/**
 * reference to the app
 */
silex.Controller.prototype.app;


////////////////////////////////////////////////////////////////
// Callback for the view events
////////////////////////////////////////////////////////////////
/**
 * menu event handler
 */
silex.Controller.prototype.menuCallback = function(event) {
  this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'title.changed':
      alertify.prompt('What is the name of your website?', goog.bind(function(accept, name) {
        if (accept) this.app.file.setTitle(name);
      }, this), this.app.menu.getWebsiteName());
      break;
    case 'file.new':
      this.app.file.newFile();
      break;
    case 'file.saveas':
      this.app.file.saveAs(
          goog.bind(function() {
            this.notifySuccess('Your file is saved.');
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
          }, this),
          goog.bind(function(error) {
            this.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this));
      break;
    case 'file.publish.settings':
      this.app.publishSettings.openDialog();
      this.app.workspace.invalidate();
      break;
    case 'file.publish':
      if (!this.app.file.getPublicationPath()) {
        alertify.alert('I do not know where to publish your site. \
            Select a folder in the settings pannel and do "publish" again. \
            <br /><br />Now I will open the publish settings.',
            goog.bind(function() {
              this.app.publishSettings.openDialog();
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
                this.notifySuccess('I am about to publish your site. This may take several minutes.');
                this.tracker.trackAction('controller-events', 'success', event.type, 1);
              }
            }, this),
            goog.bind(function(error) {
              console.error('Error: I did not manage to publish the file. (2)', error);
              this.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. <br /><br />Error message: ' + error);
              this.tracker.trackAction('controller-events', 'error', event.type, -1);
            }, this));
      }
      break;
    case 'file.save':
      if (!this.app.file.getBlob()) {
        this.app.file.saveAs(
            goog.bind(function() {
              this.notifySuccess('Your file is saved.');
              this.tracker.trackAction('controller-events', 'success', event.type, 1);
            }, this),
            goog.bind(function(error) {
              this.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
              this.tracker.trackAction('controller-events', 'error', event.type, -1);
            }, this));
      }
      else {
        this.app.file.save(
            goog.bind(function() {
              this.notifySuccess('Your file is saved.');
              this.tracker.trackAction('controller-events', 'success', event.type, 1);
            }, this),
            goog.bind(function(error) {
              this.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
              this.tracker.trackAction('controller-events', 'error', event.type, -1);
            }, this));
      }
      break;
    case 'file.open':
      this.app.file.open(goog.bind(function() {
        this.notifySuccess(this.app.file.getTitle() + ' opened.');
        this.app.selection.setComponent(this.app.file.getStageComponent());
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
      }, this),
      goog.bind(function(error) {
        this.notifyError('Error: I did not manage to open this file. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      }, this));
      break;
    case 'file.close':
      this.app.file.close();
      this.app.selection.setComponent(null);
      break;
    case 'view.file':
      this.app.file.view();
      break;
    case 'tools.advanced.activate':
      if (!goog.dom.classes.has(document.body, 'advanced-mode-on')) {
        goog.dom.classes.add(document.body, 'advanced-mode-on');
        goog.dom.classes.remove(document.body, 'advanced-mode-off');
      }
      else {
        goog.dom.classes.remove(document.body, 'advanced-mode-on');
        goog.dom.classes.add(document.body, 'advanced-mode-off');
      }
      break;
    case 'tools.debug.activate':
      if (this.logger.getLevel() !== silex.Logger.ALL) {
        this.logger.setLevel(silex.Logger.ALL);
      }
      else {
        this.logger.setLevel(silex.Logger.OFF);
      }
      break;
    case 'view.open.fileExplorer':
      this.app.fileExplorer.openDialog();
      this.app.workspace.invalidate();
      break;
    case 'view.open.textEditor':
      this.editComponent();
      break;
    case 'insert.page':
      this.createPage(goog.bind(function() {
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
      }, this),
      goog.bind(function() {
        this.tracker.trackAction('controller-events', 'cancel', event.type, 0);
      }, this));
      break;
    case 'insert.text':
      var component = this.app.file.getStageComponent().addText();
      // only visible on the current page
      this.app.selection.getPage().addComponent(component);
      // select the component
      this.app.selection.setComponent(component);
      break;
    case 'insert.html':
      var component = this.app.file.getStageComponent().addHtml();
      // only visible on the current page
      this.app.selection.getPage().addComponent(component);
      // select the component
      this.app.selection.setComponent(component);
      break;
    case 'insert.image':
      this.app.fileExplorer.openDialog(
          goog.bind(function(blob) {
            var component = this.app.file.getStageComponent().addImage(blob.url);
            // only visible on the current page
            this.app.selection.getPage().addComponent(component);
            // select the component
            this.app.selection.setComponent(component);
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
          }, this),
          ['image/*', 'text/plain'],
          goog.bind(function(error) {
            this.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this)
      );
      this.app.workspace.invalidate();
      break;
    case 'insert.container':
      var component = this.app.file.getStageComponent().addContainer();
      // only visible on the current page
      this.app.selection.getPage().addComponent(component);
      // select the component
      this.app.selection.setComponent(component);
      break;
    case 'edit.delete.selection':
      // delete component
      this.app.file.getStageComponent().remove(this.app.selection.getComponent());
      // select stage
      this.app.selection.setComponent(this.app.file.getStageComponent());
      break;
    case 'edit.delete.page':
      this.removePage(this.app.selection.getPage());
      break;
    case 'edit.rename.page':
      this.renamePage(this.app.selection.getPage());
      break;
    // Help menu
    case 'help.about':
      window.open('http://www.silexlabs.org/silex/');
      break;
    case 'help.aboutSilexLabs':
      window.open('http://www.silexlabs.org/silexlabs/');
      break;
    case 'help.forums':
      window.open('http://graphicdesign.stackexchange.com/questions/tagged/silex');
      break;
    case 'help.newsLetter':
      window.open('http://eepurl.com/F48q5');
      break;
    case 'help.googlPlus':
      window.open('https://plus.google.com/communities/107373636457908189681');
      break;
    case 'help.twitter':
      window.open('http://twitter.com/silexlabs');
      break;
    case 'help.facebook':
      window.open('http://www.facebook.com/silexlabs');
      break;
    case 'help.forkMe':
      window.open('https://github.com/silexlabs/Silex');
      break;
  }
};


/**
 * stage event handler
 */
silex.Controller.prototype.stageCallback = function(event) {
  //this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'select':
      // reset context for the old selection
      var oldSelectedComp = this.app.selection.getComponent();
      if (oldSelectedComp) oldSelectedComp.setContext(silex.model.Component.CONTEXT_NORMAL);
      // select the new element
      if (event.element) {
        // update the
        this.app.selection.setComponent(
            new silex.model.Component(
            event.element,
            this.app.selection.getContext()
            ));
        // update context for the selection
        this.app.selection.getComponent().setContext(this.app.selection.getContext());
      }
      else {
        // select stage
        this.app.selection.setComponent(this.app.file.getStageComponent());
      }
      break;
    case 'change':
      // size or position of the element has changed
      this.app.selection.getComponent().setBoundingBox(
          this.app.selection.getComponent().getBoundingBox()
      );
      this.app.propertiesTool.redraw();
      break;
    case 'newContainer':
      // an element is dropped in a new container
      var component = this.app.selection.getComponent();
      // if it is dropped in a container which is visible only on some pages,
      // then the dropped element should be visible everywhere, i.e. in the same pages as its parent
      if (component.getFirstPageableParent() !== null) {
        // get all the pages in which this element is visible
        var pages = silex.model.Page.getPagesForElement(component.element);
        for (idx in pages) {
          var page = pages[idx];
          // remove the component from the page
          page.removeComponent(component);
        }
        // redraw the tool box in order to reflect the changes
        this.app.propertiesTool.redraw();
      }
      break;
    case 'edit':
      // size or position of the element has changed
      this.editComponent();
      break;
  }
};


/**
 * pageTool event handler
 */
silex.Controller.prototype.pageToolCallback = function(event) {
  this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'changed':
      this.app.selection.setPage(event.page);
      if (event.page) {
        event.page.open();
      }
      break;
    case 'delete':
      // delete the page from the model
      this.removePage(event.page);
      break;
    case 'rename':
      // delete the page from the model
      this.renamePage(event.page);
      break;
  }
};


/**
 * rename a page
 */
silex.Controller.prototype.renamePage = function(page) {
  this.getUserInputPageName(page.name, goog.bind(function(name) {
    if (name) {
      page.rename(name);
    }
    this.app.selection.getPage().open();
  }, this));
};


/**
 * remvoe a given page
 */
silex.Controller.prototype.removePage = function(page) {
  alertify.confirm('I am about to delete the page "' + page.name + '", are you sure?', function(accept) {
    if (accept) {
      // update model
      page.detach();
    }
  });
};


/**
 * input a page name
 */
silex.Controller.prototype.getUserInputPageName = function(defaultName, cbk) {
  alertify.prompt('Enter a name for your page!',
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
silex.Controller.prototype.createPage = function(successCbk, errorCbk) {
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
 * publishSettings event handler
 */
silex.Controller.prototype.publishSettingsCallback = function(event) {
  switch (event.type) {
    case 'browsePublishPath':
      this.app.fileExplorer.openDialog(
          goog.bind(function(blob) {
            var url = blob.url.substring(blob.url.indexOf('/api/v1.0/'), blob.url.lastIndexOf('/'));
            //var url = blob.url.substring(blob.url.indexOf('api/v1.0/')+9, blob.url.lastIndexOf('/'));
            //var url = blob.url.substr(blob.url.indexOf('api/v1.0/')+9);
            url = url.replace('/exec/get', '/exec/put');
            this.app.file.setPublicationPath(url);
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
          }, this),
          null,
          goog.bind(function(error) {
            this.notifyError('Error: I could not select the publish path. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this)
      );
      break;
    case 'change':
      this.app.file.setPublicationPath(event.data);
      break;
  }
};


/**
 * propertiesTool event handler
 */
silex.Controller.prototype.propertiesToolCallback = function(event) {
  //this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'editHTML':
      this.editComponent();
      break;
    case 'editText':
      this.editComponent();
      break;
    case 'selectBgImage':
      var errCbk = function(error) {
        this.notifyError('Error: I could not load the image. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', event.type, -1);
      };
      var successCbk = function(blob) {
        this.app.propertiesTool.setBgImage(blob.url);
        this.tracker.trackAction('controller-events', 'success', event.type, 1);
      };
      // open the file browser
      this.app.fileExplorer.openDialog(
          goog.bind(successCbk, this),
          ['image/*', 'text/plain'],
          goog.bind(errCbk, this)
      );
      this.app.workspace.invalidate();
      break;
    case 'selectImage':
      this.editComponent();
      break;
    case 'contextChanged':
      // style of the element has changed
      this.app.selection.setContext(event.context);
      this.app.selection.getComponent().setContext(event.context);
      break;
    case 'styleChanged':
      // style of the element has changed
      this.app.selection.getComponent().setStyle(event.style, event.context);
      break;
    case 'propertiesChanged':
      break;
  }
};


/**
 * htmlEditor event handler
 */
silex.Controller.prototype.htmlEditorCallback = function(event) {
  switch (event.type) {
    case 'changed':
      this.app.selection.getComponent().setHtml(event.content);
      break;
  }
};


/**
 * textEditor event handler
 */
silex.Controller.prototype.textEditorCallback = function(event) {
  switch (event.type) {
    case 'changed':
      this.app.selection.getComponent().setHtml(event.content);

      //update loaded font list, as user might have choose a new one
      this.app.file.refreshFontList();
      break;
  }
};


/**
 * edit a component
 * take its type into account
 */
silex.Controller.prototype.editComponent = function() {
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
 * notify the user
 */
silex.Controller.prototype.notifySuccess = function(message) {
  console.info(message);
  alertify.success(message);
};


/**
 * notify the user
 */
silex.Controller.prototype.notifyError = function(message) {
  console.error(message);
  alertify.error(message);
};
