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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
goog.provide('silex.controller.MenuController');

goog.require('silex.controller.ControllerBase');


/**
 * @constructor
 * @extends silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.types.Model} model
 * @param {silex.types.View} view
 */
silex.controller.MenuController = function (model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
  // attach events to the view
  view.menu.onStatus = goog.bind(this.menuCallback, this);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.MenuController, silex.controller.ControllerBase);


/**
 * menu event handler
 */
silex.controller.MenuController.prototype.menuCallback = function(type) {
  this.tracker.trackAction('controller-events', 'request', type, 0);
  switch (type) {
    case 'title.changed':
      this.promptTitle();
      break;
    case 'file.close':
    case 'file.new':
      this.newFile(goog.bind(function () {
        // QOS, track success
        this.tracker.trackAction('controller-events', 'success', type, 1);
      }, this));
      break;
    case 'file.saveas':
      this.save(goog.bind(function () {
        // QOS, track success
        this.tracker.trackAction('controller-events', 'success', type, 1);
      }, this));
      break;
    case 'file.rename':
      this.promptTitle();
      break;
    case 'file.publish.settings':
      this.view.settingsDialog.openDialog();
      this.view.workspace.invalidate();
      break;
    case 'file.publish':
      this.publish();
      break;
    case 'file.save':
      this.save(this.model.file.getUrl());
      break;
    case 'file.open':
      this.openFile(goog.bind(function () {
        // QOS, track success
        this.tracker.trackAction('controller-events', 'success', type, 1);
      }, this));
      break;
    case 'view.file':
      this.preview();
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
    case 'view.open.fileExplorer':
      this.view.fileExplorer.openDialog();
      this.view.workspace.invalidate();
      break;
    case 'view.open.editor':
      this.editComponent();
      break;
    case 'insert.page':
      this.createPage();
      break;
    case 'insert.text':
      this.addElement(silex.model.Element.TYPE_TEXT);
      break;
    case 'insert.html':
      this.addElement(silex.model.Element.TYPE_IMAGE);
      break;
    case 'insert.image':
      this.view.fileExplorer.openDialog(
          goog.bind(function(url) {
            // create the element
            var img = this.addElement(silex.model.Element.TYPE_IMAGE);
            // loads the image
            this.model.element.setImageUrl(img, url,
              goog.bind(function(element){
                this.view.workspace.invalidate();
                this.tracker.trackAction('controller-events', 'success', type, 1);
              }, this),
              goog.bind(function(element, message){
                silex.utils.Notification.notifyError('Error: I did not manage to load the image. <br /><br />' + message);
                this.removeElement(element);
                this.tracker.trackAction('controller-events', 'error', type, 1);
              }, this)
            );
          }, this),
          ['image/*', 'text/plain'],
          goog.bind(function(error) {
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', type, -1);
          }, this)
      );
      this.view.workspace.invalidate();
      break;
    case 'insert.container':
      this.addElement(silex.model.Element.TYPE_CONTAINER);
      break;
    case 'edit.delete.selection':
      // delete component
      this.removeElement();
      break;
    case 'edit.delete.page':
      this.removePage();
      break;
    case 'edit.rename.page':
      this.renamePage();
      break;
    // Help menu
    case 'help.about':
      window.open(silex.Config.ABOUT_SILEX);
      break;
    case 'help.aboutSilexLabs':
      window.open(silex.Config.ABOUT_SILEX_LABS);
      break;
    case 'help.newsLetter':
      window.open(silex.Config.SUBSCRIBE_SILEX_LABS);
      break;
    case 'help.googlPlus':
      window.open(silex.Config.SOCIAL_GPLUS);
      break;
    case 'help.twitter':
      window.open(silex.Config.SOCIAL_TWITTER);
      break;
    case 'help.facebook':
      window.open(silex.Config.SOCIAL_FB);
      break;
    case 'help.forkMe':
      window.open(silex.Config.FORK_CODE);
      break;
  }
};
