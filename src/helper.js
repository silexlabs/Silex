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

goog.provide('silex.Helper');

goog.require('goog.net.XhrIo');
goog.require('goog.Uri');
goog.require('goog.style');

silex.Helper = function(){
}
/**
 * load a template and put the content in the provided element, then call the callback
 */
silex.Helper.loadTemplateFile = function(url, element, cbk, context){
    goog.net.XhrIo.send(url, function(e){
        var xhr = e.target;
        var data = xhr.getResponse();
        element.innerHTML = data;
        if (cbk) goog.bind(cbk, context)();
    });
}
/**
 * Resolve a template and put the result in the provided element
 */
silex.Helper.resolveTemplate = function(element, templateHtml, data){
    var template = Handlebars.compile(templateHtml);
    element.innerHTML = template(data);
}
/**
 * Get a relative path from an absolute URL, given a base URL
 * @param url   a URL which has to end with a '/' or with a file name
 * @param base  a URL which has to end with a '/' or with a file name
 * @return      a path from the base to the url
 * @example     silex.Helper.getRelativePath("http://abc.com/d/f/g/file.html","http://abc.com/d/e/");
 *              base    http://abc.com/d/e/
 *              url     http://abc.com/d/f/g/file.html
 *              result  ../f/g/file.html
 */
silex.Helper.getRelativePath = function(url, base){

    // check if they are both absolute urls
    if(base.indexOf('http')!=0 || url.indexOf('http')!=0){
        console.warn('Warning: the URL is not absolute ', url, base);
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
        console.warn('Warning: the URL is not on the same domain as the base url ', url);
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

    console.log("getRelativePath ", url, base, relativePath);

    return relativePath;
}
/**
 * convert relative to absolute url 
 * use http://docs.closure-library.googlecode.com/git/class_goog_Uri.html
 */
silex.Helper.getAbsolutePath = function(url, base){
    console.log("getAbsolutePath ", url, base, goog.Uri.resolve(base, url).toString());
    return goog.Uri.resolve(base, url).toString();
}
/**
 * convert style object to string
 */
silex.Helper.styleToString = function(style){
    // build a string out of the style object
    var styleStr = '';
    goog.object.forEach(style, function(val, index, obj) {
        if (val)
            styleStr += goog.string.toSelectorCase(index) + ': ' + val + '; ';
    });
    return styleStr;
}
/**
 * convert style string to object
 */
silex.Helper.stringToStyle = function(styleStr){
    return goog.style.parseStyleAttribute(styleStr);
}
/**
 * convert hex color to rgba values
 * @example  #000000FF will return rgba(0, 0, 0, 1)
 */
silex.Helper.hexToRgba = function(hex){
    if (hex.indexOf('#')!==0) return hex;
    if (hex.length!==9){
        console.error('Error in length '+hex+' - '+hex.length);
        return hex;
    }
    hexArr = silex.Helper.hexToArray(hex);
    r = hexArr[0];
    g = hexArr[1];
    b = hexArr[2];
    a = hexArr[3];

    var result = 'rgba('+r+','+g+','+b+','+a+')';
    return result;
}
/**
 * convert rgba to array of values
 * @example     #000000FF will return [0, 0, 0, 1]
 */
silex.Helper.hexToArray = function(hex){
    if (hex.indexOf('#')!==0) return hex;
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);
    a = parseInt(hex.substring(6,8), 16)/255;

    var result = [r, g, b, a];
    return result;
}
/**
 * convert rgba to hex
 * @example     rgba(0, 0, 0, 1) will return #000000FF
 */
silex.Helper.rgbaToHex = function(rgba){
    // has to be rgb or rgba
    if (rgba.indexOf('rgb')!==0) return rgba;
    // get the array version
    rgbaArr = silex.Helper.rgbaToArray(rgba);

    r = rgbaArr[0].toString(16); if (r.length<2) r = '0'+r;
    g = rgbaArr[1].toString(16); if (g.length<2) g = '0'+g;
    b = rgbaArr[2].toString(16); if (b.length<2) b = '0'+b;
    a = (rgbaArr[3]).toString(16); if (a.length<2) a = '0'+a;

    var result = '#'+(r+g+b+a);
    return result;
}
/**
 * convert rgba to array of values
 * @example     rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
 */
silex.Helper.rgbaToArray = function(rgba){
    // not rgb nor rgba
    if (rgba.indexOf('rgb')!==0) return rgba;
    if (rgba.indexOf('rgba')!==0){
        // rgb
        rgba = rgba.replace('rgb','');
    }
    else{
        // rgba
        rgba = rgba.replace('rgba','');
    }
    rgba = rgba.replace(' ','');
    rgbaArr = rgba.substring(1,rgba.length-1).split(',');

    // add alpha if needed
    if (rgbaArr.length<4) rgbaArr.push('1');

    r = parseInt(rgbaArr[0]);
    g = parseInt(rgbaArr[1]);
    b = parseInt(rgbaArr[2]);
    a = parseInt(rgbaArr[3]*255);

    var result = [r, g, b, a];
    return result;
}
