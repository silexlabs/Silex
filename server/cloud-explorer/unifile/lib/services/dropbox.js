/**
 * Service connector for the dropbox api
 * 
 * Uses:
 * https://github.com/sintaxi/node-dbox
 * 
 */

// config

var config  = require("../core/config-manager.js").getConfig("dropbox");
var dbox  = require("dbox");
var pathModule = require('path');
//var dboxapp   = dbox.app({ "app_key": "svr5id53hug36a7", "app_secret": "mpbhr91louaqk6o" })
//var dboxapp   = dbox.app({"root" : "dropbox", "app_key": "rvz6kvs9394dx8a", "app_secret": "b0stxoj0zsxy14m" })

var dboxapp   = dbox.app({"root" : config.root, "app_key": config.app_key, "app_secret": config.app_secret })

/**
 * init the service global vars
 */
exports.init = function (app, express) {
}

/**
 * @return true if the user is logged in (and connected)
 */
exports.isLoggedIn = function (request) {
	return request.session.dropbox_access_token != undefined;
}
/**
 * @return true if the user is connected
 */
exports.isConnected = function (request) {
	return request.session.dropbox_request_token != undefined;
}

/**
 * info about this service
 * @return an object with these attributes: display_name, description, visible. These attributes determine the response to the request /v1.0/services/list/
 */
exports.getInfo = function (request) {
	return {
		display_name: 'Dropbox',
		name: 'dropbox', // det the root of the service
		description: 'This service let you use Dropbox cloud storage.',
		visible: true, // true if it should be listed in /v1.0/services/list/
		isLoggedIn: exports.isLoggedIn(request),
		isConnected: exports.isConnected(request),
		user: request.session.dropbox_account
	};
}
/**
 * Connect to the service, i.e. ask for a request token.
 * The request token is required so that the user can allow our app to access his data.
 * Regenerate an auth link each time in order to avoid the expiration 
 * Call the provided callback with these parameters
 *		status			: {"success": true},
 *		authorize_url	: "https://www.dropbox.com/1/oauth/authorize?oauth_token=NMCS862sIG1P5m6P"
 */
exports.connect = function (request, response, next, cbk) {
	exports.logout(request, response, next, function () {
		dboxapp.requesttoken(function(status, request_token){
			if (status!=200){
				cbk(
					{success:false}, 
					undefined
				);
			}
			else{
				request.session.dropbox_request_token = request_token;
				request.session.dropbox_authorize_url = request_token.authorize_url;
				cbk(
					{success:true}, 
					request_token.authorize_url
				);
			}
		});
	});
}
/**
 * Login to the service, i.e. ask for an access token.
 * The access token is required to access the user data.
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.login = function (request, response, next, cbk) {
	if (!request.session.dropbox_request_token){
		cbk({success:false, message:"Can not loggin, user not connected yet. You need to call the 'connect' service first."});
	}
	else{
		if (request.session.dropbox_access_token){
			cbk({success:true, message:"Was allready logged in."});
		}
		else dboxapp.accesstoken(request.session.dropbox_request_token, function(status, access_token){
			if (status!=200){
				cbk(
					{success:false}
				);
			}
			else{
				request.session.dropbox_access_token = access_token;
				cbk({success:true});
			}
		})
	}
}
/**
 * Logout from the service
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.logout = function (request, response, next, cbk) {
	if (request.session.dropbox_request_token 
		|| request.session.dropbox_access_token
	){
		request.session.dropbox_request_token = undefined;
		request.session.dropbox_access_token = undefined;
		cbk({success:true, message:"Now logged out."});
	}
	else{
		cbk({success:true, message:"Was not logged in."});
	}
}
/**
 * This is an internal method used to load a client object, which has several usefull methods
 */
exports.getClient = function (request) {
	if (!request.session.dropbox_access_token){
		console.error("No access token here, this is going to crash..");
		return undefined;
	}
	else{
		var client = dboxapp.client(request.session.dropbox_access_token);
		return client;
	}
}
/**
 * Load the data associated with the current user account
 * Call the provided callback with this data
 *		status		: {"success": true},
 *		data 		{
 * 						display_name: "Alexandre Hoyau",
 * 						quota_info: {
 * 						available: 5368709120,
 * 						used: 144201723
 * 					}
 */
exports.getAccountInfo = function (request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).account(function(status, reply){
			if (reply){
				request.session.dropbox_account = {
						"display_name": reply.display_name,
						"quota_info": {
							"available": reply.quota_info.quota,
							"used": reply.quota_info.normal + reply.quota_info.shared
						}
					};
				cbk({"success": true}, request.session.dropbox_account);
			}
			else{
				cbk({success:false, code:401, message:"Server could not connect to dropbox."});
			}
		});
	}
}


// ******* commands

/**
 * List the files of a given folder
 * @result 	an object like this one:
 * {
 *   "status": {
 *     "success": true
 *   },
 *   "data": [
 *     {
 *       "bytes": 0,
 *       "modified": "Thu, 03 Jan 2013 14:24:53 +0000",
 *       "title": "name",
 *       "is_dir": true,
 *     },
 *     
 *     ...
 *   ]
 * }
 * 
 */
exports.ls = function (path, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		console.log("ls", path)
		exports.getClient(request).readdir(path, {
			details: true,
			recursive: false
		}, 
		function(status, reply){

			if (status!=200){
				cbk(
					{success:false, code: status}, 
					undefined
				);
			}
			else{
				cbk({success:true}, toFilesArray(reply));
			}
		})
	}
}
/**
 * Convert the result from dropbox api to an array of files
 * This is an internal method
 * @result 	an array of objects like this one:
 * 	[
 *     {
 *       "bytes": 0,
 *       "modified": "Thu, 03 Jan 2013 14:24:53 +0000",
 *       "title": "name",
 *       "is_dir": true,
 *     },
 *     
 *     ...
 *   ]
 */
function toFilesArray (apiFiles) {
	var files = [];
	for (var idx = 0; idx<apiFiles.length; idx++){
		var fileName = apiFiles[idx].path.substr(apiFiles[idx].path.lastIndexOf("/") + 1);
		files.push({
			name: fileName,
			bytes : apiFiles[idx].bytes,
			modified : apiFiles[idx].modified,
			is_dir : apiFiles[idx].is_dir,
		});
	}
	return files;
}

/**
 * delete a file or folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.rm = function (path, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).rm(path, function(status, reply){
			if (status!=200){
				cbk(
					{success:false}
				);
			}
			else{
				cbk({success:true});
			}
		})
	}
}
/**
 * Create a folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.mkdir = function (path, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).mkdir(path, function(status, reply){
			if (status!=200){
				cbk(
					{success:false}, 
					undefined
				);
			}
			else{
				cbk({success:true}, reply);
			}
		})
	}
}
/** 
 * Copy the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
 exports.cp = function (src, dst, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).cp(src, dst, function(status, reply){
			if (reply.error)
				cbk({success:false}, reply);
			else
				cbk({success:true}, reply);
		})
	}
}
/** 
 * Move or rename a file or folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.mv = function (src, dst, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).mv(src, dst, function(status, reply){
			if (reply.error)
				cbk({success:false});
			else
				cbk({success:true});
		})
	}
}
/** 
 * Create the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.put = function (path, data, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).put(path, data, function(status, reply){
			if (reply.error)
				cbk({success:false});
			else
				cbk({success:true});
		})
	}
}
/** 
 * Get the give file, output its content
 * @return	the content of the file if there is no error
 * @return	an object with this attribute
 * {
 *   "status": {"success": false}
 * }
 */
exports.get = function (path, request, response, next, cbk) {
	if (!request.session.dropbox_access_token){
		cbk({success:false, code:401, message:"User not logged in yet. You need to call the 'login' service first."});
	}
	else{
		exports.getClient(request).get(path, function(status, reply, metadata){
			if (status != 200){
				cbk({success:false, code: status, message:reply.toString()});
			}else{
				cbk({success:true}, reply, metadata.mime_type);
			}
		})
	}
}
