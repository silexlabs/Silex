// useful modules
pathModule = require('path');
fs = require('fs');
http = require('http');
router = require('unifile/lib/core/router.js');

exports.route = function(cbk, req, res, next, task){
	switch(task){
		case 'publish':
			exports.publish(cbk, req, res, next, req.body.path, req.body.html, req.body.css, JSON.parse(req.body.files));
		break;
	}
}
exports.createFolders = function(folders, errCbk, cbk){
	if (folders.length>0){
		var folder = folders.shift();
		
		console.log('fs.mkdir', folder);
		fs.mkdir(folder, null, function (error) {
			console.log('fs.mkdir callback', error);
			if (error){
				console.error('mkdir error: ', error);
				errCbk({success:false, code: error.code});
			}
			else{
				exports.createFolders(folders, errCbk, cbk);
			}
		});
	}
	else{
		cbk();
	}
}
/**
 * the public method called to publish a website to a location
 * create a temp folder, the css, js, assets folders
 * download assets and files
 * write css and html data
 */
exports.publish = function(cbk, req, res, next, path, html, css, files){
	// folder to store files
	var tmpPath = '../tmp/' + (new Date().getTime()) + Math.round(Math.random() * 1000000000) + '/';
	var resolvedPath = pathModule.resolve(__dirname, tmpPath);
	exports.createFolders([resolvedPath, resolvedPath + '/js', resolvedPath + '/css', resolvedPath + '/assets'], cbk, function (){
		//console.log('publish', path, html, css, files)
		console.log('publish');

		// get all files to local
		exports.getAllFiles(req, res, next, files, resolvedPath, function(error){
			if (error){
				console.error('Error', error.code);
				cbk({success:false, code: error.code});
			}
			else{
				cbk({success: true});
			}
		});
		// write the html
		var file = fs.createWriteStream(resolvedPath + '/index.html');
		file.write(html);
		// write the css
		var file = fs.createWriteStream(resolvedPath + '/css/styles.css');
		file.write(css);
	});

}
exports.getAllFiles = function(req, res, next, files, dstPath, cbk){
	if(files.length>0){
		var file = files.pop();
		exports.getFile(req, res, next, file.srcPath, dstPath + '/' + file.destPath, function (error) {
			if (error){
				cbk({success:false, code: error.code});
			}
			else{
				exports.getAllFiles(req, res, next, files, dstPath, cbk);
			}
		});
	}
	else{
		cbk();
	}
}
/**
 * get file from URL or service, to a service
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
	console.log('getFileFromUrl', srcPath, dstPath);
	var file = fs.createWriteStream(dstPath);
	http.get(srcPath, function(res) {
		console.log('Got response for '+srcPath+': ' + res.statusCode);
		res.pipe(file);
		cbk();
	}).on('error', function(e) {
		console.log('Error while loading '+srcPath+': ' + e.message);
		cbk({
        	code: 'Error while loading '+srcPath+': ' + e.message
        });
	});
}
/**
 * get file from a service, to a service
 */
exports.getFileFromService = function(req, res, next, srcPath, dstPath, cbk){
	console.log('getFileFromService', srcPath, dstPath);
    // split to be able to manipulate each folder
    var url_arr = srcPath.split('/');
    // remove the first empty '' from the path (first slash)
    url_arr.shift();
    // remove the 'api' path
    url_arr.shift();
    // remove the api version number
    url_arr.shift();
    console.log('User request:', url_arr);
   // get and remove the service name
    var serviceName = url_arr.shift();
    try{
        if (serviceName){
            var routed = router.route(serviceName, url_arr, req, res, next, function (response, status, data, mime_type, responseFilePath) {
            	console.log('router result', status);
            	if (data){
					var file = fs.createWriteStream(dstPath);
					file.write(data);
                	cbk();
            	}
            	else if (responseFilePath){
            		exports.cp(responseFilePath, dstPath, function (error) {
            			if (error){
				            cbk({
				            	code: 'Error for '+serviceName+ ': ' + error.code
				            });
            			}
            			else{
	                		cbk();
            			}
            		});
            	}
            	else{
	                console.error('no data for '+serviceName);
		            cbk({
		            	code: 'no data for '+serviceName
		            });
            	}
            });
            if (!routed){
                console.error('Unknown service '+serviceName);
	            cbk({
	            	code: 'Unknown service '+serviceName
	            });
            }
        }
        else{
            console.error('Unknown service '+serviceName);
            cbk({
            	code: 'Unknown service '+serviceName
            });
        }
    }
    catch(e){
        console.error('Error loading service '+serviceName+': '+e);
            cbk({
            	code: 'Error loading service '+serviceName+': '+e
            });
    }
}
exports.cp = function(srcPath, savPath, cbk) {
	fs.readFile(srcPath, function (err, data) {
        if (err) cbk(err);
        else {
	        fs.writeFile (savPath, data, function(err) {
		        if (err) cbk(err);
		        else cbk();
	        });
        }
    });
}
