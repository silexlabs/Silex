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
 * @fileoverview In Silex, each UI of the view package,
 *      has a controller in the UI controller package which listens to its events,
 *      and call the main {silex.controller.Controller} controller's methods
 *      These UI controllers override the
 *      {silex.controller.ControllerBase} UiControllerBase class
 *
 */
goog.provide('silex.controller.ControllerBase');

goog.require('silex.utils.Notification');
goog.require('silex.utils.PageablePlugin');
goog.require('silex.utils.BackwardCompat');

/**
 * @constructor
 * base class for all UI controllers of the controller package
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.ControllerBase = function (model, view) {
  // store the model and view
  this.model = model;
  this.view = view;

  // tracker
  this.tracker = silex.service.Tracker.getInstance();
};


/**
 * {silex.service.Tracker} tracker used to pull statistics on the user actions
 * @see     silex.service.Tracker
 */
silex.controller.ControllerBase.prototype.tracker;


/**
 * reference to the {object} view, an object with properties menu, stage...
 */
silex.controller.ControllerBase.prototype.view;


/**
 * reference to the {object} model, an object with properties file, head, body...
 */
silex.controller.ControllerBase.prototype.model;


/**
 * remove an element from the stage
 * @param {element} element    the element to remove
 */
silex.controller.ControllerBase.prototype.removeElement = function(opt_element) {
  // default is selected element
  if(!opt_element) opt_element = this.view.stage.getSelection()[0];
  // remove the element
  this.model.element.removeElement(opt_element);
  // update view
  this.view.propertyTool.redraw();
}


/**
 * open file explorer, choose an image and set it as the background image of the current selection
 */
silex.controller.ControllerBase.prototype.browseBgImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'selectBgImage', 0);

  var errCbk = function(error) {
    silex.utils.Notification.notifyError('Error: I could not load the image. <br /><br />' + (error.message || ''));
    this.tracker.trackAction('controller-events', 'error', type, -1);
  };

  var successCbk = function(url) {
    // update the model
    var element = this.view.stage.getSelection()[0];
    // absolute url only on stage
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
    // load the image
    this.model.element.setBgImage(element, url);
    // redraw the data
    this.view.propertyTool.redraw();
    this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
  };

  // open the file browser
  this.view.fileExplorer.openDialog(
      goog.bind(successCbk, this),
      {'mimetype': 'image/*'},
      goog.bind(errCbk, this)
  );
  this.view.workspace.invalidate();
}


/**
 * open file explorer, choose an image and add it to the stage
 */
silex.controller.ControllerBase.prototype.browseAndAddImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
  this.view.fileExplorer.openDialog(
      goog.bind(function(url) {
        // absolute url only on stage
        var baseUrl = silex.utils.Url.getBaseUrl();
        url = silex.utils.Url.getAbsolutePath(url, baseUrl);
        // create the element
        var img = this.addElement(silex.model.Element.TYPE_IMAGE);
        // load the image
        this.model.element.setImageUrl(img, url,
          goog.bind(function(element, img){
            // update element size
            goog.style.setStyle(element, {
              width: img.naturalWidth + 'px',
              height: img.naturalHeight + 'px'
            });
            this.tracker.trackAction('controller-events', 'success', 'insert.image', 1);
          }, this),
          goog.bind(function(element, message){
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. <br /><br />' + message);
            this.removeElement(element);
            this.tracker.trackAction('controller-events', 'error', 'insert.image', 1);
          }, this)
        );
      }, this),
      {'mimetype': 'image/*'},
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
      }, this)
  );
  this.view.workspace.invalidate();
}
/**
 * create an element and add it to the stage
 * @return {element} the new element
 */
silex.controller.ControllerBase.prototype.addElement = function(type) {
  this.tracker.trackAction('controller-events', 'request', 'insert.'+type, 0);
  try{
    // create the element and add it to the stage
    var element = this.model.element.createElement(type);
    // only visible on the current page
    var currentPageName = silex.utils.PageablePlugin.getCurrentPageName();
    silex.utils.PageablePlugin.addToPage(element, currentPageName);
    // unless one of its parents is in a page already
    this.checkElementVisibility(element);
    // select the component
    this.model.element.setSelected(element, true);
    // update view
    this.view.propertyTool.redraw();
    // update drop zones z index
    silex.utils.EditablePlugin.resetEditable(this.model.body.bodyElement, true);
    // tracking / qos
    this.tracker.trackAction('controller-events', 'success', 'insert.'+type, 1);
  }
  catch(e){
    this.tracker.trackAction('controller-events', 'error', 'insert.'+type, -1);
    console.error('could not add element of type', type, ' - ', e.message);
  }
  return element;
}


/**
 * set a given style to the current selection
 */
silex.controller.ControllerBase.prototype.styleChanged = function(name, value) {
  // style of the element has changed
  var element = this.view.stage.getSelection()[0];
  if (element){
    // update the model
    this.model.element.setStyle(element, name, value);
    // redraw the data
    this.view.propertyTool.redraw();
    // update drop zones z index
    silex.utils.EditablePlugin.resetEditable(this.model.body.bodyElement, true);
  }
  else{
    console.error('can not set style ', name, ' on element ', element);
  }
}


/**
 * set a given property to the current selection
 */
silex.controller.ControllerBase.prototype.propertyChanged = function(name, value) {
  // style of the element has changed
  var element = this.view.stage.getSelection()[0];
  if (element){
    // update the model
    this.model.element.setProperty(element, name, value);
    // redraw the data
    this.view.propertyTool.redraw();
  }
  else{
    console.error('can not set style ', name, ' on element ', element);
  }
}


/**
 * edit Silex editable css styles
 */
silex.controller.ControllerBase.prototype.openCssEditor = function() {
  this.view.cssEditor.openEditor(this.model.head.getHeadStyle());
}


/**
 * edit Silex editable js scripts
 */
silex.controller.ControllerBase.prototype.openJsEditor = function() {
  this.view.jsEditor.openEditor(this.model.head.getHeadScript());
}


/**
 * set css class names
 */
silex.controller.ControllerBase.prototype.setClassName = function(name) {
  // style of the element has changed
  var element = this.view.stage.getSelection()[0];
  if (element){
    // update the model
    silex.utils.Style.setClassName(element, name);
    // redraw the data
    this.view.propertyTool.redraw();
  }
  else{
    console.error('can not add class ', name, ' to element ', element);
  }
}


/**
 * edit an {element} element
 * take its type into account and open the corresponding editor
 */
silex.controller.ControllerBase.prototype.editElement = function(opt_element) {
  // default is selected element
  if(!opt_element) opt_element = this.view.stage.getSelection()[0];

  switch (this.model.element.getType(opt_element)) {
    case silex.model.Element.TYPE_TEXT:
      var bgColor = silex.utils.Style.computeBgColor(opt_element);
      // open the text editor with the same bg color as the element
      this.view.textEditor.openEditor(this.model.element.getInnerHtml(opt_element),
        goog.color.rgbToHex(
          Math.round(bgColor[0]),
          Math.round(bgColor[1]),
          Math.round(bgColor[2])
        ));
      break;
    case silex.model.Element.TYPE_HTML:
      this.view.htmlEditor.openEditor(this.model.element.getInnerHtml(opt_element));
      break;
    case silex.model.Element.TYPE_IMAGE:
      this.view.fileExplorer.openDialog(
          goog.bind(function(url) {
            // absolute url only on stage
            var baseUrl = silex.utils.Url.getBaseUrl();
            url = silex.utils.Url.getAbsolutePath(url, baseUrl);
            // load the image
            this.model.element.setImageUrl(opt_element, url);
          }, this),
          {'mimetype': 'image/*'},
          goog.bind(function(error) {
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
          }, this)
      );
      this.view.workspace.invalidate();
      break;
  }
};


/**
 * open a page
 */
silex.controller.ControllerBase.prototype.openPage = function(pageName) {
  silex.utils.PageablePlugin.setCurrentPage(pageName);
  // update view
  this.view.pageTool.redraw();
}
/**
 * rename a page
 */
silex.controller.ControllerBase.prototype.renamePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName){
    opt_pageName = silex.utils.PageablePlugin.getCurrentPageName();
  }
  this.getUserInputPageName(
    silex.utils.PageablePlugin.getDisplayName(opt_pageName),
      goog.bind(function(name, newDisplayName) {
    if (newDisplayName) {
      // update model
      silex.utils.PageablePlugin.renamePage(opt_pageName, name, newDisplayName);
      // open the new page
      this.openPage(name);
    }
    // update view
    this.view.pageTool.redraw();
    this.view.propertyTool.redraw(); // css class of selected element may have chenged
  }, this));
};


/**
 * remvove a page
 */
silex.controller.ControllerBase.prototype.removePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName){
    opt_pageName = silex.utils.PageablePlugin.getCurrentPage(this.model.body.bodyElement);
  }
  // confirm and delete
  silex.utils.Notification.confirm('I am about to delete the page "'
    + silex.utils.PageablePlugin.getDisplayName(opt_pageName)
    + '", are you sure?',
    goog.bind(function(accept) {
      if (accept) {
        // update model
        silex.utils.PageablePlugin.removePage(opt_pageName);
        // update view
        this.view.pageTool.redraw();
        this.view.propertyTool.redraw(); // css class of selected element may have chenged
      }
  }, this));
};


/**
 * input a page name
 */
silex.controller.ControllerBase.prototype.getUserInputPageName = function(defaultName, cbk) {
  silex.utils.Notification.prompt('Enter a name for your page!',
      goog.bind(function(accept, name) {
        if (accept && name && name.length > 0) {
          // keep the full name
          var displayName = name;
          // cleanup the page name
          name = name.replace(/\ /g, '-')
                .replace(/\./g, '-')
                .replace(/'/g, '-')
                .replace(/"/g, '-')
                .toLowerCase();
          // check if a page with this name exists
          var pages = silex.utils.PageablePlugin.getPages();
          var exists = false;
          goog.array.forEach(pages, function(pageName) {
            if (pageName === name)
              exists = true;
          });
          if (exists) {
            this.openPage(name);
          }
          else {
            cbk(name, displayName);
          }
        }
        cbk(null);
      }, this), defaultName);
};


/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as its parent
 */
silex.controller.ControllerBase.prototype.checkElementVisibility = function(element) {
  var parentPage = silex.utils.PageablePlugin.getParentPage(element);
  if (parentPage !== null) {
    // get all the pages
    var pages = silex.utils.PageablePlugin.getPagesForElement(element);
    for (idx in pages) {
      // remove the component from the page
      var pageName = pages[idx];
      silex.utils.PageablePlugin.removeFromPage(element, pageName);
    }
    // redraw the tool box in order to reflect the changes
    this.view.propertyTool.redraw();
  }
}


/**
 * create a page
 */
silex.controller.ControllerBase.prototype.createPage = function(successCbk, cancelCbk) {
  this.tracker.trackAction('controller-events', 'request', 'insert.page', 0);
  this.getUserInputPageName('Your new page name', goog.bind(function(name, displayName) {
    if (name) {
      // create the page model
      silex.utils.PageablePlugin.createPage(name, displayName);
      this.openPage(name);
      // update view
      this.view.pageTool.redraw();
      this.view.propertyTool.redraw(); // css class of selected element may have chenged
      if (successCbk) successCbk();
      this.tracker.trackAction('controller-events', 'success', 'insert.page', 1);
    }
    else {
      if (cancelCbk) cancelCbk();
      this.tracker.trackAction('controller-events', 'cancel', 'insert.page', 0);
    }
  }, this));
};


/**
 * view this file in a new window
 */
silex.controller.ControllerBase.prototype.preview = function() {
  this.tracker.trackAction('controller-events', 'request', 'view.file', 0);
  try{
    if (!this.model.file.getUrl()) {
      silex.utils.Notification.confirm('Save your file before preview?', goog.bind(function(accept) {
        if (accept) {
          this.save(null, goog.bind(function() {
            window.open(this.model.file.getUrl());
            this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
          }, this));
        }
      }, this));
    }
    else {
      window.open(this.model.file.getUrl());
      this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
    }
  }
  catch(e){
      this.tracker.trackAction('controller-events', 'error', 'view.file', -1);
  }
};


/**
 * ask the user for a new file title
 */
silex.controller.ControllerBase.prototype.promptTitle = function(){
  silex.utils.Notification.prompt('What is the name of your website?', goog.bind(function(accept, name) {
    if (accept) {
      this.model.head.setTitle(name);
      this.view.menu.redraw();
    }
  }, this), this.model.head.getTitle());
}
/**
 * refresh font list in the text editor, and in the head tag
 */
silex.controller.ControllerBase.prototype.refreshFonts = function(){
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.view.stage.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
}
/**
 * open a file
 */
silex.controller.ControllerBase.prototype.newFile = function(opt_cbk, opt_errorCbk){

  this.tracker.trackAction('controller-events', 'request', 'file.new', 0);

  this.model.file.newFile(goog.bind(function (rawHtml) {
    this.model.file.setHtml(rawHtml);
    this.fileOperationSuccess(null, true);
    // QOS, track success
    this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
    if (opt_cbk) {
      opt_cbk();
    }
  }, this), function (error) {
    this.tracker.trackAction('controller-events', 'error', 'file.new', -1);
    if(opt_errorCbk) opt_errorCbk(error);
  });
}
/**
 * open a file
 */
silex.controller.ControllerBase.prototype.openFile = function(opt_cbk, opt_errorCbk){
  // QOS, track success
  this.tracker.trackAction('controller-events', 'request', 'file.open', 0);
  // let the user choose the file
  this.view.fileExplorer.openDialog(
    goog.bind(function(url) {
      this.model.file.open(url, goog.bind(function(rawHtml) {
        this.model.file.setHtml(rawHtml);
        // handle retrocompatibility issues
        silex.utils.BackwardCompat.process(this.model.body.bodyElement, this.model.head.headElement);
        // display and redraw
        this.fileOperationSuccess(this.model.head.getTitle() + ' opened.', true)
        // QOS, track success
        this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
        if(opt_cbk) opt_cbk();
      }, this),
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to open this file. <br /><br />' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
        if(opt_errorCbk) opt_errorCbk(error);
      }, this));
    }, this),
    {'mimetype': 'text/html'},
    function (error) {
      this.tracker.trackAction('controller-events', 'error', 'file.open', -1);
      if(opt_errorCbk) opt_errorCbk(error);
    });
}
/**
 * save or save-as
 */
silex.controller.ControllerBase.prototype.doSave = function(url, opt_cbk, opt_errorCbk){
  // urls will be relative to the html file url
  this.model.file.setUrl(url);
  // relative urls only in the files
  var rawHtml = this.model.file.getHtml();
  // save to file
  this.model.file.saveAs(
    url,
    rawHtml,
    goog.bind(function() {
      this.tracker.trackAction('controller-events', 'success', 'file.save', 1);
      this.fileOperationSuccess('File is saved.', false)
      if (opt_cbk) opt_cbk();
    }, this),
    goog.bind(function(error) {
      silex.utils.Notification.notifyError('Error: I did not manage to save the file. <br /><br />' + (error.message || ''));
      this.tracker.trackAction('controller-events', 'error', 'file.save', -1);
      if (opt_errorCbk) opt_errorCbk(error);
    }, this));
}


/**
 * save or save-as
 */
silex.controller.ControllerBase.prototype.save = function(opt_url, opt_cbk, opt_errorCbk){
  this.tracker.trackAction('controller-events', 'request', 'file.save', 0);
  if (opt_url){
    this.doSave(opt_url, opt_cbk, opt_errorCbk);
  }
  else{
    // choose a new name
    this.view.fileExplorer.saveAsDialog(
      goog.bind(function(url) {
        this.doSave(url, opt_cbk, opt_errorCbk);
      }, this),
      {'mimetype': 'text/html'}
    );
  }
}

/**
 * success of an operation involving changing the file model
 */
silex.controller.ControllerBase.prototype.fileOperationSuccess = function(opt_message, opt_updateTools) {
  // update tools
  if (opt_updateTools){
    // find default first page
    var pages = silex.utils.PageablePlugin.getPages();
    // open default page
    silex.utils.PageablePlugin.setCurrentPage(pages[0]);

    this.view.pageTool.redraw();
    this.view.propertyTool.redraw();
    this.view.menu.redraw();
    // update fonts
    this.refreshFonts();
  }
  if(opt_message){
    // notify user
    silex.utils.Notification.notifySuccess(opt_message);
  }
  // update Silex editable style
  this.model.head.updateBrowserStyle();
}

/**
 * ask the user for a new file title
 */
silex.controller.ControllerBase.prototype.publish = function(){
  this.tracker.trackAction('controller-events', 'request', 'file.publish', 0);
  if (!this.model.head.getPublicationPath()) {
    silex.utils.Notification.alert('I do not know where to publish your site. \
      Select a folder in the settings pannel and do "publish" again. \
      <br /><br />Now I will open the publish settings.',
      goog.bind(function() {
        this.view.settingsDialog.openDialog();
        this.view.workspace.invalidate();
        this.tracker.trackAction('controller-events', 'cancel', 'file.publish', 0);
      }, this));
  }
  else
  {
    this.model.file.publish(
      this.model.head.getPublicationPath(),
      goog.bind(function(status) {
      if (status && status.success == false) {
        console.error('Error: I did not manage to publish the file. (1)');
        silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. <br /><br />Error message: ' + (status.message || status.code || ''));
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      }
      else {
        silex.utils.Notification.notifySuccess('I am about to publish your site. This may take several minutes.');
        this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
      }
      }, this),
      goog.bind(function(error) {
        console.error('Error: I did not manage to publish the file. (2)', error);
        silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. <br /><br />Error message: ' + error);
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      }, this));
  }
}


