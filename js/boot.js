var silex = silex || {}; 

goog.require('goog.dom');
goog.require('goog.events');

window.onload = function() {
    console.log('onload');

    var element = goog.dom.getElement('_silex_menu');
    silex.SilexMenu.getInstance().attachTo(element);
    
    element = goog.dom.getElement('_silex_controller');
    silex.SilexController.getInstance().attachTo(element);
}
