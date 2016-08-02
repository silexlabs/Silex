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
var request = require('request');
var router = require('unifile/lib/core/router.js');

var publishStates = {};

/**
 * route the call to a silex task
 */
exports.route = function(cbk, req, res, next, task){
  switch(task){
    case 'publish':
      exports.publish(function(result){
        // just log the result
        if (!result) {
          result = {success: true};
          publishStates[req.session.sessionID] = 'Done.';
        }
        else {
          publishStates[req.session.sessionID] = 'Error: ' + result.message;
        }
      }, req, res, next, req.body.path, req.body.html, req.body.css, req.body.js, JSON.parse(req.body.files));
      // imediately returns success, to avoid timeout
      cbk();
    break;
    case 'publishState':
      cbk({
        'status': publishStates[req.session.sessionID],
        'stop': !publishStates[req.session.sessionID] || publishStates[req.session.sessionID] === 'Done.' || publishStates[req.session.sessionID].indexOf('Error') === 0
      });
    break;
    case 'sendImage':
      // exports.sendImage(cbk, req, res, next, req.query.path, req.query.image);
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
    case process.env.RESTART_ROUTE || 'reload':
      if(!process.env.RESTART_ROUTE) {
        cbk({
          success: false,
          message: 'You need to define an env var RESTART_ROUTE and call /{{RESTART_ROUTE}}'
        });
        return;
      }
      cbk({
        success: true
      });
      process.send('restart');
    break;
    default:
      cbk({
      success: false,
      code: 400,
      message: 'Silex task "' + task + '" does not exist'
      });
  }
};


/**
 * create folders needed for publishing
 */
exports.createFolders = function(req, res, next, folders, errCbk, cbk){
  if (folders.length > 0){
    var folder = folders.shift();
    folder = folder.replace('/exec/put/', '/exec/mkdir/');
    exports.unifileRoute(req, res, next, folder, function(response, status, data, mime_type, responseFilePath) {
      // do not handle errors, since it is probably due to already existing folders
      exports.createFolders(req, res, next, folders, errCbk, cbk);
    });
  }
  else{
    cbk();
  }
};


/**
 * the public method called to publish a website to a location
 * copy assets and files to and from unifile services
 * write css and html data to a unifile service
 */
exports.publish = function(cbk, req, res, next, path, html, css, js, files){
    publishStates[req.session.sessionID] = 'Creating folders.';
    // cleanup path since front end sends an absolute path
    // and we need path which start with /api
    if(path.indexOf('http') === 0) {
        path = path.substring(path.indexOf('/api'));
    }
    // check inputs
    if (cbk === undefined || req === undefined || res === undefined || next === undefined || path === undefined || html === undefined || css === undefined || js === undefined || files === undefined){
        console.error('All attributes needed: cbk, req, res, next, path, html, css, js, files', !!cbk, !!req, !!res, !!next, !!path, !!html, !!css, !!js, !!files)
        cbk({
            success: false
            , code: 400
            , message: 'All attributes needed: cbk, req, res, next, path, html, css, js, files ('+(!!cbk)+', '+(!!req)+', '+(!!res)+', '+(!!next)+', '+(!!path)+', '+(!!html)+', '+(!!css)+', '+(!!js)+', '+(!!files)+')'
        });
        return;
    }
    // folder to store files
    exports.createFolders(req, res, next, [path + '/js', path + '/css', path + '/assets'], cbk, function (){
        // get all files data and copy it to destination service
        exports.publishFiles(req, res, next, files, path, function(error){
            publishStates[req.session.sessionID] = 'Creating "/js/script.js".';
            if (error){
                console.error('SilexTasks:: publishFiles:: Error', error);
                cbk(error);
            }
            // write the js
            exports.writeFileToService(req, res, next, path + '/js/script.js', js, function (error){
              publishStates[req.session.sessionID] = 'Creating "/css/styles.css".';
              if(error){
                  console.error('SilexTasks:: writeFileToService:: Error for /js/script.js', error);
                  cbk(error);
              }
              else{
                // write the js
                exports.writeFileToService(req, res, next, path + '/css/styles.css', css, function (error){
                  publishStates[req.session.sessionID] = 'Creating "/index.html".';
                  if(error){
                      console.error('SilexTasks:: writeFileToService:: Error for /css/styles.css', error);
                      cbk(error);
                  }
                  else{
                      // write the html
                      exports.writeFileToService(req, res, next, path + '/index.html', html, function (error){
                          publishStates[req.session.sessionID] = 'index.html file created.';
                          if(error){
                              console.error('SilexTasks:: writeFileToService:: Error for /index.html', error);
                              cbk(error);
                          }
                          else{
                              cbk();
                          }
                      });
                  }
              });
            }
          });
        });
    });
};


/**
 * get all files data and copy it to destination service
 */
exports.publishFiles = function(req, res, next, files, dstPath, cbk){
  // check inputs
  if (cbk === undefined || req === undefined || res === undefined || next === undefined || files === undefined || dstPath === undefined){
    console.error('All attributes needed when calling publishFiles', files, dstPath);
    cbk({
      success: false,
      message: 'All attributes needed when calling publishFiles method',
      code: 400
    });
    return;
  }
  if(files.length > 0){
    var file = files.shift();
    publishStates[req.session.sessionID] = 'Downloading ' + file.destPath + ' (' + files.length + ' left)';
    exports.getFile(req, res, next, file.srcPath, dstPath + '/' + file.destPath, function (error) {
      if (error){
        console.error('publishFiles - Error in getFile', error, file.srcPath, dstPath, file.destPath);
        // no, continue on error
        // cbk(error);
      }
      exports.publishFiles(req, res, next, files, dstPath, cbk);
    });
  }
  else{
    cbk();
  }
};


/**
 * the public method called to store an image from pixlr
 */
// exports.sendImage = function(cbk, req, res, next, path, url){
//   // check inputs
//   if (cbk === undefined || req === undefined || res === undefined || next === undefined || path === undefined || url === undefined){
//     console.error('All attributes needed when calling sendImage', path, url);
//     // FIXME: do not send JSON, the end user will see the result
//     cbk({
//       success: false,
//       code: 400,
//       message: 'All attributes needed when calling sendImage'
//     });
//     return;
//   }
//   // load the image and save it to the desired service
//   exports.getFile(req, res, next, url, path, function (error) {
//     // no, makes the headers to be sent and crashes everything
//     // res.redirect('/libs/pixlr/close.html');
//     if (error){
//       console.error('Error in getFile', error, url, path);
//       // do not send JSON, the end user will see the result
//       // cbk({success: false, code: error.code});
//     }
//     // do not send JSON, the end user will see the result
//     fs.readFile(pathModule.resolve(__dirname, '../client/libs/pixlr/close.html'), 'utf-8', function (err, data) {
//       // FIXME: handle err?
//       if (!err) {
//         cbk(data.toString());
//       }
//       else {
//         console.error('Error: could not read the template close.html');
//         cbk('Error: could not read the template close.html');
//       }
//     });

//   });
// };


/**
 * the public method called to get a temp link to a ressource stored in a cloud service
 */
exports.disposeTempLink = function(cbk, req, res, next, name){
  // remove the first optional /tmp/
  // and compute the path in the /www/tmp folder
  var path = pathModule.resolve(__dirname, '../client/tmp', name.replace(/\/|\\|tmp/g, ''));
  fs.unlink(path, function(err) {
    if (err){
      console.error('Error, could not remove ' + name + ' resolved to path ' + path + ' (' + err + ')');
      cbk({
        success: false,
        message: 'Error, could not remove ' + name
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
    console.error('Error: path param must be provided in get');
    cbk({success: false, code: 400, message: 'path param must be provided in get'});
    return;
  }
  var ext = path.split('.').pop();
  var name = Math.floor(2147483648 * Math.random()).toString(36) + '-' + Date.now() + '.' + ext;
  var tempLink = '/tmp/' + name;
  var tempPath = pathModule.resolve(__dirname, '../client/tmp/', name);
  exports.unifileRoute(req, res, next, path, function (response, status, data, mime_type, responseFilePath) {
    if (status && status.success === false){
      console.error('Error in getFileFromService for ' + path, status);
      cbk(status);
    }
    else if (data){
      var p = pathModule.resolve(__dirname, tempPath);
      fs.writeFile(p, data, function (err) {
        if (err){
          console.error('Error: could not write temp file (' + p + ') - ' + err);
          cbk({success: false, message: 'Error: could not write temp file'});
        }
        else{
          cbk({success: true, tempLink: tempLink});
        }
      });
    }
    else if (responseFilePath){
      fs.readFile(responseFilePath, 'utf-8', function (err, data) {
        if (err) {
          cbk(err);
        }
        else {
          var p = pathModule.resolve(__dirname, tempPath);
          fs.writeFile(p, data, function (err) {
            if (err){
              console.error('Error: could not write temp file (' + p + ') - ' + err);
              cbk({success: false, message: 'Error: could not write temp file'});
            }
            else{
              cbk({success: true, tempLink: tempLink});
            }
          });
        }
      });
    }
    else{
      console.error('Error, no data in result of getFileFromService for ' + path);
      cbk({
        message: 'Error, no data in result of getFileFromService for ' + path
      });
    }
  });
};



/**
 * get one file from URL or service, to a service
 */
exports.getFile = function(req, res, next, srcPath, dstPath, cbk){
  // check inputs
  if (cbk === undefined || req === undefined || res === undefined || next === undefined || srcPath === undefined || dstPath === undefined){
    console.error('All attributes needed when calling getFile', srcPath, dstPath);
    cbk({
      success: false,
      code: 400,
      message: 'All attributes needed when calling getFile'
    });
    return;
  }
  if (srcPath.indexOf('http') === 0){
    exports.getFileFromUrl(req, res, next, srcPath, dstPath, cbk);
  }
  else{
    exports.getFileFromService(req, res, next, srcPath, dstPath, cbk);
  }
};


/**
 * get file from URL, to a service
 */
exports.getFileFromUrl = function(req, res, next, srcPath, dstPath, cbk){
  request(srcPath, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      exports.writeFileToService(req, res, next, dstPath, body, function(error) {
        cbk(error);
      });
    }
    else {
      console.error('Error while loading '+srcPath+': ' + e.message);
      cbk(error);
    }
  });
};


/**
 * get file from a service, to a service
 */
exports.getFileFromService = function(req, res, next, srcPath, dstPath, cbk){
  exports.unifileRoute(req, res, next, srcPath, function (response, status, data, mime_type, responseFilePath) {
    if (data){
      exports.writeFileToService(req, res, next, dstPath, data, cbk);
    }
    else if (responseFilePath){
      fs.readFile(responseFilePath, function (err, responseData) {
        if (err) {
          cbk(err);
        }
        else {
          exports.writeFileToService(req, res, next, dstPath, responseData, cbk);
        }
      });
    }
    else{
      console.error('Error, no data in result of getFileFromService for ' + srcPath);
      cbk({
        message: 'Error, no data in result of getFileFromService for ' + srcPath
      });
    }
  });
};


/**
 * call unifile as an api
 */
exports.writeFileToService = function(req, res, next, url, data, cbk){
  if(!data || data === '') {
    cbk();
  }
  else {
    console.log('writeFileToService', req.body);
    req.body.data = data;
    exports.unifileRoute(req, res, next, url, function(response, status, responseData, mime_type, responseFilePath) {
      if (status.success){
        cbk();
      }
      else{
        cbk(status);
      }
    });
  }
};


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
          success: false,
          code: 400,
          message: 'Unknown service ' + serviceName
        });
      }
    }
    else{
      console.error('Unknown service ', serviceName, ' (', url, ')');
      cbk(res, {
        success: false,
        code: 400,
        message: 'Unknown service ' + serviceName
      });
    }
  }
  catch(e){
    console.error('Error in service ' + serviceName, e, e.stack);
    cbk(res, {
      success: false,
      message: 'Error in service ' + serviceName + ': ' + e
    });
  }
};
