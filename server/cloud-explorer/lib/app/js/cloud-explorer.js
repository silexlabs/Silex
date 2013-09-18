'use strict';

/**
 * Front-end component for the unifile node.js server
 * @see https://github.com/silexlabs/unifile
 * @author Thomas Fétiveau, http://www.tokom.fr/  &  Alexandre Hoyau, http://www.intermedia-paris.fr/
 * Copyrights SilexLabs 2013 - http://www.silexlabs.org/ -
 * License MIT
 */

/**
 * TODO
 * manage cases when moving/pasting files where other files with same name exists...
 * unselect files when clicked somewhere else ?
 * fix # anchor part in url should not appear (since angular 1.1.4)
 * create alert/error system with focus on inputs for faulty uses (like: rename file to a invalid name, ...)
 * console messages + display
 * bootstrap styling
 * move between services [need fix in unifile]
 * drag from CE to desktop
 * upload progress
 * selectable items should allow mass moving by drag n drop ?
 * download link won't propose to save file in Firefox 20 if not same origin, we could force download from server side [unifile]
 */

/**
 * TODO create a "factory", a prototype ?
 * 
 * CEBlob.url
 * The most critical part of the file, the url points to where the file is stored and acts as a sort of "file path". 
 * The url is what is used when making the underlying GET and POST calls to Ink when you do a filepicker.read or filepicker.write call.
 * 
 * CEBlob.filename
 * The name of the file, if available
 * 
 * CEBlob.mimetype
 * The mimetype of the file, if available.
 * 
 * CEBlob.size
 * The size of the file in bytes, if available. We will attach this directly to the InkBlob when we have it, otherwise you can always get the size by calling filepicker.stat
 * 
 * CEBlob.isWriteable
 * This flag specifies whether the underlying file is writeable. In most cases this will be true, but if a user uploads a photo from facebook, 
 * for instance, the original file cannot be written to. In these cases, you should use the filepicker.exportFile call as a way to give the user the ability to save their content.
 */

////////////
// Internals
////////////

var ceInstance = null;
/**
 * out 	onSuccess
 * in 	mode
 */
var __ceInstance = {};

var ONE_FILE_SEL_MODE = 1; // select one file only
var ONE_FILE_SAVE_MODE = 2; // write or overwrite one file only

function openCE()
{
	if (ceInstance == null)
	{
		ceInstance = document.getElementById("CE");
		for (var ci in ceInstance.children)
		{
			if (ceInstance.children[ci].tagName == "BUTTON")
			{
				ceInstance.children[ci].addEventListener( "click", function() { ceInstance.style.display = "none"; }, false );
			}
		}
	}
	else
	{
		__ceInstance["refresh"]();
	}
	if (ceInstance.style.display != "block")
	{
		ceInstance.style.display = "block";
	}
}
function closeCE()
{
	ceInstance.style.display = "none";
}
/**
 * TODO match method signature: pick([options], onSuccess(InkBlob){}, onError(FPError){})
 * TODO manage onError
 * TODO manage file upload
 * TODO return CEBlob
 */
function ce_pick(onSuccess, onError) {
	__ceInstance["mode"] = ONE_FILE_SEL_MODE;
	__ceInstance["onSuccess"] = function(data) {
		closeCE();
		onSuccess(data);
	}
	openCE();
}
/**
 * TODO match method signature: ce_exportFile(input, [options], onSuccess, onError, onProgress)
 * When does Alex use it ? use store() first ?
 * signature: ce_exportFile(input, [options], onSuccess, onError)
 */
function ce_exportFile()
{
	if (arguments.length == 0)
	{
		throw "Incorrect number of arguments in call to exportFile. Method signature is: exportFile(input, [options], onSuccess, onError) ";
	}
	__ceInstance["mode"] = ONE_FILE_SAVE_MODE;
	__ceInstance["input"] = arguments[0];
	__ceInstance["options"] = (arguments.length >=2 && typeof(arguments[1]) != 'function') ? arguments[1] : null;
	var sc = null;
	if (arguments.length >= 2 && typeof(arguments[1]) == 'function')
	{
		sc = arguments[1];
	}
	else if (arguments.length >= 3)
	{
		sc = arguments[2];
	}
	__ceInstance["onSuccess"] = function(data) {
		closeCE();
		if (sc != null)
		{
			sc(data);
		}
	}
	// TODO onError
	openCE();
}
/**
 * TODO ce_read(input, [options], onSuccess, onError, onProgress)
 * @param 
 */
function ce_read(input, onSuccess, onError) {
	__ceInstance.read(input, onSuccess);
}
/**
 * TODO match method signature: ce_write(target, data, [options], onSuccess, onError, onProgress)
 * TODO support "CEBlob, a DOM File Object, or an <input type="file"/>" as data
 * 
 * @param target An CEBlob pointing to the file you'd like to write to.
 * @param data The data to write to the target file, or an object that holds the data. Can be raw data, an CEBlob, a DOM File Object, or an <input type="file"/>.
 * @param onSuccess The function to call if the write is successful. We'll return an CEBlob as a JSON object.
 */
function ce_write(target, data, onSuccess, onError) {
	__ceInstance.write(target, data, onSuccess);
}


//////////////
// Exposed API
//////////////

var cloudExplorer = {};
cloudExplorer.pick = ce_pick;
cloudExplorer.exportFile = ce_exportFile;
cloudExplorer.read = ce_read;
cloudExplorer.write = ce_write;


////////
// UTILS
////////

function getExtByMimeType( mt )
{
console.log('getExtByMimeType '+mt);
	switch (mt.toLowerCase())
	{
		case 'image/png':
			return 'png';
		case 'image/jpeg':
			return 'jpg';
		case 'text/html':
			return 'html';
		default:
			throw 'Unknown MIME Type: '+mt;
	}
}
function getMimeByExt( ext )
{
console.log('getMimeByExt '+ext);
	switch ( ext.toLowerCase() )
	{
		case 'png':
			return 'image/png';
		case 'jpg':
			return 'image/jpeg';
		case 'html':
			return 'text/html';
		default:
			return null;
	}
}
/* MD lexoyo, use this to have an absolute path to the server
function getBase() {
	console.log(window.location, window.location.origin.replace(':', '\\:') +'/')
	return window.location.origin.replace(':', '\\:') +'/';
}
*/
/////////////////////////
// AngularJS CE component
/////////////////////////

/* Config */
angular.module('ceConf', [])

	.constant( 'server.url', '../api/v1.0/' )
	//.constant( 'server.url', 'http://unifile.silexlabs.org/api/v1.0/' )

	.constant( 'server.url.unescaped', '../api/v1.0/' ) // Need to get rid of this as soon as we use an angular version that is not buggy on this
	//.constant( 'server.url.unescaped', 'http://unifile.silexlabs.org/api/v1.0/' ) // Need to get rid of this as soon as we use an angular version that is not buggy on this

	.constant( 'console.level', 0 ) // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NOTHING (no console)

	.config(['$httpProvider', function($httpProvider)
	{
		delete $httpProvider.defaults.headers.common["X-Requested-With"];
		$httpProvider.defaults.useXDomain = true;
		$httpProvider.defaults.withCredentials = true;
	}]);


/* Services */
angular.module('ceServices', ['ngResource', 'ceConf'])

	.factory('$ceConsoleSrv', [ '$rootScope', 'console.level', function( $rootScope, level )
	{
		return { 
			"log": function( msg, l ) { if ( l >= level ) $rootScope.$emit("log", msg, l); }
		};
	}])

	.factory('$unifileStub', ['$resource', 'server.url', function( $resource, serverUrl )
	{
		//return $resource(CEConfig.serverUrl+':service/:method/:command/?:path/', {}, {  // workaround: "?" is to keep a "/" at the end of the URL
		return $resource( serverUrl + ':service/:method/:command/:path ', {},
			{  // *very ugly* FIXME added space to keep the '/' at the end of the url
				listServices: {method:'GET', params:{service:'services', method:'list'}, isArray:true},
				connect: {method:'GET', params:{method:'connect'}, isArray:false},
				login: {method:'GET', params:{method:'login'}, isArray:false},
				ls: {method:'GET', params:{method:'exec', command:'ls'}, isArray:true},
				rm: {method:'GET', params:{method:'exec', command:'rm'}, isArray:false},
				mkdir: {method:'GET', params:{method:'exec', command:'mkdir'}, isArray:false},
				cp: {method:'GET', params:{method:'exec', command:'cp'}, isArray:false},
				mv: {method:'GET', params:{method:'exec', command:'mv'}, isArray:false},
				get: {method:'GET', params:{method:'exec', command:'get'}, isArray:false} // FIXME buggy
			});
	}])

	.factory('$ceUtils', [ 'server.url.unescaped', function(serverUrl)
	{
		function urlToPath(url) {
			if (url.indexOf(serverUrl) != 0)
			{
				console.log("ERROR: can't convert url to path: "+url);
				return null;
			}
			var parsedUrl = url.substr(serverUrl.length);
			if (parsedUrl.indexOf("/exec/get/") != parsedUrl.indexOf("/"))
			{
				console.log("ERROR: can't convert url to path: "+url);
				return null;
			}
			var srv = parsedUrl.substr(0, parsedUrl.indexOf("/"));
			parsedUrl = parsedUrl.substr(parsedUrl.indexOf("/exec/get/")+"/exec/get/".length); 
console.log("before extracting path and filename, parsedUrl= "+parsedUrl);
			var filename = "";
			var path = "";
			if (parsedUrl.lastIndexOf('/') > -1)
			{
				filename = parsedUrl.substr(parsedUrl.lastIndexOf('/')+1);
				path = parsedUrl.substr(0, parsedUrl.lastIndexOf('/')+1);
			}
			else
			{
				filename = parsedUrl;
			}
			return { 'srv':srv, 'path':path, 'filename': filename };
		}
		function pathToUrl(path) {
			if ( path.srv === undefined || path.path === undefined || path.filename === undefined )
			{
				console.log("ERROR: can't convert path to url: "+JSON.stringify(path));
				return null;
			}
			var ret = serverUrl+path.srv+"/exec/get/"+path.path;
			if (path.path.length > 0)
			{
				ret += '/';
			}
			ret += path.filename;
			return ret;
		}
		return {
			urlToPath: urlToPath,
			pathToUrl: pathToUrl
		}
	}])

	.factory('$unifileSrv', ['$unifileStub', '$http', 'server.url.unescaped', function($unifileStub, $http, serverUrl)
	{
		// array of available services from unifile
		var services;
		// the current navigation data
		var currentNav; // looks like { "path": "...", "files": [...], "srv": "..." }
		// the clipboard var used for copy/paste 
		var clipboard = { "mode":0, "path":"", "files":[] }; // mode=0 => copy, mode=1 => cut

		function listServices()
		{ 
			if (services == undefined)
			{
				services = []; // value used by data bindings while the response until the next call has arrived
				$unifileStub.listServices({}, function(list){ services = list; });
			}
			return services;
		}
		function isConnected(srvName)
		{
			for (var si in services)
			{
				if (services[si]["name"] == srvName)
				{
					if (services[si].hasOwnProperty("isConnected") && services[si]["isConnected"]===true
						&& services[si].hasOwnProperty("isLoggedIn") && services[si]["isLoggedIn"]===true)
					{
						return true;
					}
					return false;
				}
			}
			return false;
		}
		function login(srvName)
		{
			for (var si = 0; si < services.length; si++) // FIXME angular 1.1.3 doesn't accept both filter and associative arrays in ng-repeat. As soon as it does, optimize it to make services an associative array
			{
				if (services[si]["name"]!=srvName)
				{
					continue;
				}
				if (!services[si]["isLoggedIn"])
				{
					var res = $unifileStub.login({service:srvName}, function (status)
						{
							if (res.success == true)
							{
								services[si]["isLoggedIn"] = true;
							}
							else
							{
								services[si]["isLoggedIn"] = false;
							}
						},
						function (obj) // FIXME
						{
							console.error('Could not login. Try connect first, then follow the auth URL and try login again.');
							console.error(obj.data); // FIXME
							console.error(obj.status); // FIXME
							services[si]["isConnected"] = false;
							services[si]["isLoggedIn"] = false;
						});
				}
				return;
			}
		}
		function cd(srvName, path) {
//console.log("cd("+srvName+", "+path+")");
			$unifileStub.ls({service:srvName, path:path}, function (res)
				{
					console.log("cd command returned "+res.length+" elts for service "+srvName);
					currentNav = { "srv": srvName, "path": path, "files": res };
				});
		}
		//$unifileSrv.mv($scope.fileSrv, evData.path, $scope.filePath, evData.files);
		function mv(oldSrv, newSrv, oldPath, newPath, files) { // FIXME manage errors
			if (oldPath!='' && oldPath[oldPath.length-1]!='/')
			{
				oldPath+='/';
			}
			if (newPath!='' && newPath[newPath.length-1]!='/')
			{
				newPath+='/';
			}
			for (var fi in files)
			{
				(function(file)
				{
					$unifileStub.mv({service:newSrv, path:oldPath+file.name+':'+newPath+file.name}, function()		// FIXME unifile should manage mv between srvs
					{
						var op = oldPath.substring(0, oldPath.lastIndexOf('/')); console.log("OP="+op);
						var np = newPath.substring(0, newPath.lastIndexOf('/')); console.log("NP="+np);
						console.log("CP= "+ currentNav["path"])
						if (op == currentNav["path"])
						{
							for(var i in currentNav['files'])
							{
								if (currentNav['files'][i]['name']===file.name) { 
									currentNav['files'].splice(i, 1);
									break;
								}
							}
						}
						if (np == currentNav["path"])
						{
							currentNav['files'].push(file);
						}
					}, function()
					{
						/* TODO */ 
						console.log("ERROR after mv");
					});
				})(files[fi]);
			}
		}
		function setClipboardContent(mode) {
			clipboard["mode"] = mode;
			clipboard["files"] = [];
			var rp = '';
			if (currentNav["path"]!='' && currentNav["path"]!=undefined)
			{
				rp = currentNav["path"] + '/';
			}
			clipboard["path"] = rp;
			for(var fi in currentNav['files'])
			{
				if (currentNav['files'][fi]['isSelected']===true) { 
					clipboard["files"].push(currentNav['files'][fi]);
				}
			}
		}
		function remove() { // FIXME manage errors
			for(var fi in currentNav.files)
			{
				var cf = currentNav.files[fi];
				if (cf.isSelected===true)
				{
					var fp = currentNav.path;
					if (fp != '')
					{
						fp += '/';
					}
					fp += cf.name; console.log("calling rm with cf.name= "+cf.name);
					(function(cf) {
						$unifileStub.rm({service:currentNav.srv, path:fp}, function() { 
							for(var fir in currentNav.files)
							{
								if (currentNav.files[fir] == cf)
								{
									var temp = currentNav.files.splice(fir,1); console.log("removed it at "+fir+"  named "+temp[0].name);
									return;
								}
							}
						});
					})(cf);
				}
			}
		}
		function paste() { // FIXME manage errors
			if (clipboard["files"].length == 0 || currentNav["path"]==clipboard["path"])
			{
				return;
			}
			var rp = '';
			if (currentNav["path"]!='' && currentNav["path"]!=undefined)
			{
				rp = currentNav["path"] + '/';
			}
			for (var fi in clipboard["files"])
			{
				(function(file){
					var nfp = rp + file['name'];
					
					if (clipboard["mode"]==0)
					{
						$unifileStub.cp({service:currentNav["srv"], path:clipboard["path"]+file.name+':'+nfp}, function() {
							console.log("copy done");
							file.isSelected = false;
							currentNav["files"].push(file); // paste happens always in current directory
						});
					}
					else
					{
						$unifileStub.mv({service:currentNav["srv"], path:clipboard["path"]+file.name+':'+nfp}, function() {
							console.log("cut done");
							file.isSelected = false;
							currentNav["files"].push(file); // paste happens always in current directory
						});
					}
				})(clipboard["files"][fi]);
			}
			if (clipboard["mode"]==1) // clear clipboard if cut mode
			{
				clipboard["mode"]=0;
				clipboard["files"]=[];
			}
		}
		function isCorrectFileName(name)
		{
			if (name === undefined || name == "")
			{
				return false;
			}
			//TODO other checks on characters used...
			return true;
		}
		function mkdir(mkdirName)
		{ // FIXME manage errors
			var rp = currentNav.path;
			if (rp != '')
			{
				rp += '/';
			}
			$unifileStub.mkdir({service:currentNav.srv, path:rp+mkdirName}, function () {
//console.log("new "+mkdirName+" directory created.");
					currentNav.files.push({ 'name': mkdirName, 'is_dir': true }); // FIXME see if unifile couldn't send back the file json object
				});
		}
		function togleSelect(file)
		{
console.log("togleSelect "+file.name);
			for(var fi in currentNav.files)
			{
				if (currentNav.files[fi] == file)
				{
					if (currentNav.files[fi]["isSelected"])
					{
						currentNav.files[fi]["isSelected"] = !currentNav.files[fi]["isSelected"];
					}
					else
					{
						currentNav.files[fi]["isSelected"] = true;
					}
					currentNav.files[fi]["lastSelectionDate"] = Date.now();

					if (!__ceInstance)
					{
						return;
					}
				}
				//else if (__ceInstance && __ceInstance["mode"]===ONE_FILE_SEL_MODE)
				else if (__ceInstance)
				{
					currentNav.files[fi]["isSelected"] = false;
				}
			}
		}
		function upload(uploadFiles, path, onSuccess)
		{
			//enforce path as a folder path
			if (path != "" && path.lastIndexOf('/') != path.length-1) // TODO check in unifile if it's not a bug
			{
				path += '/';
			}
			var formData = new FormData();
			var fn = [];
			for(var i in uploadFiles)
			{
				if(typeof uploadFiles[i] == 'object') // raw data from drop event or input[type=file] contains methods we need to filter
				{
					formData.append('data', uploadFiles[i], uploadFiles[i].name);
					fn.push({ "name": uploadFiles[i].name });
				}
			}
			if (fn.length == 1) // FIXME this is a temporary workaround for following issue on FF: https://bugzilla.mozilla.org/show_bug.cgi?id=690659
			{
				path += fn[0].name;
			}
			return $http({
					method: 'POST',
					url: serverUrl+currentNav.srv+'/exec/put/'+path, // FIXME address as config value, srv as param
					data: formData,
					headers: {'Content-Type': undefined},
					transformRequest: angular.identity
				})
				.success(function(data, status, headers, config) {
					if (path == currentNav.path+'/') // FIXME that's ugly, check if we cannot do better
					{
						for(var i in fn)
						{
							currentNav.files.push({ 'name': fn[i].name, 'is_dir': false }); // FIXME see if unifile couldn't send back the file json objects
						}
					}
					console.log(fn.length+" file(s) successfully sent");
					if (onSuccess != null)
					{
						onSuccess();
					}
				});
		}
		function get(srv, path, onSuccess)
		{
//console.log("[unifileSrv] get called");
			$http({
					method: 'GET',
					url: serverUrl+srv+'/exec/get/'+path, // FIXME address as config value, srv as param
					transformRequest: angular.identity
				})
				.success(function(data, status, headers, config) {
					console.log("successfuly got file content: "+data);
					if (onSuccess != null)
					{
						onSuccess(data);
					}
				});
		}
		return {
			services: function() { return services; },
			isConnected: isConnected,
			currentNav: function() { return currentNav; },
			clipboard: function() { return clipboard; },
			listServices: listServices,
			login: login,
			cd: cd,
			mv: mv,
			setClipboardContent: setClipboardContent,
			remove: remove,
			paste: paste,
			mkdir:mkdir,
			isCorrectFileName: isCorrectFileName,
			togleSelect: togleSelect,
			upload: upload,
			get: get
		};
	}]);


/* Controllers */
angular.module('ceCtrls', ['ceServices'])

	/**
	 * Sets some exposed functions to the outside world
	 */
	.controller('CEBrowserCtrl', ['$scope', '$rootScope', '$unifileSrv', '$unifileStub', '$ceUtils', function($scope, $rootScope, $unifileSrv, $unifileStub, $ceUtils)
		{
			if (__ceInstance)
			{
				__ceInstance["read"] = function(input, onSuccess) {
					var path = $ceUtils.urlToPath(input.url);
console.log("path.srv= "+path.srv+"   path.path= "+path.path+"    path.filename= "+path.filename);

					$scope.$apply( function($scope){ $unifileSrv.get(path.srv, path.path+path.filename, function (data) { console.log("onSuccess data= "+data); onSuccess(data); }); } );
					//$scope.$apply( function($scope){ $unifileStub.get({service:path.srv, path:path.path}, function (data) { console.log("onSuccess data= "+JSON.stringify(data)); onSuccess(data); }); } );
				};
				__ceInstance["write"] = function(target, data, onSuccess) {
					var path = $ceUtils.urlToPath(target.url);
					var fileContent = [data];
					var fileBlob = new Blob(fileContent, { "type" : target.mimetype });
					fileBlob["name"] = path.filename;
//console.log("path.filename= "+path.filename);

					$scope.$apply( function($scope){ 
						$unifileSrv.upload( [fileBlob], path.path, function() { onSuccess(target); } );
					 } );
				};
				__ceInstance["refresh"] = function() { console.log('digest called');
					$rootScope.$digest();
				}
			}
		}
	])


	/**
	 * Controls the browser left pane
	 */
	.controller('CELeftPaneCtrl', ['$scope', '$unifileSrv', '$unifileStub', function($scope, $unifileSrv, $unifileStub)
		{
			// the services folder tree
			$scope.tree = {}; // { "dropbox" => [  ], "gdrive" => [  ] }

			// scope contains the service + folders tree and need to be able to enable/disable a branch (service) id its isConnected flag changes
			$scope.$watch( $unifileSrv.services, servicesChanged, true);

			// Initiate the list of services (should it be somewhere else ?)
			$unifileSrv.listServices();
			/**
			 *
			 */
			function servicesChanged(services)
			{
				for (var s in services)
				{
					if (services[s].hasOwnProperty("name") && !$scope.tree.hasOwnProperty(services[s]["name"]))
					{
//console.log("services[s]= "+JSON.stringify(services[s]))
						$scope.tree[services[s]["name"]] = [];
					}
					if (services[s]["isConnected"]===true && services[s]["isLoggedIn"]===true)
					{
						//console.log(services[s]["name"]+" connected but no data found in tree. Performing ls()...");
						var sname = services[s]["name"];
						if ( $unifileSrv.currentNav() == undefined )
						{
							// if tree empty we set current dir
							$unifileSrv.cd(sname, "");
						}
						else
						{
//console.log("$unifileSrv.currentNav already set so do not change it");
							// if tree not empty, we do not want to change current dir automatically
							$unifileStub.ls({service:sname, path:""}, function (res)
							{
								$scope.tree[ sname ] = res;
							});
						}
					}
				}
			}
		}])

	/**
	 * Controls the browser right pane
	 */
	.controller('CERightPaneCtrl', ['$scope', '$unifileSrv', '$ceUtils', function($scope, $unifileSrv, $ceUtils)
		{
			// scope contains the current path, the list of folders and files in the current path
			$scope.$watch( $unifileSrv.currentNav, currentNavChanged, true);

			/**
			 *
			 */
			$scope.hideSelectBtn = function()
			{
				if (__ceInstance && (__ceInstance["mode"] === ONE_FILE_SEL_MODE || __ceInstance["mode"] === ONE_FILE_SAVE_MODE))
				{
					for(var fi in $scope.files)
					{
						if ($scope.files[fi].isSelected===true)
						{
							return $scope.files[fi].is_dir;
						}
					}
				}
				return true;
			}
			$scope.hideSaveAsBtn = function()
			{
				if (__ceInstance && __ceInstance["mode"] === ONE_FILE_SAVE_MODE)
				{
					return false;
				}
				return true;
			}
			$scope.hideUploadBtn = function()
			{
				if (!__ceInstance || (__ceInstance && __ceInstance["mode"] === ONE_FILE_SEL_MODE))
				{
					return false;
				}
				return true;
			}
			/**
			 *
			 */
			function currentNavChanged(currNav)
			{
//console.log("[CERightPaneCtrl] currentNavChanged in right pane and equals "+currNav);
				if (currNav!==undefined)
				{
//console.log("right pane files set");
					$scope.path = currNav.path;
					$scope.srv = currNav.srv;
					$scope.files = currNav.files;
					$scope.isEmptySelection = true;
					for(var fi in $scope.files)
					{
						if ($scope.files[fi].isSelected===true)
						{
							$scope.isEmptySelection = false;
							break;
						}
					}
				}
			}
			$scope.isCtrlBtnsVisible = function() {
				return ($unifileSrv.currentNav() !== undefined);
			}
			$scope.showLinkToParent = function()
			{
				if ( $scope.path == undefined || $scope.path == '' || $scope.path == '/' )
				{
					return false;
				}
				return true;
			};
			/**
			 * mkdir command
			 */
			$scope.doMkdir = function(mkdirName)
			{
//console.log("doMkdir("+mkdirName+") called");
				if (!$unifileSrv.isCorrectFileName(mkdirName))
				{
					console.log("WARNING: name given for new directory is not valid: "+mkdirName);
					//TODO show this either in console or through a new alert service
				}
				else
				{
//console.log("creating directory "+mkdirName+" in "+$scope.srv+":"+$scope.path);
					$unifileSrv.mkdir(mkdirName);
					$scope.mkdirOn = false; // FIXME, should be set to false when server response received
				}
			}
			$scope.isEmptyClipboard = function() {
				return ($unifileSrv.clipboard()["files"].length === 0);
			}
			$scope.remove = function() {
				$unifileSrv.remove();
			}
			$scope.copy = function()
			{
				$unifileSrv.setClipboardContent(0);
			};
			$scope.cut = function()
			{
				$unifileSrv.setClipboardContent(1);
			};
			$scope.paste = function()
			{
				$unifileSrv.paste();
			};
			$scope.chose = function()
			{
				for(var fi in $scope.files)
				{
					if ($scope.files[fi].isSelected===true)
					{
						__ceInstance.onSuccess({
													'url': $ceUtils.pathToUrl({'srv':$scope.srv, 'path':$scope.path, 'filename':$scope.files[fi].name}),
													'filename': $scope.files[fi].name,
													'mimetype': ($scope.files[fi].name.indexOf('.') > -1) ? getMimeByExt($scope.files[fi].name.substring($scope.files[fi].name.lastIndexOf('.')+1)) : null
												}); // FIXME other CEBlob fields
						break;
					}
				}
			};
			$scope.ext = null;
			$scope.$watch( function(){ return __ceInstance }, refreshExtension, true);
			function refreshExtension()
			{
				$scope.ext = null;
				( __ceInstance['options'] != null && __ceInstance['options']['mimetype'] != null)  ? $scope.ext = getExtByMimeType( __ceInstance['options']['mimetype'] ) : $scope.ext = null;
				if ($scope.ext == null)
				{
					if ( __ceInstance['input'] != null && __ceInstance['input']['mimetype'] != null )
					{
						$scope.ext = getExtByMimeType( __ceInstance['input']['mimetype'] );
					}
				}
console.log('ext has been refreshed and is now: '+$scope.ext);
			}
			$scope.saveAs = function(fileName)
			{
				if ($scope.ext == null)
				{
					throw "Can't save file with no mimetype set !";
				}
				// TODO create file ?
				__ceInstance.onSuccess({ 'url': $ceUtils.pathToUrl({'srv':$scope.srv, 'path':$scope.path, 'filename':fileName+"."+$scope.ext }) }); // FIXME other CEBlob fields
			};
		}])

	/**
	 * This controller is shared by the ceFile and ceFolder directives.
	 */
	.controller('CEFileEntryCtrl', ['$scope', '$element', '$unifileSrv', '$unifileStub', 'server.url.unescaped', '$q', '$window', function($scope, $element, $unifileSrv, $unifileStub, serverUrl, $q, $window)
		{
			function getFilePath() {
				var fp = $scope.path;

				if ($scope.file != null)
				{
					if (fp != '')
					{
						fp += '/';
					}
					fp += $scope.file.name;
				}
				return fp;
			}
			$scope.filePath = getFilePath(); //console.log('$scope.filePath= '+$scope.filePath); // FIXME that should be necessary as this is a child scope !!!
			$scope.fileSrv = $scope.srv; //console.log('$scope.fileSrv= '+$scope.fileSrv); // FIXME that should be necessary as this is a child scope !!!
			$scope.renameOn = false;
			// can be dir, file or both
			$scope.isFile = false;
			$scope.isDir = false;

			/**
			 * TODO comment
			 */
			$scope.setLinkToParent = function()
			{
				$scope.$watch('path', function() {
					if ( $scope.path != undefined && $scope.path != '' && $scope.path != '/' )
					{
						var p = $scope.path;
						if (p.lastIndexOf('/') == p.length-1) p = p.substr(0, p.length-1);
						$scope.filePath = p.substr(0, p.lastIndexOf('/'));
					}
				});
			};
			/**
			 * Opens the application authorization popup for the given service
			 */
			function authorize(url, serviceName)
			{
				var authPopup = $window.open(url, 'authPopup', 'height=829,width=1035,dialog'); // FIXME parameterize size? per service ?
				authPopup.owner = $window;
				if ($window.focus) { authPopup.focus() }
				if (authPopup)
				{
					// timer based solution until we find something better to listen to the child window events (close, url change...)
					var timer = setInterval(function() 
						{
							if (authPopup.closed)
							{
								clearInterval(timer);
								$scope.$apply( function($scope){$unifileSrv.login(serviceName);} );
							}
						}, 500);
				}
				else
				{
					console.error('ERROR: Authorization popup could not be opened');
				}
			}
			/**
			 * Connect to service
			 */
			function connect(srvName)
			{
				if (!$unifileSrv.isConnected(srvName))
				{
					$q.when(srvName)
					.then( function(sn) {
						var deferred = $q.defer();
						$unifileStub.connect({service:sn},
							function (resp) {
								deferred.resolve(resp);
							}
						);
						return deferred.promise;
					})
					.then(function(cr) {
						authorize(cr.authorize_url, srvName);
					});
				}
				else
				{
					console.log("Already connected to "+srvName);
				}
			};
			/**
			 * TODO comment
			 */
			$scope.enterDir = function()
			{
console.log("Entering within "+$scope.fileSrv+":"+$scope.filePath);
				if (!$unifileSrv.isConnected($scope.fileSrv))
				{
console.log("sorry, but you're not connected to "+$scope.fileSrv);
					connect($scope.fileSrv);
				}
				else if ($scope.file != null && $scope.file.is_dir || $scope.file == null)
				{
					$unifileSrv.cd($scope.fileSrv, $scope.filePath);
				}
			};
			$scope.select = function()
			{
console.log("simple click received");
				var lastSel = $scope.file["lastSelectionDate"];
				$unifileSrv.togleSelect($scope.file);
				if (lastSel)
				{
					var diff = ($scope.file["lastSelectionDate"] - lastSel);
					if (diff < 2000 && diff > 500) // FIXME those values should be config constants
					{
						$scope.rename("");
					}
				}
			};

			/**
			 * TODO comment
			 */
			$scope.handleDragStart = function(e)
			{
console.log("ceFile => dragStart,  e.target= "+e.target+",  path= "+$scope.filePath);
				e.originalEvent.dataTransfer.effectAllowed = 'move';
				//e.originalEvent.dataTransfer.setData('text', $scope.filePath);
				e.originalEvent.dataTransfer.setData('text', '{ "srv": "'+$scope.fileSrv+'", "path": "'+$scope.path+'", "files": ['+JSON.stringify($scope.file)+'] }' );

				$element.addClass("ce-file-drag"); // FIXME make it a param in conf?
			};
			/**
			 * TODO comment
			 */
			$scope.handleDragEnd = function(e)
			{
//console.log( "ceFile => dragEnd  file= " + e.originalEvent.dataTransfer.getData('text') );
				$element.removeClass("ce-file-drag"); // FIXME make it a param in conf?
			};

			/**
			 * TODO comment
			 */
			$scope.getClass = function()
			{
				var fic = [];
				if ($scope.file != null && $scope.file.isSelected === true)
				{
					fic.push("ce-file-selected");
				}
				if ($scope.file != null && !$scope.file.is_dir)
				{
					fic.push("is-dir-false");
				}
				else
				{
					fic.push("is-dir-true");
				}
				return fic.join(" ");
			};

			/**
			 * TODO comment
			 */
			$scope.handleDragEnter = function(e) // TODO manage styles
			{
				e.preventDefault();
//console.log("e.target= "+e.target);
				$element.addClass("ce-folder-over"); // FIXME make it a param in conf?
			};
			/**
			 * TODO comment
			 */
			$scope.handleDragLeave = function(e) // TODO manage styles
			{
//console.log("e.target= "+e.target);
				$element.removeClass("ce-folder-over"); // FIXME make it a param in conf?
			};
			/**
			 * TODO comment
			 */
			$scope.handleDragOver = function(e)
			{
				if ( e.preventDefault )
				{
					e.preventDefault(); // Necessary. Allows us to drop.
				}
				e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

				return false;
			};
			/**
			 * TODO comment
			 */
			$scope.handleDrop = function(e)
			{
//console.log("drop ");
				e.stopPropagation();
				e.preventDefault();
				
				if ( e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0 ) // case files from desktop
				{
//console.log("files from desktop case upload to: " + $scope.filePath);
//console.log("e.originalEvent.dataTransfer.files= "+JSON.stringify(e.originalEvent.dataTransfer.files));
					$unifileSrv.upload( e.originalEvent.dataTransfer.files, $scope.filePath );
				}
				else // move case
				{ //console.log("from drag event: "+e.originalEvent.dataTransfer.getData('text'));
					var evData = JSON.parse(e.originalEvent.dataTransfer.getData('text'));
					
					for (var i in evData.files)
					{
						if ( evData.path != '' && $scope.filePath == evData.path+'/'+evData.files[i].name || 
							evData.path == '' && $scope.filePath == evData.files[i].name )
						{
							console.log("WARNING: cannot move a folder into itself!");
							return; // FIXME could it be cleaner ?
						}
					}
//console.log("move " + evPath + " to: " + $scope.filePath+'/'+evPath.substr(evPath.lastIndexOf('/')+1)); // NOTE: new path will probably need to be concatenated with file '/'+name
					$unifileSrv.mv(evData.srv, $scope.fileSrv, evData.path, $scope.filePath, evData.files);
				}
			};
			/**
			 * TODO comment
			 */
			$scope.download = function()
			{
				return serverUrl+$scope.fileSrv+'/exec/get/'+$scope.filePath; // FIXME make it a conf param
			};
			/**
			 * TODO comment
			 */
			$scope.rename = function(newName)
			{
				if (!$scope.renameOn)
				{
console.log("rename called and now on");
					$scope.renameOn = true;
				}
				else
				{
console.log("rename called and now off");
					if (!$unifileSrv.isCorrectFileName(newName))
					{
						console.log("WARNING: won't rename, incorrect file/folder name given: "+newName);
						// TODO show error somewhere in console or through a new alert service
					}
					else
					{
						var newPath = $scope.filePath.substr(0, $scope.filePath.lastIndexOf('/') + 1) + newName;

						// FIXME
						$unifileStub.mv({service: $scope.fileSrv, path: $scope.filePath + ':' + newPath}, function()
							{
								$scope.filePath = newPath;
								$scope.file.name = newName;
								$scope.renameOn = false;
							});
					}
				}
			};
		}
	])

	.controller('CEConsoleCtrl', [ '$scope', '$element', function( $scope, $element )
	{
		function onLogEntry( event, msg, l )
		{
			event.stopPropagation();
			$element.append("<li>"+l+": "+msg+"</li>"); // FIXME see if we can use some kind of template here...
		}
		$scope.$on("log", onLogEntry);
	}]);

/* Directives */
angular.module('ceDirectives', [ 'ceConf', 'ceServices', 'ceCtrls' ])

	.directive('fileUploader', function()
	{
		return {
			restrict: 'A',
			transclude: true,
			template: '<div class="fileUploader"><input type="file" multiple /><button ng-click="upload()">Upload</button></div>',
			replace: true,
			controller: function($scope, $unifileSrv)
			{
				$scope.push = function(e)
				{
					$unifileSrv.upload(e.target.files, $scope.path);
				}
			},
			link: function($scope, $element)
			{
				var fileInput = $element.find('input');

				$scope.upload = function() { fileInput.trigger('click'); console.log( "browse called "); };

				fileInput.bind('change', function(e) { $scope.$apply(function($scope){$scope.push(e);}); } );
			}
		};
	})

	// the rename item form
	// FIXME merge with ceMkdir ? Or should this be a directive at all ?
	.directive('ceRename', function()
	{
		return {
			restrict: 'C',
			template: '<form ng-submit=\"rename(newName)\"><input type=\"text\" ng-model=\"newName\" ng-init=\"newName=file.name\" /></form>',
			link: function($scope, $element)
			{
				var i = $element.find('input');
				i.bind('focusout', function(e) { $scope.$parent.$apply(function(scope){ scope.renameOn = false; }); } ); // maybe rootScope instead of parentScope would be safer here
				i.focus();
			}
		};
	})

	// the "new folder" button
	// FIXME merge with ceRename ? Or should this be a directive at all ?
	.directive('ceMkdir', function()
	{
		return {
			restrict: 'C',
			template: '<div class=\"is-dir-true \"><form ng-submit=\"doMkdir(mkdirName)\"><input type=\"text\" ng-model=\"mkdirName\" /></form></div>',
			link: function($scope, $element)
			{
				var i = $element.find('input');
				i.bind('focusout', function(e) { $scope.$parent.$apply(function(scope){ scope.mkdirOn = false; }); } ); // maybe rootScope instead of parentScope would be safer here
				i.focus();
			}
		};
	})

	// the "new folder" button
	.directive('ceMkdirBtn', function()
	{
		return {
			restrict: 'A',
			template: '<button ng-click="mkdir()">New folder</button>',
			replace: 'true',
			controller: function($scope)
			{
				$scope.mkdir = function()
				{
					$scope.mkdirOn = true;
				}
			}
		};
	})

	// this is the CE browser log console
	.directive('ceConsole', function()
	{
		return {
			restrict: 'A',
			replace: true,
			template: '<ul class="ce-log-console"></ul>',
			controller: 'CEConsoleCtrl'
		};
	})

	// this directive implements the behavior of receiving a file/folder on drop
	.directive('ceItem', function()
	{
		return {
			restrict: 'C',
			controller: 'CEFileEntryCtrl'
		};
	})

	// this directive implements the behavior of receiving a file/folder on drop
	.directive('ceFolder', function()
	{
		return {
			priority: 1,
			restrict: 'A',
			link: function(scope, element, attrs)
			{
				scope.isDir = true;
				attrs.$set('dropzone', 'move');
				attrs.$set('draggable', 'false'); // necessary to avoid folders that aren't files to be draggable

				//element.bind('dblclick', scope.enterDir ); // not set with ng-click 'cause we need to be able to unbind it at some points (renaming, ...)
				element.bind('dblclick', function(e) { scope.$apply(function(scope){scope.enterDir(e);}); } ); // not set with ng-click 'cause we need to be able to unbind it at some points (renaming, ...)
				element.bind('dragenter', function(e) { scope.$apply(function(scope){scope.handleDragEnter(e);}); } );
				element.bind('dragleave', function(e) { scope.$apply(function(scope){scope.handleDragLeave(e);}); } );
				element.bind('dragover', function(e) { scope.$apply(function(scope){scope.handleDragOver(e);}); } );
				element.bind('drop', function(e) { scope.$apply(function(scope){scope.handleDrop(e);}); } );
			}
		};
	})

	// this directive implements the behavior of mooving a file on drag
	.directive('ceFile', function()
	{
		return {
			restrict: 'A',
			link: function(scope, element, attrs)
			{
				scope.isFile = true;
				attrs.$set('draggable', 'true');

				//element.bind('click', scope.select );
				element.bind('click', function(e) { scope.$apply(function(scope){scope.select(e);}); } );
				element.bind('dragstart', function(e) { scope.$apply(function(scope){scope.handleDragStart(e);}); } );
				element.bind('dragend', function(e) { scope.$apply(function(scope){scope.handleDragEnd(e);}); } );
			}
		};
	})
/*
	// this directive implements the Connect button
	.directive('ceConnectBtn', function()
	{
		return {
			restrict: 'A',
			replace: true,
			template: '<div class="btn-group"> \
							<a class="btn dropdown-toggle" data-toggle="dropdown">Connect <span class="caret"></span></a> \
							<ul class="dropdown-menu"> \
								<li ng-repeat="srv in services"><a ng-class="srvLinkClass(srv)" ng-click="connect(srv)">{{srv.display_name}}</a></li> \
							</ul> \
						</div>',
			controller: 'CEConnectBtnCtrl'
		};
	})
*/
	// the browser left pane directive
	.directive('ceLeftPane',  function()
	{
		return {
			restrict: 'A',
			replace: true,
			template: "<div> \
						<ul class=\"tree\"> \
							<li ng-repeat=\"(srvTreeK, srvTreeV) in tree\" ng-init=\"srv=srvTreeK; path='';\"> \
								<span class=\"ce-item\" ce-folder ng-click=\"enterDir()\" ng-class=\"srvTreeK\">{{ srvTreeK }}</span> \
							</li> \
						</ul> \
					</div>",
			controller: 'CELeftPaneCtrl'
		};
	})

	// the browser right pane directive
	// FIXME: The download link will not dl but open in FF20 if not same origin thus the blank target
	.directive('ceRightPane',  function()
	{
		return {
			restrict: 'C',
			replace: true,
			template: "<div> \
						<ul> \
							<li ng-show=\"isCtrlBtnsVisible()\"> \
								<div ng-hide=\"hideUploadBtn()\" file-uploader></div> \
								<div ce-mkdir-btn></div> \
								<button ng-hide=\"isEmptySelection\" ng-click=\"copy()\">Copy</button> \
								<button ng-hide=\"isEmptySelection\" ng-click=\"cut()\">Cut</button> \
								<button ng-hide=\"isEmptyClipboard()\" ng-click=\"paste()\">Paste</button> <button ng-hide=\"isEmptySelection\" ng-click=\"remove()\">Delete</button> \
							</li> \
							<li ng-show=\"isCtrlBtnsVisible()\"> \
								<div ng-hide=\"hideSaveAsBtn()\" class=\"ce-saveas-btn\">{{ srv+\":\"+path+\"/\" }} <input type=\"text\" ng-model=\"saveAsName\"> .{{ext}} <button ng-click=\"saveAs(saveAsName)\">Save As</button></div> \
								<button ng-hide=\"hideSelectBtn()\" ng-click=\"chose()\">Select</button> \
							</li> \
							<li ng-if=\"showLinkToParent()\"><span ng-init=\"setLinkToParent()\" class=\"ce-item is-dir-true\" ce-folder>..</span></li> \
							<li class=\"ce-item\" ng-repeat=\"file in files | orderBy:'is_dir':true\"> \
								<div ng-if=\"file.is_dir && !renameOn\" ce-folder ce-file ng-class=\"getClass()\"><span>{{file.name}}</span></div> \
								<div ng-if=\"!file.is_dir && !renameOn\" ce-file ng-class=\"getClass()\"><span>{{file.name}}</span></div> \
								<div class=\"ce-rename\" ng-if=\"renameOn\" ng-class=\"getClass()\"></div> \
							</li> \
							<li class=\"ce-new-item ce-mkdir\" ng-if=\"mkdirOn\"></li> \
						</ul> \
					</div>",
//								<a ng-hide=\"file.is_dir\" ng-href=\"{{download()}}\" download=\"{{file.name}}\" target=\"blank\">download</a> \
			controller: 'CERightPaneCtrl'
		};
	})

	// this is the root directive, the one you should use in your projects
	.directive('ceBrowser',  function()
	{
		return {
			restrict: 'A',
			replace: true,
			template: "<div class=\"ceBrowser\"> \
						<div class=\"ceTitle\">Browse your cloud drives</div> \
						<div class=\"row-fluid\"> \
							<div class=\"span5\"> \
								<div ce-left-pane></div> \
							</div> \
							<div class=\"span7\"> \
								<div class=\"ce-right-pane\"></div> \
							</div> \
						</div> \
						<div class=\"row-fluid\"><div class=\"span12\" ce-console></div></div> \
					</div>",
			controller: 'CEBrowserCtrl'
		};
	});