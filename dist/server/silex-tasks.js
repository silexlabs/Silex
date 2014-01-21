// useful modules
pathModule = require('path');
fs = require('fs');
http = require('http');
https = require('https');
router = require('unifile/lib/core/router.js');

/**
 * route the call to a silex task
 */
exports.route = function(cbk, req, res, next, task){
    console.log('route');
	switch(task){
		case 'publish':
			exports.publish(function(result){
				// just log the result
		        if (!result) result = {success:true};
		        console.log('silex task result', result);
		    }, req, res, next, req.body.path, req.body.html, req.body.css, req.body.js, JSON.parse(req.body.files));
			// imediately returns success, to avoid timeout
		    cbk();
		break;
	}
}
/**
 * create folders needed for publishing
 */
exports.createFolders = function(req, res, next, folders, errCbk, cbk){
    console.log('createFolder');
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
    console.log('publish');
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
        console.log('xxx');
		// get all files data and copy it to destination service
		exports.publishFiles(req, res, next, files, path, function(error){
			if (error){
				console.error('Error in publishFiles', error);
				cbk({success:false, code: error.code});
			}
			else{
				// write the css
		    	exports.writeFileToService(req, res, next, path + '/css/styles.css', css, function (error){
                    console.log('xxx css', error);
            if(error){
		    			cbk({success:false, code: error.code});
		    		}
		    		else{
                if (js === '') js = '/* */';
                console.log('about to write ', js, 'to ', path + '/js/script.js');
                    // write the js
                    exports.writeFileToService(req, res, next, path + '/js/script.js', js, function (error){
                      console.log('xxx js', error);
                        if(error){
                            cbk({success:false, code: error.code});
                        }
                        else{
                            // write the html
                            exports.writeFileToService(req, res, next, path + '/index.php', html, function (error){
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
    console.log('publishFiles', file.srcPath);
		exports.getFile(req, res, next, file.srcPath, dstPath + '/' + file.destPath, function (error) {
			if (error){
				console.error('Error in getFile', error, file.srcPath);
				cbk({success:false, code: error.code});
			}
			else{
				exports.publishFiles(req, res, next, files, dstPath, cbk);
			}
		});
	}
	else{
		cbk();
	}
}
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
	var data = '';

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
			    data += chunk;
			}
		  });
		  result.on('end', function() {
	    	exports.writeFileToService(req, res, next, dstPath, data, function(status) {
				cbk();
	        });
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
                console.error('Unknown service '+serviceName);
	            cbk(res, {
	            	success: false
	            	, code: 'Unknown service '+serviceName
	            });
            }
        }
        else{
            console.error('Unknown service '+serviceName);
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
