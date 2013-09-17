
// check https://developers.google.com/drive/quickstart-js

/**
 * Service connector for the google drive api
 * 
 * Uses:
 * https://github.com/google/google-api-nodejs-client
 * 
 * the app must be decalred in https://code.google.com/apis/console/
 * and have a callback url set to [node server url]/gdrive/auth_callback/
 */

// config
var config  = require("../core/config-manager.js").getConfig("gdrive");

var https  = require('https');
//var http  = require('follow-redirects').http;
var url  = require("url");

// init googleappis 
var googleapis = require('googleapis');
var OAuth= require('oauth').OAuth;
var googleapis = require('googleapis'),
    OAuth2Client = googleapis.OAuth2Client;
var oauth2Client =
    new OAuth2Client(config.client_id, config.client_secret, config.redirect_uris[0]);

/**
 * info about this service
 * @return an object with these attributes: display_name, description, visible. These attributes determine the response to the request /v1.0/services/list/
 */
exports.getInfo = function (request) {
	return {
		display_name: 'Google Drive',
		name: 'gdrive', // det the root of the service
		description: 'This service let you use google drive cloud storage.',
		visible: true, // true if it should be listed in /v1.0/services/list/
		isLoggedIn: exports.isLoggedIn(request),
		isConnected: exports.isConnected(request),
		user: request.session.gdrive_account
	};
}

/**
 * init the service global vars
 */
exports.init = function (app, express) {
	// callback url from google
	app.get(config.auth_url_callback, function(request, response, next){
		var url = require('url');
		var url_parts = url.parse(request.url, true);
		var query = url_parts.query;
		if (request.query.code){
			request.session.gdrive_request_token = request.query.code;
			response.send("<html><head></head><body>close this window please, and proceed to login</body></html>");
		}
		else{
			console.error("An error occured, no code from google");
			response.send("<html><head></head><body>An error occured, no code from google</body></html>");
		}
	});
}
/**
 * @return true if the user is logged in (and connected)
 */
exports.isLoggedIn = function (request) {
	return request.session.gdrive_token != undefined;
}
/**
 * @return true if the user is connected
 */
exports.isConnected = function (request) {
	return request.session.gdrive_request_token != undefined;
}

/**
 * Connect to the service, i.e. ask for a request token.
 * The request token is required so that the user can allow our app to access his data.
 * Call the provided callback with these parameters
 *		status			: {"success": true},
 *		authorize_url	: "https://www.dropbox.com/1/oauth/authorize?oauth_token=NMCS862sIG1P5m6P"
 */
exports.connect = function (request, response, next, cbk) {

// generates a url allows offline access and asks permissions
	exports.logout(request, response, next, function () {
		var url = oauth2Client.generateAuthUrl({
		  access_type: config.app_access_type,
		  scope: config.app_scope
		});
		cbk({success:true}, url);
	});
}

/**
 * Login to the service, i.e. ask for an access token.
 * The access token is required to access the user data.
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.login = function (request, response, next, cbk) {
	if (!request.session.gdrive_request_token){
		console.error("Can not loggin, user not connected yet. You need to call the 'connect' service first.");
		cbk({
			success:false, 
			message:"Can not loggin, user not connected yet. You need to call the 'connect' service first.", 
			code:401
		});
	}
	else{
		if (request.session.gdrive_account){
			// get the account info, in order to have an easy access to rootFolderId
			oauth2Client.credentials = request.session.gdrive_token;
			getAccount(request, response, next, function (status, data) {
				if (!status)
				{
					request.session.gdrive_account = 
					{
						name : data.name,
						user : data.user,
						quotaBytesTotal : data.quotaBytesTotal,
						quotaBytesUsed : data.quotaBytesUsed,
						quotaBytesUsedAggregate : data.quotaBytesUsedAggregate,
						quotaBytesUsedInTrash : data.quotaBytesUsedInTrash,
						rootFolderId : data.rootFolderId,
					};
					cbk({success:true});
				}else{
					cbk({success:false, message:status});
				}
			});
		}
		else oauth2Client.getToken(request.session.gdrive_request_token, function(err, tokens) {
			  // contains an access_token and optionally a refresh_token.
			  // save them permanently.
			if (!err){
				request.session.gdrive_token = tokens;
				
				// get the account info, in order to have an easy access to rootFolderId
				oauth2Client.credentials = request.session.gdrive_token;
				getAccount(request, response, next, function (status, data) {
					if (!status)
					{
						request.session.gdrive_account = 
						{
							name : data.name,
							user : data.user,
							quotaBytesTotal : data.quotaBytesTotal,
							quotaBytesUsed : data.quotaBytesUsed,
							quotaBytesUsedAggregate : data.quotaBytesUsedAggregate,
							quotaBytesUsedInTrash : data.quotaBytesUsedInTrash,
							rootFolderId : data.rootFolderId,
						};
						cbk({success:true});
					}else{
						cbk({success:false, message:status});
					}
				});
			}else{
				cbk({success:false, message:err});
			}
		});
	}
}
/**
 * Logout from the service
 * Call the provided callback with this data
 *		status		: {"success": true},
 */
exports.logout = function (request, response, next, cbk) {
	if (request.session.gdrive_request_token 
		|| request.session.gdrive_token
		|| request.session.gdrive_account
	){
		request.session.gdrive_request_token = undefined;
		request.session.gdrive_token = undefined;
		request.session.gdrive_account = undefined;
		cbk({success:true, message:"Now logged out."});
	}
	else{
		cbk({success:true, message:"Was not logged in."});
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
	if (!request.session.gdrive_account){
		cbk({
			success:false, 
			message:"User not connected yet. You need to call the 'login' service first.",
			code: 401
		});
	}
	else{
//		getAccount(request, response, next, function (resp) {
			var resp = request.session.gdrive_account;
			cbk({"success": true},
		    	{
					"display_name": resp.user.displayName,
					"quota_info": {
						"available": parseInt(resp.quotaBytesTotal),
						"used": parseInt(resp.quotaBytesUsed)
					},
		    	});
//		});
	}
}
/**
 * Send a "not logged in" error response
 * This is an internal method
 */
function notLoggedIn (cbk) {
	cbk({
		success:false, 
		message:"User not logged in yet. You need to call the 'login' service first.",
		code: 401
	});
}
/**
 * Retrive the info about the user account
 * This is an internal method
 * @result 	an object like this one:
 * {
 *   "status": {
 *     "success": true
 *   },
 *   "data": {
 *     "display_name": "Alexandre Hoyau",
 *     "quota_info": {
 *       "available": "5368709120",
 *       "used": "144208896"
 *     }
 *  }
 * }
 * 
 */
function getAccount (request, response, next, cbk) {
	oauth2Client.credentials = request.session.gdrive_token;

	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}

		client
		.drive.about.get()
		.withAuthClient(oauth2Client)
		.execute(function (status, resp, c) {
	    	cbk(status, resp);
		});
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
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		// det the search querry
		path_arr = path.split("/");
		search_params = {};
		if (path_arr.length>2){
			// remove the first empty item
			path_arr.shift();
			// remove the last empty item
			if (path_arr[path_arr.length-1]=="") path_arr.pop();

			// path of the file
			//search_params["q"] = "title = '"+path_arr.join("/")+"'";
			// yes : search_params["q"] = "title = '"+path_arr[path_arr.length-1]+"'";
			//search_params["q"] = "'"+path_arr[path_arr.length-1]+"' in parents";

			search_folder_recursive(path_arr, null, request, response, next, function (folder, err) {
				if (folder){
					listFiles(folder.id, request, response, next, cbk);
				}
				else{
					console.error("Error: "+err);
					cbk ({success:false, code:err});
				}
			});
		}
		else{
			listFiles(request.session.gdrive_account.rootFolderId, request, response, next, cbk);
		}
	}
}
/**
 * List the files of the given folder
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
 function listFiles (folder_id, request, response, next, cbk) {
	oauth2Client.credentials = request.session.gdrive_token;
	var search_params = {};
	if (folder_id)
		search_params.q = "'"+folder_id+"' in parents";
	else
		search_params.q = "'"+request.session.gdrive_account.rootFolderId+"' in parents";

	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}

		client
		.drive.files.list(search_params)
		.withAuthClient(oauth2Client)
		.execute(function (err, result, c) {

			if(result && result.items){				
		    	cbk ({success:true}, toFilesArray(result));
			}
			else{
				var errCode = 404;
				if (err && err.code){
					errCode = err.code;
				}
		    	cbk ({success:false, code:errCode});
		    }
		});
	});		
}
/**
 * Convert the result from gdrive api to an array of files
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
	for (var idx = 0; idx<apiFiles.items.length; idx++){
		files.push({
			name: apiFiles.items[idx].title,
			bytes : parseInt(apiFiles.items[idx].quotaBytesUsed),
			modified : apiFiles.items[idx].modifiedDate,
			is_dir : (apiFiles.items[idx].mimeType=="application/vnd.google-apps.folder"),
		});
	}
	return files;
}
/**
 * Recursive function which let us get the ids of each folder in the desired path
 * This is an internal method
 * @return	a folder object from gdrive api
 */
 function search_folder_recursive(path_arr, parent_id, request, response, next, cbk) {
	search_folder(path_arr.shift(), parent_id, request, response, next, function (folder) {
		if (folder){
			if(path_arr.length>0){
				search_folder_recursive(path_arr, folder.id, request, response, next, cbk);
			}
			else cbk(folder);
		}
		else cbk(undefined, 404);
	});
}
/**
 * Get the id of the folder with the given parent and name
 * This is an internal method
 * @return	a folder object from gdrive api
 */
function search_folder(title, parent_id, request, response, next, cbk) {
	var search_param = {q:"title='"+title+"'"};
	if (parent_id)
		search_param.q += " and '"+parent_id+"' in parents";
	else
		search_param.q += " and '"+request.session.gdrive_account.rootFolderId+"' in parents";

	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}

		client
		.drive.files.list(search_param)
		.withAuthClient(oauth2Client)
		.execute(function (err, result, c) {

			if(result && result.items && result.items.length>0){		
		    	cbk (result.items[0]);
			}
			else{
				console.error("Error: could not find the folder named "+title);
				console.dir(err);
				cbk(undefined, err);
			}
		});
	});
}

/**
 * delete a file or folder
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.rm = function (path, request, response, next, cbk) {
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		// det the search querry
		path_arr = path.split("/");
		search_params = {};
		if (path_arr.length>2){
			// remove the first empty item
			path_arr.shift();
			// remove the last empty item
			if (path_arr[path_arr.length-1]=="") path_arr.pop();
			// get the last item and assume it is the file to delete

			search_folder_recursive(path_arr, null, request, response, next, function (file, err) {
				if (file){
					deleteFile(file, request, response, next, cbk);
				}
				else{
					var errCode = null;
					if (err && err.code){
						errCode = err.code;
					}
			    	cbk ({success:false, code:errCode});
				}
			});
		}
	}
}
/** 
 * Delete the give file
 */
function deleteFile (file, request, response, next, cbk) {
	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}
		try{
			client
			.drive.files.delete({"fileId":file.id})
			.withAuthClient(oauth2Client)
			.execute(function (a, b, c) {
				console.warn("File deleted "+file.title);
				cbk ({success:true});
			});
		}
		catch(err){
			console.error("Error while deleting file "+file.title+". Error: "+err);
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}else{
				errCode = err;				
			}
	    	cbk ({success:false, code:errCode});
		}
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
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		// det the search querry
		path_arr = path.split("/");
		search_params = {};
		if (path_arr.length>1){
			// remove the first empty item
			path_arr.shift();
			// remove the last empty item
			if (path_arr[path_arr.length-1]=="") path_arr.pop();
			// get the last item and assume it is the name of the folder to create
			var folder_name = path_arr.pop();

			// find the folder parent
			search_folder_recursive(path_arr, null, request, response, next, function (parent_folder, err) {
				if (parent_folder){
					// create the folder object
					var folder = new Object();
					folder.title = folder_name;
					folder.parents = [{"id":parent_folder.id}];
					folder.mimeType = "application/vnd.google-apps.folder";

					// create the empty folder
					createFile(parent_folder, folder, undefined, request, response, next, cbk);
				}
				else{
					var errCode = null;
					if (err && err.code){
						errCode = err.code;
					}else{
						errCode = err;				
					}
			    	cbk ({success:false, code:errCode});
				}
			});
		}
	}
}
/** 
 * Create the give file
 */
function createFile (parent_folder, file, data, request, response, next, cbk) {

	var dataObj ={};
	if (data) dataObj.data = data;

	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}
		try{
			client
			.drive.files.insert({'resource': file}, dataObj)
			.withAuthClient(oauth2Client)
			.execute(function (a, file_data, c) {
				console.warn("File created "+file_data.title);
				cbk ({success:true});
			});
		}
		catch(err){
			console.error("Error while deleting file "+file.title+". Error: "+err);
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}else{
				errCode = err;				
			}
	    	cbk ({success:false, code:errCode});
		}
	});
}
/** 
 * Create the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.cp = function (src, dst, request, response, next, cbk) {
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		moveOrCopyFile (src, dst, false, request, response, next, cbk);
	}
}
/** 
 * Move or rename the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.mv = function (src, dst, request, response, next, cbk) {
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		moveOrCopyFile (src, dst, true, request, response, next, cbk);
	}
}

/**
 * Internal method used to copy, move, rename files and folders
 */
function moveOrCopyFile (src, dst, remove_original, request, response, next, cbk) {
	// det the search querry
	var src_path_arr = src.split("/");
	var dst_path_arr = dst.split("/");

	search_params = {};
	if (src_path_arr.length>1 && dst_path_arr.length>1){
		// remove the first empty item
		src_path_arr.shift();
		// remove the last empty item
		if (src_path_arr[src_path_arr.length-1]=="") src_path_arr.pop();

		// remove the first empty item
		dst_path_arr.shift();
		// remove the last empty item
		if (dst_path_arr[dst_path_arr.length-1]=="") dst_path_arr.pop();
		// get the last item and assume it is the name of the folder to create
		var dst_file_name = dst_path_arr.pop();

		// find the parent folder
		search_folder_recursive(src_path_arr, null, request, response, next, function (src_file, err) {
			if (src_file){
				search_folder_recursive(dst_path_arr, null, request, response, next, function (dst_parent_folder, err) {
					if (dst_parent_folder){
						// create the file object
						var dst_file = new Object();
						dst_file.title = dst_file_name;
						dst_file.parents = [{"id":dst_parent_folder.id}];

						// do the copy or move
						if (remove_original==true)
							moveFile(src_file, dst_file, request, response, next, cbk);
						else
							copyFile(src_file, dst_file, request, response, next, cbk);
					}
					else{
						var errCode = null;
						if (err && err.code){
							errCode = err.code;
						}else{
							errCode = err;				
						}
				    	cbk ({success:false, code:errCode});
					}
				});
			}
			else{
				var errCode = null;
				if (err && err.code){
					errCode = err.code;
				}else{
					errCode = err;				
				}
		    	cbk ({success:false, code:errCode});
			}
		});
	}
}
/** 
 * Copy the give file
 */
function copyFile (src_file, dst_file_data, request, response, next, cbk) {

	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}
		try{
			client
			.drive.files.copy({'fileId': src_file.id, 'resource': dst_file_data})
			.withAuthClient(oauth2Client)
			.execute(function (a, file_data, c) {
				console.warn("File copyed ");
				cbk ({success:true});
			});
		}
		catch(err){
			console.error("Error while deleting file "+src_file.title+". Error: "+err);
			var errCode = null;
			if (err && err.code){
				errCode = err.code;
			}else{
				errCode = err;				
			}
	    	cbk ({success:false, code:errCode});
		}
	});
}
/** 
 * Move or rename the give file
 */
function moveFile (src_file, dst_file_data, request, response, next, cbk) {

	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}
		try{
			client
			.drive.files.update({'fileId': src_file.id, 'resource': dst_file_data})
			.withAuthClient(oauth2Client)
			.execute(function (a, file_data, c) {
				console.warn("File moved ");
				cbk ({success:true});
			});
		}
		catch(err){
			console.error("Error while deleting file "+src_file.title+". Error: "+err);
			var errCode = null;
			if (err && err.code){
				errCode = err.code;
			}else{
				errCode = err;				
			}
	    	cbk ({success:false, code:errCode});
		}
	});
}
/** 
 * Create the give file
 * @return	an object with this attribute
 * {
 *   "status": {"success": true}
 * }
 */
exports.put = function (path, data, request, response, next, cbk) {
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		// det the search querry
		path_arr = path.split("/");
		search_params = {};
		if (path_arr.length>1){
			// remove the first empty item
			path_arr.shift();
			// remove the last empty item
			if (path_arr[path_arr.length-1]=="") path_arr.pop();
			// get the last item and assume it is the name of the folder to create
			var folder_name = path_arr.pop();

			// find the folder parent
			search_folder_recursive(path_arr, null, request, response, next, function (parent_folder, err) {
				if (parent_folder){
					// create the file object
					var dst_file = new Object();
					dst_file.title = dst_file_name;
					dst_file.parents = [{"id":dst_parent_folder.id}];

					// create the empty file
					createFile(parent_folder, file, data, request, response, next, cbk);
				}
				else{
					var errCode = null;
					if (err && err.code){
						errCode = err.code;
					}else{
						errCode = err;				
					}
			    	cbk ({success:false, code:errCode});
				}
			});
		}
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
	if (!request.session.gdrive_token){
		notLoggedIn(cbk);
	}
	else{
		// det the search querry
		path_arr = path.split("/");
		search_params = {};
		if (path_arr.length>2){
			// remove the first empty item
			path_arr.shift();
			// remove the last empty item
			if (path_arr[path_arr.length-1]=="") path_arr.pop();

			search_folder_recursive(path_arr, null, request, response, next, function (file, err) {
				if (file){
					getFile(file, request, response, next, cbk);
				}
				else{
					console.error("file not found "+err)
					cbk ({success:false, code:404});
				}
			});
		}
		else{
			listFiles(request.session.gdrive_account.rootFolderId, request, response, next, cbk);
		}
	}
}
function getFile (file, request, response, next, cbk) {
	oauth2Client.credentials = request.session.gdrive_token;
	googleapis
	.discover('drive', 'v2')
	.execute(function(err, client) {
		if (err){
			var errCode = null;
			if (err.code){
				errCode = err.code;
			}
	    	cbk ({success:false, code:errCode});
			return;
		}
		try{

			downloadFile(file, request.session.gdrive_token.access_token, function (data) {
				if(data){
					cbk({success:true}, data, file.mimeType);
				}
				else{
					cbk ({success:false});
				}
			});
		}
		catch(err){
			console.error("Error while searching for file "+file.title+". Error: "+err);
			var errCode = null;
			if (err && err.code){
				errCode = err.code;
			}else{
				errCode = err;				
			}
	    	cbk ({success:false, code:errCode});
		}
	});
}
/**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
function downloadFile(file, accessToken, callback) {
  if (file.downloadUrl) {
		var urlData = url.parse(file.downloadUrl);
		var options = {
		  host: urlData.hostname,
		  path: urlData.path,
		  headers: {
		    Authorization: 'Bearer '+accessToken,
		  }
		};

		https.get(options, function(resp){
			resp.setEncoding('binary');
			var store = '';
			//var buffer = new Buffer(32);
			resp.on('data', function(data){
				store += data;
				//buffer.write(data, buffer.length);
			});
			resp.on('end', function(){
				callback(store);
				//cbk({success:true}, buffer, file.mimeType);
			});
		}).on("error", function(e){
			console.error("Got error: " + e.message);
			console.dir(e);
			callback(null);
		});
	}

}