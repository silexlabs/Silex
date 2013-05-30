var silex = silex || {}; 

goog.provide('silex.TemplateHelper');

goog.require('goog.net.XhrIo');

silex.TemplateHelper = function(){
    
}
/**
 * load a template and put the content in the provided element, then call the callback
 */
silex.TemplateHelper.loadTemplate = function(url, element, cbk){
    console.log('loadTemplate '+url);
    goog.net.XhrIo.send(url, function(e){
        var xhr = e.target;
        var data = xhr.getResponse();
        console.log('request success '+data);
        element.innerHTML = data;
        cbk();
    });
}
