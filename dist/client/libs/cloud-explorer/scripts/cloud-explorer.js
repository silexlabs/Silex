(function ($hx_exports) { "use strict";
$hx_exports.ce = $hx_exports.ce || {};
$hx_exports.ce.api = $hx_exports.ce.api || {};
var $estr = function() { return js.Boot.__string_rec(this,''); };
var DateTools = function() { };
DateTools.__name__ = true;
DateTools.__format_get = function(d,e) {
	switch(e) {
	case "%":
		return "%";
	case "C":
		return StringTools.lpad(Std.string(Std["int"](d.getFullYear() / 100)),"0",2);
	case "d":
		return StringTools.lpad(Std.string(d.getDate()),"0",2);
	case "D":
		return DateTools.__format(d,"%m/%d/%y");
	case "e":
		return Std.string(d.getDate());
	case "H":case "k":
		return StringTools.lpad(Std.string(d.getHours()),e == "H"?"0":" ",2);
	case "I":case "l":
		var hour = d.getHours() % 12;
		return StringTools.lpad(Std.string(hour == 0?12:hour),e == "I"?"0":" ",2);
	case "m":
		return StringTools.lpad(Std.string(d.getMonth() + 1),"0",2);
	case "M":
		return StringTools.lpad(Std.string(d.getMinutes()),"0",2);
	case "n":
		return "\n";
	case "p":
		if(d.getHours() > 11) return "PM"; else return "AM";
		break;
	case "r":
		return DateTools.__format(d,"%I:%M:%S %p");
	case "R":
		return DateTools.__format(d,"%H:%M");
	case "s":
		return Std.string(Std["int"](d.getTime() / 1000));
	case "S":
		return StringTools.lpad(Std.string(d.getSeconds()),"0",2);
	case "t":
		return "\t";
	case "T":
		return DateTools.__format(d,"%H:%M:%S");
	case "u":
		var t = d.getDay();
		if(t == 0) return "7"; else if(t == null) return "null"; else return "" + t;
		break;
	case "w":
		return Std.string(d.getDay());
	case "y":
		return StringTools.lpad(Std.string(d.getFullYear() % 100),"0",2);
	case "Y":
		return Std.string(d.getFullYear());
	default:
		throw "Date.format %" + e + "- not implemented yet.";
	}
};
DateTools.__format = function(d,f) {
	var r = new StringBuf();
	var p = 0;
	while(true) {
		var np = f.indexOf("%",p);
		if(np < 0) break;
		r.addSub(f,p,np - p);
		r.add(DateTools.__format_get(d,HxOverrides.substr(f,np + 1,1)));
		p = np + 2;
	}
	r.addSub(f,p,f.length - p);
	return r.b;
};
DateTools.format = function(d,f) {
	return DateTools.__format(d,f);
};
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.__name__ = true;
Lambda.has = function(it,elt) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(x == elt) return true;
	}
	return false;
};
Lambda.count = function(it,pred) {
	var n = 0;
	if(pred == null) {
		var $it0 = $iterator(it)();
		while( $it0.hasNext() ) {
			var _ = $it0.next();
			n++;
		}
	} else {
		var $it1 = $iterator(it)();
		while( $it1.hasNext() ) {
			var x = $it1.next();
			if(pred(x)) n++;
		}
	}
	return n;
};
var IMap = function() { };
IMap.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		return null;
	}
};
Reflect.getProperty = function(o,field) {
	var tmp;
	if(o == null) return null; else if(o.__properties__ && (tmp = o.__properties__["get_" + field])) return o[tmp](); else return o[field];
};
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && v.__enum__ == null || t == "function" && (v.__name__ || v.__ename__) != null;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
var StringBuf = function() {
	this.b = "";
};
StringBuf.__name__ = true;
StringBuf.prototype = {
	add: function(x) {
		this.b += Std.string(x);
	}
	,addSub: function(s,pos,len) {
		if(len == null) this.b += HxOverrides.substr(s,pos,null); else this.b += HxOverrides.substr(s,pos,len);
	}
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
};
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && HxOverrides.substr(s,slen - elen,elen) == end;
};
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	return c > 8 && c < 14 || c == 32;
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return HxOverrides.substr(s,r,l - r); else return s;
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return HxOverrides.substr(s,0,l - r); else return s;
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
StringTools.lpad = function(s,c,l) {
	if(c.length <= 0) return s;
	while(s.length < l) s = c + s;
	return s;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
var ce = {};
ce.api = {};
ce.api.CloudExplorer = $hx_exports.ce.api.CloudExplorer = function(iframeEltId) {
	var ceIframe;
	if(iframeEltId != null) ceIframe = window.document.getElementById(iframeEltId); else ceIframe = null;
	var config = new ce.core.config.Config();
	if(ceIframe == null) {
		var _this = window.document;
		ceIframe = _this.createElement("iframe");
		window.document.body.appendChild(ceIframe);
	} else if(ceIframe.src != null) {
		var _g = 0;
		var _g1 = ceIframe.attributes;
		while(_g < _g1.length) {
			var ca = _g1[_g];
			++_g;
			if(ca.nodeName.indexOf("data-ce-") == 0) config.readProperty(HxOverrides.substr(ca.nodeName,8,null),ca.nodeValue);
		}
	}
	this.ctrl = new ce.core.Controller(config,ceIframe);
};
ce.api.CloudExplorer.__name__ = true;
ce.api.CloudExplorer.get = function(iframeEltId) {
	return new ce.api.CloudExplorer(iframeEltId);
};
ce.api.CloudExplorer.prototype = {
	pick: function(arg1,arg2,arg3) {
		if(arg1 == null || arg2 == null) throw "Missing mandatory parameters for CloudExplorer.pick(onSuccess : CEBlob -> Void, onError : CEError -> Void)";
		var options;
		if(arg3 != null) options = arg1; else options = null;
		var onSuccess;
		if(options != null) onSuccess = arg2; else onSuccess = arg1;
		var onError;
		if(options != null) onError = arg3; else onError = arg2;
		console.log("options: " + Std.string(options) + "  onSuccess: " + Std.string(onSuccess) + "  onError: " + Std.string(onError));
		this.ctrl.pick(options,onSuccess,onError);
	}
	,read: function(arg1,arg2,arg3,arg4,arg5) {
		var input = arg1;
		var options;
		if(Reflect.isObject(arg2)) options = arg2; else options = null;
		var onSuccess;
		if(options == null) onSuccess = arg2; else onSuccess = arg3;
		var onError;
		if(options == null) onError = arg3; else onError = arg4;
		var onProgress;
		if(options == null) onProgress = arg4; else onProgress = arg5;
		this.ctrl.read(input,options,onSuccess,onError,onProgress);
	}
	,exportFile: function(arg1,arg2,arg3,arg4) {
		var input = arg1;
		var options;
		if(Reflect.isObject(arg2)) options = arg2; else options = null;
		var onSuccess;
		if(options == null) onSuccess = arg2; else onSuccess = arg3;
		var onError;
		if(options == null) onError = arg3; else onError = arg4;
		this.ctrl.exportFile(input,options,onSuccess,onError);
	}
	,write: function(arg1,arg2,arg3,arg4,arg5,arg6) {
		var target = arg1;
		var data = arg2;
		var options;
		if(Reflect.isObject(arg3)) options = arg3; else options = null;
		var onSuccess;
		if(options == null) onSuccess = arg3; else onSuccess = arg4;
		var onError;
		if(options == null) onError = arg4; else onError = arg5;
		var onProgress;
		if(options == null) onProgress = arg5; else onProgress = arg6;
		this.ctrl.write(target,data,options,onSuccess,onError,onProgress);
	}
	,isLoggedIn: function(arg1,arg2,arg3) {
		var srvName = arg1;
		var onSuccess = arg2;
		var onError = arg3;
		return this.ctrl.isLoggedIn(srvName,onSuccess,onError);
	}
	,requestAuthorize: function(arg1,arg2,arg3) {
		var srvName = arg1;
		var onSuccess = arg2;
		var onError = arg3;
		this.ctrl.requestAuthorize(srvName,onSuccess,onError);
	}
};
ce.core = {};
ce.core.Controller = function(config,iframe) {
	this.config = config;
	this.state = new ce.core.model.State();
	this.unifileSrv = new ce.core.service.UnifileSrv(config);
	this.application = new ce.core.view.Application(iframe,config);
	this.errorCtrl = new ce.core.ctrl.ErrorCtrl(this,this.state,this.application);
	this.initMvc();
};
ce.core.Controller.__name__ = true;
ce.core.Controller.prototype = {
	pick: function(options,onSuccess,onError) {
		ce.util.OptionTools.normalizePickOptions(options);
		this.state.set_currentMode(ce.core.model.Mode.SingleFileSelection(onSuccess,onError,options));
		this.show();
	}
	,read: function(input,options,onSuccess,onError,onProgress) {
		ce.util.OptionTools.normalizeReadOptions(options);
		this.unifileSrv.get(input.url,onSuccess,function(e) {
			onError(new ce.core.model.CEError(e.code));
		});
	}
	,exportFile: function(input,options,onSuccess,onError) {
		ce.util.OptionTools.normalizeExportOptions(options);
		this.state.set_currentMode(ce.core.model.Mode.SingleFileExport(onSuccess,onError,input,options));
		this.show();
	}
	,write: function(target,data,options,onSuccess,onError,onProgress) {
		var _g1 = this;
		ce.util.OptionTools.normalizeWriteOptions(options);
		var explodedUrl = this.unifileSrv.explodeUrl(target.url);
		var fileBlob = new Blob([data],{ type : target.mimetype});
		this.unifileSrv.upload((function($this) {
			var $r;
			var _g = new haxe.ds.StringMap();
			_g.set(explodedUrl.filename,fileBlob);
			$r = _g;
			return $r;
		}(this)),null,explodedUrl.srv,explodedUrl.path,function() {
			if(_g1.state.currentFileList.get(explodedUrl.filename) == null) _g1.refreshFilesList();
			onSuccess(target);
		},function(e) {
			onError(new ce.core.model.CEError(e.code));
		});
	}
	,isLoggedIn: function(srvName,onSuccess,onError) {
		this.state.set_currentMode(ce.core.model.Mode.IsLoggedIn(onSuccess,onError,srvName));
		if(this.state.serviceList == null) this.listServices(); else if(this.state.serviceList.get(srvName) == null) {
			console.log("unknown service " + srvName);
			onError(new ce.core.model.CEError(400));
		} else onSuccess(this.state.serviceList.get(srvName).isLoggedIn);
	}
	,requestAuthorize: function(srvName,onSuccess,onError) {
		this.state.set_currentMode(ce.core.model.Mode.RequestAuthorize(onSuccess,onError,srvName));
		if(this.state.serviceList == null) this.listServices(); else if(this.state.serviceList.get(srvName) == null) {
			console.log("unknown service " + srvName);
			onError(new ce.core.model.CEError(400));
		} else if(this.state.serviceList.get(srvName).isLoggedIn) {
			console.log("user already logged into " + srvName);
			onSuccess();
		} else {
			this.state.set_displayState(true);
			this.connect(srvName);
		}
	}
	,setAlert: function(msg,level,choices) {
		if(level == null) level = 2;
		var _g = this;
		if(choices == null || choices.length == 0) this.application.onClicked = function() {
			_g.application.setAlertPopupDisplayed(false);
		}; else this.application.onClicked = function() {
		};
		this.application.alertPopup.setMsg(msg,level,choices);
		this.application.setAlertPopupDisplayed(true);
	}
	,initMvc: function() {
		var _g = this;
		this.application.onViewReady = function() {
			_g.state.set_displayMode(ce.core.model.DisplayMode.List);
			_g.state.set_currentSortField("name");
			_g.state.set_readyState(true);
		};
		this.application.onLogoutClicked = function() {
			_g.logoutAll();
		};
		this.application.onCloseClicked = function() {
			_g.hide();
		};
		this.application.onServiceLoginRequest = function(name) {
			if(_g.state.serviceList.get(name).isLoggedIn) throw "unexpected call to login " + name; else _g.connect(name);
		};
		this.application.onServiceLogoutRequest = function(name1) {
			if(!_g.state.serviceList.get(name1).isLoggedIn) throw "unexpected call to logout " + name1;
			_g.logout(name1);
		};
		this.application.onServiceClicked = function(name2) {
			if(_g.state.serviceList.get(name2).isLoggedIn) _g.state.set_currentLocation(new ce.core.model.Location(name2,"/")); else _g.connect(name2);
		};
		this.application.onFileSelectClicked = function(id) {
			var f = _g.state.currentFileList.get(id);
			{
				var _g1 = _g.state.currentMode;
				switch(_g1[1]) {
				case 0:
					var options = _g1[4];
					var onError = _g1[3];
					var onSuccess = _g1[2];
					if(f.isDir) {
						onSuccess({ url : _g.unifileSrv.generateUrl(_g.state.currentLocation.service,_g.state.currentLocation.path,f.name), filename : f.name, mimetype : "text/directory", size : null, key : null, container : null, isWriteable : true, path : _g.state.currentLocation.path});
						_g.hide();
					} else {
						var _g2 = _g.state.currentLocation;
						_g2.set_path(_g2.path + (_g.state.currentFileList.get(id).name + "/"));
					}
					break;
				default:
					var _g2 = _g.state.currentLocation;
					_g2.set_path(_g2.path + (_g.state.currentFileList.get(id).name + "/"));
				}
			}
		};
		this.application.onParentFolderClicked = function() {
			_g.cpd(_g.state.currentLocation.service,_g.state.currentLocation.path);
		};
		this.application.onFileClicked = function(id1) {
			var f1 = _g.state.currentFileList.get(id1);
			if(_g.state.currentMode == null) {
				if(f1.isDir) {
					var _g11 = _g.state.currentLocation;
					_g11.set_path(_g11.path + (_g.state.currentFileList.get(id1).name + "/"));
				}
				return;
			}
			{
				var _g12 = _g.state.currentMode;
				switch(_g12[1]) {
				case 0:
					var options1 = _g12[4];
					var onError1 = _g12[3];
					var onSuccess1 = _g12[2];
					if(!f1.isDir) {
						onSuccess1({ url : _g.unifileSrv.generateUrl(_g.state.currentLocation.service,_g.state.currentLocation.path,f1.name), filename : f1.name, mimetype : ce.util.FileTools.getMimeType(f1.name), size : f1.bytes, key : null, container : null, isWriteable : true, path : _g.state.currentLocation.path});
						_g.hide();
					} else {
						var _g21 = _g.state.currentLocation;
						_g21.set_path(_g21.path + (_g.state.currentFileList.get(id1).name + "/"));
					}
					break;
				case 1:
					var options2 = _g12[5];
					var input = _g12[4];
					var onError2 = _g12[3];
					var onSuccess2 = _g12[2];
					if(!f1.isDir) {
						onSuccess2({ url : _g.unifileSrv.generateUrl(_g.state.currentLocation.service,_g.state.currentLocation.path,f1.name), filename : f1.name, mimetype : ce.util.FileTools.getMimeType(f1.name), size : f1.bytes, key : null, container : null, isWriteable : true, path : _g.state.currentLocation.path});
						_g.hide();
					} else {
						var _g21 = _g.state.currentLocation;
						_g21.set_path(_g21.path + (_g.state.currentFileList.get(id1).name + "/"));
					}
					break;
				default:
					var _g21 = _g.state.currentLocation;
					_g21.set_path(_g21.path + (_g.state.currentFileList.get(id1).name + "/"));
				}
			}
		};
		this.application.onFileDeleteClicked = function(id2) {
			var f2 = _g.state.currentFileList.get(id2);
			_g.setAlert("Are you sure you want to delete " + f2.name + " from your " + _g.state.serviceList.get(_g.state.currentLocation.service).displayName + " storage?",1,[{ msg : "Yes, delete it", cb : function() {
				_g.application.setAlertPopupDisplayed(false);
				_g.deleteFile(id2);
			}},{ msg : "No, do not delete it", cb : function() {
				_g.application.setAlertPopupDisplayed(false);
			}}]);
		};
		this.application.onFileCheckedStatusChanged = function(_) {
			var _g13 = 0;
			var _g22 = _g.application.fileBrowser.fileListItems;
			while(_g13 < _g22.length) {
				var f3 = _g22[_g13];
				++_g13;
				if(f3.get_isChecked()) {
					_g.application.setSelecting(true);
					return;
				}
			}
			_g.application.setSelecting(false);
		};
		this.application.onFileRenameRequested = function(id3,value) {
			var f4 = _g.state.currentFileList.get(id3);
			if(value != f4.name) {
				var oldPath = _g.state.currentLocation.path;
				var newPath = _g.state.currentLocation.path;
				if(oldPath == "/" || oldPath == "") oldPath = f4.name; else oldPath = oldPath + "/" + f4.name;
				if(newPath == "/" || newPath == "") newPath = value; else newPath = newPath + "/" + value;
				_g.application.setLoaderDisplayed(true);
				_g.unifileSrv.mv(_g.state.currentLocation.service,oldPath,newPath,function() {
					_g.application.setLoaderDisplayed(false);
					_g.refreshFilesList();
				},($_=_g.errorCtrl,$bind($_,$_.setUnifileError)));
			}
		};
		this.application.onOverwriteExportClicked = function() {
			{
				var _g14 = _g.state.currentMode;
				switch(_g14[1]) {
				case 1:
					var options3 = _g14[5];
					var input1 = _g14[4];
					var onError3 = _g14[3];
					var onSuccess3 = _g14[2];
					var fname = _g.application["export"].get_exportName();
					if(options3 != null) {
						if(options3.mimetype != null && ce.util.FileTools.getExtension(options3.mimetype) != null) fname += ce.util.FileTools.getExtension(options3.mimetype); else if(options3.extension != null) if(options3.extension.indexOf(".") != 0) fname += "." + options3.extension; else fname += options3.extension;
					}
					_g.setAlert("Do you confirm overwriting of " + fname + "?",1,[{ msg : "Yes, do overwrite it.", cb : function() {
						_g.application.setAlertPopupDisplayed(false);
						_g.doExportFile();
						_g.hide();
					}},{ msg : "No, do not overwrite it.", cb : function() {
						_g.application.setAlertPopupDisplayed(false);
					}}]);
					break;
				default:
					throw "unexpected mode " + Std.string(_g.state.currentMode);
				}
			}
		};
		this.application.onSaveExportClicked = function() {
			_g.doExportFile();
			_g.hide();
		};
		this.application.onExportNameChanged = function() {
			if(_g.application["export"].get_exportName() != "") {
				var _g15 = _g.state.currentMode;
				switch(_g15[1]) {
				case 1:
					var options4 = _g15[5];
					var input2 = _g15[4];
					var onError4 = _g15[3];
					var onSuccess4 = _g15[2];
					var fname1 = _g.application["export"].get_exportName();
					if(options4 != null) {
						if(options4.mimetype != null && ce.util.FileTools.getExtension(options4.mimetype) != null) fname1 += ce.util.FileTools.getExtension(options4.mimetype); else if(options4.extension != null) if(options4.extension.indexOf(".") != 0) fname1 += "." + options4.extension; else fname1 += options4.extension;
					}
					var $it0 = _g.state.currentFileList.iterator();
					while( $it0.hasNext() ) {
						var f5 = $it0.next();
						if(f5.name == fname1) {
							_g.application.setExportOverwriteDisplayed(true);
							return;
						}
					}
					_g.application.setExportOverwriteDisplayed(false);
					break;
				default:
					throw "unexpected mode " + Std.string(_g.state.currentMode);
				}
			}
		};
		this.application.onFilesDropped = function(files) {
			_g.application.setLoaderDisplayed(true);
			_g.unifileSrv.upload(null,files,_g.state.currentLocation.service,_g.state.currentLocation.path,function() {
				_g.refreshFilesList();
			},($_=_g.errorCtrl,$bind($_,$_.setUnifileError)));
		};
		this.application.onInputFilesChanged = function() {
			_g.application.setLoaderDisplayed(true);
			_g.unifileSrv.upload(null,_g.application.dropzone.inputElt.files,_g.state.currentLocation.service,_g.state.currentLocation.path,function() {
				_g.refreshFilesList();
			},($_=_g.errorCtrl,$bind($_,$_.setUnifileError)));
		};
		this.application.onNavBtnClicked = function(srv,path) {
			_g.state.set_currentLocation(new ce.core.model.Location(srv,path));
		};
		this.application.onNewFolderClicked = function() {
			_g.state.set_newFolderMode(!_g.state.newFolderMode);
		};
		this.application.onDeleteClicked = function() {
			_g.setAlert("Are you sure you want to delete the selected files from your " + _g.state.serviceList.get(_g.state.currentLocation.service).displayName + " storage?",1,[{ msg : "Yes, delete the selected files", cb : function() {
				_g.application.setAlertPopupDisplayed(false);
				_g.deleteSelectedFiles();
			}},{ msg : "No, do not delete the selected files", cb : function() {
				_g.application.setAlertPopupDisplayed(false);
			}}]);
		};
		this.application.onNewFolderName = function() {
			var name3 = _g.application.fileBrowser.get_newFolderName();
			if(StringTools.trim(name3) == "") _g.state.set_newFolderMode(false); else {
				var mkDirPath = _g.state.currentLocation.path;
				if(mkDirPath == "/" || mkDirPath == "") mkDirPath = name3; else mkDirPath = mkDirPath + "/" + name3;
				_g.unifileSrv.mkdir(_g.state.currentLocation.service,mkDirPath,function() {
					_g.state.set_newFolderMode(false);
					_g.refreshFilesList();
				},function(e) {
					_g.state.set_newFolderMode(false);
					_g.errorCtrl.setUnifileError(e);
				});
			}
		};
		this.application.onItemsListClicked = function() {
			_g.state.set_displayMode(ce.core.model.DisplayMode.List);
		};
		this.application.onItemsIconClicked = function() {
			_g.state.set_displayMode(ce.core.model.DisplayMode.Icons);
		};
		this.application.onSortBtnClicked = function(field) {
			if(_g.state.currentSortField == field) _g.state.set_currentSortOrder(_g.state.currentSortOrder == "asc"?"desc":"asc"); else _g.state.set_currentSortField(field);
		};
		this.state.onServiceListChanged = function() {
			{
				var _g16 = _g.state.currentMode;
				switch(_g16[1]) {
				case 2:
					var srvName = _g16[4];
					var onError5 = _g16[3];
					var onSuccess5 = _g16[2];
					_g.isLoggedIn(srvName,onSuccess5,onError5);
					break;
				case 3:
					var srvName1 = _g16[4];
					var onError6 = _g16[3];
					var onSuccess6 = _g16[2];
					_g.requestAuthorize(srvName1,onSuccess6,onError6);
					break;
				case 0:case 1:
					break;
				}
			}
			var lastConnectedService = null;
			_g.application.home.resetList();
			_g.application.fileBrowser.resetList();
			_g.application.fileBrowser.resetFileList();
			var $it1 = _g.state.serviceList.iterator();
			while( $it1.hasNext() ) {
				var s = $it1.next();
				_g.application.home.addService(s.name,s.displayName,s.description);
				if(s.isLoggedIn) lastConnectedService = s.name;
				_g.application.fileBrowser.addService(s.name,s.displayName,s.isLoggedIn);
			}
			if(lastConnectedService != null) {
				if(_g.state.currentLocation == null) _g.state.set_currentLocation(new ce.core.model.Location(lastConnectedService,"/"));
				_g.application.setLogoutButtonDisplayed(true);
				_g.application.setFileBrowserDisplayed(true);
			} else {
				_g.application.setLogoutButtonDisplayed(false);
				_g.application.setHomeDisplayed(true);
			}
		};
		this.state.onDisplayStateChanged = function() {
			_g.application.setDisplayed(_g.state.displayState);
		};
		this.state.onReadyStateChanged = function() {
		};
		this.state.onServiceLoginStateChanged = function(srvName2) {
			_g.application.fileBrowser.setSrvConnected(srvName2,_g.state.serviceList.get(srvName2).isLoggedIn);
			{
				var _g17 = _g.state.currentMode;
				switch(_g17[1]) {
				case 0:case 1:
					break;
				case 2:
					throw "unexpected mode: " + Std.string(_g.state.currentMode);
					break;
				case 3:
					var onSuccess7 = _g17[2];
					onSuccess7();
					_g.hide();
					break;
				}
			}
			if(!_g.state.serviceList.get(srvName2).isLoggedIn) {
				if(_g.state.currentLocation.service == srvName2) {
					var $it2 = _g.state.serviceList.iterator();
					while( $it2.hasNext() ) {
						var s1 = $it2.next();
						if(s1.isLoggedIn) {
							_g.state.set_currentLocation(new ce.core.model.Location(s1.name,"/"));
							return;
						}
					}
					_g.state.set_currentLocation(null);
				}
			} else {
				_g.application.setLogoutButtonDisplayed(true);
				if(_g.state.serviceList.get(srvName2).account == null) _g.unifileSrv.account(srvName2,function(a) {
					_g.state.serviceList.get(srvName2).set_account(a);
				},($_=_g.errorCtrl,$bind($_,$_.setUnifileError)));
				_g.state.set_currentLocation(new ce.core.model.Location(srvName2,"/"));
			}
		};
		this.state.onDisplayModeChanged = function() {
			var _g18 = _g.state.displayMode;
			switch(_g18[1]) {
			case 0:
				_g.application.setListDisplayMode();
				break;
			case 1:
				_g.application.setIconDisplayMode();
				break;
			}
		};
		this.state.onCurrentLocationChanged = function() {
			if(_g.state.currentLocation == null) {
				_g.state.set_currentFileList(null);
				_g.application.setLogoutButtonDisplayed(false);
				_g.application.setHomeDisplayed(true);
			} else {
				var p = _g.state.currentLocation.path;
				while(p.length > 0 && p.lastIndexOf("/") == p.length - 1) p = HxOverrides.substr(p,0,p.length - 1);
				_g.application.breadcrumb.setBreadcrumbPath(_g.state.currentLocation.service,_g.state.currentLocation.path);
				_g.application.setCurrentService(_g.state.currentLocation.service);
				_g.cd(_g.state.currentLocation.service,_g.state.currentLocation.path);
			}
		};
		this.state.onCurrentFileListChanged = function() {
			_g.application.fileBrowser.resetFileList();
			_g.application.setSelecting(false);
			_g.application.setSortField(_g.state.currentSortField);
			_g.application.setSortOrder(_g.state.currentSortOrder);
			if(_g.state.currentFileList == null) {
			} else {
				if(_g.state.currentLocation.path != "/") _g.application.parentFolderBtn.set_enabled(true); else _g.application.parentFolderBtn.set_enabled(false);
				var $it3 = _g.state.currentFileList.keys();
				while( $it3.hasNext() ) {
					var fid = $it3.next();
					if(_g.state.currentFileList.get(fid).isDir) _g.application.fileBrowser.addFolder(fid,_g.state.currentFileList.get(fid).name,_g.state.currentFileList.get(fid).modified); else _g.application.fileBrowser.addFile(fid,_g.state.currentFileList.get(fid).name,ce.util.FileTools.getMimeType(_g.state.currentFileList.get(fid).name),_g.state.currentFileList.get(fid).modified);
				}
			}
		};
		this.state.onCurrentModeChanged = function() {
			if(_g.state.currentMode != null) {
				_g.application.fileBrowser.set_filters(null);
				{
					var _g19 = _g.state.currentMode;
					switch(_g19[1]) {
					case 2:case 3:
						break;
					case 0:
						var options5 = _g19[4];
						var onError7 = _g19[3];
						var onSuccess8 = _g19[2];
						if(options5 != null) {
							if((options5.mimetype != null || options5.mimetypes != null) && (options5.extension != null || options5.extensions != null)) throw "Cannot pass in both mimetype(s) and extension(s) parameters to the pick function";
							var filters = null;
							if(options5.mimetype != null || options5.mimetypes != null) {
								if(options5.mimetype != null) {
									if(options5.mimetypes != null) throw "Cannot pass in both mimetype and mimetypes parameters to the pick function";
									filters = [options5.mimetype];
								} else filters = options5.mimetypes;
							} else {
								var extensions = null;
								if(options5.extension != null) {
									if(options5.extensions != null) throw "Cannot pass in both extension and extensions parameters to the pick function";
									extensions = [options5.extension];
								} else extensions = options5.extensions;
								if(extensions != null && extensions.length > 0) {
									filters = [];
									var _g23 = 0;
									while(_g23 < extensions.length) {
										var e1 = extensions[_g23];
										++_g23;
										var mimetype = ce.util.FileTools.getMimeType(e1.indexOf(".") == 0?e1:"." + e1);
										if(mimetype != null && HxOverrides.indexOf(filters,e1,0) == -1) filters.push(mimetype);
									}
								}
							}
							if(filters != null) _g.application.fileBrowser.set_filters(filters);
						}
						break;
					case 1:
						var options6 = _g19[5];
						var input3 = _g19[4];
						var onError8 = _g19[3];
						var onSuccess9 = _g19[2];
						var ext;
						if(options6 != null && options6.mimetype != null) ext = ce.util.FileTools.getExtension(options6.mimetype); else ext = null;
						if(ext == null && options6 != null && options6.extension != null) if(options6.extension.indexOf(".") == 0) ext = options6.extension; else ext = "." + options6.extension;
						_g.application["export"].set_ext(ext != null?ext:"");
						_g.application["export"].set_exportName("");
						_g.application.setExportOverwriteDisplayed(false);
						break;
					}
				}
			}
			_g.application.setModeState(_g.state.currentMode);
		};
		this.state.onNewFolderModeChanged = function() {
			_g.application.setNewFolderDisplayed(_g.state.newFolderMode);
		};
		this.state.onCurrentSortOrderChanged = function() {
			_g.application.setSortOrder(_g.state.currentSortOrder);
			_g.application.fileBrowser.sort(_g.state.currentSortField,_g.state.currentSortOrder);
		};
		this.state.onCurrentSortFieldChanged = function() {
			_g.application.setSortField(_g.state.currentSortField);
			_g.application.setSortOrder(_g.state.currentSortOrder);
			_g.application.fileBrowser.sort(_g.state.currentSortField,_g.state.currentSortOrder);
		};
	}
	,deleteSelectedFiles: function() {
		var _g2 = this;
		var toDelCnt = 0;
		var _g = 0;
		var _g1 = this.application.fileBrowser.fileListItems;
		while(_g < _g1.length) {
			var f = _g1[_g];
			++_g;
			if(f.get_isChecked()) {
				toDelCnt++;
				var rmDirPath = this.state.currentLocation.path;
				if(rmDirPath == "/" || rmDirPath == "") rmDirPath = f.get_name(); else rmDirPath = rmDirPath + "/" + f.get_name();
				this.application.setLoaderDisplayed(true);
				this.unifileSrv.rm(this.state.currentLocation.service,rmDirPath,function() {
					toDelCnt--;
					if(toDelCnt == 0) {
						_g2.application.setLoaderDisplayed(false);
						_g2.refreshFilesList();
					}
				},($_=this.errorCtrl,$bind($_,$_.setUnifileError)));
			}
		}
	}
	,deleteFile: function(id) {
		var _g = this;
		var f = this.state.currentFileList.get(id);
		var rmDirPath = this.state.currentLocation.path;
		if(rmDirPath == "/" || rmDirPath == "") rmDirPath = f.name; else rmDirPath = rmDirPath + "/" + f.name;
		this.application.setLoaderDisplayed(true);
		this.unifileSrv.rm(this.state.currentLocation.service,rmDirPath,function() {
			_g.application.setLoaderDisplayed(false);
			_g.refreshFilesList();
		},($_=this.errorCtrl,$bind($_,$_.setUnifileError)));
	}
	,doExportFile: function() {
		{
			var _g = this.state.currentMode;
			switch(_g[1]) {
			case 1:
				var options = _g[5];
				var input = _g[4];
				var onError = _g[3];
				var onSuccess = _g[2];
				var fname = this.application["export"].get_exportName();
				if(options != null) {
					if(options.mimetype != null && ce.util.FileTools.getExtension(options.mimetype) != null) fname += ce.util.FileTools.getExtension(options.mimetype); else if(options.extension != null) if(options.extension.indexOf(".") != 0) fname += "." + options.extension; else fname += options.extension;
				}
				onSuccess({ url : this.unifileSrv.generateUrl(this.state.currentLocation.service,this.state.currentLocation.path,fname), filename : fname, mimetype : options != null && options.mimetype != null?options.mimetype:ce.util.FileTools.getMimeType(fname), size : null, key : null, container : null, isWriteable : true, path : null});
				break;
			default:
			}
		}
	}
	,cpd: function(srvName,path) {
		if(path.length > 1) {
			if(path.lastIndexOf("/") == path.length - 1) path = HxOverrides.substr(path,0,path.length - 2);
			var len = path.lastIndexOf("/") + 1;
			path = HxOverrides.substr(path,0,len);
			this.state.currentLocation.set_service(srvName);
			this.state.currentLocation.set_path(path);
		}
	}
	,refreshFilesList: function() {
		this.cd(this.state.currentLocation.service,this.state.currentLocation.path);
	}
	,cd: function(srvName,path) {
		var _g = this;
		this.application.setLoaderDisplayed(true);
		this.unifileSrv.ls(srvName,path,function(files) {
			_g.state.set_currentFileList(files);
			_g.application.setFileBrowserDisplayed(true);
			_g.application.setLoaderDisplayed(false);
		},($_=this.errorCtrl,$bind($_,$_.setUnifileError)));
	}
	,connect: function(srv) {
		var _g = this;
		if(this.state.serviceList.get(srv).isLoggedIn) {
			console.log("unexpected call to connect " + Std.string(srv));
			return;
		}
		this.application.setLoaderDisplayed(true);
		this.unifileSrv.connect(srv,function(cr) {
			_g.state.serviceList.get(srv).isConnected = true;
			_g.application.authPopup.setServerName(_g.state.serviceList.get(srv).displayName);
			_g.application.authPopup.onClicked = function() {
				_g.application.onAuthorizationWindowBlocked = function() {
					_g.application.setAuthPopupDisplayed(false);
					_g.setAlert("Popup Blocker is enabled! Please add this site to your exception list and reload the page.",0);
				};
				_g.application.onServiceAuthorizationDone = function(result) {
					_g.application.setAuthPopupDisplayed(false);
					if(_g.state.serviceList.get(srv).isOAuth) {
						if(result != null && result.notApproved != true) _g.login(srv); else _g.application.setLoaderDisplayed(false);
					} else _g.login(srv);
				};
				var authUrl;
				authUrl = cr.authorizeUrl + (cr.authorizeUrl.indexOf("?") > -1?"&":"?") + "oauth_callback=" + StringTools.urlEncode(_g.application.get_location() + (!StringTools.endsWith(_g.application.get_location(),"/") && !StringTools.startsWith(_g.config.path,"/")?"/":"") + _g.config.path + (!StringTools.endsWith(_g.config.path,"/") && _g.config.path.length > 0?"/":"") + "oauth-cb.html");
				_g.application.openAuthorizationWindow(authUrl);
			};
			_g.application.setAuthPopupDisplayed(true);
		},function(e) {
			_g.state.serviceList.get(srv).isConnected = false;
			_g.errorCtrl.manageConnectError(e.message);
		});
	}
	,login: function(srv) {
		var _g = this;
		if(!this.state.serviceList.get(srv).isLoggedIn) {
			this.application.setLoaderDisplayed(true);
			this.unifileSrv.login(srv,function(lr) {
				_g.application.setLoaderDisplayed(false);
				_g.state.serviceList.get(srv).set_isLoggedIn(true);
			},function(e) {
				_g.state.serviceList.get(srv).set_isLoggedIn(false);
				_g.errorCtrl.manageLoginError(e.message);
			});
		} else console.log("can't log into " + Std.string(srv) + " as user already logged in!");
	}
	,logout: function(srv) {
		var _g = this;
		if(this.state.serviceList.get(srv).isLoggedIn) {
			this.application.setLoaderDisplayed(true);
			this.unifileSrv.logout(srv,function(lr) {
				_g.application.setLoaderDisplayed(false);
				_g.state.serviceList.get(srv).set_isLoggedIn(false);
			},function(e) {
				_g.errorCtrl.setUnifileError(e);
			});
		} else console.log("can't log out from " + Std.string(srv) + " as user not yet logged in!");
	}
	,logoutAll: function() {
		var _g1 = this;
		this.application.setLoaderDisplayed(true);
		var loggedInSrvs = [];
		var $it0 = this.state.serviceList.iterator();
		while( $it0.hasNext() ) {
			var srv = $it0.next();
			if(srv.isLoggedIn) loggedInSrvs.push(srv.name);
		}
		var _g = 0;
		while(_g < loggedInSrvs.length) {
			var srv1 = loggedInSrvs[_g];
			++_g;
			var s = [srv1];
			this.unifileSrv.logout(s[0],(function(s) {
				return function(lr) {
					HxOverrides.remove(loggedInSrvs,s[0]);
					if(loggedInSrvs.length == 0) {
						_g1.application.setLoaderDisplayed(false);
						_g1.listServices();
					}
				};
			})(s),(function() {
				return function(e) {
					_g1.errorCtrl.setUnifileError(e);
				};
			})());
		}
	}
	,listServices: function() {
		var _g = this;
		this.application.setLoaderDisplayed(true);
		this.unifileSrv.listServices(function(slm) {
			_g.application.setLoaderDisplayed(false);
			_g.state.set_serviceList(slm);
		},function(e) {
			_g.errorCtrl.manageListSrvError(e.message);
		});
	}
	,hide: function() {
		this.state.set_displayState(false);
	}
	,show: function() {
		var goHome = true;
		if(this.state.serviceList != null) {
			var $it0 = this.state.serviceList.iterator();
			while( $it0.hasNext() ) {
				var s = $it0.next();
				if(s.isLoggedIn) {
					goHome = false;
					break;
				}
			}
		}
		if(goHome || this.state.currentFileList == null) this.listServices(); else this.application.setFileBrowserDisplayed(true);
		this.state.set_displayState(true);
	}
};
ce.core.config = {};
ce.core.config.Config = function() {
	this.path = "";
	this.unifileEndpoint = "http://localhost:6805/api/1.0/";
};
ce.core.config.Config.__name__ = true;
ce.core.config.Config.prototype = {
	readProperty: function(name,value) {
		switch(name) {
		case "unifile-url":
			this.unifileEndpoint = value;
			break;
		case "path":
			this.path = value;
			break;
		default:
			throw "Unexpected configuration property " + name;
		}
	}
};
ce.core.ctrl = {};
ce.core.ctrl.ErrorCtrl = function(parent,state,application) {
	this.parent = parent;
	this.state = state;
	this.application = application;
};
ce.core.ctrl.ErrorCtrl.__name__ = true;
ce.core.ctrl.ErrorCtrl.prototype = {
	manageListSrvError: function(msg) {
		{
			var _g = this.state.currentMode;
			switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 2:
				var onError = _g[3];
				onError(new ce.core.model.CEError(500));
				break;
			case 3:
				var onError1 = _g[3];
				onError1(new ce.core.model.CEError(500));
				this.state.set_displayState(false);
				break;
			}
		}
	}
	,manageConnectError: function(msg) {
		{
			var _g = this.state.currentMode;
			switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 3:
				var onError = _g[3];
				onError(new ce.core.model.CEError(500));
				this.state.set_displayState(false);
				break;
			case 2:
				throw "unexpected mode " + Std.string(this.state.currentMode);
				break;
			}
		}
	}
	,manageLoginError: function(msg) {
		{
			var _g = this.state.currentMode;
			switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 3:
				var onError = _g[3];
				onError(new ce.core.model.CEError(500));
				this.state.set_displayState(false);
				break;
			case 2:
				throw "unexpected mode " + Std.string(this.state.currentMode);
				break;
			}
		}
	}
	,setUnifileError: function(err) {
		if(err.code == 401) {
			var srv = this.state.currentLocation.service;
			this.state.serviceList.get(srv).set_isLoggedIn(false);
			this.parent.connect(srv);
		} else this.setError(err.message);
	}
	,setError: function(msg) {
		var _g = this;
		this.application.setLoaderDisplayed(false);
		this.application.alertPopup.setMsg(msg,0,[{ msg : "Continue", cb : function() {
			_g.application.setAlertPopupDisplayed(false);
		}}]);
		this.application.setAlertPopupDisplayed(true);
	}
};
ce.core.model = {};
ce.core.model.CEError = function(code) {
};
ce.core.model.CEError.__name__ = true;
ce.core.model.CEError.prototype = {
	toString: function() {
		return Std.string(this.code);
	}
};
ce.core.model.DisplayMode = { __ename__ : true, __constructs__ : ["List","Icons"] };
ce.core.model.DisplayMode.List = ["List",0];
ce.core.model.DisplayMode.List.toString = $estr;
ce.core.model.DisplayMode.List.__enum__ = ce.core.model.DisplayMode;
ce.core.model.DisplayMode.Icons = ["Icons",1];
ce.core.model.DisplayMode.Icons.toString = $estr;
ce.core.model.DisplayMode.Icons.__enum__ = ce.core.model.DisplayMode;
ce.core.model.Location = function(s,p) {
	this.set_service(s);
	this.set_path(p);
};
ce.core.model.Location.__name__ = true;
ce.core.model.Location.prototype = {
	onChanged: function() {
	}
	,set_service: function(v) {
		if(v == this.service) return v;
		this.service = v;
		this.onChanged();
		return this.service;
	}
	,set_path: function(v) {
		if(v == this.path) return v;
		this.path = v;
		this.onChanged();
		return this.path;
	}
	,__properties__: {set_path:"set_path",set_service:"set_service"}
};
ce.core.model.Mode = { __ename__ : true, __constructs__ : ["SingleFileSelection","SingleFileExport","IsLoggedIn","RequestAuthorize"] };
ce.core.model.Mode.SingleFileSelection = function(onSuccess,onError,options) { var $x = ["SingleFileSelection",0,onSuccess,onError,options]; $x.__enum__ = ce.core.model.Mode; $x.toString = $estr; return $x; };
ce.core.model.Mode.SingleFileExport = function(onSuccess,onError,input,options) { var $x = ["SingleFileExport",1,onSuccess,onError,input,options]; $x.__enum__ = ce.core.model.Mode; $x.toString = $estr; return $x; };
ce.core.model.Mode.IsLoggedIn = function(onSuccess,onError,srvName) { var $x = ["IsLoggedIn",2,onSuccess,onError,srvName]; $x.__enum__ = ce.core.model.Mode; $x.toString = $estr; return $x; };
ce.core.model.Mode.RequestAuthorize = function(onSuccess,onError,srvName) { var $x = ["RequestAuthorize",3,onSuccess,onError,srvName]; $x.__enum__ = ce.core.model.Mode; $x.toString = $estr; return $x; };
ce.core.model._Service = {};
ce.core.model._Service.Service_Impl_ = function() { };
ce.core.model._Service.Service_Impl_.__name__ = true;
ce.core.model._SortField = {};
ce.core.model._SortField.SortField_Impl_ = function() { };
ce.core.model._SortField.SortField_Impl_.__name__ = true;
ce.core.model._SortOrder = {};
ce.core.model._SortOrder.SortOrder_Impl_ = function() { };
ce.core.model._SortOrder.SortOrder_Impl_.__name__ = true;
ce.core.model.State = function() {
	this.currentSortOrder = null;
	this.currentSortField = null;
	this.currentMode = null;
	this.currentFileList = null;
	this.currentLocation = null;
	this.serviceList = null;
	this.displayMode = null;
	this.newFolderMode = false;
	this.displayState = false;
	this.readyState = false;
};
ce.core.model.State.__name__ = true;
ce.core.model.State.prototype = {
	onReadyStateChanged: function() {
	}
	,onDisplayStateChanged: function() {
	}
	,onServiceListChanged: function() {
	}
	,onCurrentLocationChanged: function() {
	}
	,onCurrentFileListChanged: function() {
	}
	,onCurrentModeChanged: function() {
	}
	,onNewFolderModeChanged: function() {
	}
	,onDisplayModeChanged: function() {
	}
	,onCurrentSortFieldChanged: function() {
	}
	,onCurrentSortOrderChanged: function() {
	}
	,onServiceLoginStateChanged: function(srvName) {
	}
	,set_currentSortField: function(v) {
		if(v == this.currentSortField) return this.currentSortField;
		this.currentSortField = v;
		this.set_currentSortOrder("asc");
		this.onCurrentSortFieldChanged();
		return this.currentSortField;
	}
	,set_currentSortOrder: function(v) {
		if(v == this.currentSortOrder) return this.currentSortOrder;
		this.currentSortOrder = v;
		this.onCurrentSortOrderChanged();
		return this.currentSortOrder;
	}
	,set_newFolderMode: function(v) {
		if(v == this.newFolderMode) return this.newFolderMode;
		this.newFolderMode = v;
		this.onNewFolderModeChanged();
		return this.newFolderMode;
	}
	,set_displayMode: function(v) {
		if(v == this.displayMode) return this.displayMode;
		this.displayMode = v;
		this.onDisplayModeChanged();
		return this.displayMode;
	}
	,set_serviceList: function(v) {
		var _g = this;
		if(v == this.serviceList) return v;
		this.serviceList = v;
		var $it0 = this.serviceList.iterator();
		while( $it0.hasNext() ) {
			var s = $it0.next();
			var s1 = [s];
			s1[0].onLoginStateChanged = (function(s1) {
				return function() {
					_g.onServiceLoginStateChanged(s1[0].name);
				};
			})(s1);
		}
		this.onServiceListChanged();
		return this.serviceList;
	}
	,set_currentFileList: function(v) {
		if(v == this.currentFileList) return v;
		this.currentFileList = v;
		this.set_currentSortField("name");
		this.set_currentSortOrder("asc");
		this.onCurrentFileListChanged();
		return this.currentFileList;
	}
	,set_currentMode: function(v) {
		if(v == this.currentMode) return v;
		this.currentMode = v;
		this.onCurrentModeChanged();
		return this.currentMode;
	}
	,set_readyState: function(v) {
		if(v == this.readyState) return v;
		this.readyState = v;
		this.onReadyStateChanged();
		return this.readyState;
	}
	,set_displayState: function(v) {
		if(v == this.displayState) return v;
		this.displayState = v;
		this.onDisplayStateChanged();
		return this.displayState;
	}
	,set_currentLocation: function(v) {
		var _g = this;
		if(v == this.currentLocation) return v;
		this.currentLocation = v;
		if(this.currentLocation != null) this.currentLocation.onChanged = function() {
			_g.onCurrentLocationChanged();
		};
		this.onCurrentLocationChanged();
		return this.currentLocation;
	}
	,__properties__: {set_currentSortOrder:"set_currentSortOrder",set_currentSortField:"set_currentSortField",set_currentMode:"set_currentMode",set_currentFileList:"set_currentFileList",set_currentLocation:"set_currentLocation",set_serviceList:"set_serviceList",set_displayMode:"set_displayMode",set_newFolderMode:"set_newFolderMode",set_displayState:"set_displayState",set_readyState:"set_readyState"}
};
ce.core.model.unifile = {};
ce.core.model.unifile.Service = function(n,dn,$is,d,v,il,ic,ioa,a) {
	this.name = n;
	this.displayName = dn;
	this.imageSmall = $is;
	this.description = d;
	this.visible = v;
	this.set_isLoggedIn(il);
	this.isConnected = ic;
	this.isOAuth = ioa;
	this.set_account(a);
};
ce.core.model.unifile.Service.__name__ = true;
ce.core.model.unifile.Service.prototype = {
	onLoginStateChanged: function() {
	}
	,onAccountChanged: function() {
	}
	,set_isLoggedIn: function(v) {
		if(v == this.isLoggedIn) return v;
		this.isLoggedIn = v;
		this.onLoginStateChanged();
		return this.isLoggedIn;
	}
	,set_account: function(v) {
		if(v == this.account) return v;
		this.account = v;
		this.onAccountChanged();
		return this.account;
	}
	,__properties__: {set_account:"set_account",set_isLoggedIn:"set_isLoggedIn"}
};
ce.core.parser = {};
ce.core.parser.json = {};
ce.core.parser.json.Json2Primitive = function() { };
ce.core.parser.json.Json2Primitive.__name__ = true;
ce.core.parser.json.Json2Primitive.checkPath = function(node,path,optional) {
	if(optional == null) optional = false;
	var pathes = path.split(".");
	var n = ce.core.parser.json.Json2Primitive.doCheckPath(node,pathes,optional);
	if(n == null && !optional) console.log(path + " not found !");
	return n;
};
ce.core.parser.json.Json2Primitive.doCheckPath = function(node,pathes,optional) {
	if(optional == null) optional = false;
	var p = pathes.shift();
	if(!Object.prototype.hasOwnProperty.call(node,p) || Reflect.field(node,p) == null) {
		if(!optional) console.log(p + " not found !");
		return null;
	}
	if(pathes.length > 0) return ce.core.parser.json.Json2Primitive.doCheckPath(Reflect.field(node,p),pathes,optional);
	return Reflect.field(node,p);
};
ce.core.parser.json.Json2Primitive.node2String = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	var n = ce.core.parser.json.Json2Primitive.checkPath(node,path,nullable);
	if(n == null) {
		if(!nullable) {
		}
		return null;
	}
	return Std.string(n);
};
ce.core.parser.json.Json2Primitive.node2Float = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	return Std.parseFloat(ce.core.parser.json.Json2Primitive.node2String(node,path,nullable));
};
ce.core.parser.json.Json2Primitive.node2Int = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	return Std.parseInt(ce.core.parser.json.Json2Primitive.node2String(node,path,nullable));
};
ce.core.parser.json.Json2Primitive.node2Bool = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	var v = ce.core.parser.json.Json2Primitive.node2String(node,path,nullable);
	if(v != null) return v == "true" || v == "1"; else return false;
};
ce.core.parser.oauth = {};
ce.core.parser.oauth.Str2OAuthResult = function() { };
ce.core.parser.oauth.Str2OAuthResult.__name__ = true;
ce.core.parser.oauth.Str2OAuthResult.parse = function(dataStr) {
	if(dataStr.indexOf("?") == 0) dataStr = HxOverrides.substr(dataStr,1,null);
	var dataArr = dataStr.split("&");
	var res = { };
	var _g = 0;
	while(_g < dataArr.length) {
		var pStr = dataArr[_g];
		++_g;
		var kv = pStr.split("=");
		res = ce.core.parser.oauth.Str2OAuthResult.parseValue(res,kv[0],kv[1]);
	}
	return res;
};
ce.core.parser.oauth.Str2OAuthResult.parseValue = function(obj,key,value) {
	switch(key) {
	case "not_approved":
		if(value.toLowerCase() == "true" || value == "1") obj.notApproved = true; else obj.notApproved = false;
		break;
	case "oauth_token":
		obj.oauthToken = value;
		break;
	case "uid":
		obj.uid = value;
		break;
	default:
		throw "unexpected parameter " + key;
	}
	return obj;
};
ce.core.parser.unifile = {};
ce.core.parser.unifile.Json2Account = function() { };
ce.core.parser.unifile.Json2Account.__name__ = true;
ce.core.parser.unifile.Json2Account.parseAccount = function(dataStr,obj) {
	if(obj == null) {
		if(dataStr == null) return null;
		obj = JSON.parse(dataStr);
	}
	return { displayName : ce.core.parser.json.Json2Primitive.node2String(obj,"display_name",false), quotaInfo : Object.prototype.hasOwnProperty.call(obj,"quota_info")?ce.core.parser.unifile.Json2Account.parseQuotaInfo(Reflect.field(obj,"quota_info")):null};
};
ce.core.parser.unifile.Json2Account.parseQuotaInfo = function(obj) {
	return { available : ce.core.parser.json.Json2Primitive.node2Int(obj,"available",false), used : ce.core.parser.json.Json2Primitive.node2Int(obj,"used",false)};
};
ce.core.parser.unifile.Json2ConnectResult = function() { };
ce.core.parser.unifile.Json2ConnectResult.__name__ = true;
ce.core.parser.unifile.Json2ConnectResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce.core.parser.json.Json2Primitive.node2Bool(obj,"success",false), message : ce.core.parser.json.Json2Primitive.node2String(obj,"message",false), authorizeUrl : ce.core.parser.json.Json2Primitive.node2String(obj,"authorize_url",false)};
};
ce.core.parser.unifile.Json2File = function() { };
ce.core.parser.unifile.Json2File.__name__ = true;
ce.core.parser.unifile.Json2File.parseFileCollection = function(dataStr) {
	var col = JSON.parse(dataStr);
	var fileCol = new Array();
	var _g = 0;
	while(_g < col.length) {
		var f = col[_g];
		++_g;
		fileCol.push(ce.core.parser.unifile.Json2File.parseFile(f));
	}
	return fileCol;
};
ce.core.parser.unifile.Json2File.parseFile = function(obj) {
	var dStr = ce.core.parser.json.Json2Primitive.node2String(obj,"modified",false);
	return { name : ce.core.parser.json.Json2Primitive.node2String(obj,"name",false), bytes : ce.core.parser.json.Json2Primitive.node2Int(obj,"bytes",false), modified : dStr != null?(function($this) {
		var $r;
		var t = new Date(dStr).getTime();
		var d = new Date();
		d.setTime(t);
		$r = d;
		return $r;
	}(this)):null, isDir : ce.core.parser.json.Json2Primitive.node2Bool(obj,"is_dir",false)};
};
ce.core.parser.unifile.Json2LoginResult = function() { };
ce.core.parser.unifile.Json2LoginResult.__name__ = true;
ce.core.parser.unifile.Json2LoginResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce.core.parser.json.Json2Primitive.node2Bool(obj,"success",false)};
};
ce.core.parser.unifile.Json2LogoutResult = function() { };
ce.core.parser.unifile.Json2LogoutResult.__name__ = true;
ce.core.parser.unifile.Json2LogoutResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce.core.parser.json.Json2Primitive.node2Bool(obj,"success",false), message : ce.core.parser.json.Json2Primitive.node2String(obj,"message",false)};
};
ce.core.parser.unifile.Json2Service = function() { };
ce.core.parser.unifile.Json2Service.__name__ = true;
ce.core.parser.unifile.Json2Service.parseServiceCollection = function(dataStr) {
	var col = JSON.parse(dataStr);
	var serviceCol = new Array();
	var _g = 0;
	while(_g < col.length) {
		var s = col[_g];
		++_g;
		serviceCol.push(ce.core.parser.unifile.Json2Service.parseService(s));
	}
	return serviceCol;
};
ce.core.parser.unifile.Json2Service.parseService = function(obj) {
	return new ce.core.model.unifile.Service(ce.core.parser.json.Json2Primitive.node2String(obj,"name",false),ce.core.parser.json.Json2Primitive.node2String(obj,"display_name",false),ce.core.parser.json.Json2Primitive.node2String(obj,"image_small",false),ce.core.parser.json.Json2Primitive.node2String(obj,"description",false),ce.core.parser.json.Json2Primitive.node2Bool(obj,"visible",false),ce.core.parser.json.Json2Primitive.node2Bool(obj,"isLoggedIn",false),ce.core.parser.json.Json2Primitive.node2Bool(obj,"isConnected",false),ce.core.parser.json.Json2Primitive.node2Bool(obj,"isOAuth",false),Object.prototype.hasOwnProperty.call(obj,"user")?ce.core.parser.unifile.Json2Account.parseAccount(null,Reflect.field(obj,"user")):null);
};
ce.core.parser.unifile.Json2UnifileError = function() { };
ce.core.parser.unifile.Json2UnifileError.__name__ = true;
ce.core.parser.unifile.Json2UnifileError.parseUnifileError = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce.core.parser.json.Json2Primitive.node2Bool(obj,"success",false), code : ce.core.parser.json.Json2Primitive.node2Int(obj,"code",false), message : ce.core.parser.json.Json2Primitive.node2String(obj,"message",false)};
};
ce.core.parser.unifile.Json2UploadResult = function() { };
ce.core.parser.unifile.Json2UploadResult.__name__ = true;
ce.core.parser.unifile.Json2UploadResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce.core.parser.json.Json2Primitive.node2Bool(obj,"success",false)};
};
ce.core.service = {};
ce.core.service.UnifileSrv = function(config) {
	this.config = config;
};
ce.core.service.UnifileSrv.__name__ = true;
ce.core.service.UnifileSrv.prototype = {
	generateUrl: function(srv,path,filename) {
		return this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/get/{uri}","{srv}",srv),"{uri}",path.length > 1?HxOverrides.substr(path,1,null) + filename:filename);
	}
	,explodeUrl: function(url) {
		if(url.indexOf(this.config.unifileEndpoint) != 0) throw "ERROR: can't convert url to path: " + url;
		var parsedUrl = HxOverrides.substr(url,this.config.unifileEndpoint.length,null);
		if(parsedUrl.indexOf("/exec/get/") != parsedUrl.indexOf("/")) throw "ERROR: can't convert url to path: " + url;
		var srv;
		var len = parsedUrl.indexOf("/");
		srv = HxOverrides.substr(parsedUrl,0,len);
		var pos = parsedUrl.indexOf("/exec/get/") + "/exec/get/".length;
		parsedUrl = HxOverrides.substr(parsedUrl,pos,null);
		var filename = "";
		var path = "";
		if(parsedUrl.lastIndexOf("/") > -1) {
			var pos1 = parsedUrl.lastIndexOf("/") + 1;
			filename = HxOverrides.substr(parsedUrl,pos1,null);
			var len1 = parsedUrl.lastIndexOf("/") + 1;
			path = HxOverrides.substr(parsedUrl,0,len1);
		} else filename = parsedUrl;
		return { srv : srv, path : path, filename : filename};
	}
	,listServices: function(onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else {
				var sl = ce.core.parser.unifile.Json2Service.parseServiceCollection(req.responseText);
				var slm = new haxe.ds.StringMap();
				var _g = 0;
				while(_g < sl.length) {
					var s = sl[_g];
					++_g;
					slm.set(s.name,s);
				}
				onSuccess(slm);
			}
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + "services/list");
		req.send();
	}
	,connect: function(srv,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce.core.parser.unifile.Json2ConnectResult.parse(req.responseText));
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace("{srv}/connect","{srv}",srv));
		req.send();
	}
	,login: function(srv,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce.core.parser.unifile.Json2LoginResult.parse(req.responseText));
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace("{srv}/login","{srv}",srv));
		req.send();
	}
	,account: function(srv,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce.core.parser.unifile.Json2Account.parseAccount(req.responseText));
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("POST",this.config.unifileEndpoint + StringTools.replace("{srv}/account","{srv}",srv));
		req.send();
	}
	,logout: function(srv,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce.core.parser.unifile.Json2LogoutResult.parse(req.responseText));
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace("{srv}/logout","{srv}",srv));
		req.send();
	}
	,ls: function(srv,path,onSuccess,onError) {
		if(path == "/") path = ""; else path = path;
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else {
				var fa = ce.core.parser.unifile.Json2File.parseFileCollection(req.responseText);
				var fsm = new haxe.ds.StringMap();
				var _g = 0;
				while(_g < fa.length) {
					var f = fa[_g];
					++_g;
					fsm.set(f.name,f);
				}
				onSuccess(fsm);
			}
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/ls/{path}","{srv}",srv),"{path}",path),true);
		req.send();
	}
	,rm: function(srv,path,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess();
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/rm/{path}","{srv}",srv),"{path}",path),true);
		req.send();
	}
	,mkdir: function(srv,path,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess();
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/mkdir/{path}","{srv}",srv),"{path}",path));
		req.send();
	}
	,cp: function() {
	}
	,mv: function(srv,oldPath,newPath,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess();
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/mv/{path}","{srv}",srv),"{path}",oldPath + ":" + newPath));
		req.send();
	}
	,upload: function(blobs,files,srv,path,onSuccess,onError) {
		if(path != "" && path.lastIndexOf("/") != path.length - 1) path += "/";
		var formData = new FormData();
		if(files != null) {
			var _g = 0;
			while(_g < files.length) {
				var f = files[_g];
				++_g;
				if(Reflect.isObject(f)) {
					console.log("appended " + f.name);
					formData.append('data', f, f.name);;
				}
			}
		}
		if(blobs != null) {
			if(Lambda.count(blobs) == 1) path += blobs.keys().next();
			var $it0 = blobs.keys();
			while( $it0.hasNext() ) {
				var fn = $it0.next();
				formData.append('data', blobs.get(fn), fn);;
			}
		}
		var xhttp = new XMLHttpRequest();
		xhttp.open("POST",this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/put/{path}","{srv}",srv),"{path}",path));
		xhttp.onload = function(_) {
			if(xhttp.status == 200) onSuccess(); else {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(xhttp.responseText);
				onError(err);
			}
		};
		xhttp.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		xhttp.send(formData);
	}
	,get: function(url,onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce.core.parser.unifile.Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(req.responseText);
		};
		req.onerror = function(_1) {
			onError({ success : false, code : 0, message : "The request has failed."});
		};
		req.open("GET",url);
		req.send();
	}
};
ce.core.view = {};
ce.core.view.AlertPopup = function(elt) {
	this.elt = elt;
	this.txtElt = elt.querySelector(".txt");
	this.choiceTmpl = this.txtElt.querySelector(".choice");
	this.txtElt.removeChild(this.choiceTmpl);
	this.choicesElts = [];
};
ce.core.view.AlertPopup.__name__ = true;
ce.core.view.AlertPopup.prototype = {
	setMsg: function(msg,level,choices) {
		if(level == null) level = 2;
		var _g = this;
		while(this.choicesElts.length > 0) this.txtElt.removeChild(this.choicesElts.pop());
		this.txtElt.textContent = msg;
		if(choices != null) {
			var _g1 = 0;
			while(_g1 < choices.length) {
				var c = choices[_g1];
				++_g1;
				var nc = this.choiceTmpl.cloneNode(true);
				var tc = [c];
				nc.textContent = tc[0].msg;
				nc.addEventListener("click",(function(tc) {
					return function(_) {
						tc[0].cb();
					};
				})(tc));
				this.txtElt.appendChild(nc);
			}
		}
		switch(level) {
		case 0:
			ce.util.HtmlTools.toggleClass(this.elt,"error",true);
			ce.util.HtmlTools.toggleClass(this.elt,"warning",false);
			break;
		case 1:
			ce.util.HtmlTools.toggleClass(this.elt,"error",false);
			ce.util.HtmlTools.toggleClass(this.elt,"warning",true);
			break;
		default:
			ce.util.HtmlTools.toggleClass(this.elt,"error",false);
			ce.util.HtmlTools.toggleClass(this.elt,"warning",false);
		}
		haxe.Timer.delay(function() {
			_g.txtElt.style.marginTop = "-" + Std.string(_g.txtElt.offsetHeight / 2 + 20) + "px";
		},0);
	}
};
ce.core.view.Application = function(iframe,config) {
	this.iframe = iframe;
	this.config = config;
	this.initFrame();
	ce.core.view.Application.oauthCbListener = $bind(this,this.listenOAuthCb);
};
ce.core.view.Application.__name__ = true;
ce.core.view.Application.oauthCb = $hx_exports.CEoauthCb = function(pStr) {
	if(ce.core.view.Application.oauthCbListener != null) ce.core.view.Application.oauthCbListener(pStr);
};
ce.core.view.Application.prototype = {
	onClicked: function() {
	}
	,onSortBtnClicked: function(f) {
	}
	,onViewReady: function() {
	}
	,onLogoutClicked: function() {
	}
	,onCloseClicked: function() {
	}
	,onServiceLoginRequest: function(name) {
	}
	,onServiceLogoutRequest: function(name) {
	}
	,onServiceClicked: function(name) {
	}
	,onFileClicked: function(id) {
	}
	,onFileSelectClicked: function(id) {
	}
	,onFileDeleteClicked: function(id) {
	}
	,onFileRenameRequested: function(id,value) {
	}
	,onFileCheckedStatusChanged: function(id) {
	}
	,onNavBtnClicked: function(srv,path) {
	}
	,onAuthorizationWindowBlocked: function() {
	}
	,onServiceAuthorizationDone: function(r) {
	}
	,onSaveExportClicked: function() {
	}
	,onOverwriteExportClicked: function() {
	}
	,onExportNameChanged: function() {
	}
	,onInputFilesChanged: function() {
	}
	,onFilesDropped: function(files) {
	}
	,onNewFolderClicked: function() {
	}
	,onParentFolderClicked: function() {
	}
	,onItemsListClicked: function() {
	}
	,onItemsIconClicked: function() {
	}
	,onDeleteClicked: function() {
	}
	,onNewFolderName: function() {
	}
	,setCurrentService: function(s) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"srv-" + Std.string("dropbox"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"srv-" + Std.string("ftp"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"srv-" + Std.string("www"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"srv-" + Std.string(s),true);
	}
	,setSortField: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"sortedby-" + Std.string("name"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"sortedby-" + Std.string("type"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"sortedby-" + Std.string("lastUpdate"),false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"sortedby-" + v,true);
	}
	,setSortOrder: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"asc",false);
		ce.util.HtmlTools.toggleClass(this.rootElt,"desc",false);
		ce.util.HtmlTools.toggleClass(this.rootElt,v,true);
	}
	,setListDisplayMode: function() {
		ce.util.HtmlTools.toggleClass(this.rootElt,"items-list",true);
		ce.util.HtmlTools.toggleClass(this.rootElt,"items-icons",false);
	}
	,setIconDisplayMode: function() {
		ce.util.HtmlTools.toggleClass(this.rootElt,"items-icons",true);
		ce.util.HtmlTools.toggleClass(this.rootElt,"items-list",false);
	}
	,setDisplayed: function(v) {
		if(v) this.iframe.style.display = "block"; else this.iframe.style.display = "none";
	}
	,setLoaderDisplayed: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"loading",v);
	}
	,setLogoutButtonDisplayed: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"loggedin",v);
	}
	,setHomeDisplayed: function(v) {
		if(v) this.cleanPreviousState();
		ce.util.HtmlTools.toggleClass(this.rootElt,"starting",v);
	}
	,setFileBrowserDisplayed: function(v) {
		if(v) this.cleanPreviousState();
		ce.util.HtmlTools.toggleClass(this.rootElt,"browsing",v);
	}
	,setExportOverwriteDisplayed: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"export-overwriting",v);
	}
	,setAuthPopupDisplayed: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"authorizing",v);
	}
	,setAlertPopupDisplayed: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"alerting",v);
	}
	,setNewFolderDisplayed: function(v) {
		if(!v) this.fileBrowser.set_newFolderName("");
		ce.util.HtmlTools.toggleClass(this.rootElt,"making-new-folder",v);
		if(v) this.fileBrowser.focusOnNewFolder();
	}
	,setSelecting: function(v) {
		ce.util.HtmlTools.toggleClass(this.rootElt,"selecting",v);
	}
	,openAuthorizationWindow: function(url) {
		var _g = this;
		var authPopup = window.open(url,"authPopup","height=829,width=1035");
		if(authPopup == null || authPopup.closed || authPopup.closed == null) this.onAuthorizationWindowBlocked(); else {
			if($bind(authPopup,authPopup.focus) != null) authPopup.focus();
			var timer = new haxe.Timer(500);
			timer.run = function() {
				if(authPopup.closed) {
					timer.stop();
					_g.onServiceAuthorizationDone();
				}
			};
		}
	}
	,setModeState: function(v) {
		var cms = this.currentModeState();
		if(cms != null) ce.util.HtmlTools.toggleClass(this.rootElt,cms,false);
		if(v != null) switch(v[1]) {
		case 0:
			ce.util.HtmlTools.toggleClass(this.rootElt,"single-file-sel-mode",true);
			break;
		case 1:
			ce.util.HtmlTools.toggleClass(this.rootElt,"single-file-exp-mode",true);
			break;
		case 2:
			ce.util.HtmlTools.toggleClass(this.rootElt,"is-logged-in-mode",true);
			break;
		case 3:
			ce.util.HtmlTools.toggleClass(this.rootElt,"request-authorize-mode",true);
			break;
		}
	}
	,get_location: function() {
		if(this.iframe == null) return null;
		return this.iframe.contentDocument.location.origin;
	}
	,listenOAuthCb: function(pStr) {
		var o = ce.core.parser.oauth.Str2OAuthResult.parse(pStr);
		this.onServiceAuthorizationDone(o);
	}
	,currentModeState: function() {
		var _g = 0;
		var _g1 = this.rootElt.className.split(" ");
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			if(Lambda.has(["single-file-sel-mode","single-file-exp-mode"],c)) return c;
		}
		return null;
	}
	,currentState: function() {
		var _g = 0;
		var _g1 = this.rootElt.className.split(" ");
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			if(Lambda.has(["starting","browsing"],c)) return c;
		}
		return null;
	}
	,cleanPreviousState: function() {
		var cs = this.currentState();
		ce.util.HtmlTools.toggleClass(this.rootElt,"authorizing",false);
		if(cs != null) ce.util.HtmlTools.toggleClass(this.rootElt,cs,false);
	}
	,initFrame: function() {
		var _g = this;
		this.iframe.style.display = "none";
		this.iframe.style.position = "absolute";
		this.iframe.style.top = this.iframe.style.left = "0";
		this.iframe.style.width = this.iframe.style.height = "100%";
		this.iframe.onload = function(_) {
			_g.initElts();
		};
		this.iframe.src = this.config.path + "cloud-explorer.html";
	}
	,initElts: function() {
		var _g = this;
		this.rootElt = this.iframe.contentDocument.getElementById("cloud-explorer");
		this.logoutBtn = new ce.core.view.Button(this.rootElt.querySelector(".logoutBtn"));
		this.logoutBtn.onClicked = $bind(this,this.onLogoutClicked);
		this.closeBtn = new ce.core.view.Button(this.rootElt.querySelector(".closeBtn"));
		this.closeBtn.onClicked = $bind(this,this.onCloseClicked);
		this.breadcrumb = new ce.core.view.Breadcrumb(this.rootElt.querySelector(".breadcrumb"));
		this.breadcrumb.onNavBtnClicked = function(srv,path) {
			_g.onNavBtnClicked(srv,path);
		};
		this["export"] = new ce.core.view.Export(this.rootElt.querySelector(".export"));
		this["export"].onSaveBtnClicked = function() {
			_g.onSaveExportClicked();
		};
		this["export"].onOverwriteBtnClicked = function() {
			_g.onOverwriteExportClicked();
		};
		this["export"].onExportNameChanged = function() {
			_g.onExportNameChanged();
		};
		this.home = new ce.core.view.Home(this.rootElt.querySelector(".home"));
		this.home.onServiceClicked = function(name) {
			_g.onServiceClicked(name);
		};
		this.fileBrowser = new ce.core.view.FileBrowser(this.rootElt.querySelector(".fileBrowser"));
		this.fileBrowser.onServiceLogoutRequest = function(name1) {
			_g.onServiceLogoutRequest(name1);
		};
		this.fileBrowser.onServiceLoginRequest = function(name2) {
			_g.onServiceLoginRequest(name2);
		};
		this.fileBrowser.onServiceClicked = function(name3) {
			_g.onServiceClicked(name3);
		};
		this.fileBrowser.onFileClicked = function(id) {
			_g.onFileClicked(id);
		};
		this.fileBrowser.onFileSelectClicked = function(id1) {
			_g.onFileSelectClicked(id1);
		};
		this.fileBrowser.onFileDeleteClicked = function(id2) {
			_g.onFileDeleteClicked(id2);
		};
		this.fileBrowser.onFileCheckedStatusChanged = function(id3) {
			_g.onFileCheckedStatusChanged(id3);
		};
		this.fileBrowser.onFileRenameRequested = function(id4,value) {
			_g.onFileRenameRequested(id4,value);
		};
		this.fileBrowser.onNewFolderName = function() {
			_g.onNewFolderName();
		};
		this.fileBrowser.onSortBtnClicked = function(f) {
			_g.onSortBtnClicked(f);
		};
		this.dropzone = new ce.core.view.DropZone(this.rootElt.querySelector(".dropzone"));
		this.dropzone.onInputFilesChanged = function() {
			_g.onInputFilesChanged();
		};
		this.dropzone.onFilesDropped = function(files) {
			_g.onFilesDropped(files);
		};
		this.authPopup = new ce.core.view.AuthPopup(this.rootElt.querySelector(".authPopup"));
		this.alertPopup = new ce.core.view.AlertPopup(this.rootElt.querySelector(".alertPopup"));
		this.newFolderBtn = new ce.core.view.Button(this.rootElt.querySelector(".newFolderBtn"));
		this.newFolderBtn.onClicked = $bind(this,this.onNewFolderClicked);
		this.parentFolderBtn = new ce.core.view.Button(this.rootElt.querySelector(".parentFolderBtn"));
		this.parentFolderBtn.onClicked = $bind(this,this.onParentFolderClicked);
		this.itemsListBtn = new ce.core.view.Button(this.rootElt.querySelector(".listItemsBtn"));
		this.itemsListBtn.onClicked = $bind(this,this.onItemsListClicked);
		this.itemsIconBtn = new ce.core.view.Button(this.rootElt.querySelector(".iconItemsBtn"));
		this.itemsIconBtn.onClicked = $bind(this,this.onItemsIconClicked);
		this.deleteBtn = new ce.core.view.Button(this.rootElt.querySelector(".deleteBtn"));
		this.deleteBtn.onClicked = $bind(this,this.onDeleteClicked);
		this.rootElt.addEventListener("click",function(_) {
			_g.onClicked();
		});
		this.onViewReady();
	}
	,__properties__: {get_location:"get_location"}
};
ce.core.view.AuthPopup = function(elt) {
	var _g = this;
	this.elt = elt;
	this.linkElt = elt.querySelector("a");
	this.linkElt.addEventListener("click",function(_) {
		_g.onClicked();
	});
	this.textElt = elt.querySelector("span");
	this.txtTmpl = this.textElt.textContent;
};
ce.core.view.AuthPopup.__name__ = true;
ce.core.view.AuthPopup.prototype = {
	onClicked: function() {
	}
	,setServerName: function(srvName) {
		this.textElt.textContent = StringTools.replace(this.txtTmpl,"{srvName}",srvName);
	}
};
ce.core.view.Breadcrumb = function(elt) {
	this.elt = elt;
	this.pathItemTmpl = elt.querySelector("span.pathIt");
	elt.removeChild(this.pathItemTmpl);
	this.pathSepTmpl = elt.querySelector("span.sep");
	elt.removeChild(this.pathSepTmpl);
};
ce.core.view.Breadcrumb.__name__ = true;
ce.core.view.Breadcrumb.prototype = {
	onNavBtnClicked: function(srv,path) {
	}
	,setBreadcrumbPath: function(srv,path) {
		var _g = this;
		while(this.elt.childNodes.length > 0) this.elt.removeChild(this.elt.firstChild);
		var srvIt = this.pathItemTmpl.cloneNode(true);
		srvIt.addEventListener("click",function(_) {
			_g.onNavBtnClicked(srv,"/");
		});
		srvIt.textContent = srv;
		this.elt.appendChild(srvIt);
		var pathItems = [];
		if(path.length > 0) {
			var parr = path.split("/");
			while(parr.length > 0) {
				var itPath = ["/" + parr.join("/") + "/"];
				var pit = parr.pop();
				if(StringTools.trim(pit) != "") {
					var nit = this.pathItemTmpl.cloneNode(true);
					nit.addEventListener("click",(function(itPath) {
						return function(_1) {
							_g.onNavBtnClicked(srv,itPath[0]);
						};
					})(itPath));
					nit.textContent = pit;
					pathItems.push(nit);
				}
			}
		}
		while(pathItems.length > 0) {
			this.elt.appendChild(this.pathSepTmpl.cloneNode(true));
			this.elt.appendChild(pathItems.pop());
		}
	}
};
ce.core.view.Button = function(elt) {
	var _g = this;
	this.elt = elt;
	this.elt.addEventListener("click",function(_) {
		_g.onClicked();
	});
};
ce.core.view.Button.__name__ = true;
ce.core.view.Button.prototype = {
	onClicked: function() {
	}
	,get_enabled: function() {
		return !this.elt.hasAttribute("disabled");
	}
	,set_enabled: function(v) {
		if(v && this.elt.hasAttribute("disabled")) this.elt.removeAttribute("disabled");
		if(!v && !this.elt.hasAttribute("disabled")) this.elt.setAttribute("disabled","disabled");
		return v;
	}
	,__properties__: {set_enabled:"set_enabled",get_enabled:"get_enabled"}
};
ce.core.view.DropZone = function(elt) {
	var _g = this;
	this.elt = elt;
	this.inputElt = elt.querySelector("div input");
	this.inputElt.addEventListener("change",function(_) {
		_g.onInputFilesChanged();
	});
	this.btnElt = elt.querySelector("div button");
	this.btnElt.addEventListener("click",function(_1) {
		_g.onBtnClicked();
	});
	this.elt.addEventListener("dragover",function(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
		return false;
	});
	this.elt.addEventListener("dragenter",function(e1) {
		ce.util.HtmlTools.toggleClass(_g.elt,"draggingover",true);
	});
	this.elt.addEventListener("dragleave",function(e2) {
		ce.util.HtmlTools.toggleClass(_g.elt,"draggingover",false);
	});
	this.elt.addEventListener("drop",function(e3) {
		e3.preventDefault();
		e3.stopPropagation();
		ce.util.HtmlTools.toggleClass(_g.elt,"draggingover",false);
		var fileList = e3.dataTransfer.files;
		if(fileList.length > 0) _g.onFilesDropped(fileList);
	});
};
ce.core.view.DropZone.__name__ = true;
ce.core.view.DropZone.prototype = {
	onInputFilesChanged: function() {
	}
	,onFilesDropped: function(files) {
	}
	,onBtnClicked: function() {
		this.inputElt.click();
	}
};
ce.core.view.Export = function(elt) {
	var _g = this;
	this.elt = elt;
	this.inputElt = elt.querySelector("input");
	this.inputElt.addEventListener("input",function(_) {
		_g.onExportNameChanged();
	});
	this.pathElt = elt.querySelector("span.path");
	this.extElt = elt.querySelector("span.ext");
	this.saveBtnElt = elt.querySelector(".saveBtn");
	this.saveBtnElt.addEventListener("click",function(_1) {
		_g.onSaveBtnClicked();
	});
	this.overwriteBtnElt = elt.querySelector(".overwriteBtn");
	this.overwriteBtnElt.addEventListener("click",function(_2) {
		_g.onOverwriteBtnClicked();
	});
};
ce.core.view.Export.__name__ = true;
ce.core.view.Export.prototype = {
	onNavBtnClicked: function(srv,path) {
	}
	,onSaveBtnClicked: function() {
	}
	,onOverwriteBtnClicked: function() {
	}
	,onExportNameChanged: function() {
	}
	,get_exportName: function() {
		return this.inputElt.value;
	}
	,set_exportName: function(v) {
		this.inputElt.value = v;
		return v;
	}
	,set_ext: function(v) {
		this.extElt.textContent = v;
		return v;
	}
	,set_path: function(v) {
		this.pathElt.textContent = v;
		return v;
	}
	,__properties__: {set_path:"set_path",set_ext:"set_ext",set_exportName:"set_exportName",get_exportName:"get_exportName"}
};
ce.core.view.FileBrowser = function(elt) {
	var _g = this;
	this.elt = elt;
	this.srvItemElts = new haxe.ds.StringMap();
	this.srvListElt = elt.querySelector(".services ul");
	this.srvItemTmpl = this.srvListElt.querySelector("li");
	this.srvListElt.removeChild(this.srvItemTmpl);
	this.fileListElt = elt.querySelector(".files ul");
	this.fileItemTmpl = this.fileListElt.querySelector(".file");
	this.fileListElt.removeChild(this.fileItemTmpl);
	this.newFolderItem = this.fileListElt.querySelector(".folder.new");
	this.newFolderInput = this.newFolderItem.querySelector("input");
	this.newFolderInput.addEventListener("keydown",function(e) {
		if(e.keyIdentifier != null && e.keyIdentifier.toLowerCase() == "enter" || e.key != null && e.key.toLowerCase() == "enter") _g.onNewFolderName();
	});
	this.newFolderInput.addEventListener("focusout",function(_) {
		_g.onNewFolderName();
	});
	this.folderItemTmpl = this.fileListElt.querySelector(".folder:nth-last-child(-n+1)");
	this.fileListElt.removeChild(this.folderItemTmpl);
	var nameBtn = elt.querySelector(".titles .fileName");
	nameBtn.addEventListener("click",function(_1) {
		_g.onSortBtnClicked("name");
	});
	var typeBtn = elt.querySelector(".titles .fileType");
	typeBtn.addEventListener("click",function(_2) {
		_g.onSortBtnClicked("type");
	});
	var dateBtn = elt.querySelector(".titles .lastUpdate");
	dateBtn.addEventListener("click",function(_3) {
		_g.onSortBtnClicked("lastUpdate");
	});
	this.fileListItems = [];
	this.set_filters(null);
};
ce.core.view.FileBrowser.__name__ = true;
ce.core.view.FileBrowser.prototype = {
	onServiceLoginRequest: function(name) {
	}
	,onServiceLogoutRequest: function(name) {
	}
	,onServiceClicked: function(name) {
	}
	,onFileSelected: function(id) {
	}
	,onFileClicked: function(id) {
	}
	,onFileSelectClicked: function(id) {
	}
	,onFileDeleteClicked: function(id) {
	}
	,onFileCheckedStatusChanged: function(id) {
	}
	,onFileRenameRequested: function(id,value) {
	}
	,onNewFolderName: function() {
	}
	,onSortBtnClicked: function(field) {
	}
	,resetList: function() {
		while(this.srvListElt.childNodes.length > 0) this.srvListElt.removeChild(this.srvListElt.childNodes.item(0));
	}
	,removeService: function(name) {
		this.srvListElt.removeChild(this.srvItemElts.get(name));
	}
	,addService: function(name,displayName,connected) {
		var _g = this;
		var newItem = this.srvItemTmpl.cloneNode(true);
		newItem.className = name;
		newItem.addEventListener("click",function(_) {
			_g.onServiceClicked(name);
		});
		var lis = newItem.querySelectorAll("ul.contextMenu li");
		var _g1 = 0;
		var _g2 = lis.length;
		while(_g1 < _g2) {
			var i = _g1++;
			var li = [lis[i]];
			li[0].textContent = StringTools.replace(li[0].textContent,"{srvName}",displayName);
			li[0].addEventListener("click",(function(li) {
				return function(e) {
					e.stopPropagation();
					if(li[0].classList.contains("login")) _g.onServiceLoginRequest(name); else if(li[0].classList.contains("logout")) _g.onServiceLogoutRequest(name);
				};
			})(li));
		}
		this.srvListElt.appendChild(newItem);
		this.srvItemElts.set(name,newItem);
		if(connected) this.setSrvConnected(name,connected);
	}
	,setSrvConnected: function(name,connected) {
		ce.util.HtmlTools.toggleClass(this.srvItemElts.get(name),"connected",connected);
	}
	,resetFileList: function() {
		while(this.fileListItems.length > 0) this.fileListElt.removeChild(this.fileListItems.pop().elt);
	}
	,addFolder: function(id,name,lastUpdate,selectable) {
		if(selectable == null) selectable = true;
		var _g = this;
		var newItem = this.folderItemTmpl.cloneNode(true);
		var fli = new ce.core.view.FileListItem(newItem);
		fli.set_name(name);
		fli.set_lastUpdate(lastUpdate);
		fli.onClicked = function() {
			_g.onFileClicked(id);
		};
		fli.onSelectClicked = function() {
			_g.onFileSelectClicked(id);
		};
		fli.onDeleteClicked = function() {
			_g.onFileDeleteClicked(id);
		};
		fli.onRenameRequested = function() {
			_g.onFileRenameRequested(id,fli.get_renameValue());
		};
		fli.onCheckedStatusChanged = function() {
			_g.onFileCheckedStatusChanged(id);
		};
		fli.set_selectable(selectable);
		this.fileListItems.push(fli);
		this.fileListElt.insertBefore(newItem,this.newFolderItem);
	}
	,addFile: function(id,name,type,lastUpdate) {
		var _g = this;
		var newItem = this.fileItemTmpl.cloneNode(true);
		var fli = new ce.core.view.FileListItem(newItem);
		fli.set_name(name);
		if(type != null) fli.set_type(type);
		fli.set_lastUpdate(lastUpdate);
		fli.onClicked = function() {
			_g.onFileClicked(id);
		};
		fli.onDeleteClicked = function() {
			_g.onFileDeleteClicked(id);
		};
		fli.onRenameRequested = function() {
			_g.onFileRenameRequested(id,fli.get_renameValue());
		};
		fli.onCheckedStatusChanged = function() {
			_g.onFileCheckedStatusChanged(id);
		};
		this.fileListItems.push(fli);
		this.applyFilters(fli);
		this.fileListElt.insertBefore(newItem,this.newFolderItem);
	}
	,focusOnNewFolder: function() {
		this.newFolderInput.focus();
	}
	,sort: function(byField,order) {
		this.fileListItems.sort(function(a,b) {
			switch(order) {
			case "asc":
				if(Reflect.getProperty(a,byField) > Reflect.getProperty(b,byField)) return 1; else return -1;
				break;
			case "desc":
				if(Reflect.getProperty(a,byField) < Reflect.getProperty(b,byField)) return 1; else return -1;
				break;
			}
		});
		var _g = 0;
		var _g1 = this.fileListItems;
		while(_g < _g1.length) {
			var fit = _g1[_g];
			++_g;
			this.fileListElt.insertBefore(fit.elt,this.newFolderItem);
		}
	}
	,get_newFolderName: function() {
		return this.newFolderInput.value;
	}
	,set_newFolderName: function(v) {
		this.newFolderInput.value = v;
		return v;
	}
	,set_filters: function(v) {
		if(this.filters == v) return v;
		this.filters = v;
		if(this.filters != null && HxOverrides.indexOf(this.filters,"text/directory",0) > -1) ce.util.HtmlTools.toggleClass(this.elt,"selectFolders",true); else ce.util.HtmlTools.toggleClass(this.elt,"selectFolders",false);
		var _g = 0;
		var _g1 = this.fileListItems;
		while(_g < _g1.length) {
			var f = _g1[_g];
			++_g;
			this.applyFilters(f);
		}
		return this.filters;
	}
	,applyFilters: function(f) {
		if(f.get_type() != "text/directory") {
			if(this.filters == null || (function($this) {
				var $r;
				var x = f.get_type();
				$r = HxOverrides.indexOf($this.filters,x,0);
				return $r;
			}(this)) != -1) f.set_filteredOut(false); else f.set_filteredOut(true);
		}
	}
	,__properties__: {set_newFolderName:"set_newFolderName",get_newFolderName:"get_newFolderName",set_filters:"set_filters"}
};
ce.core.view.FileListItem = function(elt) {
	var _g = this;
	this.elt = elt;
	this.checkBoxElt = elt.querySelector("input[type='checkbox']");
	this.checkBoxElt.addEventListener("change",function(_) {
		_g.onCheckedStatusChanged();
	});
	this.nameElt = elt.querySelector("span.fileName");
	this.nameElt.addEventListener("click",function(_1) {
		if(_g.get_filteredOut()) return;
		_g.onClicked();
	});
	this.renameInput = elt.querySelector("input[type='text']");
	this.renameInput.addEventListener("keydown",function(e) {
		if(e.keyIdentifier != null && e.keyIdentifier.toLowerCase() == "enter" || e.key != null && e.key.toLowerCase() == "enter") {
			ce.util.HtmlTools.toggleClass(elt,"renaming",false);
			_g.onRenameRequested();
		}
	});
	this.renameInput.addEventListener("focusout",function(_2) {
		ce.util.HtmlTools.toggleClass(elt,"renaming",false);
		_g.onRenameRequested();
	});
	this.typeElt = elt.querySelector("span.fileType");
	this.dateElt = elt.querySelector("span.lastUpdate");
	this.renameBtn = elt.querySelector("button.rename");
	this.renameBtn.addEventListener("click",function(_3) {
		ce.util.HtmlTools.toggleClass(elt,"renaming",true);
		_g.renameInput.value = _g.nameElt.textContent;
		_g.renameInput.focus();
	});
	this.deleteBtn = elt.querySelector("button.delete");
	this.deleteBtn.addEventListener("click",function(_4) {
		_g.onDeleteClicked();
	});
	this.selectBtn = elt.querySelector("button.select");
	if(this.selectBtn != null) this.selectBtn.addEventListener("click",function(_5) {
		if(_g.get_filteredOut()) return;
		_g.onSelectClicked();
	});
};
ce.core.view.FileListItem.__name__ = true;
ce.core.view.FileListItem.prototype = {
	get_isChecked: function() {
		return this.checkBoxElt.checked;
	}
	,get_renameValue: function() {
		return this.renameInput.value;
	}
	,set_renameValue: function(v) {
		this.renameInput.value = v;
		return v;
	}
	,get_name: function() {
		return this.nameElt.textContent;
	}
	,set_name: function(v) {
		this.nameElt.textContent = v;
		return v;
	}
	,get_type: function() {
		if(Lambda.has(ce.util.HtmlTools.classes(this.elt),"folder".toLowerCase())) return "text/directory";
		return this.typeElt.textContent;
	}
	,set_type: function(v) {
		this.typeElt.textContent = v;
		ce.util.HtmlTools.toggleClass(this.elt,"image",v.indexOf("image/") == 0);
		ce.util.HtmlTools.toggleClass(this.elt,"sound",v.indexOf("audio/") == 0);
		ce.util.HtmlTools.toggleClass(this.elt,"video",v.indexOf("video/") == 0);
		return v;
	}
	,get_lastUpdate: function() {
		return this.lastUpdate;
	}
	,set_lastUpdate: function(v) {
		this.lastUpdate = v;
		if(v != null) this.dateElt.textContent = DateTools.format(this.get_lastUpdate(),"%d/%m/%Y"); else this.dateElt.innerHTML = "&nbsp;";
		return v;
	}
	,get_selectable: function() {
		return !Lambda.has(ce.util.HtmlTools.classes(this.elt),"nosel".toLowerCase());
	}
	,set_selectable: function(v) {
		ce.util.HtmlTools.toggleClass(this.elt,"nosel",!v);
		return v;
	}
	,get_filteredOut: function() {
		return Lambda.has(ce.util.HtmlTools.classes(this.elt),"filteredOut".toLowerCase());
	}
	,set_filteredOut: function(v) {
		ce.util.HtmlTools.toggleClass(this.elt,"filteredOut",v);
		return v;
	}
	,onCheckedStatusChanged: function() {
	}
	,onDeleteClicked: function() {
	}
	,onRenameRequested: function() {
	}
	,onSelectClicked: function() {
	}
	,onClicked: function() {
	}
	,__properties__: {set_filteredOut:"set_filteredOut",get_filteredOut:"get_filteredOut",set_selectable:"set_selectable",get_selectable:"get_selectable",set_lastUpdate:"set_lastUpdate",get_lastUpdate:"get_lastUpdate",set_type:"set_type",get_type:"get_type",set_renameValue:"set_renameValue",get_renameValue:"get_renameValue",set_name:"set_name",get_name:"get_name",get_isChecked:"get_isChecked"}
};
ce.core.view.Home = function(elt) {
	this.elt = elt;
	this.listElt = elt.querySelector("ul");
	this.srvItemTmpl = elt.querySelector("li");
	this.listElt.removeChild(this.srvItemTmpl);
};
ce.core.view.Home.__name__ = true;
ce.core.view.Home.prototype = {
	onServiceClicked: function(name) {
	}
	,resetList: function() {
		while(this.listElt.childNodes.length > 0) this.listElt.removeChild(this.listElt.firstChild);
	}
	,addService: function(name,displayName,description) {
		var _g = this;
		var newSrvIt = this.srvItemTmpl.cloneNode(true);
		newSrvIt.textContent = displayName;
		newSrvIt.className = name;
		newSrvIt.addEventListener("click",function(_) {
			_g.onServiceClicked(name);
		});
		this.listElt.appendChild(newSrvIt);
	}
};
ce.util = {};
ce.util.FileTools = function() { };
ce.util.FileTools.__name__ = true;
ce.util.FileTools.mimeTypeByExt = function() {
	var _g = new haxe.ds.StringMap();
	_g.set(".323","text/h323");
	_g.set(".3g2","video/3gpp2");
	_g.set(".3gp","video/3gpp");
	_g.set(".3gp2","video/3gpp2");
	_g.set(".3gpp","video/3gpp");
	_g.set(".7z","application/x-7z-compressed");
	_g.set(".aa","audio/audible");
	_g.set(".AAC","audio/aac");
	_g.set(".aaf","application/octet-stream");
	_g.set(".aax","audio/vnd.audible.aax");
	_g.set(".ac3","audio/ac3");
	_g.set(".aca","application/octet-stream");
	_g.set(".accda","application/msaccess.addin");
	_g.set(".accdb","application/msaccess");
	_g.set(".accdc","application/msaccess.cab");
	_g.set(".accde","application/msaccess");
	_g.set(".accdr","application/msaccess.runtime");
	_g.set(".accdt","application/msaccess");
	_g.set(".accdw","application/msaccess.webapplication");
	_g.set(".accft","application/msaccess.ftemplate");
	_g.set(".acx","application/internet-property-stream");
	_g.set(".AddIn","text/xml");
	_g.set(".ade","application/msaccess");
	_g.set(".adobebridge","application/x-bridge-url");
	_g.set(".adp","application/msaccess");
	_g.set(".ADT","audio/vnd.dlna.adts");
	_g.set(".ADTS","audio/aac");
	_g.set(".afm","application/octet-stream");
	_g.set(".ai","application/postscript");
	_g.set(".aif","audio/x-aiff");
	_g.set(".aifc","audio/aiff");
	_g.set(".aiff","audio/aiff");
	_g.set(".air","application/vnd.adobe.air-application-installer-package+zip");
	_g.set(".amc","application/x-mpeg");
	_g.set(".application","application/x-ms-application");
	_g.set(".art","image/x-jg");
	_g.set(".asa","application/xml");
	_g.set(".asax","application/xml");
	_g.set(".ascx","application/xml");
	_g.set(".asd","application/octet-stream");
	_g.set(".asf","video/x-ms-asf");
	_g.set(".ashx","application/xml");
	_g.set(".asi","application/octet-stream");
	_g.set(".asm","text/plain");
	_g.set(".asmx","application/xml");
	_g.set(".aspx","application/xml");
	_g.set(".asr","video/x-ms-asf");
	_g.set(".asx","video/x-ms-asf");
	_g.set(".atom","application/atom+xml");
	_g.set(".au","audio/basic");
	_g.set(".avi","video/x-msvideo");
	_g.set(".axs","application/olescript");
	_g.set(".bas","text/plain");
	_g.set(".bcpio","application/x-bcpio");
	_g.set(".bin","application/octet-stream");
	_g.set(".bmp","image/bmp");
	_g.set(".c","text/plain");
	_g.set(".cab","application/octet-stream");
	_g.set(".caf","audio/x-caf");
	_g.set(".calx","application/vnd.ms-office.calx");
	_g.set(".cat","application/vnd.ms-pki.seccat");
	_g.set(".cc","text/plain");
	_g.set(".cd","text/plain");
	_g.set(".cdda","audio/aiff");
	_g.set(".cdf","application/x-cdf");
	_g.set(".cer","application/x-x509-ca-cert");
	_g.set(".chm","application/octet-stream");
	_g.set(".class","application/x-java-applet");
	_g.set(".clp","application/x-msclip");
	_g.set(".cmx","image/x-cmx");
	_g.set(".cnf","text/plain");
	_g.set(".cod","image/cis-cod");
	_g.set(".config","application/xml");
	_g.set(".contact","text/x-ms-contact");
	_g.set(".coverage","application/xml");
	_g.set(".cpio","application/x-cpio");
	_g.set(".cpp","text/plain");
	_g.set(".crd","application/x-mscardfile");
	_g.set(".crl","application/pkix-crl");
	_g.set(".crt","application/x-x509-ca-cert");
	_g.set(".cs","text/plain");
	_g.set(".csdproj","text/plain");
	_g.set(".csh","application/x-csh");
	_g.set(".csproj","text/plain");
	_g.set(".css","text/css");
	_g.set(".csv","text/csv");
	_g.set(".cur","application/octet-stream");
	_g.set(".cxx","text/plain");
	_g.set(".dat","application/octet-stream");
	_g.set(".datasource","application/xml");
	_g.set(".dbproj","text/plain");
	_g.set(".dcr","application/x-director");
	_g.set(".def","text/plain");
	_g.set(".deploy","application/octet-stream");
	_g.set(".der","application/x-x509-ca-cert");
	_g.set(".dgml","application/xml");
	_g.set(".dib","image/bmp");
	_g.set(".dif","video/x-dv");
	_g.set(".dir","application/x-director");
	_g.set(".disco","text/xml");
	_g.set(".dll","application/x-msdownload");
	_g.set(".dll.config","text/xml");
	_g.set(".dlm","text/dlm");
	_g.set(".doc","application/msword");
	_g.set(".docm","application/vnd.ms-word.document.macroEnabled.12");
	_g.set(".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document");
	_g.set(".dot","application/msword");
	_g.set(".dotm","application/vnd.ms-word.template.macroEnabled.12");
	_g.set(".dotx","application/vnd.openxmlformats-officedocument.wordprocessingml.template");
	_g.set(".dsp","application/octet-stream");
	_g.set(".dsw","text/plain");
	_g.set(".dtd","text/xml");
	_g.set(".dtsConfig","text/xml");
	_g.set(".dv","video/x-dv");
	_g.set(".dvi","application/x-dvi");
	_g.set(".dwf","drawing/x-dwf");
	_g.set(".dwp","application/octet-stream");
	_g.set(".dxr","application/x-director");
	_g.set(".eml","message/rfc822");
	_g.set(".emz","application/octet-stream");
	_g.set(".eot","application/octet-stream");
	_g.set(".eps","application/postscript");
	_g.set(".etl","application/etl");
	_g.set(".etx","text/x-setext");
	_g.set(".evy","application/envoy");
	_g.set(".exe","application/octet-stream");
	_g.set(".exe.config","text/xml");
	_g.set(".fdf","application/vnd.fdf");
	_g.set(".fif","application/fractals");
	_g.set(".filters","Application/xml");
	_g.set(".fla","application/octet-stream");
	_g.set(".flr","x-world/x-vrml");
	_g.set(".flv","video/x-flv");
	_g.set(".fsscript","application/fsharp-script");
	_g.set(".fsx","application/fsharp-script");
	_g.set(".generictest","application/xml");
	_g.set(".gif","image/gif");
	_g.set(".group","text/x-ms-group");
	_g.set(".gsm","audio/x-gsm");
	_g.set(".gtar","application/x-gtar");
	_g.set(".gz","application/x-gzip");
	_g.set(".h","text/plain");
	_g.set(".hdf","application/x-hdf");
	_g.set(".hdml","text/x-hdml");
	_g.set(".hhc","application/x-oleobject");
	_g.set(".hhk","application/octet-stream");
	_g.set(".hhp","application/octet-stream");
	_g.set(".hlp","application/winhlp");
	_g.set(".hpp","text/plain");
	_g.set(".hqx","application/mac-binhex40");
	_g.set(".hta","application/hta");
	_g.set(".htc","text/x-component");
	_g.set(".html","text/html");
	_g.set(".htm","text/html");
	_g.set(".htt","text/webviewhtml");
	_g.set(".hxa","application/xml");
	_g.set(".hxc","application/xml");
	_g.set(".hxd","application/octet-stream");
	_g.set(".hxe","application/xml");
	_g.set(".hxf","application/xml");
	_g.set(".hxh","application/octet-stream");
	_g.set(".hxi","application/octet-stream");
	_g.set(".hxk","application/xml");
	_g.set(".hxq","application/octet-stream");
	_g.set(".hxr","application/octet-stream");
	_g.set(".hxs","application/octet-stream");
	_g.set(".hxt","text/html");
	_g.set(".hxv","application/xml");
	_g.set(".hxw","application/octet-stream");
	_g.set(".hxx","text/plain");
	_g.set(".i","text/plain");
	_g.set(".ico","image/x-icon");
	_g.set(".ics","application/octet-stream");
	_g.set(".idl","text/plain");
	_g.set(".ief","image/ief");
	_g.set(".iii","application/x-iphone");
	_g.set(".inc","text/plain");
	_g.set(".inf","application/octet-stream");
	_g.set(".inl","text/plain");
	_g.set(".ins","application/x-internet-signup");
	_g.set(".ipa","application/x-itunes-ipa");
	_g.set(".ipg","application/x-itunes-ipg");
	_g.set(".ipproj","text/plain");
	_g.set(".ipsw","application/x-itunes-ipsw");
	_g.set(".iqy","text/x-ms-iqy");
	_g.set(".isp","application/x-internet-signup");
	_g.set(".ite","application/x-itunes-ite");
	_g.set(".itlp","application/x-itunes-itlp");
	_g.set(".itms","application/x-itunes-itms");
	_g.set(".itpc","application/x-itunes-itpc");
	_g.set(".IVF","video/x-ivf");
	_g.set(".jar","application/java-archive");
	_g.set(".java","application/octet-stream");
	_g.set(".jck","application/liquidmotion");
	_g.set(".jcz","application/liquidmotion");
	_g.set(".jfif","image/pjpeg");
	_g.set(".jnlp","application/x-java-jnlp-file");
	_g.set(".jpb","application/octet-stream");
	_g.set(".jpe","image/jpeg");
	_g.set(".jpeg","image/jpeg");
	_g.set(".jpg","image/jpeg");
	_g.set(".js","application/x-javascript");
	_g.set(".jsx","text/jscript");
	_g.set(".jsxbin","text/plain");
	_g.set(".latex","application/x-latex");
	_g.set(".library-ms","application/windows-library+xml");
	_g.set(".lit","application/x-ms-reader");
	_g.set(".loadtest","application/xml");
	_g.set(".lpk","application/octet-stream");
	_g.set(".lsf","video/x-la-asf");
	_g.set(".lst","text/plain");
	_g.set(".lsx","video/x-la-asf");
	_g.set(".lzh","application/octet-stream");
	_g.set(".m13","application/x-msmediaview");
	_g.set(".m14","application/x-msmediaview");
	_g.set(".m1v","video/mpeg");
	_g.set(".m2t","video/vnd.dlna.mpeg-tts");
	_g.set(".m2ts","video/vnd.dlna.mpeg-tts");
	_g.set(".m2v","video/mpeg");
	_g.set(".m3u","audio/x-mpegurl");
	_g.set(".m3u8","audio/x-mpegurl");
	_g.set(".m4a","audio/m4a");
	_g.set(".m4b","audio/m4b");
	_g.set(".m4p","audio/m4p");
	_g.set(".m4r","audio/x-m4r");
	_g.set(".m4v","video/x-m4v");
	_g.set(".mac","image/x-macpaint");
	_g.set(".mak","text/plain");
	_g.set(".man","application/x-troff-man");
	_g.set(".manifest","application/x-ms-manifest");
	_g.set(".map","text/plain");
	_g.set(".master","application/xml");
	_g.set(".mda","application/msaccess");
	_g.set(".mdb","application/x-msaccess");
	_g.set(".mde","application/msaccess");
	_g.set(".mdp","application/octet-stream");
	_g.set(".me","application/x-troff-me");
	_g.set(".mfp","application/x-shockwave-flash");
	_g.set(".mht","message/rfc822");
	_g.set(".mhtml","message/rfc822");
	_g.set(".mid","audio/mid");
	_g.set(".midi","audio/mid");
	_g.set(".mix","application/octet-stream");
	_g.set(".mk","text/plain");
	_g.set(".mmf","application/x-smaf");
	_g.set(".mno","text/xml");
	_g.set(".mny","application/x-msmoney");
	_g.set(".mod","video/mpeg");
	_g.set(".mov","video/quicktime");
	_g.set(".movie","video/x-sgi-movie");
	_g.set(".mp2","video/mpeg");
	_g.set(".mp2v","video/mpeg");
	_g.set(".mp3","audio/mpeg");
	_g.set(".mp4","video/mp4");
	_g.set(".mp4v","video/mp4");
	_g.set(".mpa","video/mpeg");
	_g.set(".mpe","video/mpeg");
	_g.set(".mpeg","video/mpeg");
	_g.set(".mpf","application/vnd.ms-mediapackage");
	_g.set(".mpg","video/mpeg");
	_g.set(".mpp","application/vnd.ms-project");
	_g.set(".mpv2","video/mpeg");
	_g.set(".mqv","video/quicktime");
	_g.set(".ms","application/x-troff-ms");
	_g.set(".msi","application/octet-stream");
	_g.set(".mso","application/octet-stream");
	_g.set(".mts","video/vnd.dlna.mpeg-tts");
	_g.set(".mtx","application/xml");
	_g.set(".mvb","application/x-msmediaview");
	_g.set(".mvc","application/x-miva-compiled");
	_g.set(".mxp","application/x-mmxp");
	_g.set(".nc","application/x-netcdf");
	_g.set(".nsc","video/x-ms-asf");
	_g.set(".nws","message/rfc822");
	_g.set(".ocx","application/octet-stream");
	_g.set(".oda","application/oda");
	_g.set(".odc","text/x-ms-odc");
	_g.set(".odh","text/plain");
	_g.set(".odl","text/plain");
	_g.set(".odp","application/vnd.oasis.opendocument.presentation");
	_g.set(".ods","application/oleobject");
	_g.set(".odt","application/vnd.oasis.opendocument.text");
	_g.set(".one","application/onenote");
	_g.set(".onea","application/onenote");
	_g.set(".onepkg","application/onenote");
	_g.set(".onetmp","application/onenote");
	_g.set(".onetoc","application/onenote");
	_g.set(".onetoc2","application/onenote");
	_g.set(".orderedtest","application/xml");
	_g.set(".osdx","application/opensearchdescription+xml");
	_g.set(".p10","application/pkcs10");
	_g.set(".p12","application/x-pkcs12");
	_g.set(".p7b","application/x-pkcs7-certificates");
	_g.set(".p7c","application/pkcs7-mime");
	_g.set(".p7m","application/pkcs7-mime");
	_g.set(".p7r","application/x-pkcs7-certreqresp");
	_g.set(".p7s","application/pkcs7-signature");
	_g.set(".pbm","image/x-portable-bitmap");
	_g.set(".pcast","application/x-podcast");
	_g.set(".pct","image/pict");
	_g.set(".pcx","application/octet-stream");
	_g.set(".pcz","application/octet-stream");
	_g.set(".pdf","application/pdf");
	_g.set(".pfb","application/octet-stream");
	_g.set(".pfm","application/octet-stream");
	_g.set(".pfx","application/x-pkcs12");
	_g.set(".pgm","image/x-portable-graymap");
	_g.set(".pic","image/pict");
	_g.set(".pict","image/pict");
	_g.set(".pkgdef","text/plain");
	_g.set(".pkgundef","text/plain");
	_g.set(".pko","application/vnd.ms-pki.pko");
	_g.set(".pls","audio/scpls");
	_g.set(".pma","application/x-perfmon");
	_g.set(".pmc","application/x-perfmon");
	_g.set(".pml","application/x-perfmon");
	_g.set(".pmr","application/x-perfmon");
	_g.set(".pmw","application/x-perfmon");
	_g.set(".png","image/png");
	_g.set(".pnm","image/x-portable-anymap");
	_g.set(".pnt","image/x-macpaint");
	_g.set(".pntg","image/x-macpaint");
	_g.set(".pnz","image/png");
	_g.set(".pot","application/vnd.ms-powerpoint");
	_g.set(".potm","application/vnd.ms-powerpoint.template.macroEnabled.12");
	_g.set(".potx","application/vnd.openxmlformats-officedocument.presentationml.template");
	_g.set(".ppa","application/vnd.ms-powerpoint");
	_g.set(".ppam","application/vnd.ms-powerpoint.addin.macroEnabled.12");
	_g.set(".ppm","image/x-portable-pixmap");
	_g.set(".pps","application/vnd.ms-powerpoint");
	_g.set(".ppsm","application/vnd.ms-powerpoint.slideshow.macroEnabled.12");
	_g.set(".ppsx","application/vnd.openxmlformats-officedocument.presentationml.slideshow");
	_g.set(".ppt","application/vnd.ms-powerpoint");
	_g.set(".pptm","application/vnd.ms-powerpoint.presentation.macroEnabled.12");
	_g.set(".pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation");
	_g.set(".prf","application/pics-rules");
	_g.set(".prm","application/octet-stream");
	_g.set(".prx","application/octet-stream");
	_g.set(".ps","application/postscript");
	_g.set(".psc1","application/PowerShell");
	_g.set(".psd","application/octet-stream");
	_g.set(".psess","application/xml");
	_g.set(".psm","application/octet-stream");
	_g.set(".psp","application/octet-stream");
	_g.set(".pub","application/x-mspublisher");
	_g.set(".pwz","application/vnd.ms-powerpoint");
	_g.set(".qht","text/x-html-insertion");
	_g.set(".qhtm","text/x-html-insertion");
	_g.set(".qt","video/quicktime");
	_g.set(".qti","image/x-quicktime");
	_g.set(".qtif","image/x-quicktime");
	_g.set(".qtl","application/x-quicktimeplayer");
	_g.set(".qxd","application/octet-stream");
	_g.set(".ra","audio/x-pn-realaudio");
	_g.set(".ram","audio/x-pn-realaudio");
	_g.set(".rar","application/octet-stream");
	_g.set(".ras","image/x-cmu-raster");
	_g.set(".rat","application/rat-file");
	_g.set(".rc","text/plain");
	_g.set(".rc2","text/plain");
	_g.set(".rct","text/plain");
	_g.set(".rdlc","application/xml");
	_g.set(".resx","application/xml");
	_g.set(".rf","image/vnd.rn-realflash");
	_g.set(".rgb","image/x-rgb");
	_g.set(".rgs","text/plain");
	_g.set(".rm","application/vnd.rn-realmedia");
	_g.set(".rmi","audio/mid");
	_g.set(".rmp","application/vnd.rn-rn_music_package");
	_g.set(".roff","application/x-troff");
	_g.set(".rpm","audio/x-pn-realaudio-plugin");
	_g.set(".rqy","text/x-ms-rqy");
	_g.set(".rtf","application/rtf");
	_g.set(".rtx","text/richtext");
	_g.set(".ruleset","application/xml");
	_g.set(".s","text/plain");
	_g.set(".safariextz","application/x-safari-safariextz");
	_g.set(".scd","application/x-msschedule");
	_g.set(".sct","text/scriptlet");
	_g.set(".sd2","audio/x-sd2");
	_g.set(".sdp","application/sdp");
	_g.set(".sea","application/octet-stream");
	_g.set(".searchConnector-ms","application/windows-search-connector+xml");
	_g.set(".setpay","application/set-payment-initiation");
	_g.set(".setreg","application/set-registration-initiation");
	_g.set(".settings","application/xml");
	_g.set(".sgimb","application/x-sgimb");
	_g.set(".sgml","text/sgml");
	_g.set(".sh","application/x-sh");
	_g.set(".shar","application/x-shar");
	_g.set(".shtml","text/html");
	_g.set(".sit","application/x-stuffit");
	_g.set(".sitemap","application/xml");
	_g.set(".skin","application/xml");
	_g.set(".sldm","application/vnd.ms-powerpoint.slide.macroEnabled.12");
	_g.set(".sldx","application/vnd.openxmlformats-officedocument.presentationml.slide");
	_g.set(".slk","application/vnd.ms-excel");
	_g.set(".sln","text/plain");
	_g.set(".slupkg-ms","application/x-ms-license");
	_g.set(".smd","audio/x-smd");
	_g.set(".smi","application/octet-stream");
	_g.set(".smx","audio/x-smd");
	_g.set(".smz","audio/x-smd");
	_g.set(".snd","audio/basic");
	_g.set(".snippet","application/xml");
	_g.set(".snp","application/octet-stream");
	_g.set(".sol","text/plain");
	_g.set(".sor","text/plain");
	_g.set(".spc","application/x-pkcs7-certificates");
	_g.set(".spl","application/futuresplash");
	_g.set(".src","application/x-wais-source");
	_g.set(".srf","text/plain");
	_g.set(".SSISDeploymentManifest","text/xml");
	_g.set(".ssm","application/streamingmedia");
	_g.set(".sst","application/vnd.ms-pki.certstore");
	_g.set(".stl","application/vnd.ms-pki.stl");
	_g.set(".sv4cpio","application/x-sv4cpio");
	_g.set(".sv4crc","application/x-sv4crc");
	_g.set(".svc","application/xml");
	_g.set(".swf","application/x-shockwave-flash");
	_g.set(".t","application/x-troff");
	_g.set(".tar","application/x-tar");
	_g.set(".tcl","application/x-tcl");
	_g.set(".testrunconfig","application/xml");
	_g.set(".testsettings","application/xml");
	_g.set(".tex","application/x-tex");
	_g.set(".texi","application/x-texinfo");
	_g.set(".texinfo","application/x-texinfo");
	_g.set(".tgz","application/x-compressed");
	_g.set(".thmx","application/vnd.ms-officetheme");
	_g.set(".thn","application/octet-stream");
	_g.set(".tif","image/tiff");
	_g.set(".tiff","image/tiff");
	_g.set(".tlh","text/plain");
	_g.set(".tli","text/plain");
	_g.set(".toc","application/octet-stream");
	_g.set(".tr","application/x-troff");
	_g.set(".trm","application/x-msterminal");
	_g.set(".trx","application/xml");
	_g.set(".ts","video/vnd.dlna.mpeg-tts");
	_g.set(".tsv","text/tab-separated-values");
	_g.set(".ttf","application/octet-stream");
	_g.set(".tts","video/vnd.dlna.mpeg-tts");
	_g.set(".txt","text/plain");
	_g.set(".u32","application/octet-stream");
	_g.set(".uls","text/iuls");
	_g.set(".user","text/plain");
	_g.set(".ustar","application/x-ustar");
	_g.set(".vb","text/plain");
	_g.set(".vbdproj","text/plain");
	_g.set(".vbk","video/mpeg");
	_g.set(".vbproj","text/plain");
	_g.set(".vbs","text/vbscript");
	_g.set(".vcf","text/x-vcard");
	_g.set(".vcproj","Application/xml");
	_g.set(".vcs","text/plain");
	_g.set(".vcxproj","Application/xml");
	_g.set(".vddproj","text/plain");
	_g.set(".vdp","text/plain");
	_g.set(".vdproj","text/plain");
	_g.set(".vdx","application/vnd.ms-visio.viewer");
	_g.set(".vml","text/xml");
	_g.set(".vscontent","application/xml");
	_g.set(".vsct","text/xml");
	_g.set(".vsd","application/vnd.visio");
	_g.set(".vsi","application/ms-vsi");
	_g.set(".vsix","application/vsix");
	_g.set(".vsixlangpack","text/xml");
	_g.set(".vsixmanifest","text/xml");
	_g.set(".vsmdi","application/xml");
	_g.set(".vspscc","text/plain");
	_g.set(".vss","application/vnd.visio");
	_g.set(".vsscc","text/plain");
	_g.set(".vssettings","text/xml");
	_g.set(".vssscc","text/plain");
	_g.set(".vst","application/vnd.visio");
	_g.set(".vstemplate","text/xml");
	_g.set(".vsto","application/x-ms-vsto");
	_g.set(".vsw","application/vnd.visio");
	_g.set(".vsx","application/vnd.visio");
	_g.set(".vtx","application/vnd.visio");
	_g.set(".wav","audio/wav");
	_g.set(".wave","audio/wav");
	_g.set(".wax","audio/x-ms-wax");
	_g.set(".wbk","application/msword");
	_g.set(".wbmp","image/vnd.wap.wbmp");
	_g.set(".wcm","application/vnd.ms-works");
	_g.set(".wdb","application/vnd.ms-works");
	_g.set(".wdp","image/vnd.ms-photo");
	_g.set(".webarchive","application/x-safari-webarchive");
	_g.set(".webtest","application/xml");
	_g.set(".wiq","application/xml");
	_g.set(".wiz","application/msword");
	_g.set(".wks","application/vnd.ms-works");
	_g.set(".WLMP","application/wlmoviemaker");
	_g.set(".wlpginstall","application/x-wlpg-detect");
	_g.set(".wlpginstall3","application/x-wlpg3-detect");
	_g.set(".wm","video/x-ms-wm");
	_g.set(".wma","audio/x-ms-wma");
	_g.set(".wmd","application/x-ms-wmd");
	_g.set(".wmf","application/x-msmetafile");
	_g.set(".wml","text/vnd.wap.wml");
	_g.set(".wmlc","application/vnd.wap.wmlc");
	_g.set(".wmls","text/vnd.wap.wmlscript");
	_g.set(".wmlsc","application/vnd.wap.wmlscriptc");
	_g.set(".wmp","video/x-ms-wmp");
	_g.set(".wmv","video/x-ms-wmv");
	_g.set(".wmx","video/x-ms-wmx");
	_g.set(".wmz","application/x-ms-wmz");
	_g.set(".wpl","application/vnd.ms-wpl");
	_g.set(".wps","application/vnd.ms-works");
	_g.set(".wri","application/x-mswrite");
	_g.set(".wrl","x-world/x-vrml");
	_g.set(".wrz","x-world/x-vrml");
	_g.set(".wsc","text/scriptlet");
	_g.set(".wsdl","text/xml");
	_g.set(".wvx","video/x-ms-wvx");
	_g.set(".x","application/directx");
	_g.set(".xaf","x-world/x-vrml");
	_g.set(".xaml","application/xaml+xml");
	_g.set(".xap","application/x-silverlight-app");
	_g.set(".xbap","application/x-ms-xbap");
	_g.set(".xbm","image/x-xbitmap");
	_g.set(".xdr","text/plain");
	_g.set(".xht","application/xhtml+xml");
	_g.set(".xhtml","application/xhtml+xml");
	_g.set(".xla","application/vnd.ms-excel");
	_g.set(".xlam","application/vnd.ms-excel.addin.macroEnabled.12");
	_g.set(".xlc","application/vnd.ms-excel");
	_g.set(".xld","application/vnd.ms-excel");
	_g.set(".xlk","application/vnd.ms-excel");
	_g.set(".xll","application/vnd.ms-excel");
	_g.set(".xlm","application/vnd.ms-excel");
	_g.set(".xls","application/vnd.ms-excel");
	_g.set(".xlsb","application/vnd.ms-excel.sheet.binary.macroEnabled.12");
	_g.set(".xlsm","application/vnd.ms-excel.sheet.macroEnabled.12");
	_g.set(".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	_g.set(".xlt","application/vnd.ms-excel");
	_g.set(".xltm","application/vnd.ms-excel.template.macroEnabled.12");
	_g.set(".xltx","application/vnd.openxmlformats-officedocument.spreadsheetml.template");
	_g.set(".xlw","application/vnd.ms-excel");
	_g.set(".xml","text/xml");
	_g.set(".xmta","application/xml");
	_g.set(".xof","x-world/x-vrml");
	_g.set(".XOML","text/plain");
	_g.set(".xpm","image/x-xpixmap");
	_g.set(".xps","application/vnd.ms-xpsdocument");
	_g.set(".xrm-ms","text/xml");
	_g.set(".xsc","application/xml");
	_g.set(".xsd","text/xml");
	_g.set(".xsf","text/xml");
	_g.set(".xsl","text/xml");
	_g.set(".xslt","text/xml");
	_g.set(".xsn","application/octet-stream");
	_g.set(".xss","application/xml");
	_g.set(".xtp","application/octet-stream");
	_g.set(".xwd","image/x-xwindowdump");
	_g.set(".z","application/x-compress");
	_g.set(".zip","application/x-zip-compressed");
	return _g;
};
ce.util.FileTools.getMimeType = function(filename) {
	var se = filename.lastIndexOf(".");
	if(se == -1) return null; else return ce.util.FileTools.mimeTypeByExt().get(HxOverrides.substr(filename,se,null));
};
ce.util.FileTools.getExtension = function(mimetype) {
	var mtc = ce.util.FileTools.mimeTypeByExt();
	var $it0 = mtc.keys();
	while( $it0.hasNext() ) {
		var ext = $it0.next();
		if(mtc.get(ext) == mimetype.toLowerCase()) return ext;
	}
	return null;
};
ce.util.HtmlTools = function() { };
ce.util.HtmlTools.__name__ = true;
ce.util.HtmlTools.classes = function(el,cl) {
	if(cl != null) el.className = cl.join(" ");
	return el.className.split(" ").filter(function(s) {
		return s != "";
	}).map(function(s1) {
		return s1.toLowerCase();
	});
};
ce.util.HtmlTools.toggleClass = function(el,cl,flag) {
	if(flag) ce.util.HtmlTools.addClass(el,cl); else ce.util.HtmlTools.removeClass(el,cl);
	return el;
};
ce.util.HtmlTools.hasClass = function(el,cl) {
	return Lambda.has(ce.util.HtmlTools.classes(el),cl.toLowerCase());
};
ce.util.HtmlTools.addClass = function(el,cl) {
	var cls = ce.util.HtmlTools.classes(el);
	var changed = false;
	var _g = 0;
	var _g1 = cl.split(" ");
	while(_g < _g1.length) {
		var c = _g1[_g];
		++_g;
		if(!Lambda.has(cls,c.toLowerCase())) {
			cls.push(c.toLowerCase());
			changed = true;
		}
	}
	if(changed) ce.util.HtmlTools.classes(el,cls);
	return el;
};
ce.util.HtmlTools.removeClass = function(el,cl) {
	var cls = ce.util.HtmlTools.classes(el);
	var changed = false;
	var _g = 0;
	var _g1 = cl.split(" ");
	while(_g < _g1.length) {
		var c = _g1[_g];
		++_g;
		if((function($this) {
			var $r;
			var x = c.toLowerCase();
			$r = HxOverrides.remove(cls,x);
			return $r;
		}(this))) changed = true;
	}
	if(changed) ce.util.HtmlTools.classes(el,cls);
	return el;
};
ce.util.HtmlTools.offset = function(el) {
	var pos = { x : el.offsetLeft, y : el.offsetTop};
	var parent = ce.util.HtmlTools.parentElement(el);
	while(parent != null) {
		pos.x += parent.offsetLeft;
		pos.y += parent.offsetTop;
		parent = ce.util.HtmlTools.parentElement(parent);
	}
	return pos;
};
ce.util.HtmlTools.parentElement = function(el) {
	var parent = el.parentNode;
	if(parent != null && parent.nodeType == 1) return parent;
	return null;
};
ce.util.HtmlTools.vendorPrefixCall = function(el,field,args) {
	if(args == null) args = [];
	var _g = 0;
	var _g1 = ce.util.HtmlTools.vendorPrefix(field);
	while(_g < _g1.length) {
		var prefixed = _g1[_g];
		++_g;
		var v = Reflect.field(el,prefixed);
		if(typeof v != "undefined") return v.apply(el,args);
	}
	return null;
};
ce.util.HtmlTools.vendorPrefix = function(field,capitalize) {
	if(capitalize == null) capitalize = true;
	var prefixes = ["","webkit","moz","ms","o"];
	var fields = [field];
	if(field == "fullScreen") fields.push("isFullScreen");
	var prefixed = [];
	var _g = 0;
	while(_g < prefixes.length) {
		var p = prefixes[_g];
		++_g;
		var _g1 = 0;
		while(_g1 < fields.length) {
			var f = fields[_g1];
			++_g1;
			prefixed.push(p + (capitalize?HxOverrides.substr(f,0,1).toUpperCase() + HxOverrides.substr(f,1,null):f));
		}
	}
	return prefixed;
};
ce.util.HtmlTools.vendorPrefixProperty = function(el,field) {
	var _g = 0;
	var _g1 = ce.util.HtmlTools.vendorPrefix(field);
	while(_g < _g1.length) {
		var prefixed = _g1[_g];
		++_g;
		var v = Reflect.field(el,prefixed);
		if(typeof v != "undefined") return v;
	}
	return null;
};
ce.util.HtmlTools.addEvent = function(el,event,callback) {
	ce.util.HtmlTools.addEvents(el,event.split(" "),callback);
};
ce.util.HtmlTools.addEvents = function(el,events,callback) {
	var _g = 0;
	while(_g < events.length) {
		var e = events[_g];
		++_g;
		el.addEventListener(e,callback);
	}
};
ce.util.OptionTools = function() { };
ce.util.OptionTools.__name__ = true;
ce.util.OptionTools.normalizePickOptions = function(o) {
	if(o == null) return o;
	if(o.mimetype != null) o.mimetype = o.mimetype.toLowerCase();
	if(o.extension != null) o.extension = o.extension.toLowerCase();
	if(o.mimetypes != null) {
		var _g1 = 0;
		var _g = o.mimetypes.length;
		while(_g1 < _g) {
			var mi = _g1++;
			o.mimetypes[mi] = o.mimetypes[mi].toLowerCase();
		}
	}
	if(o.extensions != null) {
		var _g11 = 0;
		var _g2 = o.extensions.length;
		while(_g11 < _g2) {
			var ei = _g11++;
			o.extensions[ei] = o.extensions[ei].toLowerCase();
		}
	}
	return o;
};
ce.util.OptionTools.normalizeExportOptions = function(o) {
	if(o == null) return o;
	if(o.mimetype != null) o.mimetype = o.mimetype.toLowerCase();
	if(o.extension != null) o.extension = o.extension.toLowerCase();
	return o;
};
ce.util.OptionTools.normalizeReadOptions = function(o) {
	return o;
};
ce.util.OptionTools.normalizeWriteOptions = function(o) {
	return o;
};
var haxe = {};
haxe.Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe.Timer.__name__ = true;
haxe.Timer.delay = function(f,time_ms) {
	var t = new haxe.Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe.Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
};
haxe.ds = {};
haxe.ds.StringMap = function() {
	this.h = { };
};
haxe.ds.StringMap.__name__ = true;
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,get: function(key) {
		return this.h["$" + key];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key.substr(1));
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref["$" + i];
		}};
	}
};
var js = {};
js.Boot = function() { };
js.Boot.__name__ = true;
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
String.__name__ = true;
Array.__name__ = true;
Date.__name__ = ["Date"];
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
ce.core.config.Config.PROP_NAME_UNIFILE_ENDPOINT = "unifile-url";
ce.core.config.Config.PROP_NAME_CE_PATH = "path";
ce.core.config.Config.PROP_VALUE_DEFAULT_UNIFILE_ENDPOINT = "http://localhost:6805/api/1.0/";
ce.core.config.Config.PROP_VALUE_DEFAULT_CE_PATH = "";
ce.core.model.CEError.CODE_BAD_PARAMETERS = 400;
ce.core.model.CEError.CODE_UNAUTHORIZED = 401;
ce.core.model.CEError.CODE_INVALID_REQUEST = 403;
ce.core.model._Service.Service_Impl_.Dropbox = "dropbox";
ce.core.model._Service.Service_Impl_.Www = "www";
ce.core.model._Service.Service_Impl_.Ftp = "ftp";
ce.core.model._SortField.SortField_Impl_.Name = "name";
ce.core.model._SortField.SortField_Impl_.Type = "type";
ce.core.model._SortField.SortField_Impl_.LastUpdate = "lastUpdate";
ce.core.model._SortOrder.SortOrder_Impl_.Asc = "asc";
ce.core.model._SortOrder.SortOrder_Impl_.Desc = "desc";
ce.core.parser.oauth.Str2OAuthResult.PARAM_NOT_APPROVED = "not_approved";
ce.core.parser.oauth.Str2OAuthResult.PARAM_OAUTH_TOKEN = "oauth_token";
ce.core.parser.oauth.Str2OAuthResult.PARAM_UID = "uid";
ce.core.service.UnifileSrv.ENDPOINT_LIST_SERVICES = "services/list";
ce.core.service.UnifileSrv.ENDPOINT_CONNECT = "{srv}/connect";
ce.core.service.UnifileSrv.ENDPOINT_LOGIN = "{srv}/login";
ce.core.service.UnifileSrv.ENDPOINT_ACCOUNT = "{srv}/account";
ce.core.service.UnifileSrv.ENDPOINT_LOGOUT = "{srv}/logout";
ce.core.service.UnifileSrv.ENDPOINT_LS = "{srv}/exec/ls/{path}";
ce.core.service.UnifileSrv.ENDPOINT_RM = "{srv}/exec/rm/{path}";
ce.core.service.UnifileSrv.ENDPOINT_MKDIR = "{srv}/exec/mkdir/{path}";
ce.core.service.UnifileSrv.ENDPOINT_CP = "exec/cp";
ce.core.service.UnifileSrv.ENDPOINT_MV = "{srv}/exec/mv/{path}";
ce.core.service.UnifileSrv.ENDPOINT_GET = "{srv}/exec/get/{uri}";
ce.core.service.UnifileSrv.ENDPOINT_PUT = "{srv}/exec/put/{path}";
ce.core.view.AlertPopup.CLASS_ERROR = "error";
ce.core.view.AlertPopup.CLASS_WARNING = "warning";
ce.core.view.AlertPopup.SELECTOR_TEXT = ".txt";
ce.core.view.AlertPopup.SELECTOR_CHOICE_TMPL = ".choice";
ce.core.view.Application.PLACE_HOLDER_LOGOUT_NAME = "{name}";
ce.core.view.Application.ID_APPLICATION = "cloud-explorer";
ce.core.view.Application.CLASS_LOADING = "loading";
ce.core.view.Application.CLASS_STARTING = "starting";
ce.core.view.Application.CLASS_BROWSING = "browsing";
ce.core.view.Application.CLASS_AUTHORIZING = "authorizing";
ce.core.view.Application.CLASS_LOGGED_IN = "loggedin";
ce.core.view.Application.CLASS_ALERTING = "alerting";
ce.core.view.Application.CLASS_MAKING_NEW_FOLDER = "making-new-folder";
ce.core.view.Application.CLASS_SELECTING = "selecting";
ce.core.view.Application.CLASS_EXPORT_OVERWRITING = "export-overwriting";
ce.core.view.Application.CLASS_MODE_SINGLE_FILE_SELECTION = "single-file-sel-mode";
ce.core.view.Application.CLASS_MODE_SINGLE_FILE_EXPORT = "single-file-exp-mode";
ce.core.view.Application.CLASS_MODE_IS_LOGGED_IN = "is-logged-in-mode";
ce.core.view.Application.CLASS_MODE_REQUEST_AUTHORIZE = "request-authorize-mode";
ce.core.view.Application.CLASS_ITEMS_LIST = "items-list";
ce.core.view.Application.CLASS_ITEMS_ICONS = "items-icons";
ce.core.view.Application.CLASS_PREFIX_SORTEDBY = "sortedby-";
ce.core.view.Application.CLASS_PREFIX_SERVICE = "srv-";
ce.core.view.Application.SELECTOR_LOGOUT_BTN = ".logoutBtn";
ce.core.view.Application.SELECTOR_CLOSE_BTN = ".closeBtn";
ce.core.view.Application.SELECTOR_HOME = ".home";
ce.core.view.Application.SELECTOR_FILE_BROWSER = ".fileBrowser";
ce.core.view.Application.SELECTOR_ALERT_POPUP = ".alertPopup";
ce.core.view.Application.SELECTOR_AUTH_POPUP = ".authPopup";
ce.core.view.Application.SELECTOR_BREADCRUMB = ".breadcrumb";
ce.core.view.Application.SELECTOR_DROPZONE = ".dropzone";
ce.core.view.Application.SELECTOR_EXPORT = ".export";
ce.core.view.Application.SELECTOR_NEW_FOLDER_BTN = ".newFolderBtn";
ce.core.view.Application.SELECTOR_PARENT_FOLDER_BTN = ".parentFolderBtn";
ce.core.view.Application.SELECTOR_DELETE_BTN = ".deleteBtn";
ce.core.view.Application.SELECTOR_ITEMS_LIST_BTN = ".listItemsBtn";
ce.core.view.Application.SELECTOR_ITEMS_ICON_BTN = ".iconItemsBtn";
ce.core.view.AuthPopup.SELECTOR_LINK = "a";
ce.core.view.AuthPopup.SELECTOR_TEXT = "span";
ce.core.view.AuthPopup.PLACE_HOLDER_SRV_NAME = "{srvName}";
ce.core.view.Breadcrumb.SELECTOR_PATH_ITEM_TMPL = "span.pathIt";
ce.core.view.Breadcrumb.SELECTOR_PATH_SEP_TMPL = "span.sep";
ce.core.view.Button.ATTR_DISABLED = "disabled";
ce.core.view.Button.ATTR_VALUE_DISABLED = "disabled";
ce.core.view.DropZone.SELECTOR_INPUT = "div input";
ce.core.view.DropZone.SELECTOR_BUTTON = "div button";
ce.core.view.DropZone.CLASS_DRAGGINGOVER = "draggingover";
ce.core.view.Export.SELECTOR_INPUT = "input";
ce.core.view.Export.SELECTOR_PATH = "span.path";
ce.core.view.Export.SELECTOR_EXT = "span.ext";
ce.core.view.Export.SELECTOR_SAVE_BUTTON = ".saveBtn";
ce.core.view.Export.SELECTOR_OVERWRITE_BUTTON = ".overwriteBtn";
ce.core.view.FileBrowser.SELECTOR_SRV_LIST = ".services ul";
ce.core.view.FileBrowser.SELECTOR_FILES_LIST = ".files ul";
ce.core.view.FileBrowser.SELECTOR_SRV_ITEM_TMPL = "li";
ce.core.view.FileBrowser.SELECTOR_NEW_FOLDER_ITEM = ".folder.new";
ce.core.view.FileBrowser.SELECTOR_FOLDER_ITEM_TMPL = ".folder:nth-last-child(-n+1)";
ce.core.view.FileBrowser.SELECTOR_FILE_ITEM_TMPL = ".file";
ce.core.view.FileBrowser.SELECTOR_CONTEXT_MENU_ITEMS = "ul.contextMenu li";
ce.core.view.FileBrowser.SELECTOR_NAME_BTN = ".titles .fileName";
ce.core.view.FileBrowser.SELECTOR_TYPE_BTN = ".titles .fileType";
ce.core.view.FileBrowser.SELECTOR_DATE_BTN = ".titles .lastUpdate";
ce.core.view.FileBrowser.CLASS_SELECT_FOLDER = "selectFolders";
ce.core.view.FileBrowser.CLASS_SRV_CONNECTED = "connected";
ce.core.view.FileListItem.CLASS_RENAMING = "renaming";
ce.core.view.FileListItem.CLASS_NOT_SELECTABLE = "nosel";
ce.core.view.FileListItem.CLASS_FILTERED_OUT = "filteredOut";
ce.core.view.FileListItem.CLASS_FOLDER = "folder";
ce.core.view.FileListItem.CLASS_IMAGE = "image";
ce.core.view.FileListItem.CLASS_SOUND = "sound";
ce.core.view.FileListItem.CLASS_VIDEO = "video";
ce.core.view.Home.SELECTOR_SRV_LIST = "ul";
ce.core.view.Home.SELECTOR_SRV_ITEM_TMPL = "li";
ce.util.FileTools.DIRECTORY_MIME_TYPE = "text/directory";
})(typeof window != "undefined" ? window : exports);
