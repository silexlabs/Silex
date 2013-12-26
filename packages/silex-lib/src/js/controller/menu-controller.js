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

goog.require('silex.controller.UiControllerBase');
goog.require('silex.Model');
goog.require('silex.View');
goog.require('silex.Controller');


/**
 * @constructor
 * @extends silex.controller.UiControllerBase
 * listen to the view events and call the main controller's methods
 * @param {silex.Model} model
 * @param {silex.View} view
 * @param {silex.Controller} controller
 */
silex.controller.MenuController = function (model, view, controller) {
  // call super
  silex.controller.UiControllerBase.call(this, model, view, controller);
  // attach events to the view
  view.menu.onStatus = goog.bind(this.menuCallback, this);
};

// inherit from silex.controller.UiControllerBase
goog.inherits(silex.controller.UiControllerBase);


/**
 * menu event handler
 */
silex.controller.MenuController.prototype.menuCallback = function(event) {
  this.tracker.trackAction('controller-events', 'request', event.type, 0);
  switch (event.type) {
    case 'title.changed':
      this.controller.promptTitle();
      break;
    case 'file.new':
      this.model.file.newFile();
      break;
    case 'file.saveas':
      this.controller.save();
      break;
    case 'file.publish.settings':
      this.view.settingsDialog.openDialog();
      this.view.workspace.invalidate();
      break;
    case 'file.publish':
      this.controller.publish();
      break;
    case 'file.save':
      this.controller.save(this.model.file.getUrl());
      break;
    case 'file.open':
      this.controller.openFile();
      break;
    case 'file.close':
      this.model.file.newFile();
      break;
    case 'view.file':
      this.model.file.view();
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
      this.model.fileExplorer.openDialog();
      this.view.workspace.invalidate();
      break;
    case 'view.open.editor':
      this.controller.editComponent();
      break;
    case 'insert.page':
      this.controller.createPage(goog.bind(function() {
        this.controller.tracker.trackAction('controller-events', 'success', event.type, 1);
      }, this),
      goog.bind(function() {
        this.controller.tracker.trackAction('controller-events', 'cancel', event.type, 0);
      }, this));
      break;
    case 'insert.text':
      var element = this.model.element.getStageComponent().addText();
      // only visible on the current page
      this.view.selection.getPage().addComponent(component);
      // select the component
      this.view.selection.setComponent(component);
      break;
    case 'insert.html':
      var component = this.model.file.getStageComponent().addHtml();
      // only visible on the current page
      this.view.selection.getPage().addComponent(component);
      // select the component
      this.view.selection.setComponent(component);
      break;
    case 'insert.image':
      this.model.fileExplorer.openDialog(
          goog.bind(function(blob) {
            var component = this.model.file.getStageComponent().addImage(blob.url);
            // only visible on the current page
            this.view.selection.getPage().addComponent(component);
            // select the component
            this.view.selection.setComponent(component);
            this.tracker.trackAction('controller-events', 'success', event.type, 1);
          }, this),
          ['image/*', 'text/plain'],
          goog.bind(function(error) {
            this.notifyError('Error: I did not manage to load the image. <br /><br />' + (error.message || ''));
            this.tracker.trackAction('controller-events', 'error', event.type, -1);
          }, this)
      );
      this.view.workspace.invalidate();
      break;
    case 'insert.container':
      var component = this.model.file.getStageComponent().addContainer();
      // only visible on the current page
      this.view.selection.getPage().addComponent(component);
      // select the component
      this.view.selection.setComponent(component);
      break;
    case 'edit.delete.selection':
      // delete component
      this.model.file.getStageComponent().remove(this.view.selection.getComponent());
      // select stage
      this.view.selection.setComponent(this.model.file.getStageComponent());
      break;
    case 'edit.delete.page':
      this.removePage(this.view.selection.getPage());
      break;
    case 'edit.rename.page':
      this.renamePage(this.view.selection.getPage());
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
