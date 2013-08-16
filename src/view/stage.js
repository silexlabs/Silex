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

goog.provide('silex.view.Stage');

//////////////////////////////////////////////////////////////////
// Stage class
//////////////////////////////////////////////////////////////////
/**
 * the Silex stage class
 * @constructor
 * load the template and render to the given html element
 */
silex.view.Stage = function(element, cbk){
	this.element = element;
	this.headElement = goog.dom.createElement('div');
	silex.Helper.loadTemplateFile('templates/stage.html', element, function(){
		this.bodyElement = goog.dom.getElementByClass('silex-stage-body', this.element);
		if (cbk) cbk();
		// make the body pageable
		$(this.bodyElement).pageable({useDeeplink:false});
	}, this);
	goog.events.listen(this.element, 'mousedown', function(e){
		if (this.onStatus) this.onStatus({
			type:'select',
			element:e.target
		});
	}, false, this);
	goog.events.listen(this.element, 'mouseup', function(e){
		if (this.onStatus) this.onStatus({
			type:'change'
		});
	}, false, this);
	// dispatch event when an element has been moved
	goog.events.listen(this.element, 'dragstop', function(e){
		if (this.onStatus) this.onStatus({
			type:'change'
		});
	}, false, this);
	// dispatch event when an element has been moved or resized
	goog.events.listen(this.element, 'resize', function(e){
		if (this.onStatus) this.onStatus({
			type:'change'
		});
	}, false, this);
	// detect double click
	goog.events.listen(this.element, goog.events.EventType.DBLCLICK, function(e){
		if (this.onStatus) this.onStatus({
			type:'edit'
		});
	}, false, this);
}
/**
 * callback set by the controller
 */
silex.view.Stage.prototype.onStatus;
/**
 * reference to the element to render to
 */
silex.view.Stage.prototype.element;
/**
 * reference to the element in wich we store the head of the edited html file
 */
silex.view.Stage.prototype.headElement;
/**
 * reference to the element in wich we display the body of the edited html file
 */
silex.view.Stage.prototype.bodyElement;
/**
 * get the pages from the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.getPagesNamesFromDom = function(){
	// retrieve all page names from the head section
	var pageNames = [];
	$('meta[name="page"]', this.headElement).each(function() {
		pageNames.push(this.getAttribute('content'));
	});
	return pageNames;
}
/**
 * remove a page from the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.removePage = function(page){
	// remove the DOM element
	$('meta[name="page"]', this.headElement).each(
		function () {
			if (this.getAttribute('content')==page.name){
				$(this).remove();
		}
	});
	// remove the links to this page
	$('*[data-silex-href="#'+page.name+'"]').each(
		function () {
			this.removeAttribute('data-silex-href');
		}
	);
	// check elements which were only visible on this page
	// and make them visible everywhere
	$('.'+page.name).each(
		function () {
			$(this).removeClass(page.name);

			var pagesOfElement = silex.model.Page.getPagesForElement(this);
			if (pagesOfElement.length <= 0) 
				$(this).removeClass(silex.model.Page.PAGE_CLASS);
		}
	);
}
/**
 * add a page from the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.addPage = function(page){
	// create the DOM element
	var meta = goog.dom.createElement('meta');
	meta.name = 'page';
	meta.content = page.name;
	goog.dom.appendChild(this.headElement, meta);
}
/**
 * rename a page in the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.renamePage = function(page, name){
	var that = this;
	// update the DOM element
	$('meta[name="page"]', this.stage.headElement).each(
		function () {
			if (this.getAttribute('content') == that.name){
				this.setAttribute('content', name);
		}
	});
	// update the links to this page
	$('*[data-silex-href="#'+this.name+'"]').each(
		function () {
			this.setAttribute('data-silex-href', '#'+name);
		}
	);
	// update the visibility of the compoents
	$('.'+this.name).each(
		function () {
			$(this).removeClass(that.name);
			$(this).addClass(name);
		}
	);
}
/**
 * open the page
 */
silex.view.Stage.prototype.openPage = function(page){
	$(this.bodyElement).pageable({currentPage:page.name});
}
/**
 * set the html content on the stage
 * @param string containing html
 * warning: you are supposed to do stageComponent.setHtml(bodyHtml, baseUrl);
 * so that it is editable
 */
silex.view.Stage.prototype.setBody = function(bodyHtml){
	if (bodyHtml!='') console.warn('warning: you are supposed to use stageComponent.setHtml');
	this.bodyElement.innerHTML = bodyHtml;
}
/**
 * get the html content on the stage
 * @return string containing html
 */
silex.view.Stage.prototype.getBody = function(){
	return this.bodyElement.innerHTML;
}
/**
 * set the html content on the stage
 * @param string containing html
 */
silex.view.Stage.prototype.setHead = function(headHtml){
	this.headElement.innerHTML = headHtml;
}
/**
 * get the html content on the stage
 * @return string containing html
 */
silex.view.Stage.prototype.getHead = function(){
	return this.headElement.innerHTML;
}
/**
 * set body style from a string
 */
silex.view.Stage.prototype.setBodyStyle = function(styleStr){
	this.bodyElement.setAttribute('data-style-normal', styleStr);
	this.bodyElement.setAttribute('style', styleStr);
}
/**
 * @return body style as a string
 */
silex.view.Stage.prototype.getBodyStyle = function(){
	return this.bodyElement.getAttribute('style');
}
