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
goog.require('silex.utils.BackwardCompat');

/**
 * @constructor
 * base class for all UI controllers of the controller package
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.ControllerBase = function (controller, model, view) {
  // store the model
  this.model = model;
  this.controller = controller;
  this.view = view;

  // tracker
  this.tracker = silex.service.Tracker.getInstance();
};


/**
 * {silex.service.Tracker} tracker used to pull statistics on the user actions
 * @see     silex.service.Tracker
 */
silex.controller.ControllerBase.prototype.tracker = null;


/**
 * the {Array<Element>} array of elements in the clipboard
 * this is a static attribute
 * TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.clipboard;
/**
 * the {Element} element wich is the origin container of the element in the clipboard
 * this is a static attribute
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.clipboardParent;


/**
 * undo
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.prototype.undo = function() {
  this.model.element.undo();
}


/**
 * redo
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.prototype.redo = function() {
  this.model.element.redo();
}


/**
 * copy the selection for later paste
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.prototype.copySelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'copy', 0);
  // default is selected element
  var elements = this.model.body.getSelection();
  if (elements.length>0){
    // reset clipboard
    silex.controller.ControllerBase.clipboard = [];
    // add each selected element to the clipboard
    goog.array.forEach(elements, function(element) {
      if (this.model.body.getBodyElement() != element) {
        // disable editable
        this.model.body.setEditable(element, false);
        // duplicate the node
        silex.controller.ControllerBase.clipboard.push(element.cloneNode(true));
        silex.controller.ControllerBase.clipboardParent = element.parentNode;
        // re-enable editable
        this.model.body.setEditable(element, true);
      }
      else{
        console.error('could not copy this element (', element, ') because it is the stage element');
      }
    }, this);
    this.tracker.trackAction('controller-events', 'success', 'copy', 1);
  }
}


/**
 * paste the previously copied element
* TODO: Move this elsewhere?
 */
silex.controller.ControllerBase.prototype.pasteSelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'paste', 0);
  // default is selected element
  if(silex.controller.ControllerBase.clipboard) {
    // reset selection
    this.model.body.setSelection([]);
    // find the container: original container, main background container or the stage
    var container;
    if (silex.controller.ControllerBase.clipboardParent
      && goog.dom.contains(this.model.body.getBodyElement(), silex.controller.ControllerBase.clipboardParent)){
      container = silex.controller.ControllerBase.clipboardParent;
    }
    else{
      container = goog.dom.getElementByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, this.model.body.getBodyElement());
      if(!container){
        container = this.model.body.getBodyElement();
      }
    }
    // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
    var bb = silex.utils.Dom.getBoundingBox(silex.controller.ControllerBase.clipboard);
    var offsetX = 100 + this.model.body.getBodyElement().parentNode.scrollLeft - bb.left;
    var offsetY = 100 + this.model.body.getBodyElement().parentNode.scrollTop - bb.top;
    // duplicate and add to the container
    goog.array.forEach(silex.controller.ControllerBase.clipboard, function (clipboardElement) {
      var element = clipboardElement.cloneNode(true);
      this.model.element.appendChild(container, element);
      // apply the offset to the element, ccording to the scroll position
      var bbElement = silex.utils.Dom.getBoundingBox([element]);
      element.style.left = (bbElement.left + offsetX) + 'px';
      element.style.top = (bbElement.top + offsetY) + 'px';
      // reset editable option
      this.doAddElement(element);
    }, this);
  }
  this.tracker.trackAction('controller-events', 'success', 'paste', 1);
}


/**
 * remove an element from the stage
 * @param {Element} element    the element to remove
 */
silex.controller.ControllerBase.prototype.removeElement = function(element) {
  // check this is allowed, i.e. an element inside the stage container
  if (this.model.body.getBodyElement() != element
    && goog.dom.contains(this.model.body.getBodyElement(), element)){
    // confirm and delete
    silex.utils.Notification.confirm('I am about to delete the selected element(s)", are you sure?',
      goog.bind(function(accept) {
        if (accept) {
          // remove the element
          this.model.element.removeElement(element);
        }
      }, this));
  }
  else{
    console.error('could not delete', element, 'because it is not in the stage element');
  }
}


/**
 * remove selected elements from the stage
 */
silex.controller.ControllerBase.prototype.removeSelection = function() {
  // default is selected element
  var elements = this.model.body.getSelection();
  goog.array.forEach(elements, function(element) {
    this.removeElement(element);
  },this);
}


/**
 * open file explorer, choose an image and set it as the background image of the current selection
 */
silex.controller.ControllerBase.prototype.browseBgImage = function() {
  this.tracker.trackAction('controller-events', 'request', 'selectBgImage', 0);

  var errCbk = function(error) {
    silex.utils.Notification.notifyError('Error: I could not load the image. \n' + (error.message || ''));
    this.tracker.trackAction('controller-events', 'error', type, -1);
  };

  var successCbk = function(url) {
    // update the model
    var element = this.model.body.getSelection()[0];
    // absolute url only on stage
    var baseUrl = silex.utils.Url.getBaseUrl();
    url = silex.utils.Url.getAbsolutePath(url, baseUrl);
    // load the image
    this.model.element.setBgImage(element, url);
    // tracking
    this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
  };

  // open the file browser
  this.view.fileExplorer.openDialog(
      goog.bind(successCbk, this),
      {'mimetype': 'image/*'},
      goog.bind(errCbk, this)
  );
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
        console.log("image");
        // load the image
        this.model.element.setImageUrl(img, url,
          goog.bind(function(element, img){
          console.log("image2", img, img.naturalWidth);
            // update element size
            goog.style.setStyle(element, {
              width: img.naturalWidth + 'px',
              height: img.naturalHeight + 'px'
            });
            this.tracker.trackAction('controller-events', 'success', 'insert.image', 1);
          }, this),
          goog.bind(function(element, message){
            console.log('error');
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + message);
            this.removeElement(element);
            this.tracker.trackAction('controller-events', 'error', 'insert.image', 1);
          }, this)
        );
      }, this),
      {'mimetype': 'image/*'},
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
        this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
      }, this)
  );
  this.view.workspace.invalidate();
}
/**
 * create an element and add it to the stage
 * @param {string} the desired type for the new element
 * @return {Element} the new element
 */
silex.controller.ControllerBase.prototype.addElement = function(type) {
  this.tracker.trackAction('controller-events', 'request', 'insert.'+type, 0);
  try{
    // create the element and add it to the stage
    var element = this.model.element.createElement(type);
    this.doAddElement(element);
    this.tracker.trackAction('controller-events', 'success', 'insert.'+type, 1);
  }
  catch(e){
    this.tracker.trackAction('controller-events', 'error', 'insert.'+type, -1);
    console.error('could not add element of type', type, ' - ', e.message);
  }
  return element;
}
/**
 * called after an element has been created
 * add the element to the current page (only if it has not a container which is in a page)
 * redraw the tools and set the element as editable
 * @param {Element} the element to add
 */
silex.controller.ControllerBase.prototype.doAddElement = function(element) {
  // only visible on the current page
  var currentPageName = this.model.page.getCurrentPageName();
  this.model.page.removeFromAllPages(element);
  this.model.page.addToPage(element, currentPageName);
  // unless one of its parents is in a page already
  this.checkElementVisibility(element);
  // select the component
  this.model.body.setSelection([element]);
  // update drop zones z index
  //this.model.body.resetEditable(this.model.body.getBodyElement(), true);
}
/**
 * set a given style to the current selection
 */
silex.controller.ControllerBase.prototype.styleChanged = function(name, value, opt_elements) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function (element) {
    // update the model
    this.model.element.setStyle(element, name, value);
    // update drop zones z index
    //this.model.body.resetEditable(this.model.body.getBodyElement(), true);
  }, this);
}


/**
 * set a given property to the current selection
 */
silex.controller.ControllerBase.prototype.propertyChanged = function(name, value, opt_elements, opt_applyToContent) {
  if (!opt_elements) opt_elements = this.model.body.getSelection();
  // apply the change to all elements
  goog.array.forEach(opt_elements, function (element) {
    // update the model
    this.model.element.setProperty(element, name, value, opt_applyToContent);
  }, this);
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
  // apply the change to all elements
  var elements = this.model.body.getSelection();
  goog.array.forEach(elements, function (element) {
    // update the model
    this.model.element.setClassName(element, name);
  }, this);
}


/**
 * get css class names
 */
silex.controller.ControllerBase.prototype.getClassName = function(element) {
  return this.model.element.getClassName(element);
}


/**
 * edit an {Element} element
 * take its type into account and open the corresponding editor
 */
silex.controller.ControllerBase.prototype.editElement = function(opt_element) {
  // default is selected element
  if(!opt_element) opt_element = this.model.body.getSelection()[0];
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
      this.view.hTMLEditor.openEditor(this.model.element.getInnerHtml(opt_element));
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
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
          }, this)
      );
      this.view.lidate.openEditor();
      break;
  }
};


/**
 * open a page
 */
silex.controller.ControllerBase.prototype.openPage = function(pageName) {
  this.model.page.setCurrentPage(pageName);
  // update view
}
/**
 * rename a page
 */
silex.controller.ControllerBase.prototype.renamePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName){
    opt_pageName = this.model.page.getCurrentPageName();
  }
  this.getUserInputPageName(
    this.model.page.getDisplayName(opt_pageName),
      goog.bind(function(name, newDisplayName) {
    if (newDisplayName) {
      // update model
      this.model.page.renamePage(opt_pageName, name, newDisplayName);
      // open the new page
      this.openPage(name);
    }
    // update view
  }, this));
};


/**
 * remvove a page
 */
silex.controller.ControllerBase.prototype.removePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName){
    opt_pageName = this.model.page.getCurrentPage(this.model.body.getBodyElement());
  }
  // confirm and delete
  silex.utils.Notification.confirm('I am about to delete the page "'
    + this.model.page.getDisplayName(opt_pageName)
    + '", are you sure?',
    goog.bind(function(accept) {
      if (accept) {
        // update model
        var elementsOnlyOnThisPage = this.model.page.removePage(opt_pageName);
        // handle elements which should be deleted
        if (elementsOnlyOnThisPage.length > 0){
          silex.utils.Notification.confirm('This page has elements which are only visible here. Should I delete them or keep them and make them visible everywhere?', goog.bind(function(accept) {
            goog.array.forEach(elementsOnlyOnThisPage, function(element) {
              if (accept){
                // remove these elements
                this.removeElement(element);
              }
              else{
                // remove from this page
                this.model.page.removeFromAllPages(element);
              }
            }, this);
          }, this), 'delete', 'keep');
        }
        // update view
      }
  }, this));
};


/**
 * input a page name
 */
silex.controller.ControllerBase.prototype.getUserInputPageName = function(defaultName, cbk) {
  silex.utils.Notification.prompt('Enter a name for your page!', defaultName,
      goog.bind(function(accept, name) {
        if (accept && name && name.length > 0) {
          // keep the full name
          var displayName = name;
          // cleanup the page name
          name = name.replace(/\W+/g, '-').toLowerCase();
          // do not allow to start with an dash or number (see css specifications)
          name = 'page-' + name;
          // check if a page with this name exists
          var pages = this.model.page.getPages(this.model.body.getBodyElement());
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
      }, this));
};


/**
 * check if the element's parents belong to a page, and if one of them do,
 * remove the element from the other pages
 *
 * if the element is in a container which is visible only on some pages,
 * then the element should be visible everywhere, i.e. in the same pages as its parent
 */
silex.controller.ControllerBase.prototype.checkElementVisibility = function(element) {
  var parentPage = this.model.page.getParentPage(element);
  if (parentPage !== null) {
    // get all the pages
    var pages = this.model.page.getPagesForElement(element);
    for (idx in pages) {
      // remove the component from the page
      var pageName = pages[idx];
      this.model.element.removeFromPage(element, pageName);
    }
    // redraw the tool box in order to reflect the changes
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
      this.model.page.createPage(name, displayName);
      this.openPage(name);
      // update view
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
  silex.utils.Notification.prompt('What is the name of your website?',
    this.model.head.getTitle(),
    goog.bind(function(accept, name) {
    if (accept) {
      this.model.head.setTitle(name);
    }
  }, this));
}
/**
 * refresh font list in the text editor, and in the head tag
 */
silex.controller.ControllerBase.prototype.refreshFonts = function(){
  //update loaded font list, as user might have choose a new one
  var neededFonts = this.model.body.getNeededFonts();
  this.model.head.refreshFontList(neededFonts);
}
/**
 * open a file
 */
silex.controller.ControllerBase.prototype.newFile = function(opt_cbk, opt_errorCbk){

  this.tracker.trackAction('controller-events', 'request', 'file.new', 0);

  this.model.file.newFile(goog.bind(function (rawHtml) {
    this.model.file.setHtml(rawHtml, goog.bind(function () {
      this.fileOperationSuccess(null, true);
      // QOS, track success
      this.tracker.trackAction('controller-events', 'success', 'file.new', 1);
      if (opt_cbk) {
        opt_cbk();
      }
    }, this));
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
        this.model.file.setHtml(rawHtml, goog.bind(function() {
          // handle retrocompatibility issues
          silex.utils.BackwardCompat.process(this.model.body.getBodyElement(), this.model.head.getHeadElement());
          // check that it is a Silex website
          if (goog.dom.getElementByClass('editable-style', this.model.body.getBodyElement())){
            // display and redraw
            this.fileOperationSuccess(this.model.head.getTitle() + ' opened.', true)
            // QOS, track success
            this.tracker.trackAction('controller-events', 'success', 'file.open', 1);
            if(opt_cbk) opt_cbk();
          }
          else {
            // this website is not an editable Silex website?
            var message = 'This file is not an editable Silex website.';
            silex.utils.Notification.notifyError('Error: ' + message);
            this.tracker.trackAction('controller-events', 'error', 'file.open_not.editable', -1);
            if(opt_errorCbk) opt_errorCbk({message: message});
          }
        }, this));
      }, this),
      goog.bind(function(error) {
        silex.utils.Notification.notifyError('Error: I did not manage to open this file. \n' + (error.message || ''));
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
  console.log('save', rawHtml);
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
      silex.utils.Notification.notifyError('Error: I did not manage to save the file. \n' + (error.message || ''));
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
    this.view.fileExplorer.openDialog(
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
    var pages = this.model.page.getPages(this.model.body.getBodyElement());
    // open default page
    this.model.page.setCurrentPage(pages[0]);
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
      \nNow I will open the publish settings.',
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
        silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. \nError message: ' + (status.message || status.code || ''));
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      }
      else {
        silex.utils.Notification.notifySuccess('I am about to publish your site. This may take several minutes.');
        this.tracker.trackAction('controller-events', 'success', 'file.publish', 1);
      }
      }, this),
      goog.bind(function(error) {
        console.error('Error: I did not manage to publish the file. (2)', error);
        silex.utils.Notification.notifyError('I did not manage to publish the file. You may want to check the publication settings and your internet connection. \nError message: ' + error);
        this.tracker.trackAction('controller-events', 'error', 'file.publish', -1);
      }, this));
  }
}
