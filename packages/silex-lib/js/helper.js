var silex = silex || {}; 

goog.provide('silex.TemplateHelper');

goog.require('goog.net.XhrIo');

silex.TemplateHelper = function(){
    
}
/**
 * load a template and put the content in the provided element, then call the callback
 */
silex.TemplateHelper.loadTemplateFile = function(url, element, cbk){
    console.log('loadTemplateFile '+url);
    goog.net.XhrIo.send(url, function(e){
        var xhr = e.target;
        var data = xhr.getResponse();
        console.log('request success ');
        element.innerHTML = data;
        cbk();
    });
}
/**
 * Resolve a template and put the result in the provided element
 */
silex.TemplateHelper.resolveTemplate = function(element, templateHtml, data){
    //console.log('resolveTemplate '+element+', '+templateHtml+', '+data);
	var template = Handlebars.compile(templateHtml);
	element.innerHTML = template(data);
}
