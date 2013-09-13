/**
 * Service connector for the local drive
 * This only serves files as a webserver for now
 */

// useful modules
pathModule = require('path');
fs = require('fs');

/**
 * info about this service
 * @return an object with these attributes: display_name, name, description, visible. These attributes determine the response to the request /v1.0/services/list/
 */
exports.getInfo = function (request) {
	return {
		display_name: 'Web server',
		name: 'www', // det the root of the service
		description: 'This service acts as a local web server',
		visible: true, // true if it should be listed in /v1.0/services/list/
		isLoggedIn: exports.isLoggedIn(request),
		isConnected: exports.isConnected(request),
		user: 'not implemented'
	};
}

/**
 * init the service global vars
 */
exports.init = function (app, express) {
}

/**
 * @return true if the user is logged in (and connected)
 */
exports.isLoggedIn = function (request) {
	return true;
}
/**
 * @return true if the user is connected
 */
exports.isConnected = function (request) {
	return true;
}

/**
 * Connect to the service, i.e. ask for a request token.
 * The request token is required so that the user can allow our app to access his data.
 * Regenerate an auth link each time in order to avoid the expiration 
 * Call the provided callback with these parameters
 *		status			: {"success": true},
 *		authorize_url	: "https://www.dropbox.com/1/oauth/authorize?oauth_token=NMCS862sIG1P5m6P"
 */
exports.connect = function (request, cbk) {
	cbk(
		{success:true}, 
		undefined
	);
}
/**
 * Login to the service, i.e. ask for an access token.
 * The access token is required to access the user data.
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.login = function (request, cbk) {
	cbk({success:true});
}
/**
 * Logout from the service
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.logout = function (request, cbk) {
	cbk({success:true});
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
exports.getAccountInfo = function (request, cbk) {
	cbk({"success": true},
	{
		"display_name": "server storage",
   	});
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
exports.ls = function (path, request, cbk) {
	var resolvedPath = pathModule.resolve(__dirname, "../../www"+path) + '/';
	console.log()
	try{
		var filesArray = fs.readdirSync(resolvedPath);
		var filesData = [];
		for(idx=0; idx<filesArray.length; idx++){
			var file = fs.statSync(resolvedPath+filesArray[idx]);
			//console.dir(file);
			filesData.push({
				bytes: file.size,
				modified: file.mtime,
				name: filesArray[idx],
				is_dir: file.isDirectory(),
			});
		}
		cbk({success:true}, filesData);
	}catch(e){
		console.error(e);
		cbk({success:false, message: e});
	}
}
/**
 * delete a file or folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.rm = function (path, request, cbk) {
	cbk({success:false, code:501, message: 'not implemented yet'});
}
/**
 * create a folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.mkdir = function (path, request, cbk) {
	cbk({success:false, code:501, message: 'not implemented yet'});
}
/** 
 * Create the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
 exports.cp = function (src, dst, request, cbk) {
	cbk({success:false, code:501, message: 'not implemented yet'});
}
exports.mv = function (src, dst, request, cbk) {
	cbk({success:false, code:501, message: 'not implemented yet'});
}
exports.put = function (path, data, request, cbk) {
	var resolvedPath = pathModule.resolve(__dirname, "../../www"+path);
	
	var file = fs.createWriteStream(resolvedPath);
	file.write(data);

	cbk({success:true});
}
exports.get = function (path, request, response, cbk) {
	var resolvedPath = pathModule.resolve(__dirname, "../../www"+path);
	response.sendfile(resolvedPath);
	cbk(undefined, undefined);
}
