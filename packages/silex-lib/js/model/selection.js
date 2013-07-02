var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.model.Selection');

//////////////////////////////////////////////////////////////////
// Selection class
//////////////////////////////////////////////////////////////////

/**
 * constructor
 */
silex.model.Selection = function(){
	this.listeners = [];
	this.file = "";
	this.page = "";
	this.elements = [];
}
/** 
 * opened file
 */
silex.model.Selection.prototype.file;
/** 
 * selected page
 */
silex.model.Selection.prototype.page;
/** 
 * selected elements
 */
silex.model.Selection.prototype.elements;
/** 
 * listeners
 */
silex.model.Selection.prototype.listeners;
/** 
 * change event callback, set by the controller
 */
silex.model.Selection.prototype.onChanged;
/** 
 * page selection
 */
silex.model.Selection.prototype.getSelectedPage = function(){
	return this.page;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedPage = function(name, notify){
	this.page = name;
	if (notify!==false && this.onChanged) this.onChanged("page");
}
/** 
 * file selection
 */
silex.model.Selection.prototype.getSelectedFile = function(){
	return this.file;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedFile = function(name, notify){
	this.file = name;
	if (notify!==false && this.onChanged) this.onChanged("file");
}
/** 
 * elements selection
 */
silex.model.Selection.prototype.getSelectedElements = function(){
	return this.elements;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedElements = function(elements, notify){
	this.elements = elements;
	if (notify!==false && this.onChanged) this.onChanged("elements");
}

