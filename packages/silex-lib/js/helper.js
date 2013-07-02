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
/**
 * Get a relative path from an absolute URL, given a base URL
 * @param url   a URL which has to end with a '/' or with a file name
 * @param base  a URL which has to end with a '/' or with a file name
 * @return      a path from the base to the url
 * @example     silex.TemplateHelper.getRelativePath("http://abc.com/d/f/g/file.html","http://abc.com/d/e/");
 *              base    http://abc.com/d/e/
 *              url     http://abc.com/d/f/g/file.html
 *              result  ../f/g/file.html
 */
silex.TemplateHelper.getRelativePath = function(url, base){
    console.log('getRelativePath '+url+', '+base);
    // check if they are both absolute urls
    if(base.indexOf('http')!=0 || url.indexOf('http')!=0){
        console.log('Warning: the URL is not absolute');
        return url;
    }
    // get an array out of the URLs
    var urlArr = url.split('/');
    var baseArr = base.split('/');
    // keep track of the file name if any
    var fileName  = urlArr[urlArr.length-1];
    // remove the filename and the last '/'
    urlArr.pop();
    baseArr.pop();
    // remove the http[s]://
    urlArr.shift();
    urlArr.shift();
    baseArr.shift();
    baseArr.shift();
    // check if they are on the same domain
    if(baseArr[0]!=urlArr[0]){
        console.log('Warning: the URL is not on the same domain as the base url');
        return url;
    }
    // remove the common part
    var baseElement;
    var urlElement;
    while (baseArr.length>0 && urlArr.length>0
        && baseArr[0]==urlArr[0]){
        baseArr.shift();
        urlArr.shift();
    }
    
    // as many '../' as there are folders left in the base url 
    var relativePath = '';
    for (var idx = 0; idx<baseArr.length; idx++){
        relativePath += '../';
    }

    // now append the folders from url and the file name
    relativePath += urlArr.join('/') + '/' + fileName;

    console.log('result '+relativePath);
    return relativePath;
}
/**
 * replace all absolute urls with the relative path
 *
silex.TemplateHelper.convertURLsToRelative = function(str){
    // convert absolute URLs to relative
    var base = this.selection.getSelectedFile();
    //str = str.replace(window.location.href, './');
    var styleArr = str.split('url(');
    for (var idx=1; idx<styleArr.length; idx++){
        // get the url from this line
        var url = styleArr[idx].substr(0, styleArr[idx].indexOf(')'));
        var relUrl = silex.TemplateHelper.getRelativePath(url, base);
        // put back the rest of the line
        styleArr[idx] = relUrl + styleArr[idx].substr(styleArr[idx].indexOf(')'));
    }
    str = styleArr.join('url(');
    return str;
}
*/
