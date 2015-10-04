// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A plugin which extends google closure's LinkDialogPlugin class.
 * Adds support for Silex's page system / internal links
 *
 * @author a.hoyau@silexlabs.org
 */

goog.provide('silex.view.dialog.LinkDialogPlugin');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.editor.Command');
goog.require('goog.editor.plugins.LinkDialogPlugin');
goog.require('goog.events.EventHandler');
goog.require('goog.functions');
goog.require('goog.ui.editor.AbstractDialog.EventType');
goog.require('goog.ui.editor.LinkDialog');
goog.require('goog.ui.editor.LinkDialog.EventType');
goog.require('goog.ui.editor.LinkDialog.OkEvent');
goog.require('goog.uri.utils');



/**
 * A plugin that opens the link dialog.
 * @constructor
 * @extends {goog.editor.plugins.LinkDialogPlugin}
 */
silex.view.dialog.LinkDialogPlugin = function() {
  goog.base(this);
};
goog.inherits(silex.view.dialog.LinkDialogPlugin,
    goog.editor.plugins.LinkDialogPlugin);


/**
 * Handles the OK event from the dialog by updating the link in the field.
 * @param {goog.ui.editor.LinkDialog.OkEvent} event OK event object.
 * @protected
 * @override
 */
silex.view.dialog.LinkDialogPlugin.prototype.handleOk = function(event) {
  // allow internal links
  var linkUrl = event.target.urlInputHandler_.element_.value;
  if (linkUrl && linkUrl.indexOf('#') === 0) {
    // this is an internal link
    this.currentLink_.getAnchor().href = linkUrl;
    // TODO: check if this assignement is useful?
    event.linkUrl = linkUrl;
  }
  // call parent class
  goog.base(this, 'handleOk', event);
};
