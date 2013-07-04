goog.provide('silex.view.Stage');

var silex = silex || {}; 
silex.view = silex.view || {}; 

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
	this.headElement = document.createElement('div');
	var that = this;
	silex.TemplateHelper.loadTemplateFile('js/view/templates/stage.html', element, function(){
		console.log('template loaded');
		that.bodyElement = goog.dom.getElementByClass('silex-stage-body', that.element);
		if (cbk && typeof(cbk)=='function') cbk();
		if(that.onReady) that.onReady();
		if (that.onStageEvent) that.onStageEvent({type:'ready'});
	});
	$(this.element).on('mousedown', function(e){
		console.log('mousedown '+e.target.className);
		if (that.onStageEvent) that.onStageEvent({
			type:'select',
			element:that.findEditableParent(e.target),
		});
	});
	// dispatch event when an element has been moved
	$(this.element).on('dragstop', function(e){
		console.log('dragstop '+e.target.className);
		if (that.onStageEvent) that.onStageEvent({
			type:'change',
			element:that.findEditableParent(e.target),
		});
	});
	// dispatch event when an element has been moved or resized
	$(this.element).on('resize', function(e){
		console.log('resize '+e.target.className);
		if (that.onStageEvent) that.onStageEvent({
			type:'change',
			element:that.findEditableParent(e.target),
		});
	});
}
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_TYPE_CONTAINER = 'container';
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_TYPE_IMAGE = 'image';
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_TYPE_ELEMENT = 'element';
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_SUBTYPE_TEXT = 'text';
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.Stage.prototype.onReady;
/**
 * callback for stage events, set by the controller
 */
silex.view.Stage.prototype.onStageEvent;
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
 * find the first editable parent
 */
silex.view.Stage.prototype.findEditableParent = function(child){
	while (child && child.getAttribute && !child.getAttribute('data-silex-type')){
		child = child.parentNode;
	}
	if (child && child.getAttribute && child.getAttribute('data-silex-type'))
		return child;
	else
		return null;
}
/**
 * set the html content on the stage and make it editable
 * the parameters are strings containing html
 */
silex.view.Stage.prototype.setContent = function(bodyHtml, headHtml, bodyStyleStr){
	console.log('setContent ');
	this.makeEditable(false);
	this.bodyElement.innerHTML = bodyHtml;
	this.headElement.innerHTML = headHtml;
	this.makeEditable(true);

	this.bodyElement.setAttribute('style', bodyStyleStr);
}
/**
 * reset html content
 */
silex.view.Stage.prototype.removeContent = function(){
	console.log('removeContent ');
    if (this.bodyElement) this.bodyElement.innerHTML = '';
	if (this.headElement) this.headElement.innerHTML = '';
}
/**
 * init or remove editable
 */
silex.view.Stage.prototype.makeEditable = function(isEditable){
	if (isEditable){
		$('[data-silex-type="container"]').editable({
			isContainer: true,
		});
		$('[data-silex-type="element"]').editable();

		$(this.bodyElement).pageable({useDeeplink:false});
	}
	else{
		$('[data-silex-type="container"]').editable('destroy')
	    $('[data-silex-type="element"]').editable('destroy')
	    //$(this.bodyElement).pageable('destroy')
	}
}
/**
 * @return body style as a string
 */
silex.view.Stage.prototype.getBodyStyle = function(){
	// get the style as string
/*	var buffer = [];
	goog.object.forEach(this.element.style, function(value, key) {
		if (value && typeof(value)=='string'
		 && key!='cssText' && typeof(key)=='string')
		console.log(goog.string.toSelectorCase(key)+'='+value)
		buffer.push(goog.string.toSelectorCase(key), ':', value, '; ')
	});
	return buffer.join('');
	*/

	return this.bodyElement.getAttribute('data-style-normal');
}
/**
 * set body style from a string
 */
silex.view.Stage.prototype.setBodyStyle = function(styleStr){
	return this.bodyElement.setAttribute('data-style-normal', styleStr);
	return this.bodyElement.setAttribute('style', styleStr);
}
/**
 * return clean html string (no edition-related content)
 */
silex.view.Stage.prototype.getBody = function(){
	console.log('getBody ');

	var cleanContainer = this.bodyElement.cloneNode();

	$(cleanContainer).find('.ui-resizable').removeClass('ui-resizable');
	$(cleanContainer).find('.ui-draggable').removeClass('ui-draggable');
	$(cleanContainer).find('.ui-droppable').removeClass('ui-droppable');

	$(cleanContainer).find('[aria-disabled]').removeAttr('aria-disabled');
	
	$(cleanContainer).find('.ui-resizable-handle').remove();

	// apply the data-style-normal to all nodes
	this.applyState('normal');
	
	return cleanContainer.innerHTML;
}
/**
 * apply a given state to all elements
 */
silex.view.Stage.prototype.applyState = function(state){
	// apply the data-style-normal to all nodes
	$('[data-style-'+state+']').each(function () {
		this.setAttribute('style', this.getAttribute('data-style-'+state));
	});
}
/**
 * return clean html string (no edition-related content)
 */
silex.view.Stage.prototype.getHead = function(){
	return this.headElement.innerHTML;
}
/**
 * get the publication pages 
 */
silex.view.Stage.prototype.getPages = function(){
	console.log('getPages ');

	var pages = [];

	$('meta[name="page"]', this.headElement).each(function() {
		console.log('found page '+this.getAttribute('content'));
		pages.push(this.getAttribute('content'));
	});
	return pages;
}
silex.view.Stage.prototype.currentPage;
/**
 * open the given page of the site 
 */
silex.view.Stage.prototype.openPage = function(pageName){
	console.log('openPage '+pageName);
    $(this.bodyElement).pageable({currentPage:pageName});
    this.currentPage = pageName;
}
/**
 * create a new page 
 */
silex.view.Stage.prototype.createPage = function(pageName){
	console.log('createPage '+pageName);
	var meta = document.createElement('meta');
	meta.name = 'page';
	meta.content = pageName;
	this.headElement.appendChild(meta);
}
/**
 * delete a page 
 */
silex.view.Stage.prototype.removePage = function(pageName){
	console.log('removePage '+pageName);
	$('meta[name="page"]', this.headElement).each(
		function () {
			console.log('found meta '+this);
			if (this.getAttribute('content')==pageName){

				$(this).remove();
			}
		});
}
/**
 * add elements
 */
silex.view.Stage.prototype.addElement = function(elementType, opt_url){
	console.log('addElement '+elementType);
	var newHtml;
	switch(elementType){
		case silex.view.Stage.ELEMENT_TYPE_CONTAINER:
			newHtml = '<div class="editable-style silex-default-style-container" data-silex-type="container" style="position: absolute; width: 100px; height: 100px; left: 50%; top: 50%;" />';
			break;
		case silex.view.Stage.ELEMENT_SUBTYPE_TEXT:
			newHtml = '<div class="editable-style silex-default-style-text" data-silex-type="element" data-silex-sub-type="text" style="position: absolute; width: 100px; height: 100px; left: 50%; top: 50%;">New text box</div>';
			break;
		case silex.view.Stage.ELEMENT_TYPE_IMAGE:
			newHtml = '<div class="editable-style silex-default-style-image" data-silex-type="element" style="position: absolute; left: 50%; top: 50%;"><img src="'+opt_url+'" style="width: 100%; height: 100%; " /></div>';
			break;
	}
	$('.background', this.bodyElement).append(newHtml);
	var elements = $('.background').children();
	var element = elements[elements.length-1];
	this.makeEditable(true);
	return element;
}
/**
 * remove elements
 */
silex.view.Stage.prototype.removeElement = function(element){
	console.log('removeElement '+element);
	$(element).remove();
	return element;
}
