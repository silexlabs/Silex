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

goog.provide('silex.model.Page');

/**
 * @constructor
 */
silex.model.Page = function(name, pageableElement){
	this.pageableElement = pageableElement;
	this.name = name;
}
getComponents = function () {

}
/**
 * the page name
 */
silex.model.Page.prototype.name;
/**
 * the pageableElement instance from the view
 */
silex.model.Page.prototype.pageableElement;
/**
 * open the given page of the site 
 */
silex.model.Page.prototype.open = function(){
    $(pageableElement).pageable({currentPage:this.name});
}
