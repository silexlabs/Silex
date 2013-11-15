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
		// allow drops
		$(this.bodyElement).editable({
	        isContainer: true,
	        isResizable: false,
	        isDroppable: true,
	        isDraggable: false
		});
	}, this);
	goog.events.listen(this.element, 'mousedown', function(e){
		if (this.onStatus) this.onStatus({
			type:'select',
			element:e.target
		});
		this.isDragging = true;
	}, false, this);
	// listen on body instead of element because user can release on the tool boxes
	goog.events.listen(document.body, 'mouseup', function(e){
		if(this.isDragging){
			if (this.onStatus) this.onStatus({
				type:'change'
			});
			this.isDragging = false;
		}
	}, false, this);
	// dispatch event when an element has been moved
	goog.events.listen(this.element, 'dragstop', function(e){
		if (this.onStatus) this.onStatus({
			type:'change'
		});
		this.isDragging = false;
	}, false, this);
	// dispatch event when an element has been moved or resized
	goog.events.listen(this.element, 'resize', function(e){
		if (this.onStatus) this.onStatus({
			type:'change'
		});
		this.isDragging = false;
	}, false, this);
	// dispatch event when an element is dropped in a new container
	goog.events.listen(this.element, 'newContainer', function(e){
		if (this.onStatus) this.onStatus({
			type:'newContainer'
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
	$('a[data-silex-type="page"]', this.bodyElement).each(function() {
		pageNames.push(this.getAttribute('id'));
	});
	return pageNames;
}
/**
 * remove a page from the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.removePage = function(page){
	// remove the DOM element
	$('a[data-silex-type="page"]', this.bodyElement).each(
		function () {
			if (this.getAttribute('id')===page.name){
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
	var aTag = goog.dom.createElement('a');
	aTag.setAttribute('id', page.name);
	aTag.setAttribute('data-silex-type', silex.model.Component.TYPE_PAGE);
	aTag.innerHTML = page.name;
	goog.dom.appendChild(this.bodyElement, aTag);
}
/**
 * rename a page in the dom
 * @see silex.model.Page
 */
silex.view.Stage.prototype.renamePage = function(page, name){
	var that = this;
	// update the DOM element
	$('a[data-silex-type="page"]', this.bodyElement).each(
		function () {
			if (this.getAttribute('id') === page.name){
				this.setAttribute('id', name);
		}
	});
	// update the links to this page
	$('*[data-silex-href="#'+page.name+'"]').each(
		function () {
			this.setAttribute('data-silex-href', '#'+name);
		}
	);
	// update the visibility of the compoents
	$('.'+page.name).each(
		function () {
			$(this).removeClass(page.name);
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
 * get/set the publication path
 * @see silex.model.File
 */
silex.view.Stage.prototype.setPublicationPath = function(path){
	var that = this;
	var found = false;
	// update the DOM element
	$('meta[name="publicationPath"]', this.headElement).each(
	function () {
		this.setAttribute('content', path);
		found = true;
	});
	if (!found){
		// create the DOM element
		var meta = goog.dom.createElement('meta');
		meta.name = 'publicationPath';
		meta.content = path;
		goog.dom.appendChild(this.headElement, meta);
	}
}
/**
 * get/set the publication path
 * @see silex.model.File
 */
silex.view.Stage.prototype.getPublicationPath = function(){
	var that = this;
	var path = null;
	$('meta[name="publicationPath"]', this.headElement).each(
	function () {
		path = this.getAttribute('content');
	});
	return path;
}
/**
 * set the html content on the stage
 * @param string containing html
 * warning: you are supposed to do stageComponent.setHtml(bodyHtml, baseUrl);
 * so that it is editable
 */
silex.view.Stage.prototype.setBody = function(bodyHtml){
	if (bodyHtml!=='') console.warn('warning: you are supposed to use stageComponent.setHtml');
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
	return this.bodyElement.getAttribute('data-style-normal');
}
