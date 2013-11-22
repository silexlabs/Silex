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
 * @fileoverview
 * the Silex HTMLEditor class, based on ace editor
 * @see     http://ace.c9.io/
 *
 *
 */


goog.provide('silex.view.HTMLEditor');

/**
 * @constructor
 */
silex.view.HTMLEditor = function(element, cbk) {
    this.element = element;

    silex.Helper.loadTemplateFile('templates/htmleditor.html', element, function() {
        this.initUI();
        if (cbk) cbk();
    }, this);
};


/**
 * element of the dom to which the component is rendered
 */
silex.view.HTMLEditor.prototype.element;


/**
 * callback for the events, set by the controller
 */
silex.view.HTMLEditor.prototype.onStatus;


/**
 * the editable text field
 */
silex.view.HTMLEditor.prototype.textField;


/**
 * flag to prevent looping with event
 */
silex.view.HTMLEditor.prototype.iAmSettingValue;


/**
 * init the menu and UIs
 */
silex.view.HTMLEditor.prototype.initUI = function() {
    this.ace = ace.edit(goog.dom.getElementByClass('ace-editor', this.element));
    this.iAmSettingValue = false;
    //this.ace.setTheme("ace/theme/monokai");
    this.ace.getSession().setMode("ace/mode/html");
    this.ace.getSession().on('change', goog.bind(function(e) {
        if (this.iAmSettingValue === false) {
            var value = this.ace.getValue();
            setTimeout(goog.bind(function() {
                this.contentChanged();
            }, this), 100);
        }
    }, this));
    // close button
    goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function() {
        this.closeEditor();
    }, false, this);
};


/**
 * Open the editor
 */
silex.view.HTMLEditor.prototype.openEditor = function(initialHtml) {
    // background
    var background = goog.dom.getElementByClass('dialogs-background');
    // show
    goog.style.setStyle(background, 'display', 'inherit');
    goog.style.setStyle(this.element, 'display', 'inherit');
    // close
    goog.events.listenOnce(background, goog.events.EventType.CLICK, function(e) {
        this.closeEditor();
    }, false, this);
    // set value
    this.iAmSettingValue = true;
    this.ace.setValue(initialHtml);
    this.iAmSettingValue = false;
    // force ace redraw
    this.ace.resize();
};


/**
 * close text editor
 */
silex.view.HTMLEditor.prototype.closeEditor = function() {
    // background
    var background = goog.dom.getElementByClass('dialogs-background');
    // hide
    goog.style.setStyle(background, 'display', 'none');
    goog.style.setStyle(this.element, 'display', 'none');
};


/**
 * retrieve the editor html content
 */
silex.view.HTMLEditor.prototype.getData = function() {
    return this.ace.getValue();
};


/**
 * the content has changed, notify the controler
 */
silex.view.HTMLEditor.prototype.contentChanged = function() {
    if (this.onStatus) {
        this.onStatus({
            type: 'changed',
            content: this.getData()
        });
    }
}