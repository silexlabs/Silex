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
 * @fileoverview The Silex PageTool class displays the list of pages
 *     and let the user interact with them.
 * @see silex.model.Page
 *
 */


goog.provide('silex.view.PageTool');

/**
 * @constructor
 */
silex.view.PageTool = function(element, cbk) {
    this.element = element;
    this.pages = [];
    this.selectedIndex = -1;

    silex.Helper.loadTemplateFile('templates/pagetool.html', element, function() {
        goog.events.listen(this.element, goog.events.EventType.CLICK, function(e) {
            this.selectionChanged(this.pages[this.getCellIndex(e.target.parentNode)], true);
        }, false, this);
        if (cbk) cbk();
    }, this);
};


/**
 * reference to the element to render to
 */
silex.view.PageTool.prototype.element;


/**
 * callback for the events, passed by the controller
 */
silex.view.PageTool.prototype.onStatus;


/**
 * selected index
 */
silex.view.PageTool.prototype.selectedIndex;


/**
 * pages
 * array of Page instances
 * @see silex.model.Page
 */
silex.view.PageTool.prototype.pages;


/**
 * refresh with new page list
 */
silex.view.PageTool.prototype.setPages = function(pages) {
    // store pages list
    this.pages = pages;

    //$(this.element).find( '.page-tool-container' ).sortable('destroy');
    //$(this.element).find( '.page-tool-container' ).selectable('destroy');

    var container = goog.dom.getElementByClass('page-tool-container', this.element);
    var templateHtml = goog.dom.getElementByClass('page-tool-template', this.element).innerHTML;
    silex.Helper.resolveTemplate(container, templateHtml, {pages:pages});

    var that = this;
    $(this.element).find( '.page-tool-container .page-container .page-preview .delete' ).click(
        function(e) {
            // stop propagation to prevent the general listener to catch it (click on a page)
            e.stopPropagation();
            // remove the page
            that.removePageAtIndex(that.getCellIndex(this.parentNode.parentNode));
        }
    );
    $(this.element).find( '.page-tool-container .page-container .page-preview .label' ).click(
        function(e) {
            // stop propagation to prevent the general listener to catch it (click on a page)
            e.stopPropagation();
            // rename the page
            that.renamePageAtIndex(that.getCellIndex(this.parentNode.parentNode));
        }
    );
};


/**
 * ask to remove a page
 */
silex.view.PageTool.prototype.removePageAtIndex = function(idx) {
    if (this.onStatus) this.onStatus({
        type:'delete',
        page: this.pages[idx]
    });
};


/**
 * ask to rename a page
 */
silex.view.PageTool.prototype.renamePageAtIndex = function(idx) {
    if (this.onStatus) this.onStatus({
        type:'rename',
        page: this.pages[idx]
    });
};


/**
 * selection has changed
 */
silex.view.PageTool.prototype.selectionChanged = function(page) {
    if (this.onStatus) this.onStatus({
        type:'changed',
        page: page
    });
};


/**
 * set selection
 */
silex.view.PageTool.prototype.setSelectedItem = function(page, notify) {
    var idx = silex.model.Page.getPageIndex(page);
    this.setSelectedIndex(idx, notify);
};


/**
 * get selection
 */
silex.view.PageTool.prototype.getSelectedItem = function() {
    if (this.pages.length > this.selectedIndex) {
        return this.pages[this.selectedIndex];
    }
    else {
        return null;
    }
}
silex.view.PageTool.prototype.getCellIndex = function(element) {
    var page = silex.model.Page.getPageByName(element.getAttribute('data-page-name'));
    if (page) {
        var idx = silex.model.Page.getPageIndex(page);
        return idx;
    }
    console.error('Page not found for element ', element, silex.model.Page.pages);
    return -1;
};


/**
 * set the selection of pages
 * @param     notify    if true, then notify by calling the onChanged callback
 */
silex.view.PageTool.prototype.setSelectedIndex = function(index, notify) {
    this.selectedIndex = index;

    var that = this;
    var idx = 0;
    $( '.page-container', this.element ).each(function() {
        if (index === idx) {
            $(this).addClass('ui-selected');
        }
        else {
            $(this).removeClass('ui-selected');
        }
        idx++;
    });
    if (notify!==false) this.selectionChanged(this.getSelectedItem());
}
