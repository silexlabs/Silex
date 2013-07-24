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
	this.headElement = goog.dom.createElement('div');
	var that = this;
	silex.Helper.loadTemplateFile('templates/stage.html', element, function(){
		that.bodyElement = goog.dom.getElementByClass('silex-stage-body', that.element);
		if (cbk && typeof(cbk)=='function') cbk();
		if(that.onReady) that.onReady();
		if (that.onStageEvent) that.onStageEvent({type:'ready'});
	});
	$(this.element).on('mousedown', function(e){
		if (that.onStageEvent) that.onStageEvent({
			type:'select',
			element:that.findEditableParent(e.target)
		});
	});
	// dispatch event when an element has been moved
	$(this.element).on('dragstop', function(e){
		if (that.onStageEvent) that.onStageEvent({
			type:'change',
			element:that.findEditableParent(e.target)
		});
	});
	// dispatch event when an element has been moved or resized
	$(this.element).on('resize', function(e){
		if (that.onStageEvent) that.onStageEvent({
			type:'change',
			element:that.findEditableParent(e.target)
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
 * current opened page name
 */
silex.view.Stage.prototype.currentPage;
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
silex.view.Stage.prototype.setContent = function(bodyHtml, headHtml, bodyStyleStr, baseUrl){
	console.log('getBody '+baseUrl);
	if (baseUrl==null){
		console.log('The base URL is null, just load without converting relative paths to absolute');
	}

	this.makeEditable(false);
	this.bodyElement.innerHTML = bodyHtml;
	this.headElement.innerHTML = headHtml;
	this.makeEditable(true);

	// convert absolute to relative paths
	$(this.bodyElement).find('[src],[href]').each(function () {
		// attribute can be src or href
		var attr = 'src';
		var value = this.getAttribute(attr);
		if (value==null){
			attr = 'href';
			value = this.getAttribute(attr);
		}

		this.setAttribute(attr, silex.Helper.getAbsolutePath(value, baseUrl));
	});


	this.setBodyStyle(bodyStyleStr);
}
/**
 * reset html content
 */
silex.view.Stage.prototype.removeContent = function(){
    if (this.bodyElement) this.bodyElement.innerHTML = '';
	if (this.headElement) this.headElement.innerHTML = '';
}
/**
 * init or remove editable
 * if opt_element is not provided, make the stage editable or not
 */
silex.view.Stage.prototype.makeEditable = function(isEditable, opt_element){
	if (isEditable){
		if (opt_element == null){
			$('[data-silex-type="container"]').editable({
				isContainer: true
			});
			$('[data-silex-type="element"]').editable();

			$(this.bodyElement).pageable({useDeeplink:false});
		}
		else{
			$(opt_element).editable();
		}
	}
	else{
		if (opt_element == null){
			$('[data-silex-type="container"]').editable('destroy');
		    $('[data-silex-type="element"]').editable('destroy');
		    //$(this.bodyElement).pageable('destroy')
		}
		else{
			$(opt_element).editable('destroy');
		}
	}
}
/**
 * @return body style as a string
 */
silex.view.Stage.prototype.getBodyStyle = function(){
	console.log('getBodyStyle ');
	console.log(this.bodyElement.getAttribute('style'));
	return this.bodyElement.getAttribute('style');
}
/**
 * set body style from a string
 */
silex.view.Stage.prototype.setBodyStyle = function(styleStr){
	console.log('setBodyStyle '+styleStr);
	this.bodyElement.setAttribute('data-style-normal', styleStr);
	this.bodyElement.setAttribute('style', styleStr);
}
/**
 * return clean html string (no edition-related content)
 */
silex.view.Stage.prototype.getBody = function(baseUrl){
	console.log('getBody '+baseUrl);
	if (baseUrl==null){
		throw ('The base URL is needed in order to convert paths to relative');
	}
	var cleanContainer = this.bodyElement.cloneNode(true);

	$(cleanContainer).find('.ui-resizable').removeClass('ui-resizable');
	$(cleanContainer).find('.ui-draggable').removeClass('ui-draggable');
	$(cleanContainer).find('.ui-droppable').removeClass('ui-droppable');

	$(cleanContainer).find('[aria-disabled]').removeAttr('aria-disabled');
	
	$(cleanContainer).find('.ui-resizable-handle').remove();

	// apply the data-style-normal to all nodes
	this.applyState('normal');

	// convert absolute to relative paths
	$(cleanContainer).find('[src],[href]').each(function () {
		// attribute can be src or href
		var attr = 'src';
		var value = this.getAttribute(attr);
		if (value==null){
			attr = 'href';
			value = this.getAttribute(attr);
		}
// to do, do not wwork with file picker
console.warn('Conversion to relative url is turned off because of the file picker');
		//this.setAttribute(attr, silex.Helper.getRelativePath(value, baseUrl));
	});
	
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
	var pages = [];

	$('meta[name="page"]', this.headElement).each(function() {
		pages.push(this.getAttribute('content'));
	});
	return pages;
}
/**
 * open the given page of the site 
 */
silex.view.Stage.prototype.openPage = function(pageName){
    $(this.bodyElement).pageable({currentPage:pageName});
    this.currentPage = pageName;
}
/**
 * create a new page 
 */
silex.view.Stage.prototype.createPage = function(pageName){
	var meta = goog.dom.createElement('meta');
	meta.name = 'page';
	meta.content = pageName;
	this.headElement.appendChild(meta);
}
/**
 * delete a page 
 */
silex.view.Stage.prototype.removePage = function(pageName){
	$('meta[name="page"]', this.headElement).each(
		function () {
			if (this.getAttribute('content')==pageName){
				$(this).remove();
			}
		});
}
/**
 * add elements
 */
silex.view.Stage.prototype.addElement = function(elementType, opt_url){
	var newHtml;
	switch(elementType){
		case silex.view.Stage.ELEMENT_TYPE_CONTAINER:
			newHtml = '<div class="editable-style " \
				data-silex-type="container" \
				style="position: absolute; \
					width: 100px; height: 100px; left: 100px; top: 100px; \
					background-color: white; " \
				/>';
			break;
		case silex.view.Stage.ELEMENT_SUBTYPE_TEXT:
			newHtml = '<div class="editable-style " \
				data-silex-type="element" \
				data-silex-sub-type="text" \
				style="position: absolute; \
					width: 100px; height: 100px; left: 100px; top: 100px; \
					background-color: white; \
					overflow: hidden;" \
				>New text box</div>';
			break;
		case silex.view.Stage.ELEMENT_TYPE_IMAGE:
			newHtml = '<div class="editable-style " \
			data-silex-type="element" \
			style="position: absolute; left: 100px; top: 100px;">\
				<img src="'+opt_url+'" style="width: 100%; height: 100%; " />\
			</div>';
			break;
	}
	$('.background', this.bodyElement).append(newHtml);
	this.makeEditable(true);
	var elements = $('.background').children();
	var element = elements[elements.length-1];
	return element;
}
/**
 * remove elements
 */
silex.view.Stage.prototype.removeElement = function(element){
	$(element).remove();
	return element;
}
/**
 * website title
 */
silex.view.Stage.prototype.getTitle = function(){
	var elements = this.headElement.getElementsByTagName('title');
	if (elements && elements.length > 0){
		return elements[0].innerHTML;
	}
	else{
		return null;
	}
}
/**
 * website title
 */
silex.view.Stage.prototype.setTitle = function(name){
	// update website title
	var elements = this.headElement.getElementsByTagName('title');
	if (elements && elements.length > 0){
		elements[0].innerHTML = name;
	}
	// new website title
	else{
		var child = goog.dom.createElement('title');
		child.innerHTML = name;
		this.headElement.appendChild(child)
	}
}

