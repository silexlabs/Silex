// useful modules
pathModule = require('path');
fs = require('fs');
http = require('http');
router = require('unifile/lib/core/router.js');

/**
 * route the call to a silex task
 */
exports.route = function(cbk, req, res, next, task){
	switch(task){
		case 'publish':
			exports.publish(cbk, req, res, next, req.body.path, req.body.html, req.body.css, JSON.parse(req.body.files));
		break;
	}
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
exports.publish = function(cbk, req, res, next, path, html, css, files){
	// folder to store files
//	var tmpPath = '../tmp/' + (new Date().getTime()) + Math.round(Math.random() * 1000000000) + '/';
//	var resolvedPath = pathModule.resolve(__dirname, tmpPath);

	exports.createFolders(req, res, next, [path + '/js', path + '/css', path + '/assets'], cbk, function (){
		// get all files data and copy it to destination service
		exports.publishFiles(req, res, next, files, path, function(error){
			if (error){
				console.error('Error in publishFiles', error);
				cbk({success:false, code: error.code});
			}
			else{
				// write the html
		    	exports.writeFileToService(req, res, next, path + '/index.html', html, function (error){
		    		if(error){
		    			cbk({success:false, code: error.code});
		    		}
		    		else{
						// write the css
				    	exports.writeFileToService(req, res, next, path + '/css/styles.css', css, function (error){
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
				console.error('Error in getFile', error);
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
	http.get(srcPath, function(result) {
		result.on('data', function(chunk) {
		    data += chunk;
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
            console.error('Error, no data in result of '+serviceName);
            cbk({
            	code: 'Error, no data in result of '+serviceName
            });
    	}
    });
}
/**
 * call unifile as an api
 */
exports.writeFileToService = function(req, res, next, url, data, cbk){
//	req.body = req.body || {};
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
            cbk({
            	success: false
	        	, code: 'Unknown service '+serviceName
            });
        }
    }
    catch(e){
        console.error('Error in service '+serviceName+': '+e);
        cbk({
        	success: false
        	, code: 'Error in service '+serviceName+': '+e
        });
    }
}
