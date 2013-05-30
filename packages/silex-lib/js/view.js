var silex = silex || {}; 

goog.provide('silex.SilexMenu');

goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');

/**
 * the Silex menu class
 */
silex.SilexMenu = function(){
}
/**
 * singleton pattern
 */
silex.SilexMenu._instance = null;
/**
 * singleton pattern
 */
silex.SilexMenu.getInstance = function(){
    if (silex.SilexMenu._instance === null){
        silex.SilexMenu._instance = new silex.SilexMenu();
    }
    return silex.SilexMenu._instance;
}
/**
 * reference to the menu class
 */
silex.SilexMenu.prototype.menu;
/**
 * reference to the attached element
 */
silex.SilexMenu.prototype.element;
/**
 * load the template and make it a menu
 */
silex.SilexMenu.prototype.attachTo = function(element){
    this.element = element;
    silex.TemplateHelper.loadTemplate("html/ui/menu.html", element, function(){
        this.menu = new goog.ui.Menu();
        this.menu.decorate(element);
    });
}
