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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
goog.provide('silex.controller.ToolMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.ToolMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  this.pixlr = new Pixlr(silex.utils.Url.getRootUrl() + '/tasks/sendImage', silex.utils.Url.getRootUrl() + '/libs/pixlr/close.html');
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.ToolMenuController, silex.controller.ControllerBase);


silex.controller.ToolMenuController.prototype.pixlr = null;


/**
 * edit in pixlr
 * this method is called by pixlrEdit and pixlrExpress with the desired service name
 */
silex.controller.ToolMenuController.prototype.openPixlr = function(pixlrMethod, trackingLabel) {
  if (!pixlrMethod) {
    console.error('The pixlr method is required');
    return;
  }
  // tracking
  this.tracker.trackAction('controller-events', 'request', trackingLabel, 0);
  var alertMessage = 'Buddy, I am about to open someone else\'s website. There you will edit your picture and when you will save there, it will overwrite your file.';
  // get the element with the image
  var element = this.model.body.getSelection()[0];
  // case of an image
  if (this.model.element.getType(element) === silex.model.Element.TYPE_IMAGE) {
    // get a reference to the img tag in the element
    var img = this.model.element.getContentNode(element);
    // retrieve the image URL
    var url = img.getAttribute('src');
    // make it understandable by unifile, i.e.
    // from localhost:6805/api/v1.0/dropbox/exec/get/_test_silex/silex-vbig.png
    // to /api/v1.0/dropbox/exec/get/_test_silex/silex-vbig.png
    url = url.substr(silex.utils.Url.getRootUrl().length);
    // remove cache control
    url = silex.utils.Dom.removeCacheControl(url);
    // get a public temporary link to the image
    silex.service.SilexTasks.getInstance().getTempLink(
        url,
        // success callback
        goog.bind(function(tempLink) {
          silex.utils.Notification.confirm(alertMessage, goog.bind(function(isOk) {
            if (isOk) {
              // callback for pixlr
              this.pixlr.onUpdate = goog.bind(function() {
                // refresh image
                silex.utils.Dom.refreshImage(img, goog.bind(function() {
                  // track success
                  this.tracker.trackAction('controller-events', 'success', trackingLabel, 1);
                  // remove temp file on the server
                  silex.service.SilexTasks.getInstance().disposeTempLink(tempLink);
                }, this));
              }, this);
              // start editing in pixlr
              pixlrMethod(silex.utils.Url.getRootUrl() + tempLink, url.replace('exec/get/', 'exec/put/'), '_blank');
            }
          }, this));
        }, this),
        // error callback for getTempLink
        goog.bind(function(err) {
          console.error(err);
          silex.utils.Notification.notifyError('Error: ' + err);
          this.tracker.trackAction('controller-events', 'error', trackingLabel, -1);
        }, this)
    );
  }
// case of a background image on any other element
  else if (goog.style.getStyle(element, 'backgroundImage')) {
    // retrieve the URL from "background-image: url(...)"
    var url = goog.style.getStyle(element, 'backgroundImage');
    url = url.substr(url.indexOf('url(') + 4);
    url = url.substring(0, url.lastIndexOf(')'));
    url = url.substr(silex.utils.Url.getRootUrl().length);
    // remove cache control
    url = silex.utils.Dom.removeCacheControl(url);
    // get a public temporary link to the image
    silex.service.SilexTasks.getInstance().getTempLink(
        url,
        // success callback
        goog.bind(function(tempLink) {
          silex.utils.Notification.confirm(alertMessage, goog.bind(function(isOk) {
            if (isOk) {
              // callback for pixlr
              this.pixlr.onUpdate = goog.bind(function() {
                // track success
                this.tracker.trackAction('controller-events', 'success', trackingLabel, 1);
                // remove temp file on the server
                silex.service.SilexTasks.getInstance().disposeTempLink(tempLink);
              }, this);
              // start editing in pixlr
              pixlrMethod(silex.utils.Url.getRootUrl() + tempLink, url.replace('exec/get/', 'exec/put/'), '_blank');
            }
          }, this));
        }, this)
    );
    // error callback for getTempLink
    goog.bind(function(err) {
      console.error(err);
      silex.utils.Notification.notifyError('Error: ' + err);
      this.tracker.trackAction('controller-events', 'error', trackingLabel, -1);
    }, this);
  }
  else {
    silex.utils.Notification.notifyError('Error: only images can be edited in pixlr. \nSelect an image and try again.');
    this.tracker.trackAction('controller-events', 'cancel', 'pixlr.edit', 0);
  }
};


/**
 * edit in pixlr
 */
silex.controller.ToolMenuController.prototype.pixlrEdit = function() {
  this.openPixlr(this.pixlr.edit.bind(this.pixlr), 'pixlr.edit');
};


/**
 * edit in pixlr
 */
silex.controller.ToolMenuController.prototype.pixlrExpress = function() {
  this.openPixlr(this.pixlr.express.bind(this.pixlr), 'pixlr.express');
};


/**
 * toggle advanced / apollo mode
 */
silex.controller.ToolMenuController.prototype.toggleAdvanced = function() {
  if (!goog.dom.classlist.contains(document.body, 'advanced-mode-on')) {
    goog.dom.classlist.add(document.body, 'advanced-mode-on');
    goog.dom.classlist.remove(document.body, 'advanced-mode-off');
  }
  else {
    goog.dom.classlist.remove(document.body, 'advanced-mode-on');
    goog.dom.classlist.add(document.body, 'advanced-mode-off');
  }
};
