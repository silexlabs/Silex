var services = {
	dropbox : require('../services/dropbox.js'), 
	gdrive : require('../services/gdrive.js'), 
	www : require('../services/www.js'), 
};

/**
 * init the service global vars
 */
exports.init = function (app, express) {
	for(var service in services){
		services[service].init(app, express);
	}
}

/**
 * sends the response to the browser
 * @param data 	the data to send to the client, wich can be either a file content or an object with this attribute
 * {
 *   "status": {"success": false/true, code: ...http code...}
 *   "data": ...
 * }
 */
function sendResponse (response, status, data, mime_type) {
	if (status && status.success==false){
		var code;
		if (status.code) code = status.code;
		else code = 500;

		console.error("error code "+code);
//		response.writeHead(code);
		response.statusCode = code;
	}
	// set mime type
	else if (mime_type){

		// mime type
		response.setHeader('Content-Type', mime_type);
	}
	response.send(data);
}
/**
 * routes the call to a given service with the given params
 */
exports.route = function (serviceName, url_arr, request, response, next) {

	// URL to list available services
	if (serviceName=='services'){
		var res = [];
		for(var serviceName in services){
			var service = services[serviceName];
			var info = service.getInfo(request);
			if (info && info.visible == true){
				res.push(info);
			}
		}
		sendResponse(response, {"success": true}, res);
		return true;
	}
	else{
		var service = services[serviceName];
		console.log("route service="+serviceName+", url_arr="+url_arr+", request="+request);
		if (service){
			if(url_arr.length > 0 && url_arr[0] != ""){
				switch (url_arr[0]){
					case "exec":
						if (url_arr.length > 2){
							// remove the "exec" from the path
							url_arr.shift(); 
							// retrieve command
							var command = url_arr[0];
							// remove the command from the path
							url_arr.shift();
							// retrieve the path
							var path = '/' + url_arr.join('/');//.replace('?', '/');
							// executes the command
							console.log("call exec service "+serviceName+", command "+command+", path "+path);
							return exec(service, command, path, request, response, next);
						}
						break;
					case "connect":
						service.connect(request, response, next, function  (status, authorize_url) {	
							sendResponse(response, status, {authorize_url:authorize_url});
						});
						return true;
					case "login":
						service.login(request, response, next, function  (status) {
							sendResponse(response, status, status);
						});
						return true;
					case "logout":
						service.logout(request, response, next, function  (status) {
							sendResponse(response, status, status);
						});
						return true;
					case "account":
						service.getAccountInfo(request, response, next, 
							function(status, reply){
								sendResponse(response, status, reply);
							})
						return true;
				}
				console.error("Unknown route "+url_arr[0]);
				return false;
			}
		}
	}
	return false;
}

function exec (service, command, path, request, response, next) {
	switch (command){
		case "ls":
			service.ls(path, 
				request, response, next, 
				function(status, reply){
					sendResponse(response, status, reply);
				});
			return true;
		case "rm":
			if (!path || path == "" || path == "/") break;
			service.rm(path, 
				request, response, next, 
				function(status){
					sendResponse(response, status, status);
				});
			return true;
		case "mkdir":
			service.mkdir(path, 
				request, response, next, 
				function(status, reply){
					sendResponse(response, status, reply);
				})
			return true;
		case "get":
			service.get(path, 
				request, response, next, 
				function(status, text_content, mime_type){
					if (text_content){
						sendResponse(response, status, text_content, mime_type);
					}
					else if (status){
						sendResponse(response, status, status);
					}
				})
			return true;
		case "put":
			// upload with file data in data
			if (request.files && request.files.data){
				if (request.files.data.path){
					// default name for the file = the uploaded file name
					if (path.charAt(path.length-1) == '/'){
						path += request.files.data.name;
					}
					// 1 file upload
					fs.readFile(request.files.data.path, function (err, data) {
						service.put(path, data, 
							request, response, next,  
							function(status, reply){
								sendResponse(response, status, reply);
							});
					});
				}
				else{
					// multiple files upload
					multipleUpload(path, request.files.data, service, request, response, next, function(status, uploadedFiles){
						sendResponse(response, status, uploadedFiles);
					});
				}
			}
			else{
				var data;
				// file data in POST
				if (request.body && request.body.data){
					data = request.body.data;
				}
				else{
					// file data in GET
					var path_arr = path.split(":");
					path = path_arr[0];
					data = path_arr[1];
					service.put(path, data, 
						request, response, next, 
						function(status, reply){
							sendResponse(response, status, reply);
						})
				}
			}
			return true;
		case "cp":
			var path_arr = path.split(":");
			var src = path_arr[0];
			var dest = path_arr[1];
			service.cp(src, dest, 
				request, response, next, 
				function(status, reply){
					sendResponse(response, status, reply);
				})
			return true;
		case "mv":
			var path_arr = path.split(":");
			var src = path_arr[0];
			var dest = path_arr[1];
			service.mv(src, dest, 
				request, response, next, 
				function(status, reply){
					sendResponse(response, status, reply);
				})
			return true;
	}
	sendResponse(response, {success:false, message:'Nothing here. Returns a list of routes.'}, 
		['ls', 'rm', 'mkdir', 'get', 'put', 'cp', 'mv']);
	return false;
}
function multipleUpload (dstPath, files, service, request, response, next, cbk, uploadedFiles, lastStatus) {
	if (uploadedFiles == null) uploadedFiles = [];
	if (lastStatus == null) lastStatus = {success: true};

	if (files.length > 0){
		var file = files.shift();
		fs.readFile(file.path, function (err, data) {
			console.log('uploading file to '+dstPath+file.name);
			service.put(dstPath+file.name, data, 
				request, response, next,
				function(status, reply){
					lastStatus = status;
					uploadedFiles.push({
						path:dstPath+file.name,
						status:status
					});
					if (status && status.success == true){
						multipleUpload(dstPath, files, service, request, response, next, cbk, uploadedFiles);
					}
					else{
						cbk(status, uploadedFiles);
						lastStatus = {success: true};
					}
				});
		});
	}
	else{
		cbk(lastStatus, uploadedFiles);
	}
}

