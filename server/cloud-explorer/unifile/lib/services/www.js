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
		user: request.session.www_user
	};
}

/**
 * init the service global vars
 */
exports.init = function (app, express) {
	exports.config  = require("../core/config-manager.js").getConfig("www");
	// form for local auth
	app.get(exports.config.auth_form_route, function(request, response, next){
		if (!exports.checkAuth("admin", "admin")){
			exports.config.auth_form_warning = ''; 
		}
		response.send(exports.config.auth_form_html + exports.config.auth_form_warning);
	});
	// callback url for local auth
	app.post(exports.config.auth_form_submit_route, function(request, response, next){
		console.log(request.param("username"));
		if (request.param("password") && request.param("username")
			&& exports.checkAuth(request.param("username"), request.param("password")) == true
			){
			request.session.www_user = {
				name: request.param("username")
			};
			response.send("<html><head></head><body>close this window please, and proceed to login</body></html>");
		}
		else{
			console.error("Wrong login or password");
			response.send("<html><head></head><body>Wrong login or password</body></html>");
		}
	});
}
exports.checkAuth = function(username, password){
	if(exports.config.users[username] && exports.config.users[username] === password){
		return true;
	}
	return false;
}
/**
 * @return true if the user is logged in (and connected)
 */
exports.isLoggedIn = function (request) {
	return request.session.www_user != undefined;
}
/**
 * @return true if the user is connected
 */
exports.isConnected = function (request) {
	return request.session.www_user != undefined;
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
	if (exports.isConnected(request)){
		console.log("yes");
		cbk(
			{success:true}, 
			undefined
		);
	}
	else{
		console.log("no");
		cbk(
			{success:true}, 
			exports.config.auth_form_route
		);
	}
}
/**
 * Login to the service, i.e. ask for an access token.
 * The access token is required to access the user data.
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.login = function (request, response, next, cbk) {
	if (exports.isLoggedIn(request)){
		cbk({success:true});
	}
	else{
		cbk({success:false, message: 'User not logged in'});
	}
}
/**
 * Logout from the service
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.logout = function (request, response, next, cbk) {
	if (request.session.www_user){
		request.session.www_user = undefined;
		cbk({success:true, message:"Now logged out."});
	}
	else{
		cbk({success:true, message:"Was not logged in."});
	}
}
exports.errNotLoggedIn = function (cbk) {
	cbk({
		success:false, 
		message:"User not connected yet. You need to call the 'login' service first.",
		code: 401
	});
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
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}
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
exports.ls = function (path, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	var resolvedPath = pathModule.resolve(__dirname, exports.config.root+path) + '/';
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
exports.rm = function (path, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	var resolvedPath = pathModule.resolve(__dirname, exports.config.root+path);
	fs.unlink(resolvedPath, function (err) {
		if (err){
			console.log(err);
			cbk({success:false, code:501, message: err});
		}
		else
			cbk({success:true});
	});
}
/**
 * create a folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.mkdir = function (path, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	cbk({success:false, code:501, message: 'not implemented yet'});
}
/** 
 * Create the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
 exports.cp = function (src, dst, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	cbk({success:false, code:501, message: 'not implemented yet'});
}
exports.mv = function (src, dst, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	cbk({success:false, code:501, message: 'not implemented yet'});
}
exports.put = function (path, data, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	var resolvedPath = pathModule.resolve(__dirname, exports.config.root+path);
	
	var file = fs.createWriteStream(resolvedPath);
	file.write(data);

	cbk({success:true});
}
exports.get = function (path, request, response, next, cbk) {
	if (!exports.isLoggedIn(request)){
		exports.errNotLoggedIn(cbk);
		return;
	}

	var resolvedPath = pathModule.resolve(__dirname, exports.config.root+path);
	response.sendfile(resolvedPath);
	cbk(undefined, undefined);
}
