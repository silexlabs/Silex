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

// useful modules
var pathModule = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var router = require('unifile/lib/core/router.js');

/**
 * route the call to a silex task
 */
exports.route = function(cbk, req, res, next, task){
  switch(task){
        case 'publish':
            exports.publish(function(result){
                // just log the result
                if (!result) result = {success:true};
            }, req, res, next, req.body.path, req.body.html, req.body.css, req.body.js, JSON.parse(req.body.files));
            // imediately returns success, to avoid timeout
            cbk();
        break;
        case 'sendImage':
            exports.sendImage(cbk, req, res, next, req.query.path, req.query.image);
        break;
        case 'getTempLink':
            exports.getTempLink(cbk, req, res, next, req.query.path);
            break;
        case 'disposeTempLink':
            exports.disposeTempLink(cbk, req, res, next, req.query.name);
        break;
        case 'debug':
            exports.debug(cbk, req, res, next);
        break;
        default:
          cbk({
            success: false
            , code: 'Silex task "' + task + '" does not exist'
          });
    }
}
exports.debug = function(cbk, req, res, next){

  var debugFile = __dirname + '/debug.js';
  console.log('-------------------------------------');
  console.log('debug', debugFile);
  fs.readFile(debugFile, function (err, data) {
    if (err) cbk(err);
    else {
      eval(data.toString());
    }
    cbk();
  });
  console.log('-------------------------------------');
}
/**
 * create folders needed for publishing
 */
exports.createFolders = function(req, res, next, folders, errCbk, cbk){
    if (folders.length>0){
        var folder = folders.shift();
        folder = folder.replace('/exec/put/', '/exec/mkdir/')
        exports.unifileRoute(req, res, next, folder, function(response, status, data, mime_type, responseFilePath) {
            // do not handle errors, since it is probably due to already existing folders
            exports.createFolders(req, res, next, folders, errCbk, cbk);
        });
    }
    else{
        cbk();
    }
}
/**
 * the public method called to publish a website to a location
 * copy assets and files to and from unifile services
 * write css and html data to a unifile service
 */
exports.publish = function(cbk, req, res, next, path, html, css, js, files){
    // check inputs
    if (cbk === undefined || req === undefined || res === undefined || next === undefined || path === undefined || html === undefined || css === undefined || js === undefined || files === undefined){
        console.error('All attributes needed: cbk, req, res, next, path, html, css, js, files', !!cbk, !!req, !!res, !!next, !!path, !!html, !!css, !!js, !!files)
        cbk({
            success: false
            , code: 'All attributes needed: cbk, req, res, next, path, html, css, js, files ('+(!!cbk)+', '+(!!req)+', '+(!!res)+', '+(!!next)+', '+(!!path)+', '+(!!html)+', '+(!!css)+', '+(!!js)+', '+(!!files)+')'
        });
        return;
    }
    // folder to store files
    exports.createFolders(req, res, next, [path + '/js', path + '/css', path + '/assets'], cbk, function (){
        // get all files data and copy it to destination service
        exports.publishFiles(req, res, next, files, path, function(error){
            if (error){
                console.error('Error in publishFiles', error);
                cbk({success:false, code: error.code});
            }
            else{
                // write the css
                exports.writeFileToService(req, res, next, path + '/css/styles.css', css, function (error){
            if(error){
                        cbk({success:false, code: error.code});
                    }
                    else{
                if (js === '') js = '/* */';
                    // write the js
                    exports.writeFileToService(req, res, next, path + '/js/script.js', js, function (error){
                        if(error){
                            cbk({success:false, code: error.code});
                        }
                        else{
                            // write the html
                            exports.writeFileToService(req, res, next, path + '/index.html', html, function (error){
                                if(error){
                                    cbk({success:false, code: error.code});
                                }
                                else{
                                    cbk();
                                }
                            });
                        }
                    });
                 }
            });
           }
      });
    });
}
/**
 * get all files data and copy it to destination service
 */
exports.publishFiles = function(req, res, next, files, dstPath, cbk){
  if(files.length>0){
    var file = files.shift();
        exports.getFile(req, res, next, file.srcPath, dstPath + '/' + file.destPath, function (error) {
            if (error){
                console.error('Error in getFile', error, file.srcPath, dstPath);
                // no, continue on error
        // cbk({success:false, code: error.code});
            }
            else{
      }
            exports.publishFiles(req, res, next, files, dstPath, cbk);
        });
    }
    else{
        cbk();
    }
}
/**
 * the public method called to store an image from pixlr
 */
exports.sendImage = function(cbk, req, res, next, path, url){
    // check inputs
    if (cbk === undefined || req === undefined || res === undefined || next === undefined || path === undefined || url === undefined){
        console.error('All attributes needed: cbk, req, res, next, path, url')
        cbk({
            success: false
            , code: 'All attributes needed: cbk, req, res, next, path, url '
        });
        return;
    }
    // load the image and save it to the desired service
    exports.getFile(req, res, next, url, path, function (error) {
        // no, makes the headers to be sent and crashes everything
        // res.redirect('/libs/pixlr/close.html');
        if (error){
            console.error('Error in getFile', error, url, path);
            cbk({success:false, code: error.code});
        }
        else{
          res.header('Location', '/libs/pixlr/close.html');
          cbk({success:true});
        }
    });
};
/**
 * the public method called to get a temp link to a ressource stored in a cloud service
 */
exports.disposeTempLink = function(cbk, req, res, next, name){
    // remove the first optional /tmp/
    // and compute the path in the /www/tmp folder
    var path = pathModule.resolve(__dirname, '../../dist/client/tmp', name.replace(/\/|\\|tmp/g, ''));
    fs.unlink(path, function(err) {
        if (err){
            console.error('Error, could not remove ' + name + ' resolved to path ' + path + ' (' + err.code + ')');
            cbk({
                code: 'Error, could not remove ' + name + ' (' + err.code + ')'
            });
        }
        else{
            cbk();
        }
    });
};

/**
 * the public method called to get a temp link to a ressource stored in a cloud service
 */
exports.getTempLink = function(cbk, req, res, next, path){
    if (!path){
        cbk({success:false, code: 400, message: 'path param must be provided in get'});
        return;
    }
    var ext = path.split('.').pop();
    var name = Math.floor(2147483648 * Math.random()).toString(36)
        + '-'
        + Date.now()
        + '.' + ext;
    var tempLink = '/tmp/' + name;
    var tempPath = __dirname + '../../../dist/client/tmp/' + name;
    exports.unifileRoute(req, res, next, path, function (response, status, data, mime_type, responseFilePath) {
        if (status && status.success === false){
            console.error('Error in getFileFromService for ' + path, status);
            cbk(status);
        }
        else if (data){
            var p = pathModule.resolve(__dirname, tempPath)
            fs.writeFile(p, data, function (err) {
                if (err){
                    cbk({success:false, code: 400, message: 'Error: could not write temp file (' + p + ')'});
                }
                else{
                    cbk({success:true, tempLink: tempLink});
                }
            });
        }
        else if (responseFilePath){
            fs.readFile(responseFilePath, function (err, data) {
                if (err) cbk(err);
                else {
                    var p = pathModule.resolve(__dirname, tempPath)
                    fs.writeFile(p, data, function (err) {
                        if (err){
                            cbk({success:false, code: 400, message: 'Error: could not write temp file (' + p + ')'});
                        }
                        else{
                            cbk({success:true, tempLink: tempLink});
                        }
                    });
                }
            });
        }
        else{
            console.error('Error, no data in result of getFileFromService for ' + path);
            cbk({
                code: 'Error, no data in result of getFileFromService for ' + path
            });
        }
    });
};

/**
 * get one file from URL or service, to a service
 */
exports.getFile = function(req, res, next, srcPath, dstPath, cbk){
    if (srcPath.indexOf('http')===0){
        exports.getFileFromUrl(req, res, next, srcPath, dstPath, cbk);
    }
    else{
        exports.getFileFromService(req, res, next, srcPath, dstPath, cbk);
    }
}
/**
 * get file from URL, to a service
 */
exports.getFileFromUrl = function(req, res, next, srcPath, dstPath, cbk){
    var data = [];

    // http or https
    var http_s = http;
    if (srcPath.indexOf('https')===0){
        http_s = https;
    }
    // load the file
    http_s.get(srcPath, function(result) {
        result.on('data', function(chunk) {
            if (srcPath.indexOf('https')===0){
                // https => all the data the 1st time
                data = chunk;
            }
            else{
                data.push( chunk);
            }
          });
          result.on('end', function() {
            if (srcPath.indexOf('https')===0 && Array.isArray(data)){
                exports.writeFileToService(req, res, next, dstPath, data.join(), function(status) {
                    cbk(status);
                });
            }
            else{
                exports.writeFileToService(req, res, next, dstPath, data, function(status) {
                    cbk(status);
                });
            }
          });
    }).on('error', function(e) {
        console.error('Error while loading '+srcPath+': ' + e.message);
        cbk({
            code: 'Error while loading '+srcPath+': ' + e.message
        });
    });
}


/**
 * get file from a service, to a service
 */
exports.getFileFromService = function(req, res, next, srcPath, dstPath, cbk){
    exports.unifileRoute(req, res, next, srcPath, function (response, status, data, mime_type, responseFilePath) {
      if (data){
        exports.writeFileToService(req, res, next, dstPath, data, cbk);
      }
      else if (responseFilePath){
            fs.readFile(responseFilePath, function (err, data) {
                if (err) cbk(err);
                else {
                    exports.writeFileToService(req, res, next, dstPath, data, cbk);
                }
            });
        }
        else{
            console.error('Error, no data in result of getFileFromService for ' + srcPath);
            cbk({
                code: 'Error, no data in result of getFileFromService for ' + srcPath
            });
        }
    });
}
/**
 * call unifile as an api
 */
exports.writeFileToService = function(req, res, next, url, data, cbk){
    req.body.data = data;
    exports.unifileRoute(req, res, next, url, function(response, status, data, mime_type, responseFilePath) {
        if (status.success){
            cbk();
        }
        else{
            cbk(status);
        }
    });
}
/**
 * call unifile as an api
 */
exports.unifileRoute = function(req, res, next, url, cbk){
    // url decode the url
    url = decodeURIComponent(url);
    // split to be able to manipulate each folder
    var url_arr = url.split('/');
    // remove the first empty '' from the path (first slash)
    url_arr.shift();
    // remove the 'api' path
    url_arr.shift();
    // remove the api version number
    url_arr.shift();
   // get and remove the service name
    var serviceName = url_arr.shift();
    try{
        if (serviceName){
            var routed = router.route(serviceName, url_arr, req, res, next, cbk);
            if (!routed){
                console.error('Unknown service ', serviceName, ' (', url, ')');
                cbk(res, {
                    success: false
                    , code: 'Unknown service '+serviceName
                });
            }
        }
        else{
            console.error('Unknown service ', serviceName, ' (', url, ')');
            cbk(res, {
                success: false
                , code: 'Unknown service '+serviceName
            });
        }
    }
    catch(e){
        console.error('Error in service '+serviceName+': '+e);
        cbk(res, {
            success: false
            , code: 'Error in service '+serviceName+': '+e
        });
    }
}
