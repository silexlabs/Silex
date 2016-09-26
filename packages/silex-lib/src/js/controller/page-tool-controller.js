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
goog.provide('silex.controller.PageToolController');

goog.require('silex.controller.ControllerBase');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.PageToolController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.PageToolController, silex.controller.ControllerBase);


/**
 * open a page
 * @param {string} pageName
 */
silex.controller.PageToolController.prototype.openPage = function(pageName) {
  // undo checkpoint
  this.undoCheckPoint();
  // do the action
  this.model.page.setCurrentPage(pageName);
};


/**
 * rename a page
 * @param {?string=} opt_pageName name of the page to be renamed
 */
silex.controller.PageToolController.prototype.renamePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName) {
    opt_pageName = this.model.page.getCurrentPage();
  }
  this.getUserInputPageName(
      this.model.page.getDisplayName(opt_pageName),
      goog.bind(function(name, newDisplayName) {
        if (newDisplayName) {
          // undo checkpoint
          this.undoCheckPoint();
          // update model
          this.model.page.renamePage(/** @type {string} */ (opt_pageName), name, newDisplayName);
        }
        else {
          // just open the new page
          this.openPage(/** @type {string} */ (opt_pageName));
        }
        // update view
      }, this));
};


/**
 * remvove a page
 * @param {?string=} opt_pageName name of the page to be renamed
 */
silex.controller.PageToolController.prototype.removePage = function(opt_pageName) {
  // default to the current page
  if (!opt_pageName) {
    opt_pageName = this.model.page.getCurrentPage();
  }
  // confirm and delete
  silex.utils.Notification.confirm('I am about to <strong>delete the page "' +
      this.model.page.getDisplayName(opt_pageName) +
      '"</strong>, are you sure?',
      goog.bind(function(accept) {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();
          // update model
          this.model.page.removePage(/** @type {string} */ (opt_pageName));
        }
      }, this), 'delete', 'cancel');
};


/**
 * move a page up/down
 * @param {?string=} opt_pageName name of the page to be moved
 */
silex.controller.PageToolController.prototype.movePageUp = function(opt_pageName) {
  this.model.page.movePage(/** @type {string} */ (opt_pageName || this.model.page.getCurrentPage()), 'up');
};


/**
 * move a page up/down
 * @param {?string=} opt_pageName name of the page to be moved
 */
silex.controller.PageToolController.prototype.movePageDown = function(opt_pageName) {
  this.model.page.movePage(/** @type {string} */ (opt_pageName || this.model.page.getCurrentPage()), 'down');
};
