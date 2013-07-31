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
		console.log('dispatch mouseup');
		if (this.onStatus) this.onStatus({
			type:'change'
		});
	}, false, this);
	// dispatch event when an element has been moved
	goog.events.listen(this.element, 'dragstop', function(e){
		console.log('dispatch drag');
		if (this.onStatus) this.onStatus({
			type:'change'
		});
	}, false, this);
	// dispatch event when an element has been moved or resized
	goog.events.listen(this.element, 'resize', function(e){
		console.log('dispatch resize');
		console.log(this);
		if (this.onStatus) this.onStatus({
			type:'change'
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
 * set the html content on the stage
 * @param string containing html
 * warning: you are supposed to do stageComponent.setHtml(bodyHtml, baseUrl);
 * so that it is editable
 */
silex.view.Stage.prototype.setBody = function(bodyHtml){
	if (bodyHtml!='') console.warn('warning: you are supposed to do stageComponent.setHtml');
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
