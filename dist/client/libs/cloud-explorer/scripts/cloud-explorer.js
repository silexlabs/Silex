(function (console, $hx_exports) { "use strict";
$hx_exports.ce = $hx_exports.ce || {};
$hx_exports.ce.api = $hx_exports.ce.api || {};
var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
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
	case "F":
		return DateTools.__format(d,"%Y-%m-%d");
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
		throw new js__$Boot_HaxeError("Date.format %" + e + "- not implemented yet.");
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
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
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
	return js_Boot.__string_rec(s,"");
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
var ce_api_CloudExplorer = $hx_exports.ce.api.CloudExplorer = function(iframeEltId) {
	var ceIframe;
	if(iframeEltId != null) ceIframe = window.document.getElementById(iframeEltId); else ceIframe = null;
	var config = new ce_core_config_Config();
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
	this.ctrl = new ce_core_Controller(config,ceIframe);
};
ce_api_CloudExplorer.__name__ = true;
ce_api_CloudExplorer.get = function(iframeEltId) {
	return new ce_api_CloudExplorer(iframeEltId);
};
ce_api_CloudExplorer.prototype = {
	pick: function(arg1,arg2,arg3) {
		if(arg1 == null || arg2 == null) throw new js__$Boot_HaxeError("Missing mandatory parameters for CloudExplorer.pick(onSuccess : CEBlob -> Void, onError : CEError -> Void)");
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
		this.ctrl.isLoggedIn(srvName,onSuccess,onError);
		return;
	}
	,requestAuthorize: function(arg1,arg2,arg3) {
		var srvName = arg1;
		var onSuccess = arg2;
		var onError = arg3;
		this.ctrl.requestAuthorize(srvName,onSuccess,onError);
	}
};
var ce_core_Controller = function(config,iframe) {
	this.config = config;
	this.state = new ce_core_model_State();
	this.unifileSrv = new ce_core_service_UnifileSrv(config);
	this.application = new ce_core_view_Application(iframe,config);
	this.errorCtrl = new ce_core_ctrl_ErrorCtrl(this,this.state,this.application);
	this.initMvc();
};
ce_core_Controller.__name__ = true;
ce_core_Controller.prototype = {
	pick: function(options,onSuccess,onError) {
		ce_util_OptionTools.normalizePickOptions(options);
		this.state.set_currentMode(ce_core_model_Mode.SingleFileSelection(onSuccess,onError,options));
		this.show();
	}
	,read: function(input,options,onSuccess,onError,onProgress) {
		ce_util_OptionTools.normalizeReadOptions(options);
		this.unifileSrv.get(input.url,onSuccess,function(e) {
			onError(new ce_core_model_CEError(e.code));
		});
	}
	,exportFile: function(input,options,onSuccess,onError) {
		ce_util_OptionTools.normalizeExportOptions(options);
		this.state.set_currentMode(ce_core_model_Mode.SingleFileExport(onSuccess,onError,input,options));
		this.show();
	}
	,write: function(target,data,options,onSuccess,onError,onProgress) {
		var _g1 = this;
		ce_util_OptionTools.normalizeWriteOptions(options);
		var explodedUrl = this.unifileSrv.explodeUrl(target.url);
		var fileBlob = new Blob([data],{ 'type' : target.mimetype});
		this.unifileSrv.upload((function($this) {
			var $r;
			var _g = new haxe_ds_StringMap();
			_g.set(explodedUrl.filename,fileBlob);
			$r = _g;
			return $r;
		}(this)),null,explodedUrl.srv,explodedUrl.path,function() {
			if(_g1.state.currentFileList.get(explodedUrl.filename) == null) _g1.refreshFilesList();
			onSuccess(target);
		},function(e) {
			onError(new ce_core_model_CEError(e.code));
		});
	}
	,isLoggedIn: function(srvName,onSuccess,onError) {
		this.state.set_currentMode(ce_core_model_Mode.IsLoggedIn(onSuccess,onError,srvName));
		if(this.state.serviceList == null) this.listServices(); else if(this.state.serviceList.get(srvName) == null) {
			console.log("unknown service " + srvName);
			onError(new ce_core_model_CEError(400));
		} else onSuccess(this.state.serviceList.get(srvName).isLoggedIn);
	}
	,requestAuthorize: function(srvName,onSuccess,onError) {
		this.state.set_currentMode(ce_core_model_Mode.RequestAuthorize(onSuccess,onError,srvName));
		if(this.state.serviceList == null) this.listServices(); else if(this.state.serviceList.get(srvName) == null) {
			console.log("unknown service " + srvName);
			onError(new ce_core_model_CEError(400));
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
			_g.state.set_displayMode(ce_core_model_DisplayMode.List);
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
			if(_g.state.serviceList.get(name).isLoggedIn) throw new js__$Boot_HaxeError("unexpected call to login " + name); else _g.connect(name);
		};
		this.application.onServiceLogoutRequest = function(name1) {
			if(!_g.state.serviceList.get(name1).isLoggedIn) throw new js__$Boot_HaxeError("unexpected call to logout " + name1);
			_g.logout(name1);
		};
		this.application.onServiceClicked = function(name2) {
			if(_g.state.serviceList.get(name2).isLoggedIn) _g.state.set_currentLocation(new ce_core_model_Location(name2,"/")); else _g.connect(name2);
		};
		this.application.onFileSelectClicked = function(id) {
			var f = _g.state.currentFileList.get(id);
			{
				var _g1 = _g.state.currentMode;
				if(_g1 != null) switch(_g1[1]) {
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
					var _g21 = _g.state.currentLocation;
					_g21.set_path(_g21.path + (_g.state.currentFileList.get(id).name + "/"));
				} else {
					var _g21 = _g.state.currentLocation;
					_g21.set_path(_g21.path + (_g.state.currentFileList.get(id).name + "/"));
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
				if(_g12 != null) switch(_g12[1]) {
				case 0:
					var options1 = _g12[4];
					var onError1 = _g12[3];
					var onSuccess1 = _g12[2];
					if(!f1.isDir) {
						onSuccess1({ url : _g.unifileSrv.generateUrl(_g.state.currentLocation.service,_g.state.currentLocation.path,f1.name), filename : f1.name, mimetype : ce_util_FileTools.getMimeType(f1.name), size : f1.bytes, key : null, container : null, isWriteable : true, path : _g.state.currentLocation.path});
						_g.hide();
					} else {
						var _g22 = _g.state.currentLocation;
						_g22.set_path(_g22.path + (_g.state.currentFileList.get(id1).name + "/"));
					}
					break;
				case 1:
					var options2 = _g12[5];
					var input = _g12[4];
					var onError2 = _g12[3];
					var onSuccess2 = _g12[2];
					if(!f1.isDir) {
						onSuccess2({ url : _g.unifileSrv.generateUrl(_g.state.currentLocation.service,_g.state.currentLocation.path,f1.name), filename : f1.name, mimetype : ce_util_FileTools.getMimeType(f1.name), size : f1.bytes, key : null, container : null, isWriteable : true, path : _g.state.currentLocation.path});
						_g.hide();
					} else {
						var _g23 = _g.state.currentLocation;
						_g23.set_path(_g23.path + (_g.state.currentFileList.get(id1).name + "/"));
					}
					break;
				default:
					var _g24 = _g.state.currentLocation;
					_g24.set_path(_g24.path + (_g.state.currentFileList.get(id1).name + "/"));
				} else {
					var _g24 = _g.state.currentLocation;
					_g24.set_path(_g24.path + (_g.state.currentFileList.get(id1).name + "/"));
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
			var _g25 = _g.application.fileBrowser.fileListItems;
			while(_g13 < _g25.length) {
				var f3 = _g25[_g13];
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
				if(_g14 != null) switch(_g14[1]) {
				case 1:
					var options3 = _g14[5];
					var input1 = _g14[4];
					var onError3 = _g14[3];
					var onSuccess3 = _g14[2];
					var fname = _g.application["export"].get_exportName();
					if(options3 != null) {
						if(options3.mimetype != null && ce_util_FileTools.getExtension(options3.mimetype) != null) fname += ce_util_FileTools.getExtension(options3.mimetype); else if(options3.extension != null) if(options3.extension.indexOf(".") != 0) fname += "." + options3.extension; else fname += options3.extension;
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
					throw new js__$Boot_HaxeError("unexpected mode " + Std.string(_g.state.currentMode));
				} else throw new js__$Boot_HaxeError("unexpected mode " + Std.string(_g.state.currentMode));
			}
		};
		this.application.onSaveExportClicked = function() {
			_g.doExportFile();
			_g.hide();
		};
		this.application.onExportNameChanged = function() {
			if(_g.application["export"].get_exportName() != "") {
				var _g15 = _g.state.currentMode;
				if(_g15 != null) switch(_g15[1]) {
				case 1:
					var options4 = _g15[5];
					var input2 = _g15[4];
					var onError4 = _g15[3];
					var onSuccess4 = _g15[2];
					var fname1 = _g.application["export"].get_exportName();
					if(options4 != null) {
						if(options4.mimetype != null && ce_util_FileTools.getExtension(options4.mimetype) != null) fname1 += ce_util_FileTools.getExtension(options4.mimetype); else if(options4.extension != null) if(options4.extension.indexOf(".") != 0) fname1 += "." + options4.extension; else fname1 += options4.extension;
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
					throw new js__$Boot_HaxeError("unexpected mode " + Std.string(_g.state.currentMode));
				} else throw new js__$Boot_HaxeError("unexpected mode " + Std.string(_g.state.currentMode));
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
			_g.state.set_currentLocation(new ce_core_model_Location(srv,path));
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
			_g.state.set_displayMode(ce_core_model_DisplayMode.List);
		};
		this.application.onItemsIconClicked = function() {
			_g.state.set_displayMode(ce_core_model_DisplayMode.Icons);
		};
		this.application.onSortBtnClicked = function(field) {
			if(_g.state.currentSortField == field) _g.state.set_currentSortOrder(_g.state.currentSortOrder == "asc"?"desc":"asc"); else _g.state.set_currentSortField(field);
		};
		this.state.onServiceListChanged = function() {
			{
				var _g16 = _g.state.currentMode;
				if(_g16 != null) switch(_g16[1]) {
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
				if(_g.state.currentLocation == null) _g.state.set_currentLocation(new ce_core_model_Location(lastConnectedService,"/"));
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
				if(_g17 != null) switch(_g17[1]) {
				case 0:case 1:
					break;
				case 2:
					throw new js__$Boot_HaxeError("unexpected mode: " + Std.string(_g.state.currentMode));
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
							_g.state.set_currentLocation(new ce_core_model_Location(s1.name,"/"));
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
				_g.state.set_currentLocation(new ce_core_model_Location(srvName2,"/"));
			}
		};
		this.state.onDisplayModeChanged = function() {
			var _g18 = _g.state.displayMode;
			if(_g18 != null) switch(_g18[1]) {
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
					if(_g.state.currentFileList.get(fid).isDir) _g.application.fileBrowser.addFolder(fid,_g.state.currentFileList.get(fid).name,_g.state.currentFileList.get(fid).modified); else _g.application.fileBrowser.addFile(fid,_g.state.currentFileList.get(fid).name,ce_util_FileTools.getMimeType(_g.state.currentFileList.get(fid).name),_g.state.currentFileList.get(fid).modified);
				}
			}
		};
		this.state.onCurrentModeChanged = function() {
			if(_g.state.currentMode != null) {
				_g.application.fileBrowser.set_filters(null);
				{
					var _g19 = _g.state.currentMode;
					if(_g19 != null) switch(_g19[1]) {
					case 2:case 3:
						break;
					case 0:
						var options5 = _g19[4];
						var onError7 = _g19[3];
						var onSuccess8 = _g19[2];
						if(options5 != null) {
							if((options5.mimetype != null || options5.mimetypes != null) && (options5.extension != null || options5.extensions != null)) throw new js__$Boot_HaxeError("Cannot pass in both mimetype(s) and extension(s) parameters to the pick function");
							var filters = null;
							if(options5.mimetype != null || options5.mimetypes != null) {
								if(options5.mimetype != null) {
									if(options5.mimetypes != null) throw new js__$Boot_HaxeError("Cannot pass in both mimetype and mimetypes parameters to the pick function");
									filters = [options5.mimetype];
								} else filters = options5.mimetypes;
							} else {
								var extensions = null;
								if(options5.extension != null) {
									if(options5.extensions != null) throw new js__$Boot_HaxeError("Cannot pass in both extension and extensions parameters to the pick function");
									extensions = [options5.extension];
								} else extensions = options5.extensions;
								if(extensions != null && extensions.length > 0) {
									filters = [];
									var _g26 = 0;
									while(_g26 < extensions.length) {
										var e1 = extensions[_g26];
										++_g26;
										var mimetype = ce_util_FileTools.getMimeType(e1.indexOf(".") == 0?e1:"." + e1);
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
						if(options6 != null && options6.mimetype != null) ext = ce_util_FileTools.getExtension(options6.mimetype); else ext = null;
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
			if(_g != null) switch(_g[1]) {
			case 1:
				var options = _g[5];
				var input = _g[4];
				var onError = _g[3];
				var onSuccess = _g[2];
				var fname = this.application["export"].get_exportName();
				if(options != null) {
					if(options.mimetype != null && ce_util_FileTools.getExtension(options.mimetype) != null) fname += ce_util_FileTools.getExtension(options.mimetype); else if(options.extension != null) if(options.extension.indexOf(".") != 0) fname += "." + options.extension; else fname += options.extension;
				}
				onSuccess({ url : this.unifileSrv.generateUrl(this.state.currentLocation.service,this.state.currentLocation.path,fname), filename : fname, mimetype : options != null && options.mimetype != null?options.mimetype:ce_util_FileTools.getMimeType(fname), size : null, key : null, container : null, isWriteable : true, path : null});
				break;
			default:
			} else {
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
			console.log("unexpected call to connect " + srv);
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
					_g.login(srv);
					_g.application.onServiceAuthorizationDone = null;
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
		} else console.log("can't log into " + srv + " as user already logged in!");
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
		} else console.log("can't log out from " + srv + " as user not yet logged in!");
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
var ce_core_config_Config = function() {
	this.path = "";
	this.unifileEndpoint = "http://localhost:6805/api/1.0/";
};
ce_core_config_Config.__name__ = true;
ce_core_config_Config.prototype = {
	readProperty: function(name,value) {
		switch(name) {
		case "unifile-url":
			this.unifileEndpoint = value;
			break;
		case "path":
			this.path = value;
			break;
		default:
			throw new js__$Boot_HaxeError("Unexpected configuration property " + name);
		}
	}
};
var ce_core_ctrl_ErrorCtrl = function(parent,state,application) {
	this.parent = parent;
	this.state = state;
	this.application = application;
};
ce_core_ctrl_ErrorCtrl.__name__ = true;
ce_core_ctrl_ErrorCtrl.prototype = {
	manageListSrvError: function(msg) {
		{
			var _g = this.state.currentMode;
			if(_g != null) switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 2:
				var onError = _g[3];
				onError(new ce_core_model_CEError(500));
				break;
			case 3:
				var onError1 = _g[3];
				onError1(new ce_core_model_CEError(500));
				this.state.set_displayState(false);
				break;
			}
		}
	}
	,manageConnectError: function(msg) {
		{
			var _g = this.state.currentMode;
			if(_g != null) switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 3:
				var onError = _g[3];
				onError(new ce_core_model_CEError(500));
				this.state.set_displayState(false);
				break;
			case 2:
				throw new js__$Boot_HaxeError("unexpected mode " + Std.string(this.state.currentMode));
				break;
			}
		}
	}
	,manageLoginError: function(msg) {
		{
			var _g = this.state.currentMode;
			if(_g != null) switch(_g[1]) {
			case 0:case 1:
				this.setError(msg);
				break;
			case 3:
				var onError = _g[3];
				onError(new ce_core_model_CEError(500));
				this.state.set_displayState(false);
				break;
			case 2:
				throw new js__$Boot_HaxeError("unexpected mode " + Std.string(this.state.currentMode));
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
var ce_core_model_CEError = function(code) {
};
ce_core_model_CEError.__name__ = true;
ce_core_model_CEError.prototype = {
	toString: function() {
		return Std.string(this.code);
	}
};
var ce_core_model_DisplayMode = { __ename__ : true, __constructs__ : ["List","Icons"] };
ce_core_model_DisplayMode.List = ["List",0];
ce_core_model_DisplayMode.List.toString = $estr;
ce_core_model_DisplayMode.List.__enum__ = ce_core_model_DisplayMode;
ce_core_model_DisplayMode.Icons = ["Icons",1];
ce_core_model_DisplayMode.Icons.toString = $estr;
ce_core_model_DisplayMode.Icons.__enum__ = ce_core_model_DisplayMode;
var ce_core_model_Location = function(s,p) {
	this.set_service(s);
	this.set_path(p);
};
ce_core_model_Location.__name__ = true;
ce_core_model_Location.prototype = {
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
var ce_core_model_Mode = { __ename__ : true, __constructs__ : ["SingleFileSelection","SingleFileExport","IsLoggedIn","RequestAuthorize"] };
ce_core_model_Mode.SingleFileSelection = function(onSuccess,onError,options) { var $x = ["SingleFileSelection",0,onSuccess,onError,options]; $x.__enum__ = ce_core_model_Mode; $x.toString = $estr; return $x; };
ce_core_model_Mode.SingleFileExport = function(onSuccess,onError,input,options) { var $x = ["SingleFileExport",1,onSuccess,onError,input,options]; $x.__enum__ = ce_core_model_Mode; $x.toString = $estr; return $x; };
ce_core_model_Mode.IsLoggedIn = function(onSuccess,onError,srvName) { var $x = ["IsLoggedIn",2,onSuccess,onError,srvName]; $x.__enum__ = ce_core_model_Mode; $x.toString = $estr; return $x; };
ce_core_model_Mode.RequestAuthorize = function(onSuccess,onError,srvName) { var $x = ["RequestAuthorize",3,onSuccess,onError,srvName]; $x.__enum__ = ce_core_model_Mode; $x.toString = $estr; return $x; };
var ce_core_model_State = function() {
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
ce_core_model_State.__name__ = true;
ce_core_model_State.prototype = {
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
var ce_core_model_unifile_Service = function(n,dn,$is,d,v,il,ic,ioa,a) {
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
ce_core_model_unifile_Service.__name__ = true;
ce_core_model_unifile_Service.prototype = {
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
var ce_core_parser_json_Json2Primitive = function() { };
ce_core_parser_json_Json2Primitive.__name__ = true;
ce_core_parser_json_Json2Primitive.checkPath = function(node,path,optional) {
	if(optional == null) optional = false;
	var pathes = path.split(".");
	var n = ce_core_parser_json_Json2Primitive.doCheckPath(node,pathes,optional);
	if(n == null && !optional) console.log(path + " not found !");
	return n;
};
ce_core_parser_json_Json2Primitive.doCheckPath = function(node,pathes,optional) {
	if(optional == null) optional = false;
	var p = pathes.shift();
	if(!Object.prototype.hasOwnProperty.call(node,p) || Reflect.field(node,p) == null) {
		if(!optional) console.log(p + " not found !");
		return null;
	}
	if(pathes.length > 0) return ce_core_parser_json_Json2Primitive.doCheckPath(Reflect.field(node,p),pathes,optional);
	return Reflect.field(node,p);
};
ce_core_parser_json_Json2Primitive.node2String = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	var n = ce_core_parser_json_Json2Primitive.checkPath(node,path,nullable);
	if(n == null) {
		if(!nullable) {
		}
		return null;
	}
	return Std.string(n);
};
ce_core_parser_json_Json2Primitive.node2Float = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	return Std.parseFloat(ce_core_parser_json_Json2Primitive.node2String(node,path,nullable));
};
ce_core_parser_json_Json2Primitive.node2Int = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	return Std.parseInt(ce_core_parser_json_Json2Primitive.node2String(node,path,nullable));
};
ce_core_parser_json_Json2Primitive.node2Bool = function(node,path,nullable) {
	if(nullable == null) nullable = false;
	var v = ce_core_parser_json_Json2Primitive.node2String(node,path,nullable);
	if(v != null) return v == "true" || v == "1"; else return false;
};
var ce_core_parser_oauth_Str2OAuthResult = function() { };
ce_core_parser_oauth_Str2OAuthResult.__name__ = true;
ce_core_parser_oauth_Str2OAuthResult.parse = function(dataStr) {
	if(dataStr.indexOf("?") == 0) dataStr = HxOverrides.substr(dataStr,1,null);
	var dataArr = dataStr.split("&");
	var res = { };
	var _g = 0;
	while(_g < dataArr.length) {
		var pStr = dataArr[_g];
		++_g;
		var kv = pStr.split("=");
		res = ce_core_parser_oauth_Str2OAuthResult.parseValue(res,kv[0],kv[1]);
	}
	return res;
};
ce_core_parser_oauth_Str2OAuthResult.parseValue = function(obj,key,value) {
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
		throw new js__$Boot_HaxeError("unexpected parameter " + key);
	}
	return obj;
};
var ce_core_parser_unifile_Json2Account = function() { };
ce_core_parser_unifile_Json2Account.__name__ = true;
ce_core_parser_unifile_Json2Account.parseAccount = function(dataStr,obj) {
	if(obj == null) {
		if(dataStr == null) return null;
		obj = JSON.parse(dataStr);
	}
	return { displayName : ce_core_parser_json_Json2Primitive.node2String(obj,"display_name",false), quotaInfo : Object.prototype.hasOwnProperty.call(obj,"quota_info")?ce_core_parser_unifile_Json2Account.parseQuotaInfo(Reflect.field(obj,"quota_info")):null};
};
ce_core_parser_unifile_Json2Account.parseQuotaInfo = function(obj) {
	return { available : ce_core_parser_json_Json2Primitive.node2Int(obj,"available",false), used : ce_core_parser_json_Json2Primitive.node2Int(obj,"used",false)};
};
var ce_core_parser_unifile_Json2ConnectResult = function() { };
ce_core_parser_unifile_Json2ConnectResult.__name__ = true;
ce_core_parser_unifile_Json2ConnectResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce_core_parser_json_Json2Primitive.node2Bool(obj,"success",false), message : ce_core_parser_json_Json2Primitive.node2String(obj,"message",false), authorizeUrl : ce_core_parser_json_Json2Primitive.node2String(obj,"authorize_url",false)};
};
var ce_core_parser_unifile_Json2File = function() { };
ce_core_parser_unifile_Json2File.__name__ = true;
ce_core_parser_unifile_Json2File.parseFileCollection = function(dataStr) {
	var col = JSON.parse(dataStr);
	var fileCol = [];
	var _g = 0;
	while(_g < col.length) {
		var f = col[_g];
		++_g;
		fileCol.push(ce_core_parser_unifile_Json2File.parseFile(f));
	}
	return fileCol;
};
ce_core_parser_unifile_Json2File.parseFile = function(obj) {
	var dStr = ce_core_parser_json_Json2Primitive.node2String(obj,"modified",false);
	return { name : ce_core_parser_json_Json2Primitive.node2String(obj,"name",false), bytes : ce_core_parser_json_Json2Primitive.node2Int(obj,"bytes",false), modified : dStr != null?(function($this) {
		var $r;
		var t = new Date(dStr).getTime();
		var d = new Date();
		d.setTime(t);
		$r = d;
		return $r;
	}(this)):null, isDir : ce_core_parser_json_Json2Primitive.node2Bool(obj,"is_dir",false)};
};
var ce_core_parser_unifile_Json2LoginResult = function() { };
ce_core_parser_unifile_Json2LoginResult.__name__ = true;
ce_core_parser_unifile_Json2LoginResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce_core_parser_json_Json2Primitive.node2Bool(obj,"success",false)};
};
var ce_core_parser_unifile_Json2LogoutResult = function() { };
ce_core_parser_unifile_Json2LogoutResult.__name__ = true;
ce_core_parser_unifile_Json2LogoutResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce_core_parser_json_Json2Primitive.node2Bool(obj,"success",false), message : ce_core_parser_json_Json2Primitive.node2String(obj,"message",false)};
};
var ce_core_parser_unifile_Json2Service = function() { };
ce_core_parser_unifile_Json2Service.__name__ = true;
ce_core_parser_unifile_Json2Service.parseServiceCollection = function(dataStr) {
	var col = JSON.parse(dataStr);
	var serviceCol = [];
	var _g = 0;
	while(_g < col.length) {
		var s = col[_g];
		++_g;
		serviceCol.push(ce_core_parser_unifile_Json2Service.parseService(s));
	}
	return serviceCol;
};
ce_core_parser_unifile_Json2Service.parseService = function(obj) {
	return new ce_core_model_unifile_Service(ce_core_parser_json_Json2Primitive.node2String(obj,"name",false),ce_core_parser_json_Json2Primitive.node2String(obj,"display_name",false),ce_core_parser_json_Json2Primitive.node2String(obj,"image_small",false),ce_core_parser_json_Json2Primitive.node2String(obj,"description",false),ce_core_parser_json_Json2Primitive.node2Bool(obj,"visible",false),ce_core_parser_json_Json2Primitive.node2Bool(obj,"isLoggedIn",false),ce_core_parser_json_Json2Primitive.node2Bool(obj,"isConnected",false),ce_core_parser_json_Json2Primitive.node2Bool(obj,"isOAuth",false),Object.prototype.hasOwnProperty.call(obj,"user")?ce_core_parser_unifile_Json2Account.parseAccount(null,Reflect.field(obj,"user")):null);
};
var ce_core_parser_unifile_Json2UnifileError = function() { };
ce_core_parser_unifile_Json2UnifileError.__name__ = true;
ce_core_parser_unifile_Json2UnifileError.parseUnifileError = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce_core_parser_json_Json2Primitive.node2Bool(obj,"success",false), code : ce_core_parser_json_Json2Primitive.node2Int(obj,"code",false), message : ce_core_parser_json_Json2Primitive.node2String(obj,"message",false)};
};
var ce_core_parser_unifile_Json2UploadResult = function() { };
ce_core_parser_unifile_Json2UploadResult.__name__ = true;
ce_core_parser_unifile_Json2UploadResult.parse = function(dataStr) {
	var obj = JSON.parse(dataStr);
	return { success : ce_core_parser_json_Json2Primitive.node2Bool(obj,"success",false)};
};
var ce_core_service_UnifileSrv = function(config) {
	this.config = config;
};
ce_core_service_UnifileSrv.__name__ = true;
ce_core_service_UnifileSrv.prototype = {
	generateUrl: function(srv,path,filename) {
		return this.config.unifileEndpoint + StringTools.replace(StringTools.replace("{srv}/exec/get/{uri}","{srv}",srv),"{uri}",path.length > 1?HxOverrides.substr(path,1,null) + filename:filename);
	}
	,explodeUrl: function(url) {
		if(url.indexOf(this.config.unifileEndpoint) != 0) throw new js__$Boot_HaxeError("ERROR: can't convert url to path: " + url);
		var parsedUrl = HxOverrides.substr(url,this.config.unifileEndpoint.length,null);
		if(parsedUrl.indexOf("/exec/get/") != parsedUrl.indexOf("/")) throw new js__$Boot_HaxeError("ERROR: can't convert url to path: " + url);
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
		return { 'srv' : srv, 'path' : path, 'filename' : filename};
	}
	,listServices: function(onSuccess,onError) {
		var req = new XMLHttpRequest();
		req.onload = function(_) {
			if(req.status != 200) {
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else {
				var sl = ce_core_parser_unifile_Json2Service.parseServiceCollection(req.responseText);
				var slm = new haxe_ds_StringMap();
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce_core_parser_unifile_Json2ConnectResult.parse(req.responseText));
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce_core_parser_unifile_Json2LoginResult.parse(req.responseText));
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce_core_parser_unifile_Json2Account.parseAccount(req.responseText));
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else onSuccess(ce_core_parser_unifile_Json2LogoutResult.parse(req.responseText));
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
				onError(err);
			} else {
				var fa = ce_core_parser_unifile_Json2File.parseFileCollection(req.responseText);
				var fsm = new haxe_ds_StringMap();
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(xhttp.responseText);
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
				var err = ce_core_parser_unifile_Json2UnifileError.parseUnifileError(req.responseText);
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
var ce_core_view_AlertPopup = function(elt) {
	this.elt = elt;
	this.txtElt = elt.querySelector(".txt");
	this.choiceTmpl = this.txtElt.querySelector(".choice");
	this.txtElt.removeChild(this.choiceTmpl);
	this.choicesElts = [];
};
ce_core_view_AlertPopup.__name__ = true;
ce_core_view_AlertPopup.prototype = {
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
		if(level != null) switch(level) {
		case 0:
			ce_util_HtmlTools.toggleClass(this.elt,"error",true);
			ce_util_HtmlTools.toggleClass(this.elt,"warning",false);
			break;
		case 1:
			ce_util_HtmlTools.toggleClass(this.elt,"error",false);
			ce_util_HtmlTools.toggleClass(this.elt,"warning",true);
			break;
		default:
			ce_util_HtmlTools.toggleClass(this.elt,"error",false);
			ce_util_HtmlTools.toggleClass(this.elt,"warning",false);
		} else {
			ce_util_HtmlTools.toggleClass(this.elt,"error",false);
			ce_util_HtmlTools.toggleClass(this.elt,"warning",false);
		}
		haxe_Timer.delay(function() {
			_g.txtElt.style.marginTop = "-" + Std.string(_g.txtElt.offsetHeight / 2 + 20) + "px";
		},0);
	}
};
var ce_core_view_Application = function(iframe,config) {
	this.iframe = iframe;
	this.config = config;
	this.initFrame();
	ce_core_view_Application.oauthCbListener = $bind(this,this.listenOAuthCb);
};
ce_core_view_Application.__name__ = true;
ce_core_view_Application.oauthCb = $hx_exports.CEoauthCb = function(pStr) {
	if(ce_core_view_Application.oauthCbListener != null) ce_core_view_Application.oauthCbListener(pStr);
};
ce_core_view_Application.prototype = {
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
		ce_util_HtmlTools.toggleClass(this.rootElt,"srv-" + "dropbox",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"srv-" + "ftp",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"srv-" + "www",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"srv-" + s,true);
	}
	,setSortField: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"sortedby-" + "name",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"sortedby-" + "type",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"sortedby-" + "lastUpdate",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"sortedby-" + v,true);
	}
	,setSortOrder: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"asc",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,"desc",false);
		ce_util_HtmlTools.toggleClass(this.rootElt,v,true);
	}
	,setListDisplayMode: function() {
		ce_util_HtmlTools.toggleClass(this.rootElt,"items-list",true);
		ce_util_HtmlTools.toggleClass(this.rootElt,"items-icons",false);
	}
	,setIconDisplayMode: function() {
		ce_util_HtmlTools.toggleClass(this.rootElt,"items-icons",true);
		ce_util_HtmlTools.toggleClass(this.rootElt,"items-list",false);
	}
	,setDisplayed: function(v) {
		if(v) this.iframe.style.display = "block"; else this.iframe.style.display = "none";
	}
	,setLoaderDisplayed: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"loading",v);
	}
	,setLogoutButtonDisplayed: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"loggedin",v);
	}
	,setHomeDisplayed: function(v) {
		if(v) this.cleanPreviousState();
		ce_util_HtmlTools.toggleClass(this.rootElt,"starting",v);
	}
	,setFileBrowserDisplayed: function(v) {
		if(v) this.cleanPreviousState();
		ce_util_HtmlTools.toggleClass(this.rootElt,"browsing",v);
	}
	,setExportOverwriteDisplayed: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"export-overwriting",v);
	}
	,setAuthPopupDisplayed: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"authorizing",v);
	}
	,setAlertPopupDisplayed: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"alerting",v);
	}
	,setNewFolderDisplayed: function(v) {
		if(!v) this.fileBrowser.set_newFolderName("");
		ce_util_HtmlTools.toggleClass(this.rootElt,"making-new-folder",v);
		if(v) this.fileBrowser.focusOnNewFolder();
	}
	,setSelecting: function(v) {
		ce_util_HtmlTools.toggleClass(this.rootElt,"selecting",v);
	}
	,openAuthorizationWindow: function(url) {
		var _g = this;
		var authPopup = window.open(url,"authPopup","height=829,width=1035");
		if(authPopup == null || authPopup.closed || authPopup.closed == null) this.onAuthorizationWindowBlocked(); else {
			if($bind(authPopup,authPopup.focus) != null) authPopup.focus();
			var timer = new haxe_Timer(500);
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
		if(cms != null) ce_util_HtmlTools.toggleClass(this.rootElt,cms,false);
		if(v != null) switch(v[1]) {
		case 0:
			ce_util_HtmlTools.toggleClass(this.rootElt,"single-file-sel-mode",true);
			break;
		case 1:
			ce_util_HtmlTools.toggleClass(this.rootElt,"single-file-exp-mode",true);
			break;
		case 2:
			ce_util_HtmlTools.toggleClass(this.rootElt,"is-logged-in-mode",true);
			break;
		case 3:
			ce_util_HtmlTools.toggleClass(this.rootElt,"request-authorize-mode",true);
			break;
		}
	}
	,get_location: function() {
		if(this.iframe == null) return null;
		return this.iframe.contentDocument.location.origin;
	}
	,listenOAuthCb: function(pStr) {
		var o = ce_core_parser_oauth_Str2OAuthResult.parse(pStr);
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
		ce_util_HtmlTools.toggleClass(this.rootElt,"authorizing",false);
		if(cs != null) ce_util_HtmlTools.toggleClass(this.rootElt,cs,false);
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
		this.logoutBtn = new ce_core_view_Button(this.rootElt.querySelector(".logoutBtn"));
		this.logoutBtn.onClicked = $bind(this,this.onLogoutClicked);
		this.closeBtn = new ce_core_view_Button(this.rootElt.querySelector(".closeBtn"));
		this.closeBtn.onClicked = $bind(this,this.onCloseClicked);
		this.breadcrumb = new ce_core_view_Breadcrumb(this.rootElt.querySelector(".breadcrumb"));
		this.breadcrumb.onNavBtnClicked = function(srv,path) {
			_g.onNavBtnClicked(srv,path);
		};
		this["export"] = new ce_core_view_Export(this.rootElt.querySelector(".export"));
		this["export"].onSaveBtnClicked = function() {
			_g.onSaveExportClicked();
		};
		this["export"].onOverwriteBtnClicked = function() {
			_g.onOverwriteExportClicked();
		};
		this["export"].onExportNameChanged = function() {
			_g.onExportNameChanged();
		};
		this.home = new ce_core_view_Home(this.rootElt.querySelector(".home"));
		this.home.onServiceClicked = function(name) {
			_g.onServiceClicked(name);
		};
		this.fileBrowser = new ce_core_view_FileBrowser(this.rootElt.querySelector(".fileBrowser"));
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
		this.dropzone = new ce_core_view_DropZone(this.rootElt.querySelector(".dropzone"));
		this.dropzone.onInputFilesChanged = function() {
			_g.onInputFilesChanged();
		};
		this.dropzone.onFilesDropped = function(files) {
			_g.onFilesDropped(files);
		};
		this.authPopup = new ce_core_view_AuthPopup(this.rootElt.querySelector(".authPopup"));
		this.alertPopup = new ce_core_view_AlertPopup(this.rootElt.querySelector(".alertPopup"));
		this.newFolderBtn = new ce_core_view_Button(this.rootElt.querySelector(".newFolderBtn"));
		this.newFolderBtn.onClicked = $bind(this,this.onNewFolderClicked);
		this.parentFolderBtn = new ce_core_view_Button(this.rootElt.querySelector(".parentFolderBtn"));
		this.parentFolderBtn.onClicked = $bind(this,this.onParentFolderClicked);
		this.itemsListBtn = new ce_core_view_Button(this.rootElt.querySelector(".listItemsBtn"));
		this.itemsListBtn.onClicked = $bind(this,this.onItemsListClicked);
		this.itemsIconBtn = new ce_core_view_Button(this.rootElt.querySelector(".iconItemsBtn"));
		this.itemsIconBtn.onClicked = $bind(this,this.onItemsIconClicked);
		this.deleteBtn = new ce_core_view_Button(this.rootElt.querySelector(".deleteBtn"));
		this.deleteBtn.onClicked = $bind(this,this.onDeleteClicked);
		this.rootElt.addEventListener("click",function(_) {
			_g.onClicked();
		});
		this.onViewReady();
	}
	,__properties__: {get_location:"get_location"}
};
var ce_core_view_AuthPopup = function(elt) {
	var _g = this;
	this.elt = elt;
	this.linkElt = elt.querySelector("a");
	this.linkElt.addEventListener("click",function(_) {
		_g.onClicked();
	});
	this.textElt = elt.querySelector("span");
	this.txtTmpl = this.textElt.textContent;
};
ce_core_view_AuthPopup.__name__ = true;
ce_core_view_AuthPopup.prototype = {
	onClicked: function() {
	}
	,setServerName: function(srvName) {
		this.textElt.textContent = StringTools.replace(this.txtTmpl,"{srvName}",srvName);
	}
};
var ce_core_view_Breadcrumb = function(elt) {
	this.elt = elt;
	this.pathItemTmpl = elt.querySelector("span.pathIt");
	elt.removeChild(this.pathItemTmpl);
	this.pathSepTmpl = elt.querySelector("span.sep");
	elt.removeChild(this.pathSepTmpl);
};
ce_core_view_Breadcrumb.__name__ = true;
ce_core_view_Breadcrumb.prototype = {
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
var ce_core_view_Button = function(elt) {
	var _g = this;
	this.elt = elt;
	this.elt.addEventListener("click",function(_) {
		_g.onClicked();
	});
};
ce_core_view_Button.__name__ = true;
ce_core_view_Button.prototype = {
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
var ce_core_view_DropZone = function(elt) {
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
		ce_util_HtmlTools.toggleClass(_g.elt,"draggingover",true);
	});
	this.elt.addEventListener("dragleave",function(e2) {
		ce_util_HtmlTools.toggleClass(_g.elt,"draggingover",false);
	});
	this.elt.addEventListener("drop",function(e3) {
		e3.preventDefault();
		e3.stopPropagation();
		ce_util_HtmlTools.toggleClass(_g.elt,"draggingover",false);
		var fileList = e3.dataTransfer.files;
		if(fileList.length > 0) _g.onFilesDropped(fileList);
	});
};
ce_core_view_DropZone.__name__ = true;
ce_core_view_DropZone.prototype = {
	onInputFilesChanged: function() {
	}
	,onFilesDropped: function(files) {
	}
	,onBtnClicked: function() {
		this.inputElt.click();
	}
};
var ce_core_view_Export = function(elt) {
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
ce_core_view_Export.__name__ = true;
ce_core_view_Export.prototype = {
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
var ce_core_view_FileBrowser = function(elt) {
	var _g = this;
	this.elt = elt;
	this.srvItemElts = new haxe_ds_StringMap();
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
ce_core_view_FileBrowser.__name__ = true;
ce_core_view_FileBrowser.prototype = {
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
		ce_util_HtmlTools.toggleClass(this.srvItemElts.get(name),"connected",connected);
	}
	,resetFileList: function() {
		while(this.fileListItems.length > 0) this.fileListElt.removeChild(this.fileListItems.pop().elt);
	}
	,addFolder: function(id,name,lastUpdate,selectable) {
		if(selectable == null) selectable = true;
		var _g = this;
		var newItem = this.folderItemTmpl.cloneNode(true);
		var fli = new ce_core_view_FileListItem(newItem);
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
		var fli = new ce_core_view_FileListItem(newItem);
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
		if(this.filters != null && HxOverrides.indexOf(this.filters,"text/directory",0) > -1) ce_util_HtmlTools.toggleClass(this.elt,"selectFolders",true); else ce_util_HtmlTools.toggleClass(this.elt,"selectFolders",false);
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
var ce_core_view_FileListItem = function(elt) {
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
			ce_util_HtmlTools.toggleClass(elt,"renaming",false);
			_g.onRenameRequested();
		}
	});
	this.renameInput.addEventListener("focusout",function(_2) {
		ce_util_HtmlTools.toggleClass(elt,"renaming",false);
		_g.onRenameRequested();
	});
	this.typeElt = elt.querySelector("span.fileType");
	this.dateElt = elt.querySelector("span.lastUpdate");
	this.renameBtn = elt.querySelector("button.rename");
	this.renameBtn.addEventListener("click",function(_3) {
		ce_util_HtmlTools.toggleClass(elt,"renaming",true);
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
ce_core_view_FileListItem.__name__ = true;
ce_core_view_FileListItem.prototype = {
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
		if(Lambda.has(ce_util_HtmlTools.classes(this.elt),"folder".toLowerCase())) return "text/directory";
		return this.typeElt.textContent;
	}
	,set_type: function(v) {
		this.typeElt.textContent = v;
		ce_util_HtmlTools.toggleClass(this.elt,"image",v.indexOf("image/") == 0);
		ce_util_HtmlTools.toggleClass(this.elt,"sound",v.indexOf("audio/") == 0);
		ce_util_HtmlTools.toggleClass(this.elt,"video",v.indexOf("video/") == 0);
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
		return !Lambda.has(ce_util_HtmlTools.classes(this.elt),"nosel".toLowerCase());
	}
	,set_selectable: function(v) {
		ce_util_HtmlTools.toggleClass(this.elt,"nosel",!v);
		return v;
	}
	,get_filteredOut: function() {
		return Lambda.has(ce_util_HtmlTools.classes(this.elt),"filteredOut".toLowerCase());
	}
	,set_filteredOut: function(v) {
		ce_util_HtmlTools.toggleClass(this.elt,"filteredOut",v);
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
var ce_core_view_Home = function(elt) {
	this.elt = elt;
	this.listElt = elt.querySelector("ul");
	this.srvItemTmpl = elt.querySelector("li");
	this.listElt.removeChild(this.srvItemTmpl);
};
ce_core_view_Home.__name__ = true;
ce_core_view_Home.prototype = {
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
var ce_util_FileTools = function() { };
ce_util_FileTools.__name__ = true;
ce_util_FileTools.mimeTypeByExt = function() {
	return (function($this) {
		var $r;
		var _g = new haxe_ds_StringMap();
		if(__map_reserved[".323"] != null) _g.setReserved(".323","text/h323"); else _g.h[".323"] = "text/h323";
		if(__map_reserved[".3g2"] != null) _g.setReserved(".3g2","video/3gpp2"); else _g.h[".3g2"] = "video/3gpp2";
		if(__map_reserved[".3gp"] != null) _g.setReserved(".3gp","video/3gpp"); else _g.h[".3gp"] = "video/3gpp";
		if(__map_reserved[".3gp2"] != null) _g.setReserved(".3gp2","video/3gpp2"); else _g.h[".3gp2"] = "video/3gpp2";
		if(__map_reserved[".3gpp"] != null) _g.setReserved(".3gpp","video/3gpp"); else _g.h[".3gpp"] = "video/3gpp";
		if(__map_reserved[".7z"] != null) _g.setReserved(".7z","application/x-7z-compressed"); else _g.h[".7z"] = "application/x-7z-compressed";
		if(__map_reserved[".aa"] != null) _g.setReserved(".aa","audio/audible"); else _g.h[".aa"] = "audio/audible";
		if(__map_reserved[".AAC"] != null) _g.setReserved(".AAC","audio/aac"); else _g.h[".AAC"] = "audio/aac";
		if(__map_reserved[".aaf"] != null) _g.setReserved(".aaf","application/octet-stream"); else _g.h[".aaf"] = "application/octet-stream";
		if(__map_reserved[".aax"] != null) _g.setReserved(".aax","audio/vnd.audible.aax"); else _g.h[".aax"] = "audio/vnd.audible.aax";
		if(__map_reserved[".ac3"] != null) _g.setReserved(".ac3","audio/ac3"); else _g.h[".ac3"] = "audio/ac3";
		if(__map_reserved[".aca"] != null) _g.setReserved(".aca","application/octet-stream"); else _g.h[".aca"] = "application/octet-stream";
		if(__map_reserved[".accda"] != null) _g.setReserved(".accda","application/msaccess.addin"); else _g.h[".accda"] = "application/msaccess.addin";
		if(__map_reserved[".accdb"] != null) _g.setReserved(".accdb","application/msaccess"); else _g.h[".accdb"] = "application/msaccess";
		if(__map_reserved[".accdc"] != null) _g.setReserved(".accdc","application/msaccess.cab"); else _g.h[".accdc"] = "application/msaccess.cab";
		if(__map_reserved[".accde"] != null) _g.setReserved(".accde","application/msaccess"); else _g.h[".accde"] = "application/msaccess";
		if(__map_reserved[".accdr"] != null) _g.setReserved(".accdr","application/msaccess.runtime"); else _g.h[".accdr"] = "application/msaccess.runtime";
		if(__map_reserved[".accdt"] != null) _g.setReserved(".accdt","application/msaccess"); else _g.h[".accdt"] = "application/msaccess";
		if(__map_reserved[".accdw"] != null) _g.setReserved(".accdw","application/msaccess.webapplication"); else _g.h[".accdw"] = "application/msaccess.webapplication";
		if(__map_reserved[".accft"] != null) _g.setReserved(".accft","application/msaccess.ftemplate"); else _g.h[".accft"] = "application/msaccess.ftemplate";
		if(__map_reserved[".acx"] != null) _g.setReserved(".acx","application/internet-property-stream"); else _g.h[".acx"] = "application/internet-property-stream";
		if(__map_reserved[".AddIn"] != null) _g.setReserved(".AddIn","text/xml"); else _g.h[".AddIn"] = "text/xml";
		if(__map_reserved[".ade"] != null) _g.setReserved(".ade","application/msaccess"); else _g.h[".ade"] = "application/msaccess";
		if(__map_reserved[".adobebridge"] != null) _g.setReserved(".adobebridge","application/x-bridge-url"); else _g.h[".adobebridge"] = "application/x-bridge-url";
		if(__map_reserved[".adp"] != null) _g.setReserved(".adp","application/msaccess"); else _g.h[".adp"] = "application/msaccess";
		if(__map_reserved[".ADT"] != null) _g.setReserved(".ADT","audio/vnd.dlna.adts"); else _g.h[".ADT"] = "audio/vnd.dlna.adts";
		if(__map_reserved[".ADTS"] != null) _g.setReserved(".ADTS","audio/aac"); else _g.h[".ADTS"] = "audio/aac";
		if(__map_reserved[".afm"] != null) _g.setReserved(".afm","application/octet-stream"); else _g.h[".afm"] = "application/octet-stream";
		if(__map_reserved[".ai"] != null) _g.setReserved(".ai","application/postscript"); else _g.h[".ai"] = "application/postscript";
		if(__map_reserved[".aif"] != null) _g.setReserved(".aif","audio/x-aiff"); else _g.h[".aif"] = "audio/x-aiff";
		if(__map_reserved[".aifc"] != null) _g.setReserved(".aifc","audio/aiff"); else _g.h[".aifc"] = "audio/aiff";
		if(__map_reserved[".aiff"] != null) _g.setReserved(".aiff","audio/aiff"); else _g.h[".aiff"] = "audio/aiff";
		if(__map_reserved[".air"] != null) _g.setReserved(".air","application/vnd.adobe.air-application-installer-package+zip"); else _g.h[".air"] = "application/vnd.adobe.air-application-installer-package+zip";
		if(__map_reserved[".amc"] != null) _g.setReserved(".amc","application/x-mpeg"); else _g.h[".amc"] = "application/x-mpeg";
		if(__map_reserved[".application"] != null) _g.setReserved(".application","application/x-ms-application"); else _g.h[".application"] = "application/x-ms-application";
		if(__map_reserved[".art"] != null) _g.setReserved(".art","image/x-jg"); else _g.h[".art"] = "image/x-jg";
		if(__map_reserved[".asa"] != null) _g.setReserved(".asa","application/xml"); else _g.h[".asa"] = "application/xml";
		if(__map_reserved[".asax"] != null) _g.setReserved(".asax","application/xml"); else _g.h[".asax"] = "application/xml";
		if(__map_reserved[".ascx"] != null) _g.setReserved(".ascx","application/xml"); else _g.h[".ascx"] = "application/xml";
		if(__map_reserved[".asd"] != null) _g.setReserved(".asd","application/octet-stream"); else _g.h[".asd"] = "application/octet-stream";
		if(__map_reserved[".asf"] != null) _g.setReserved(".asf","video/x-ms-asf"); else _g.h[".asf"] = "video/x-ms-asf";
		if(__map_reserved[".ashx"] != null) _g.setReserved(".ashx","application/xml"); else _g.h[".ashx"] = "application/xml";
		if(__map_reserved[".asi"] != null) _g.setReserved(".asi","application/octet-stream"); else _g.h[".asi"] = "application/octet-stream";
		if(__map_reserved[".asm"] != null) _g.setReserved(".asm","text/plain"); else _g.h[".asm"] = "text/plain";
		if(__map_reserved[".asmx"] != null) _g.setReserved(".asmx","application/xml"); else _g.h[".asmx"] = "application/xml";
		if(__map_reserved[".aspx"] != null) _g.setReserved(".aspx","application/xml"); else _g.h[".aspx"] = "application/xml";
		if(__map_reserved[".asr"] != null) _g.setReserved(".asr","video/x-ms-asf"); else _g.h[".asr"] = "video/x-ms-asf";
		if(__map_reserved[".asx"] != null) _g.setReserved(".asx","video/x-ms-asf"); else _g.h[".asx"] = "video/x-ms-asf";
		if(__map_reserved[".atom"] != null) _g.setReserved(".atom","application/atom+xml"); else _g.h[".atom"] = "application/atom+xml";
		if(__map_reserved[".au"] != null) _g.setReserved(".au","audio/basic"); else _g.h[".au"] = "audio/basic";
		if(__map_reserved[".avi"] != null) _g.setReserved(".avi","video/x-msvideo"); else _g.h[".avi"] = "video/x-msvideo";
		if(__map_reserved[".axs"] != null) _g.setReserved(".axs","application/olescript"); else _g.h[".axs"] = "application/olescript";
		if(__map_reserved[".bas"] != null) _g.setReserved(".bas","text/plain"); else _g.h[".bas"] = "text/plain";
		if(__map_reserved[".bcpio"] != null) _g.setReserved(".bcpio","application/x-bcpio"); else _g.h[".bcpio"] = "application/x-bcpio";
		if(__map_reserved[".bin"] != null) _g.setReserved(".bin","application/octet-stream"); else _g.h[".bin"] = "application/octet-stream";
		if(__map_reserved[".bmp"] != null) _g.setReserved(".bmp","image/bmp"); else _g.h[".bmp"] = "image/bmp";
		if(__map_reserved[".c"] != null) _g.setReserved(".c","text/plain"); else _g.h[".c"] = "text/plain";
		if(__map_reserved[".cab"] != null) _g.setReserved(".cab","application/octet-stream"); else _g.h[".cab"] = "application/octet-stream";
		if(__map_reserved[".caf"] != null) _g.setReserved(".caf","audio/x-caf"); else _g.h[".caf"] = "audio/x-caf";
		if(__map_reserved[".calx"] != null) _g.setReserved(".calx","application/vnd.ms-office.calx"); else _g.h[".calx"] = "application/vnd.ms-office.calx";
		if(__map_reserved[".cat"] != null) _g.setReserved(".cat","application/vnd.ms-pki.seccat"); else _g.h[".cat"] = "application/vnd.ms-pki.seccat";
		if(__map_reserved[".cc"] != null) _g.setReserved(".cc","text/plain"); else _g.h[".cc"] = "text/plain";
		if(__map_reserved[".cd"] != null) _g.setReserved(".cd","text/plain"); else _g.h[".cd"] = "text/plain";
		if(__map_reserved[".cdda"] != null) _g.setReserved(".cdda","audio/aiff"); else _g.h[".cdda"] = "audio/aiff";
		if(__map_reserved[".cdf"] != null) _g.setReserved(".cdf","application/x-cdf"); else _g.h[".cdf"] = "application/x-cdf";
		if(__map_reserved[".cer"] != null) _g.setReserved(".cer","application/x-x509-ca-cert"); else _g.h[".cer"] = "application/x-x509-ca-cert";
		if(__map_reserved[".chm"] != null) _g.setReserved(".chm","application/octet-stream"); else _g.h[".chm"] = "application/octet-stream";
		if(__map_reserved[".class"] != null) _g.setReserved(".class","application/x-java-applet"); else _g.h[".class"] = "application/x-java-applet";
		if(__map_reserved[".clp"] != null) _g.setReserved(".clp","application/x-msclip"); else _g.h[".clp"] = "application/x-msclip";
		if(__map_reserved[".cmx"] != null) _g.setReserved(".cmx","image/x-cmx"); else _g.h[".cmx"] = "image/x-cmx";
		if(__map_reserved[".cnf"] != null) _g.setReserved(".cnf","text/plain"); else _g.h[".cnf"] = "text/plain";
		if(__map_reserved[".cod"] != null) _g.setReserved(".cod","image/cis-cod"); else _g.h[".cod"] = "image/cis-cod";
		if(__map_reserved[".config"] != null) _g.setReserved(".config","application/xml"); else _g.h[".config"] = "application/xml";
		if(__map_reserved[".contact"] != null) _g.setReserved(".contact","text/x-ms-contact"); else _g.h[".contact"] = "text/x-ms-contact";
		if(__map_reserved[".coverage"] != null) _g.setReserved(".coverage","application/xml"); else _g.h[".coverage"] = "application/xml";
		if(__map_reserved[".cpio"] != null) _g.setReserved(".cpio","application/x-cpio"); else _g.h[".cpio"] = "application/x-cpio";
		if(__map_reserved[".cpp"] != null) _g.setReserved(".cpp","text/plain"); else _g.h[".cpp"] = "text/plain";
		if(__map_reserved[".crd"] != null) _g.setReserved(".crd","application/x-mscardfile"); else _g.h[".crd"] = "application/x-mscardfile";
		if(__map_reserved[".crl"] != null) _g.setReserved(".crl","application/pkix-crl"); else _g.h[".crl"] = "application/pkix-crl";
		if(__map_reserved[".crt"] != null) _g.setReserved(".crt","application/x-x509-ca-cert"); else _g.h[".crt"] = "application/x-x509-ca-cert";
		if(__map_reserved[".cs"] != null) _g.setReserved(".cs","text/plain"); else _g.h[".cs"] = "text/plain";
		if(__map_reserved[".csdproj"] != null) _g.setReserved(".csdproj","text/plain"); else _g.h[".csdproj"] = "text/plain";
		if(__map_reserved[".csh"] != null) _g.setReserved(".csh","application/x-csh"); else _g.h[".csh"] = "application/x-csh";
		if(__map_reserved[".csproj"] != null) _g.setReserved(".csproj","text/plain"); else _g.h[".csproj"] = "text/plain";
		if(__map_reserved[".css"] != null) _g.setReserved(".css","text/css"); else _g.h[".css"] = "text/css";
		if(__map_reserved[".csv"] != null) _g.setReserved(".csv","text/csv"); else _g.h[".csv"] = "text/csv";
		if(__map_reserved[".cur"] != null) _g.setReserved(".cur","application/octet-stream"); else _g.h[".cur"] = "application/octet-stream";
		if(__map_reserved[".cxx"] != null) _g.setReserved(".cxx","text/plain"); else _g.h[".cxx"] = "text/plain";
		if(__map_reserved[".dat"] != null) _g.setReserved(".dat","application/octet-stream"); else _g.h[".dat"] = "application/octet-stream";
		if(__map_reserved[".datasource"] != null) _g.setReserved(".datasource","application/xml"); else _g.h[".datasource"] = "application/xml";
		if(__map_reserved[".dbproj"] != null) _g.setReserved(".dbproj","text/plain"); else _g.h[".dbproj"] = "text/plain";
		if(__map_reserved[".dcr"] != null) _g.setReserved(".dcr","application/x-director"); else _g.h[".dcr"] = "application/x-director";
		if(__map_reserved[".def"] != null) _g.setReserved(".def","text/plain"); else _g.h[".def"] = "text/plain";
		if(__map_reserved[".deploy"] != null) _g.setReserved(".deploy","application/octet-stream"); else _g.h[".deploy"] = "application/octet-stream";
		if(__map_reserved[".der"] != null) _g.setReserved(".der","application/x-x509-ca-cert"); else _g.h[".der"] = "application/x-x509-ca-cert";
		if(__map_reserved[".dgml"] != null) _g.setReserved(".dgml","application/xml"); else _g.h[".dgml"] = "application/xml";
		if(__map_reserved[".dib"] != null) _g.setReserved(".dib","image/bmp"); else _g.h[".dib"] = "image/bmp";
		if(__map_reserved[".dif"] != null) _g.setReserved(".dif","video/x-dv"); else _g.h[".dif"] = "video/x-dv";
		if(__map_reserved[".dir"] != null) _g.setReserved(".dir","application/x-director"); else _g.h[".dir"] = "application/x-director";
		if(__map_reserved[".disco"] != null) _g.setReserved(".disco","text/xml"); else _g.h[".disco"] = "text/xml";
		if(__map_reserved[".dll"] != null) _g.setReserved(".dll","application/x-msdownload"); else _g.h[".dll"] = "application/x-msdownload";
		if(__map_reserved[".dll.config"] != null) _g.setReserved(".dll.config","text/xml"); else _g.h[".dll.config"] = "text/xml";
		if(__map_reserved[".dlm"] != null) _g.setReserved(".dlm","text/dlm"); else _g.h[".dlm"] = "text/dlm";
		if(__map_reserved[".doc"] != null) _g.setReserved(".doc","application/msword"); else _g.h[".doc"] = "application/msword";
		if(__map_reserved[".docm"] != null) _g.setReserved(".docm","application/vnd.ms-word.document.macroEnabled.12"); else _g.h[".docm"] = "application/vnd.ms-word.document.macroEnabled.12";
		if(__map_reserved[".docx"] != null) _g.setReserved(".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"); else _g.h[".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		if(__map_reserved[".dot"] != null) _g.setReserved(".dot","application/msword"); else _g.h[".dot"] = "application/msword";
		if(__map_reserved[".dotm"] != null) _g.setReserved(".dotm","application/vnd.ms-word.template.macroEnabled.12"); else _g.h[".dotm"] = "application/vnd.ms-word.template.macroEnabled.12";
		if(__map_reserved[".dotx"] != null) _g.setReserved(".dotx","application/vnd.openxmlformats-officedocument.wordprocessingml.template"); else _g.h[".dotx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.template";
		if(__map_reserved[".dsp"] != null) _g.setReserved(".dsp","application/octet-stream"); else _g.h[".dsp"] = "application/octet-stream";
		if(__map_reserved[".dsw"] != null) _g.setReserved(".dsw","text/plain"); else _g.h[".dsw"] = "text/plain";
		if(__map_reserved[".dtd"] != null) _g.setReserved(".dtd","text/xml"); else _g.h[".dtd"] = "text/xml";
		if(__map_reserved[".dtsConfig"] != null) _g.setReserved(".dtsConfig","text/xml"); else _g.h[".dtsConfig"] = "text/xml";
		if(__map_reserved[".dv"] != null) _g.setReserved(".dv","video/x-dv"); else _g.h[".dv"] = "video/x-dv";
		if(__map_reserved[".dvi"] != null) _g.setReserved(".dvi","application/x-dvi"); else _g.h[".dvi"] = "application/x-dvi";
		if(__map_reserved[".dwf"] != null) _g.setReserved(".dwf","drawing/x-dwf"); else _g.h[".dwf"] = "drawing/x-dwf";
		if(__map_reserved[".dwp"] != null) _g.setReserved(".dwp","application/octet-stream"); else _g.h[".dwp"] = "application/octet-stream";
		if(__map_reserved[".dxr"] != null) _g.setReserved(".dxr","application/x-director"); else _g.h[".dxr"] = "application/x-director";
		if(__map_reserved[".eml"] != null) _g.setReserved(".eml","message/rfc822"); else _g.h[".eml"] = "message/rfc822";
		if(__map_reserved[".emz"] != null) _g.setReserved(".emz","application/octet-stream"); else _g.h[".emz"] = "application/octet-stream";
		if(__map_reserved[".eot"] != null) _g.setReserved(".eot","application/octet-stream"); else _g.h[".eot"] = "application/octet-stream";
		if(__map_reserved[".eps"] != null) _g.setReserved(".eps","application/postscript"); else _g.h[".eps"] = "application/postscript";
		if(__map_reserved[".etl"] != null) _g.setReserved(".etl","application/etl"); else _g.h[".etl"] = "application/etl";
		if(__map_reserved[".etx"] != null) _g.setReserved(".etx","text/x-setext"); else _g.h[".etx"] = "text/x-setext";
		if(__map_reserved[".evy"] != null) _g.setReserved(".evy","application/envoy"); else _g.h[".evy"] = "application/envoy";
		if(__map_reserved[".exe"] != null) _g.setReserved(".exe","application/octet-stream"); else _g.h[".exe"] = "application/octet-stream";
		if(__map_reserved[".exe.config"] != null) _g.setReserved(".exe.config","text/xml"); else _g.h[".exe.config"] = "text/xml";
		if(__map_reserved[".fdf"] != null) _g.setReserved(".fdf","application/vnd.fdf"); else _g.h[".fdf"] = "application/vnd.fdf";
		if(__map_reserved[".fif"] != null) _g.setReserved(".fif","application/fractals"); else _g.h[".fif"] = "application/fractals";
		if(__map_reserved[".filters"] != null) _g.setReserved(".filters","Application/xml"); else _g.h[".filters"] = "Application/xml";
		if(__map_reserved[".fla"] != null) _g.setReserved(".fla","application/octet-stream"); else _g.h[".fla"] = "application/octet-stream";
		if(__map_reserved[".flr"] != null) _g.setReserved(".flr","x-world/x-vrml"); else _g.h[".flr"] = "x-world/x-vrml";
		if(__map_reserved[".flv"] != null) _g.setReserved(".flv","video/x-flv"); else _g.h[".flv"] = "video/x-flv";
		if(__map_reserved[".fsscript"] != null) _g.setReserved(".fsscript","application/fsharp-script"); else _g.h[".fsscript"] = "application/fsharp-script";
		if(__map_reserved[".fsx"] != null) _g.setReserved(".fsx","application/fsharp-script"); else _g.h[".fsx"] = "application/fsharp-script";
		if(__map_reserved[".generictest"] != null) _g.setReserved(".generictest","application/xml"); else _g.h[".generictest"] = "application/xml";
		if(__map_reserved[".gif"] != null) _g.setReserved(".gif","image/gif"); else _g.h[".gif"] = "image/gif";
		if(__map_reserved[".group"] != null) _g.setReserved(".group","text/x-ms-group"); else _g.h[".group"] = "text/x-ms-group";
		if(__map_reserved[".gsm"] != null) _g.setReserved(".gsm","audio/x-gsm"); else _g.h[".gsm"] = "audio/x-gsm";
		if(__map_reserved[".gtar"] != null) _g.setReserved(".gtar","application/x-gtar"); else _g.h[".gtar"] = "application/x-gtar";
		if(__map_reserved[".gz"] != null) _g.setReserved(".gz","application/x-gzip"); else _g.h[".gz"] = "application/x-gzip";
		if(__map_reserved[".h"] != null) _g.setReserved(".h","text/plain"); else _g.h[".h"] = "text/plain";
		if(__map_reserved[".hdf"] != null) _g.setReserved(".hdf","application/x-hdf"); else _g.h[".hdf"] = "application/x-hdf";
		if(__map_reserved[".hdml"] != null) _g.setReserved(".hdml","text/x-hdml"); else _g.h[".hdml"] = "text/x-hdml";
		if(__map_reserved[".hhc"] != null) _g.setReserved(".hhc","application/x-oleobject"); else _g.h[".hhc"] = "application/x-oleobject";
		if(__map_reserved[".hhk"] != null) _g.setReserved(".hhk","application/octet-stream"); else _g.h[".hhk"] = "application/octet-stream";
		if(__map_reserved[".hhp"] != null) _g.setReserved(".hhp","application/octet-stream"); else _g.h[".hhp"] = "application/octet-stream";
		if(__map_reserved[".hlp"] != null) _g.setReserved(".hlp","application/winhlp"); else _g.h[".hlp"] = "application/winhlp";
		if(__map_reserved[".hpp"] != null) _g.setReserved(".hpp","text/plain"); else _g.h[".hpp"] = "text/plain";
		if(__map_reserved[".hqx"] != null) _g.setReserved(".hqx","application/mac-binhex40"); else _g.h[".hqx"] = "application/mac-binhex40";
		if(__map_reserved[".hta"] != null) _g.setReserved(".hta","application/hta"); else _g.h[".hta"] = "application/hta";
		if(__map_reserved[".htc"] != null) _g.setReserved(".htc","text/x-component"); else _g.h[".htc"] = "text/x-component";
		if(__map_reserved[".html"] != null) _g.setReserved(".html","text/html"); else _g.h[".html"] = "text/html";
		if(__map_reserved[".htm"] != null) _g.setReserved(".htm","text/html"); else _g.h[".htm"] = "text/html";
		if(__map_reserved[".htt"] != null) _g.setReserved(".htt","text/webviewhtml"); else _g.h[".htt"] = "text/webviewhtml";
		if(__map_reserved[".hxa"] != null) _g.setReserved(".hxa","application/xml"); else _g.h[".hxa"] = "application/xml";
		if(__map_reserved[".hxc"] != null) _g.setReserved(".hxc","application/xml"); else _g.h[".hxc"] = "application/xml";
		if(__map_reserved[".hxd"] != null) _g.setReserved(".hxd","application/octet-stream"); else _g.h[".hxd"] = "application/octet-stream";
		if(__map_reserved[".hxe"] != null) _g.setReserved(".hxe","application/xml"); else _g.h[".hxe"] = "application/xml";
		if(__map_reserved[".hxf"] != null) _g.setReserved(".hxf","application/xml"); else _g.h[".hxf"] = "application/xml";
		if(__map_reserved[".hxh"] != null) _g.setReserved(".hxh","application/octet-stream"); else _g.h[".hxh"] = "application/octet-stream";
		if(__map_reserved[".hxi"] != null) _g.setReserved(".hxi","application/octet-stream"); else _g.h[".hxi"] = "application/octet-stream";
		if(__map_reserved[".hxk"] != null) _g.setReserved(".hxk","application/xml"); else _g.h[".hxk"] = "application/xml";
		if(__map_reserved[".hxq"] != null) _g.setReserved(".hxq","application/octet-stream"); else _g.h[".hxq"] = "application/octet-stream";
		if(__map_reserved[".hxr"] != null) _g.setReserved(".hxr","application/octet-stream"); else _g.h[".hxr"] = "application/octet-stream";
		if(__map_reserved[".hxs"] != null) _g.setReserved(".hxs","application/octet-stream"); else _g.h[".hxs"] = "application/octet-stream";
		if(__map_reserved[".hxt"] != null) _g.setReserved(".hxt","text/html"); else _g.h[".hxt"] = "text/html";
		if(__map_reserved[".hxv"] != null) _g.setReserved(".hxv","application/xml"); else _g.h[".hxv"] = "application/xml";
		if(__map_reserved[".hxw"] != null) _g.setReserved(".hxw","application/octet-stream"); else _g.h[".hxw"] = "application/octet-stream";
		if(__map_reserved[".hxx"] != null) _g.setReserved(".hxx","text/plain"); else _g.h[".hxx"] = "text/plain";
		if(__map_reserved[".i"] != null) _g.setReserved(".i","text/plain"); else _g.h[".i"] = "text/plain";
		if(__map_reserved[".ico"] != null) _g.setReserved(".ico","image/x-icon"); else _g.h[".ico"] = "image/x-icon";
		if(__map_reserved[".ics"] != null) _g.setReserved(".ics","application/octet-stream"); else _g.h[".ics"] = "application/octet-stream";
		if(__map_reserved[".idl"] != null) _g.setReserved(".idl","text/plain"); else _g.h[".idl"] = "text/plain";
		if(__map_reserved[".ief"] != null) _g.setReserved(".ief","image/ief"); else _g.h[".ief"] = "image/ief";
		if(__map_reserved[".iii"] != null) _g.setReserved(".iii","application/x-iphone"); else _g.h[".iii"] = "application/x-iphone";
		if(__map_reserved[".inc"] != null) _g.setReserved(".inc","text/plain"); else _g.h[".inc"] = "text/plain";
		if(__map_reserved[".inf"] != null) _g.setReserved(".inf","application/octet-stream"); else _g.h[".inf"] = "application/octet-stream";
		if(__map_reserved[".inl"] != null) _g.setReserved(".inl","text/plain"); else _g.h[".inl"] = "text/plain";
		if(__map_reserved[".ins"] != null) _g.setReserved(".ins","application/x-internet-signup"); else _g.h[".ins"] = "application/x-internet-signup";
		if(__map_reserved[".ipa"] != null) _g.setReserved(".ipa","application/x-itunes-ipa"); else _g.h[".ipa"] = "application/x-itunes-ipa";
		if(__map_reserved[".ipg"] != null) _g.setReserved(".ipg","application/x-itunes-ipg"); else _g.h[".ipg"] = "application/x-itunes-ipg";
		if(__map_reserved[".ipproj"] != null) _g.setReserved(".ipproj","text/plain"); else _g.h[".ipproj"] = "text/plain";
		if(__map_reserved[".ipsw"] != null) _g.setReserved(".ipsw","application/x-itunes-ipsw"); else _g.h[".ipsw"] = "application/x-itunes-ipsw";
		if(__map_reserved[".iqy"] != null) _g.setReserved(".iqy","text/x-ms-iqy"); else _g.h[".iqy"] = "text/x-ms-iqy";
		if(__map_reserved[".isp"] != null) _g.setReserved(".isp","application/x-internet-signup"); else _g.h[".isp"] = "application/x-internet-signup";
		if(__map_reserved[".ite"] != null) _g.setReserved(".ite","application/x-itunes-ite"); else _g.h[".ite"] = "application/x-itunes-ite";
		if(__map_reserved[".itlp"] != null) _g.setReserved(".itlp","application/x-itunes-itlp"); else _g.h[".itlp"] = "application/x-itunes-itlp";
		if(__map_reserved[".itms"] != null) _g.setReserved(".itms","application/x-itunes-itms"); else _g.h[".itms"] = "application/x-itunes-itms";
		if(__map_reserved[".itpc"] != null) _g.setReserved(".itpc","application/x-itunes-itpc"); else _g.h[".itpc"] = "application/x-itunes-itpc";
		if(__map_reserved[".IVF"] != null) _g.setReserved(".IVF","video/x-ivf"); else _g.h[".IVF"] = "video/x-ivf";
		if(__map_reserved[".jar"] != null) _g.setReserved(".jar","application/java-archive"); else _g.h[".jar"] = "application/java-archive";
		if(__map_reserved[".java"] != null) _g.setReserved(".java","application/octet-stream"); else _g.h[".java"] = "application/octet-stream";
		if(__map_reserved[".jck"] != null) _g.setReserved(".jck","application/liquidmotion"); else _g.h[".jck"] = "application/liquidmotion";
		if(__map_reserved[".jcz"] != null) _g.setReserved(".jcz","application/liquidmotion"); else _g.h[".jcz"] = "application/liquidmotion";
		if(__map_reserved[".jfif"] != null) _g.setReserved(".jfif","image/pjpeg"); else _g.h[".jfif"] = "image/pjpeg";
		if(__map_reserved[".jnlp"] != null) _g.setReserved(".jnlp","application/x-java-jnlp-file"); else _g.h[".jnlp"] = "application/x-java-jnlp-file";
		if(__map_reserved[".jpb"] != null) _g.setReserved(".jpb","application/octet-stream"); else _g.h[".jpb"] = "application/octet-stream";
		if(__map_reserved[".jpe"] != null) _g.setReserved(".jpe","image/jpeg"); else _g.h[".jpe"] = "image/jpeg";
		if(__map_reserved[".jpeg"] != null) _g.setReserved(".jpeg","image/jpeg"); else _g.h[".jpeg"] = "image/jpeg";
		if(__map_reserved[".jpg"] != null) _g.setReserved(".jpg","image/jpeg"); else _g.h[".jpg"] = "image/jpeg";
		if(__map_reserved[".js"] != null) _g.setReserved(".js","application/x-javascript"); else _g.h[".js"] = "application/x-javascript";
		if(__map_reserved[".jsx"] != null) _g.setReserved(".jsx","text/jscript"); else _g.h[".jsx"] = "text/jscript";
		if(__map_reserved[".jsxbin"] != null) _g.setReserved(".jsxbin","text/plain"); else _g.h[".jsxbin"] = "text/plain";
		if(__map_reserved[".latex"] != null) _g.setReserved(".latex","application/x-latex"); else _g.h[".latex"] = "application/x-latex";
		if(__map_reserved[".library-ms"] != null) _g.setReserved(".library-ms","application/windows-library+xml"); else _g.h[".library-ms"] = "application/windows-library+xml";
		if(__map_reserved[".lit"] != null) _g.setReserved(".lit","application/x-ms-reader"); else _g.h[".lit"] = "application/x-ms-reader";
		if(__map_reserved[".loadtest"] != null) _g.setReserved(".loadtest","application/xml"); else _g.h[".loadtest"] = "application/xml";
		if(__map_reserved[".lpk"] != null) _g.setReserved(".lpk","application/octet-stream"); else _g.h[".lpk"] = "application/octet-stream";
		if(__map_reserved[".lsf"] != null) _g.setReserved(".lsf","video/x-la-asf"); else _g.h[".lsf"] = "video/x-la-asf";
		if(__map_reserved[".lst"] != null) _g.setReserved(".lst","text/plain"); else _g.h[".lst"] = "text/plain";
		if(__map_reserved[".lsx"] != null) _g.setReserved(".lsx","video/x-la-asf"); else _g.h[".lsx"] = "video/x-la-asf";
		if(__map_reserved[".lzh"] != null) _g.setReserved(".lzh","application/octet-stream"); else _g.h[".lzh"] = "application/octet-stream";
		if(__map_reserved[".m13"] != null) _g.setReserved(".m13","application/x-msmediaview"); else _g.h[".m13"] = "application/x-msmediaview";
		if(__map_reserved[".m14"] != null) _g.setReserved(".m14","application/x-msmediaview"); else _g.h[".m14"] = "application/x-msmediaview";
		if(__map_reserved[".m1v"] != null) _g.setReserved(".m1v","video/mpeg"); else _g.h[".m1v"] = "video/mpeg";
		if(__map_reserved[".m2t"] != null) _g.setReserved(".m2t","video/vnd.dlna.mpeg-tts"); else _g.h[".m2t"] = "video/vnd.dlna.mpeg-tts";
		if(__map_reserved[".m2ts"] != null) _g.setReserved(".m2ts","video/vnd.dlna.mpeg-tts"); else _g.h[".m2ts"] = "video/vnd.dlna.mpeg-tts";
		if(__map_reserved[".m2v"] != null) _g.setReserved(".m2v","video/mpeg"); else _g.h[".m2v"] = "video/mpeg";
		if(__map_reserved[".m3u"] != null) _g.setReserved(".m3u","audio/x-mpegurl"); else _g.h[".m3u"] = "audio/x-mpegurl";
		if(__map_reserved[".m3u8"] != null) _g.setReserved(".m3u8","audio/x-mpegurl"); else _g.h[".m3u8"] = "audio/x-mpegurl";
		if(__map_reserved[".m4a"] != null) _g.setReserved(".m4a","audio/m4a"); else _g.h[".m4a"] = "audio/m4a";
		if(__map_reserved[".m4b"] != null) _g.setReserved(".m4b","audio/m4b"); else _g.h[".m4b"] = "audio/m4b";
		if(__map_reserved[".m4p"] != null) _g.setReserved(".m4p","audio/m4p"); else _g.h[".m4p"] = "audio/m4p";
		if(__map_reserved[".m4r"] != null) _g.setReserved(".m4r","audio/x-m4r"); else _g.h[".m4r"] = "audio/x-m4r";
		if(__map_reserved[".m4v"] != null) _g.setReserved(".m4v","video/x-m4v"); else _g.h[".m4v"] = "video/x-m4v";
		if(__map_reserved[".mac"] != null) _g.setReserved(".mac","image/x-macpaint"); else _g.h[".mac"] = "image/x-macpaint";
		if(__map_reserved[".mak"] != null) _g.setReserved(".mak","text/plain"); else _g.h[".mak"] = "text/plain";
		if(__map_reserved[".man"] != null) _g.setReserved(".man","application/x-troff-man"); else _g.h[".man"] = "application/x-troff-man";
		if(__map_reserved[".manifest"] != null) _g.setReserved(".manifest","application/x-ms-manifest"); else _g.h[".manifest"] = "application/x-ms-manifest";
		if(__map_reserved[".map"] != null) _g.setReserved(".map","text/plain"); else _g.h[".map"] = "text/plain";
		if(__map_reserved[".master"] != null) _g.setReserved(".master","application/xml"); else _g.h[".master"] = "application/xml";
		if(__map_reserved[".mda"] != null) _g.setReserved(".mda","application/msaccess"); else _g.h[".mda"] = "application/msaccess";
		if(__map_reserved[".mdb"] != null) _g.setReserved(".mdb","application/x-msaccess"); else _g.h[".mdb"] = "application/x-msaccess";
		if(__map_reserved[".mde"] != null) _g.setReserved(".mde","application/msaccess"); else _g.h[".mde"] = "application/msaccess";
		if(__map_reserved[".mdp"] != null) _g.setReserved(".mdp","application/octet-stream"); else _g.h[".mdp"] = "application/octet-stream";
		if(__map_reserved[".me"] != null) _g.setReserved(".me","application/x-troff-me"); else _g.h[".me"] = "application/x-troff-me";
		if(__map_reserved[".mfp"] != null) _g.setReserved(".mfp","application/x-shockwave-flash"); else _g.h[".mfp"] = "application/x-shockwave-flash";
		if(__map_reserved[".mht"] != null) _g.setReserved(".mht","message/rfc822"); else _g.h[".mht"] = "message/rfc822";
		if(__map_reserved[".mhtml"] != null) _g.setReserved(".mhtml","message/rfc822"); else _g.h[".mhtml"] = "message/rfc822";
		if(__map_reserved[".mid"] != null) _g.setReserved(".mid","audio/mid"); else _g.h[".mid"] = "audio/mid";
		if(__map_reserved[".midi"] != null) _g.setReserved(".midi","audio/mid"); else _g.h[".midi"] = "audio/mid";
		if(__map_reserved[".mix"] != null) _g.setReserved(".mix","application/octet-stream"); else _g.h[".mix"] = "application/octet-stream";
		if(__map_reserved[".mk"] != null) _g.setReserved(".mk","text/plain"); else _g.h[".mk"] = "text/plain";
		if(__map_reserved[".mmf"] != null) _g.setReserved(".mmf","application/x-smaf"); else _g.h[".mmf"] = "application/x-smaf";
		if(__map_reserved[".mno"] != null) _g.setReserved(".mno","text/xml"); else _g.h[".mno"] = "text/xml";
		if(__map_reserved[".mny"] != null) _g.setReserved(".mny","application/x-msmoney"); else _g.h[".mny"] = "application/x-msmoney";
		if(__map_reserved[".mod"] != null) _g.setReserved(".mod","video/mpeg"); else _g.h[".mod"] = "video/mpeg";
		if(__map_reserved[".mov"] != null) _g.setReserved(".mov","video/quicktime"); else _g.h[".mov"] = "video/quicktime";
		if(__map_reserved[".movie"] != null) _g.setReserved(".movie","video/x-sgi-movie"); else _g.h[".movie"] = "video/x-sgi-movie";
		if(__map_reserved[".mp2"] != null) _g.setReserved(".mp2","video/mpeg"); else _g.h[".mp2"] = "video/mpeg";
		if(__map_reserved[".mp2v"] != null) _g.setReserved(".mp2v","video/mpeg"); else _g.h[".mp2v"] = "video/mpeg";
		if(__map_reserved[".mp3"] != null) _g.setReserved(".mp3","audio/mpeg"); else _g.h[".mp3"] = "audio/mpeg";
		if(__map_reserved[".mp4"] != null) _g.setReserved(".mp4","video/mp4"); else _g.h[".mp4"] = "video/mp4";
		if(__map_reserved[".mp4v"] != null) _g.setReserved(".mp4v","video/mp4"); else _g.h[".mp4v"] = "video/mp4";
		if(__map_reserved[".mpa"] != null) _g.setReserved(".mpa","video/mpeg"); else _g.h[".mpa"] = "video/mpeg";
		if(__map_reserved[".mpe"] != null) _g.setReserved(".mpe","video/mpeg"); else _g.h[".mpe"] = "video/mpeg";
		if(__map_reserved[".mpeg"] != null) _g.setReserved(".mpeg","video/mpeg"); else _g.h[".mpeg"] = "video/mpeg";
		if(__map_reserved[".mpf"] != null) _g.setReserved(".mpf","application/vnd.ms-mediapackage"); else _g.h[".mpf"] = "application/vnd.ms-mediapackage";
		if(__map_reserved[".mpg"] != null) _g.setReserved(".mpg","video/mpeg"); else _g.h[".mpg"] = "video/mpeg";
		if(__map_reserved[".mpp"] != null) _g.setReserved(".mpp","application/vnd.ms-project"); else _g.h[".mpp"] = "application/vnd.ms-project";
		if(__map_reserved[".mpv2"] != null) _g.setReserved(".mpv2","video/mpeg"); else _g.h[".mpv2"] = "video/mpeg";
		if(__map_reserved[".mqv"] != null) _g.setReserved(".mqv","video/quicktime"); else _g.h[".mqv"] = "video/quicktime";
		if(__map_reserved[".ms"] != null) _g.setReserved(".ms","application/x-troff-ms"); else _g.h[".ms"] = "application/x-troff-ms";
		if(__map_reserved[".msi"] != null) _g.setReserved(".msi","application/octet-stream"); else _g.h[".msi"] = "application/octet-stream";
		if(__map_reserved[".mso"] != null) _g.setReserved(".mso","application/octet-stream"); else _g.h[".mso"] = "application/octet-stream";
		if(__map_reserved[".mts"] != null) _g.setReserved(".mts","video/vnd.dlna.mpeg-tts"); else _g.h[".mts"] = "video/vnd.dlna.mpeg-tts";
		if(__map_reserved[".mtx"] != null) _g.setReserved(".mtx","application/xml"); else _g.h[".mtx"] = "application/xml";
		if(__map_reserved[".mvb"] != null) _g.setReserved(".mvb","application/x-msmediaview"); else _g.h[".mvb"] = "application/x-msmediaview";
		if(__map_reserved[".mvc"] != null) _g.setReserved(".mvc","application/x-miva-compiled"); else _g.h[".mvc"] = "application/x-miva-compiled";
		if(__map_reserved[".mxp"] != null) _g.setReserved(".mxp","application/x-mmxp"); else _g.h[".mxp"] = "application/x-mmxp";
		if(__map_reserved[".nc"] != null) _g.setReserved(".nc","application/x-netcdf"); else _g.h[".nc"] = "application/x-netcdf";
		if(__map_reserved[".nsc"] != null) _g.setReserved(".nsc","video/x-ms-asf"); else _g.h[".nsc"] = "video/x-ms-asf";
		if(__map_reserved[".nws"] != null) _g.setReserved(".nws","message/rfc822"); else _g.h[".nws"] = "message/rfc822";
		if(__map_reserved[".ocx"] != null) _g.setReserved(".ocx","application/octet-stream"); else _g.h[".ocx"] = "application/octet-stream";
		if(__map_reserved[".oda"] != null) _g.setReserved(".oda","application/oda"); else _g.h[".oda"] = "application/oda";
		if(__map_reserved[".odc"] != null) _g.setReserved(".odc","text/x-ms-odc"); else _g.h[".odc"] = "text/x-ms-odc";
		if(__map_reserved[".odh"] != null) _g.setReserved(".odh","text/plain"); else _g.h[".odh"] = "text/plain";
		if(__map_reserved[".odl"] != null) _g.setReserved(".odl","text/plain"); else _g.h[".odl"] = "text/plain";
		if(__map_reserved[".odp"] != null) _g.setReserved(".odp","application/vnd.oasis.opendocument.presentation"); else _g.h[".odp"] = "application/vnd.oasis.opendocument.presentation";
		if(__map_reserved[".ods"] != null) _g.setReserved(".ods","application/oleobject"); else _g.h[".ods"] = "application/oleobject";
		if(__map_reserved[".odt"] != null) _g.setReserved(".odt","application/vnd.oasis.opendocument.text"); else _g.h[".odt"] = "application/vnd.oasis.opendocument.text";
		if(__map_reserved[".one"] != null) _g.setReserved(".one","application/onenote"); else _g.h[".one"] = "application/onenote";
		if(__map_reserved[".onea"] != null) _g.setReserved(".onea","application/onenote"); else _g.h[".onea"] = "application/onenote";
		if(__map_reserved[".onepkg"] != null) _g.setReserved(".onepkg","application/onenote"); else _g.h[".onepkg"] = "application/onenote";
		if(__map_reserved[".onetmp"] != null) _g.setReserved(".onetmp","application/onenote"); else _g.h[".onetmp"] = "application/onenote";
		if(__map_reserved[".onetoc"] != null) _g.setReserved(".onetoc","application/onenote"); else _g.h[".onetoc"] = "application/onenote";
		if(__map_reserved[".onetoc2"] != null) _g.setReserved(".onetoc2","application/onenote"); else _g.h[".onetoc2"] = "application/onenote";
		if(__map_reserved[".orderedtest"] != null) _g.setReserved(".orderedtest","application/xml"); else _g.h[".orderedtest"] = "application/xml";
		if(__map_reserved[".osdx"] != null) _g.setReserved(".osdx","application/opensearchdescription+xml"); else _g.h[".osdx"] = "application/opensearchdescription+xml";
		if(__map_reserved[".p10"] != null) _g.setReserved(".p10","application/pkcs10"); else _g.h[".p10"] = "application/pkcs10";
		if(__map_reserved[".p12"] != null) _g.setReserved(".p12","application/x-pkcs12"); else _g.h[".p12"] = "application/x-pkcs12";
		if(__map_reserved[".p7b"] != null) _g.setReserved(".p7b","application/x-pkcs7-certificates"); else _g.h[".p7b"] = "application/x-pkcs7-certificates";
		if(__map_reserved[".p7c"] != null) _g.setReserved(".p7c","application/pkcs7-mime"); else _g.h[".p7c"] = "application/pkcs7-mime";
		if(__map_reserved[".p7m"] != null) _g.setReserved(".p7m","application/pkcs7-mime"); else _g.h[".p7m"] = "application/pkcs7-mime";
		if(__map_reserved[".p7r"] != null) _g.setReserved(".p7r","application/x-pkcs7-certreqresp"); else _g.h[".p7r"] = "application/x-pkcs7-certreqresp";
		if(__map_reserved[".p7s"] != null) _g.setReserved(".p7s","application/pkcs7-signature"); else _g.h[".p7s"] = "application/pkcs7-signature";
		if(__map_reserved[".pbm"] != null) _g.setReserved(".pbm","image/x-portable-bitmap"); else _g.h[".pbm"] = "image/x-portable-bitmap";
		if(__map_reserved[".pcast"] != null) _g.setReserved(".pcast","application/x-podcast"); else _g.h[".pcast"] = "application/x-podcast";
		if(__map_reserved[".pct"] != null) _g.setReserved(".pct","image/pict"); else _g.h[".pct"] = "image/pict";
		if(__map_reserved[".pcx"] != null) _g.setReserved(".pcx","application/octet-stream"); else _g.h[".pcx"] = "application/octet-stream";
		if(__map_reserved[".pcz"] != null) _g.setReserved(".pcz","application/octet-stream"); else _g.h[".pcz"] = "application/octet-stream";
		if(__map_reserved[".pdf"] != null) _g.setReserved(".pdf","application/pdf"); else _g.h[".pdf"] = "application/pdf";
		if(__map_reserved[".pfb"] != null) _g.setReserved(".pfb","application/octet-stream"); else _g.h[".pfb"] = "application/octet-stream";
		if(__map_reserved[".pfm"] != null) _g.setReserved(".pfm","application/octet-stream"); else _g.h[".pfm"] = "application/octet-stream";
		if(__map_reserved[".pfx"] != null) _g.setReserved(".pfx","application/x-pkcs12"); else _g.h[".pfx"] = "application/x-pkcs12";
		if(__map_reserved[".pgm"] != null) _g.setReserved(".pgm","image/x-portable-graymap"); else _g.h[".pgm"] = "image/x-portable-graymap";
		if(__map_reserved[".pic"] != null) _g.setReserved(".pic","image/pict"); else _g.h[".pic"] = "image/pict";
		if(__map_reserved[".pict"] != null) _g.setReserved(".pict","image/pict"); else _g.h[".pict"] = "image/pict";
		if(__map_reserved[".pkgdef"] != null) _g.setReserved(".pkgdef","text/plain"); else _g.h[".pkgdef"] = "text/plain";
		if(__map_reserved[".pkgundef"] != null) _g.setReserved(".pkgundef","text/plain"); else _g.h[".pkgundef"] = "text/plain";
		if(__map_reserved[".pko"] != null) _g.setReserved(".pko","application/vnd.ms-pki.pko"); else _g.h[".pko"] = "application/vnd.ms-pki.pko";
		if(__map_reserved[".pls"] != null) _g.setReserved(".pls","audio/scpls"); else _g.h[".pls"] = "audio/scpls";
		if(__map_reserved[".pma"] != null) _g.setReserved(".pma","application/x-perfmon"); else _g.h[".pma"] = "application/x-perfmon";
		if(__map_reserved[".pmc"] != null) _g.setReserved(".pmc","application/x-perfmon"); else _g.h[".pmc"] = "application/x-perfmon";
		if(__map_reserved[".pml"] != null) _g.setReserved(".pml","application/x-perfmon"); else _g.h[".pml"] = "application/x-perfmon";
		if(__map_reserved[".pmr"] != null) _g.setReserved(".pmr","application/x-perfmon"); else _g.h[".pmr"] = "application/x-perfmon";
		if(__map_reserved[".pmw"] != null) _g.setReserved(".pmw","application/x-perfmon"); else _g.h[".pmw"] = "application/x-perfmon";
		if(__map_reserved[".png"] != null) _g.setReserved(".png","image/png"); else _g.h[".png"] = "image/png";
		if(__map_reserved[".pnm"] != null) _g.setReserved(".pnm","image/x-portable-anymap"); else _g.h[".pnm"] = "image/x-portable-anymap";
		if(__map_reserved[".pnt"] != null) _g.setReserved(".pnt","image/x-macpaint"); else _g.h[".pnt"] = "image/x-macpaint";
		if(__map_reserved[".pntg"] != null) _g.setReserved(".pntg","image/x-macpaint"); else _g.h[".pntg"] = "image/x-macpaint";
		if(__map_reserved[".pnz"] != null) _g.setReserved(".pnz","image/png"); else _g.h[".pnz"] = "image/png";
		if(__map_reserved[".pot"] != null) _g.setReserved(".pot","application/vnd.ms-powerpoint"); else _g.h[".pot"] = "application/vnd.ms-powerpoint";
		if(__map_reserved[".potm"] != null) _g.setReserved(".potm","application/vnd.ms-powerpoint.template.macroEnabled.12"); else _g.h[".potm"] = "application/vnd.ms-powerpoint.template.macroEnabled.12";
		if(__map_reserved[".potx"] != null) _g.setReserved(".potx","application/vnd.openxmlformats-officedocument.presentationml.template"); else _g.h[".potx"] = "application/vnd.openxmlformats-officedocument.presentationml.template";
		if(__map_reserved[".ppa"] != null) _g.setReserved(".ppa","application/vnd.ms-powerpoint"); else _g.h[".ppa"] = "application/vnd.ms-powerpoint";
		if(__map_reserved[".ppam"] != null) _g.setReserved(".ppam","application/vnd.ms-powerpoint.addin.macroEnabled.12"); else _g.h[".ppam"] = "application/vnd.ms-powerpoint.addin.macroEnabled.12";
		if(__map_reserved[".ppm"] != null) _g.setReserved(".ppm","image/x-portable-pixmap"); else _g.h[".ppm"] = "image/x-portable-pixmap";
		if(__map_reserved[".pps"] != null) _g.setReserved(".pps","application/vnd.ms-powerpoint"); else _g.h[".pps"] = "application/vnd.ms-powerpoint";
		if(__map_reserved[".ppsm"] != null) _g.setReserved(".ppsm","application/vnd.ms-powerpoint.slideshow.macroEnabled.12"); else _g.h[".ppsm"] = "application/vnd.ms-powerpoint.slideshow.macroEnabled.12";
		if(__map_reserved[".ppsx"] != null) _g.setReserved(".ppsx","application/vnd.openxmlformats-officedocument.presentationml.slideshow"); else _g.h[".ppsx"] = "application/vnd.openxmlformats-officedocument.presentationml.slideshow";
		if(__map_reserved[".ppt"] != null) _g.setReserved(".ppt","application/vnd.ms-powerpoint"); else _g.h[".ppt"] = "application/vnd.ms-powerpoint";
		if(__map_reserved[".pptm"] != null) _g.setReserved(".pptm","application/vnd.ms-powerpoint.presentation.macroEnabled.12"); else _g.h[".pptm"] = "application/vnd.ms-powerpoint.presentation.macroEnabled.12";
		if(__map_reserved[".pptx"] != null) _g.setReserved(".pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation"); else _g.h[".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		if(__map_reserved[".prf"] != null) _g.setReserved(".prf","application/pics-rules"); else _g.h[".prf"] = "application/pics-rules";
		if(__map_reserved[".prm"] != null) _g.setReserved(".prm","application/octet-stream"); else _g.h[".prm"] = "application/octet-stream";
		if(__map_reserved[".prx"] != null) _g.setReserved(".prx","application/octet-stream"); else _g.h[".prx"] = "application/octet-stream";
		if(__map_reserved[".ps"] != null) _g.setReserved(".ps","application/postscript"); else _g.h[".ps"] = "application/postscript";
		if(__map_reserved[".psc1"] != null) _g.setReserved(".psc1","application/PowerShell"); else _g.h[".psc1"] = "application/PowerShell";
		if(__map_reserved[".psd"] != null) _g.setReserved(".psd","application/octet-stream"); else _g.h[".psd"] = "application/octet-stream";
		if(__map_reserved[".psess"] != null) _g.setReserved(".psess","application/xml"); else _g.h[".psess"] = "application/xml";
		if(__map_reserved[".psm"] != null) _g.setReserved(".psm","application/octet-stream"); else _g.h[".psm"] = "application/octet-stream";
		if(__map_reserved[".psp"] != null) _g.setReserved(".psp","application/octet-stream"); else _g.h[".psp"] = "application/octet-stream";
		if(__map_reserved[".pub"] != null) _g.setReserved(".pub","application/x-mspublisher"); else _g.h[".pub"] = "application/x-mspublisher";
		if(__map_reserved[".pwz"] != null) _g.setReserved(".pwz","application/vnd.ms-powerpoint"); else _g.h[".pwz"] = "application/vnd.ms-powerpoint";
		if(__map_reserved[".qht"] != null) _g.setReserved(".qht","text/x-html-insertion"); else _g.h[".qht"] = "text/x-html-insertion";
		if(__map_reserved[".qhtm"] != null) _g.setReserved(".qhtm","text/x-html-insertion"); else _g.h[".qhtm"] = "text/x-html-insertion";
		if(__map_reserved[".qt"] != null) _g.setReserved(".qt","video/quicktime"); else _g.h[".qt"] = "video/quicktime";
		if(__map_reserved[".qti"] != null) _g.setReserved(".qti","image/x-quicktime"); else _g.h[".qti"] = "image/x-quicktime";
		if(__map_reserved[".qtif"] != null) _g.setReserved(".qtif","image/x-quicktime"); else _g.h[".qtif"] = "image/x-quicktime";
		if(__map_reserved[".qtl"] != null) _g.setReserved(".qtl","application/x-quicktimeplayer"); else _g.h[".qtl"] = "application/x-quicktimeplayer";
		if(__map_reserved[".qxd"] != null) _g.setReserved(".qxd","application/octet-stream"); else _g.h[".qxd"] = "application/octet-stream";
		if(__map_reserved[".ra"] != null) _g.setReserved(".ra","audio/x-pn-realaudio"); else _g.h[".ra"] = "audio/x-pn-realaudio";
		if(__map_reserved[".ram"] != null) _g.setReserved(".ram","audio/x-pn-realaudio"); else _g.h[".ram"] = "audio/x-pn-realaudio";
		if(__map_reserved[".rar"] != null) _g.setReserved(".rar","application/octet-stream"); else _g.h[".rar"] = "application/octet-stream";
		if(__map_reserved[".ras"] != null) _g.setReserved(".ras","image/x-cmu-raster"); else _g.h[".ras"] = "image/x-cmu-raster";
		if(__map_reserved[".rat"] != null) _g.setReserved(".rat","application/rat-file"); else _g.h[".rat"] = "application/rat-file";
		if(__map_reserved[".rc"] != null) _g.setReserved(".rc","text/plain"); else _g.h[".rc"] = "text/plain";
		if(__map_reserved[".rc2"] != null) _g.setReserved(".rc2","text/plain"); else _g.h[".rc2"] = "text/plain";
		if(__map_reserved[".rct"] != null) _g.setReserved(".rct","text/plain"); else _g.h[".rct"] = "text/plain";
		if(__map_reserved[".rdlc"] != null) _g.setReserved(".rdlc","application/xml"); else _g.h[".rdlc"] = "application/xml";
		if(__map_reserved[".resx"] != null) _g.setReserved(".resx","application/xml"); else _g.h[".resx"] = "application/xml";
		if(__map_reserved[".rf"] != null) _g.setReserved(".rf","image/vnd.rn-realflash"); else _g.h[".rf"] = "image/vnd.rn-realflash";
		if(__map_reserved[".rgb"] != null) _g.setReserved(".rgb","image/x-rgb"); else _g.h[".rgb"] = "image/x-rgb";
		if(__map_reserved[".rgs"] != null) _g.setReserved(".rgs","text/plain"); else _g.h[".rgs"] = "text/plain";
		if(__map_reserved[".rm"] != null) _g.setReserved(".rm","application/vnd.rn-realmedia"); else _g.h[".rm"] = "application/vnd.rn-realmedia";
		if(__map_reserved[".rmi"] != null) _g.setReserved(".rmi","audio/mid"); else _g.h[".rmi"] = "audio/mid";
		if(__map_reserved[".rmp"] != null) _g.setReserved(".rmp","application/vnd.rn-rn_music_package"); else _g.h[".rmp"] = "application/vnd.rn-rn_music_package";
		if(__map_reserved[".roff"] != null) _g.setReserved(".roff","application/x-troff"); else _g.h[".roff"] = "application/x-troff";
		if(__map_reserved[".rpm"] != null) _g.setReserved(".rpm","audio/x-pn-realaudio-plugin"); else _g.h[".rpm"] = "audio/x-pn-realaudio-plugin";
		if(__map_reserved[".rqy"] != null) _g.setReserved(".rqy","text/x-ms-rqy"); else _g.h[".rqy"] = "text/x-ms-rqy";
		if(__map_reserved[".rtf"] != null) _g.setReserved(".rtf","application/rtf"); else _g.h[".rtf"] = "application/rtf";
		if(__map_reserved[".rtx"] != null) _g.setReserved(".rtx","text/richtext"); else _g.h[".rtx"] = "text/richtext";
		if(__map_reserved[".ruleset"] != null) _g.setReserved(".ruleset","application/xml"); else _g.h[".ruleset"] = "application/xml";
		if(__map_reserved[".s"] != null) _g.setReserved(".s","text/plain"); else _g.h[".s"] = "text/plain";
		if(__map_reserved[".safariextz"] != null) _g.setReserved(".safariextz","application/x-safari-safariextz"); else _g.h[".safariextz"] = "application/x-safari-safariextz";
		if(__map_reserved[".scd"] != null) _g.setReserved(".scd","application/x-msschedule"); else _g.h[".scd"] = "application/x-msschedule";
		if(__map_reserved[".sct"] != null) _g.setReserved(".sct","text/scriptlet"); else _g.h[".sct"] = "text/scriptlet";
		if(__map_reserved[".sd2"] != null) _g.setReserved(".sd2","audio/x-sd2"); else _g.h[".sd2"] = "audio/x-sd2";
		if(__map_reserved[".sdp"] != null) _g.setReserved(".sdp","application/sdp"); else _g.h[".sdp"] = "application/sdp";
		if(__map_reserved[".sea"] != null) _g.setReserved(".sea","application/octet-stream"); else _g.h[".sea"] = "application/octet-stream";
		if(__map_reserved[".searchConnector-ms"] != null) _g.setReserved(".searchConnector-ms","application/windows-search-connector+xml"); else _g.h[".searchConnector-ms"] = "application/windows-search-connector+xml";
		if(__map_reserved[".setpay"] != null) _g.setReserved(".setpay","application/set-payment-initiation"); else _g.h[".setpay"] = "application/set-payment-initiation";
		if(__map_reserved[".setreg"] != null) _g.setReserved(".setreg","application/set-registration-initiation"); else _g.h[".setreg"] = "application/set-registration-initiation";
		if(__map_reserved[".settings"] != null) _g.setReserved(".settings","application/xml"); else _g.h[".settings"] = "application/xml";
		if(__map_reserved[".sgimb"] != null) _g.setReserved(".sgimb","application/x-sgimb"); else _g.h[".sgimb"] = "application/x-sgimb";
		if(__map_reserved[".sgml"] != null) _g.setReserved(".sgml","text/sgml"); else _g.h[".sgml"] = "text/sgml";
		if(__map_reserved[".sh"] != null) _g.setReserved(".sh","application/x-sh"); else _g.h[".sh"] = "application/x-sh";
		if(__map_reserved[".shar"] != null) _g.setReserved(".shar","application/x-shar"); else _g.h[".shar"] = "application/x-shar";
		if(__map_reserved[".shtml"] != null) _g.setReserved(".shtml","text/html"); else _g.h[".shtml"] = "text/html";
		if(__map_reserved[".sit"] != null) _g.setReserved(".sit","application/x-stuffit"); else _g.h[".sit"] = "application/x-stuffit";
		if(__map_reserved[".sitemap"] != null) _g.setReserved(".sitemap","application/xml"); else _g.h[".sitemap"] = "application/xml";
		if(__map_reserved[".skin"] != null) _g.setReserved(".skin","application/xml"); else _g.h[".skin"] = "application/xml";
		if(__map_reserved[".sldm"] != null) _g.setReserved(".sldm","application/vnd.ms-powerpoint.slide.macroEnabled.12"); else _g.h[".sldm"] = "application/vnd.ms-powerpoint.slide.macroEnabled.12";
		if(__map_reserved[".sldx"] != null) _g.setReserved(".sldx","application/vnd.openxmlformats-officedocument.presentationml.slide"); else _g.h[".sldx"] = "application/vnd.openxmlformats-officedocument.presentationml.slide";
		if(__map_reserved[".slk"] != null) _g.setReserved(".slk","application/vnd.ms-excel"); else _g.h[".slk"] = "application/vnd.ms-excel";
		if(__map_reserved[".sln"] != null) _g.setReserved(".sln","text/plain"); else _g.h[".sln"] = "text/plain";
		if(__map_reserved[".slupkg-ms"] != null) _g.setReserved(".slupkg-ms","application/x-ms-license"); else _g.h[".slupkg-ms"] = "application/x-ms-license";
		if(__map_reserved[".smd"] != null) _g.setReserved(".smd","audio/x-smd"); else _g.h[".smd"] = "audio/x-smd";
		if(__map_reserved[".smi"] != null) _g.setReserved(".smi","application/octet-stream"); else _g.h[".smi"] = "application/octet-stream";
		if(__map_reserved[".smx"] != null) _g.setReserved(".smx","audio/x-smd"); else _g.h[".smx"] = "audio/x-smd";
		if(__map_reserved[".smz"] != null) _g.setReserved(".smz","audio/x-smd"); else _g.h[".smz"] = "audio/x-smd";
		if(__map_reserved[".snd"] != null) _g.setReserved(".snd","audio/basic"); else _g.h[".snd"] = "audio/basic";
		if(__map_reserved[".snippet"] != null) _g.setReserved(".snippet","application/xml"); else _g.h[".snippet"] = "application/xml";
		if(__map_reserved[".snp"] != null) _g.setReserved(".snp","application/octet-stream"); else _g.h[".snp"] = "application/octet-stream";
		if(__map_reserved[".sol"] != null) _g.setReserved(".sol","text/plain"); else _g.h[".sol"] = "text/plain";
		if(__map_reserved[".sor"] != null) _g.setReserved(".sor","text/plain"); else _g.h[".sor"] = "text/plain";
		if(__map_reserved[".spc"] != null) _g.setReserved(".spc","application/x-pkcs7-certificates"); else _g.h[".spc"] = "application/x-pkcs7-certificates";
		if(__map_reserved[".spl"] != null) _g.setReserved(".spl","application/futuresplash"); else _g.h[".spl"] = "application/futuresplash";
		if(__map_reserved[".src"] != null) _g.setReserved(".src","application/x-wais-source"); else _g.h[".src"] = "application/x-wais-source";
		if(__map_reserved[".srf"] != null) _g.setReserved(".srf","text/plain"); else _g.h[".srf"] = "text/plain";
		if(__map_reserved[".SSISDeploymentManifest"] != null) _g.setReserved(".SSISDeploymentManifest","text/xml"); else _g.h[".SSISDeploymentManifest"] = "text/xml";
		if(__map_reserved[".ssm"] != null) _g.setReserved(".ssm","application/streamingmedia"); else _g.h[".ssm"] = "application/streamingmedia";
		if(__map_reserved[".sst"] != null) _g.setReserved(".sst","application/vnd.ms-pki.certstore"); else _g.h[".sst"] = "application/vnd.ms-pki.certstore";
		if(__map_reserved[".stl"] != null) _g.setReserved(".stl","application/vnd.ms-pki.stl"); else _g.h[".stl"] = "application/vnd.ms-pki.stl";
		if(__map_reserved[".sv4cpio"] != null) _g.setReserved(".sv4cpio","application/x-sv4cpio"); else _g.h[".sv4cpio"] = "application/x-sv4cpio";
		if(__map_reserved[".sv4crc"] != null) _g.setReserved(".sv4crc","application/x-sv4crc"); else _g.h[".sv4crc"] = "application/x-sv4crc";
		if(__map_reserved[".svc"] != null) _g.setReserved(".svc","application/xml"); else _g.h[".svc"] = "application/xml";
		if(__map_reserved[".swf"] != null) _g.setReserved(".swf","application/x-shockwave-flash"); else _g.h[".swf"] = "application/x-shockwave-flash";
		if(__map_reserved[".t"] != null) _g.setReserved(".t","application/x-troff"); else _g.h[".t"] = "application/x-troff";
		if(__map_reserved[".tar"] != null) _g.setReserved(".tar","application/x-tar"); else _g.h[".tar"] = "application/x-tar";
		if(__map_reserved[".tcl"] != null) _g.setReserved(".tcl","application/x-tcl"); else _g.h[".tcl"] = "application/x-tcl";
		if(__map_reserved[".testrunconfig"] != null) _g.setReserved(".testrunconfig","application/xml"); else _g.h[".testrunconfig"] = "application/xml";
		if(__map_reserved[".testsettings"] != null) _g.setReserved(".testsettings","application/xml"); else _g.h[".testsettings"] = "application/xml";
		if(__map_reserved[".tex"] != null) _g.setReserved(".tex","application/x-tex"); else _g.h[".tex"] = "application/x-tex";
		if(__map_reserved[".texi"] != null) _g.setReserved(".texi","application/x-texinfo"); else _g.h[".texi"] = "application/x-texinfo";
		if(__map_reserved[".texinfo"] != null) _g.setReserved(".texinfo","application/x-texinfo"); else _g.h[".texinfo"] = "application/x-texinfo";
		if(__map_reserved[".tgz"] != null) _g.setReserved(".tgz","application/x-compressed"); else _g.h[".tgz"] = "application/x-compressed";
		if(__map_reserved[".thmx"] != null) _g.setReserved(".thmx","application/vnd.ms-officetheme"); else _g.h[".thmx"] = "application/vnd.ms-officetheme";
		if(__map_reserved[".thn"] != null) _g.setReserved(".thn","application/octet-stream"); else _g.h[".thn"] = "application/octet-stream";
		if(__map_reserved[".tif"] != null) _g.setReserved(".tif","image/tiff"); else _g.h[".tif"] = "image/tiff";
		if(__map_reserved[".tiff"] != null) _g.setReserved(".tiff","image/tiff"); else _g.h[".tiff"] = "image/tiff";
		if(__map_reserved[".tlh"] != null) _g.setReserved(".tlh","text/plain"); else _g.h[".tlh"] = "text/plain";
		if(__map_reserved[".tli"] != null) _g.setReserved(".tli","text/plain"); else _g.h[".tli"] = "text/plain";
		if(__map_reserved[".toc"] != null) _g.setReserved(".toc","application/octet-stream"); else _g.h[".toc"] = "application/octet-stream";
		if(__map_reserved[".tr"] != null) _g.setReserved(".tr","application/x-troff"); else _g.h[".tr"] = "application/x-troff";
		if(__map_reserved[".trm"] != null) _g.setReserved(".trm","application/x-msterminal"); else _g.h[".trm"] = "application/x-msterminal";
		if(__map_reserved[".trx"] != null) _g.setReserved(".trx","application/xml"); else _g.h[".trx"] = "application/xml";
		if(__map_reserved[".ts"] != null) _g.setReserved(".ts","video/vnd.dlna.mpeg-tts"); else _g.h[".ts"] = "video/vnd.dlna.mpeg-tts";
		if(__map_reserved[".tsv"] != null) _g.setReserved(".tsv","text/tab-separated-values"); else _g.h[".tsv"] = "text/tab-separated-values";
		if(__map_reserved[".ttf"] != null) _g.setReserved(".ttf","application/octet-stream"); else _g.h[".ttf"] = "application/octet-stream";
		if(__map_reserved[".tts"] != null) _g.setReserved(".tts","video/vnd.dlna.mpeg-tts"); else _g.h[".tts"] = "video/vnd.dlna.mpeg-tts";
		if(__map_reserved[".txt"] != null) _g.setReserved(".txt","text/plain"); else _g.h[".txt"] = "text/plain";
		if(__map_reserved[".u32"] != null) _g.setReserved(".u32","application/octet-stream"); else _g.h[".u32"] = "application/octet-stream";
		if(__map_reserved[".uls"] != null) _g.setReserved(".uls","text/iuls"); else _g.h[".uls"] = "text/iuls";
		if(__map_reserved[".user"] != null) _g.setReserved(".user","text/plain"); else _g.h[".user"] = "text/plain";
		if(__map_reserved[".ustar"] != null) _g.setReserved(".ustar","application/x-ustar"); else _g.h[".ustar"] = "application/x-ustar";
		if(__map_reserved[".vb"] != null) _g.setReserved(".vb","text/plain"); else _g.h[".vb"] = "text/plain";
		if(__map_reserved[".vbdproj"] != null) _g.setReserved(".vbdproj","text/plain"); else _g.h[".vbdproj"] = "text/plain";
		if(__map_reserved[".vbk"] != null) _g.setReserved(".vbk","video/mpeg"); else _g.h[".vbk"] = "video/mpeg";
		if(__map_reserved[".vbproj"] != null) _g.setReserved(".vbproj","text/plain"); else _g.h[".vbproj"] = "text/plain";
		if(__map_reserved[".vbs"] != null) _g.setReserved(".vbs","text/vbscript"); else _g.h[".vbs"] = "text/vbscript";
		if(__map_reserved[".vcf"] != null) _g.setReserved(".vcf","text/x-vcard"); else _g.h[".vcf"] = "text/x-vcard";
		if(__map_reserved[".vcproj"] != null) _g.setReserved(".vcproj","Application/xml"); else _g.h[".vcproj"] = "Application/xml";
		if(__map_reserved[".vcs"] != null) _g.setReserved(".vcs","text/plain"); else _g.h[".vcs"] = "text/plain";
		if(__map_reserved[".vcxproj"] != null) _g.setReserved(".vcxproj","Application/xml"); else _g.h[".vcxproj"] = "Application/xml";
		if(__map_reserved[".vddproj"] != null) _g.setReserved(".vddproj","text/plain"); else _g.h[".vddproj"] = "text/plain";
		if(__map_reserved[".vdp"] != null) _g.setReserved(".vdp","text/plain"); else _g.h[".vdp"] = "text/plain";
		if(__map_reserved[".vdproj"] != null) _g.setReserved(".vdproj","text/plain"); else _g.h[".vdproj"] = "text/plain";
		if(__map_reserved[".vdx"] != null) _g.setReserved(".vdx","application/vnd.ms-visio.viewer"); else _g.h[".vdx"] = "application/vnd.ms-visio.viewer";
		if(__map_reserved[".vml"] != null) _g.setReserved(".vml","text/xml"); else _g.h[".vml"] = "text/xml";
		if(__map_reserved[".vscontent"] != null) _g.setReserved(".vscontent","application/xml"); else _g.h[".vscontent"] = "application/xml";
		if(__map_reserved[".vsct"] != null) _g.setReserved(".vsct","text/xml"); else _g.h[".vsct"] = "text/xml";
		if(__map_reserved[".vsd"] != null) _g.setReserved(".vsd","application/vnd.visio"); else _g.h[".vsd"] = "application/vnd.visio";
		if(__map_reserved[".vsi"] != null) _g.setReserved(".vsi","application/ms-vsi"); else _g.h[".vsi"] = "application/ms-vsi";
		if(__map_reserved[".vsix"] != null) _g.setReserved(".vsix","application/vsix"); else _g.h[".vsix"] = "application/vsix";
		if(__map_reserved[".vsixlangpack"] != null) _g.setReserved(".vsixlangpack","text/xml"); else _g.h[".vsixlangpack"] = "text/xml";
		if(__map_reserved[".vsixmanifest"] != null) _g.setReserved(".vsixmanifest","text/xml"); else _g.h[".vsixmanifest"] = "text/xml";
		if(__map_reserved[".vsmdi"] != null) _g.setReserved(".vsmdi","application/xml"); else _g.h[".vsmdi"] = "application/xml";
		if(__map_reserved[".vspscc"] != null) _g.setReserved(".vspscc","text/plain"); else _g.h[".vspscc"] = "text/plain";
		if(__map_reserved[".vss"] != null) _g.setReserved(".vss","application/vnd.visio"); else _g.h[".vss"] = "application/vnd.visio";
		if(__map_reserved[".vsscc"] != null) _g.setReserved(".vsscc","text/plain"); else _g.h[".vsscc"] = "text/plain";
		if(__map_reserved[".vssettings"] != null) _g.setReserved(".vssettings","text/xml"); else _g.h[".vssettings"] = "text/xml";
		if(__map_reserved[".vssscc"] != null) _g.setReserved(".vssscc","text/plain"); else _g.h[".vssscc"] = "text/plain";
		if(__map_reserved[".vst"] != null) _g.setReserved(".vst","application/vnd.visio"); else _g.h[".vst"] = "application/vnd.visio";
		if(__map_reserved[".vstemplate"] != null) _g.setReserved(".vstemplate","text/xml"); else _g.h[".vstemplate"] = "text/xml";
		if(__map_reserved[".vsto"] != null) _g.setReserved(".vsto","application/x-ms-vsto"); else _g.h[".vsto"] = "application/x-ms-vsto";
		if(__map_reserved[".vsw"] != null) _g.setReserved(".vsw","application/vnd.visio"); else _g.h[".vsw"] = "application/vnd.visio";
		if(__map_reserved[".vsx"] != null) _g.setReserved(".vsx","application/vnd.visio"); else _g.h[".vsx"] = "application/vnd.visio";
		if(__map_reserved[".vtx"] != null) _g.setReserved(".vtx","application/vnd.visio"); else _g.h[".vtx"] = "application/vnd.visio";
		if(__map_reserved[".wav"] != null) _g.setReserved(".wav","audio/wav"); else _g.h[".wav"] = "audio/wav";
		if(__map_reserved[".wave"] != null) _g.setReserved(".wave","audio/wav"); else _g.h[".wave"] = "audio/wav";
		if(__map_reserved[".wax"] != null) _g.setReserved(".wax","audio/x-ms-wax"); else _g.h[".wax"] = "audio/x-ms-wax";
		if(__map_reserved[".wbk"] != null) _g.setReserved(".wbk","application/msword"); else _g.h[".wbk"] = "application/msword";
		if(__map_reserved[".wbmp"] != null) _g.setReserved(".wbmp","image/vnd.wap.wbmp"); else _g.h[".wbmp"] = "image/vnd.wap.wbmp";
		if(__map_reserved[".wcm"] != null) _g.setReserved(".wcm","application/vnd.ms-works"); else _g.h[".wcm"] = "application/vnd.ms-works";
		if(__map_reserved[".wdb"] != null) _g.setReserved(".wdb","application/vnd.ms-works"); else _g.h[".wdb"] = "application/vnd.ms-works";
		if(__map_reserved[".wdp"] != null) _g.setReserved(".wdp","image/vnd.ms-photo"); else _g.h[".wdp"] = "image/vnd.ms-photo";
		if(__map_reserved[".webarchive"] != null) _g.setReserved(".webarchive","application/x-safari-webarchive"); else _g.h[".webarchive"] = "application/x-safari-webarchive";
		if(__map_reserved[".webtest"] != null) _g.setReserved(".webtest","application/xml"); else _g.h[".webtest"] = "application/xml";
		if(__map_reserved[".wiq"] != null) _g.setReserved(".wiq","application/xml"); else _g.h[".wiq"] = "application/xml";
		if(__map_reserved[".wiz"] != null) _g.setReserved(".wiz","application/msword"); else _g.h[".wiz"] = "application/msword";
		if(__map_reserved[".wks"] != null) _g.setReserved(".wks","application/vnd.ms-works"); else _g.h[".wks"] = "application/vnd.ms-works";
		if(__map_reserved[".WLMP"] != null) _g.setReserved(".WLMP","application/wlmoviemaker"); else _g.h[".WLMP"] = "application/wlmoviemaker";
		if(__map_reserved[".wlpginstall"] != null) _g.setReserved(".wlpginstall","application/x-wlpg-detect"); else _g.h[".wlpginstall"] = "application/x-wlpg-detect";
		if(__map_reserved[".wlpginstall3"] != null) _g.setReserved(".wlpginstall3","application/x-wlpg3-detect"); else _g.h[".wlpginstall3"] = "application/x-wlpg3-detect";
		if(__map_reserved[".wm"] != null) _g.setReserved(".wm","video/x-ms-wm"); else _g.h[".wm"] = "video/x-ms-wm";
		if(__map_reserved[".wma"] != null) _g.setReserved(".wma","audio/x-ms-wma"); else _g.h[".wma"] = "audio/x-ms-wma";
		if(__map_reserved[".wmd"] != null) _g.setReserved(".wmd","application/x-ms-wmd"); else _g.h[".wmd"] = "application/x-ms-wmd";
		if(__map_reserved[".wmf"] != null) _g.setReserved(".wmf","application/x-msmetafile"); else _g.h[".wmf"] = "application/x-msmetafile";
		if(__map_reserved[".wml"] != null) _g.setReserved(".wml","text/vnd.wap.wml"); else _g.h[".wml"] = "text/vnd.wap.wml";
		if(__map_reserved[".wmlc"] != null) _g.setReserved(".wmlc","application/vnd.wap.wmlc"); else _g.h[".wmlc"] = "application/vnd.wap.wmlc";
		if(__map_reserved[".wmls"] != null) _g.setReserved(".wmls","text/vnd.wap.wmlscript"); else _g.h[".wmls"] = "text/vnd.wap.wmlscript";
		if(__map_reserved[".wmlsc"] != null) _g.setReserved(".wmlsc","application/vnd.wap.wmlscriptc"); else _g.h[".wmlsc"] = "application/vnd.wap.wmlscriptc";
		if(__map_reserved[".wmp"] != null) _g.setReserved(".wmp","video/x-ms-wmp"); else _g.h[".wmp"] = "video/x-ms-wmp";
		if(__map_reserved[".wmv"] != null) _g.setReserved(".wmv","video/x-ms-wmv"); else _g.h[".wmv"] = "video/x-ms-wmv";
		if(__map_reserved[".wmx"] != null) _g.setReserved(".wmx","video/x-ms-wmx"); else _g.h[".wmx"] = "video/x-ms-wmx";
		if(__map_reserved[".wmz"] != null) _g.setReserved(".wmz","application/x-ms-wmz"); else _g.h[".wmz"] = "application/x-ms-wmz";
		if(__map_reserved[".wpl"] != null) _g.setReserved(".wpl","application/vnd.ms-wpl"); else _g.h[".wpl"] = "application/vnd.ms-wpl";
		if(__map_reserved[".wps"] != null) _g.setReserved(".wps","application/vnd.ms-works"); else _g.h[".wps"] = "application/vnd.ms-works";
		if(__map_reserved[".wri"] != null) _g.setReserved(".wri","application/x-mswrite"); else _g.h[".wri"] = "application/x-mswrite";
		if(__map_reserved[".wrl"] != null) _g.setReserved(".wrl","x-world/x-vrml"); else _g.h[".wrl"] = "x-world/x-vrml";
		if(__map_reserved[".wrz"] != null) _g.setReserved(".wrz","x-world/x-vrml"); else _g.h[".wrz"] = "x-world/x-vrml";
		if(__map_reserved[".wsc"] != null) _g.setReserved(".wsc","text/scriptlet"); else _g.h[".wsc"] = "text/scriptlet";
		if(__map_reserved[".wsdl"] != null) _g.setReserved(".wsdl","text/xml"); else _g.h[".wsdl"] = "text/xml";
		if(__map_reserved[".wvx"] != null) _g.setReserved(".wvx","video/x-ms-wvx"); else _g.h[".wvx"] = "video/x-ms-wvx";
		if(__map_reserved[".x"] != null) _g.setReserved(".x","application/directx"); else _g.h[".x"] = "application/directx";
		if(__map_reserved[".xaf"] != null) _g.setReserved(".xaf","x-world/x-vrml"); else _g.h[".xaf"] = "x-world/x-vrml";
		if(__map_reserved[".xaml"] != null) _g.setReserved(".xaml","application/xaml+xml"); else _g.h[".xaml"] = "application/xaml+xml";
		if(__map_reserved[".xap"] != null) _g.setReserved(".xap","application/x-silverlight-app"); else _g.h[".xap"] = "application/x-silverlight-app";
		if(__map_reserved[".xbap"] != null) _g.setReserved(".xbap","application/x-ms-xbap"); else _g.h[".xbap"] = "application/x-ms-xbap";
		if(__map_reserved[".xbm"] != null) _g.setReserved(".xbm","image/x-xbitmap"); else _g.h[".xbm"] = "image/x-xbitmap";
		if(__map_reserved[".xdr"] != null) _g.setReserved(".xdr","text/plain"); else _g.h[".xdr"] = "text/plain";
		if(__map_reserved[".xht"] != null) _g.setReserved(".xht","application/xhtml+xml"); else _g.h[".xht"] = "application/xhtml+xml";
		if(__map_reserved[".xhtml"] != null) _g.setReserved(".xhtml","application/xhtml+xml"); else _g.h[".xhtml"] = "application/xhtml+xml";
		if(__map_reserved[".xla"] != null) _g.setReserved(".xla","application/vnd.ms-excel"); else _g.h[".xla"] = "application/vnd.ms-excel";
		if(__map_reserved[".xlam"] != null) _g.setReserved(".xlam","application/vnd.ms-excel.addin.macroEnabled.12"); else _g.h[".xlam"] = "application/vnd.ms-excel.addin.macroEnabled.12";
		if(__map_reserved[".xlc"] != null) _g.setReserved(".xlc","application/vnd.ms-excel"); else _g.h[".xlc"] = "application/vnd.ms-excel";
		if(__map_reserved[".xld"] != null) _g.setReserved(".xld","application/vnd.ms-excel"); else _g.h[".xld"] = "application/vnd.ms-excel";
		if(__map_reserved[".xlk"] != null) _g.setReserved(".xlk","application/vnd.ms-excel"); else _g.h[".xlk"] = "application/vnd.ms-excel";
		if(__map_reserved[".xll"] != null) _g.setReserved(".xll","application/vnd.ms-excel"); else _g.h[".xll"] = "application/vnd.ms-excel";
		if(__map_reserved[".xlm"] != null) _g.setReserved(".xlm","application/vnd.ms-excel"); else _g.h[".xlm"] = "application/vnd.ms-excel";
		if(__map_reserved[".xls"] != null) _g.setReserved(".xls","application/vnd.ms-excel"); else _g.h[".xls"] = "application/vnd.ms-excel";
		if(__map_reserved[".xlsb"] != null) _g.setReserved(".xlsb","application/vnd.ms-excel.sheet.binary.macroEnabled.12"); else _g.h[".xlsb"] = "application/vnd.ms-excel.sheet.binary.macroEnabled.12";
		if(__map_reserved[".xlsm"] != null) _g.setReserved(".xlsm","application/vnd.ms-excel.sheet.macroEnabled.12"); else _g.h[".xlsm"] = "application/vnd.ms-excel.sheet.macroEnabled.12";
		if(__map_reserved[".xlsx"] != null) _g.setReserved(".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); else _g.h[".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		if(__map_reserved[".xlt"] != null) _g.setReserved(".xlt","application/vnd.ms-excel"); else _g.h[".xlt"] = "application/vnd.ms-excel";
		if(__map_reserved[".xltm"] != null) _g.setReserved(".xltm","application/vnd.ms-excel.template.macroEnabled.12"); else _g.h[".xltm"] = "application/vnd.ms-excel.template.macroEnabled.12";
		if(__map_reserved[".xltx"] != null) _g.setReserved(".xltx","application/vnd.openxmlformats-officedocument.spreadsheetml.template"); else _g.h[".xltx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.template";
		if(__map_reserved[".xlw"] != null) _g.setReserved(".xlw","application/vnd.ms-excel"); else _g.h[".xlw"] = "application/vnd.ms-excel";
		if(__map_reserved[".xml"] != null) _g.setReserved(".xml","text/xml"); else _g.h[".xml"] = "text/xml";
		if(__map_reserved[".xmta"] != null) _g.setReserved(".xmta","application/xml"); else _g.h[".xmta"] = "application/xml";
		if(__map_reserved[".xof"] != null) _g.setReserved(".xof","x-world/x-vrml"); else _g.h[".xof"] = "x-world/x-vrml";
		if(__map_reserved[".XOML"] != null) _g.setReserved(".XOML","text/plain"); else _g.h[".XOML"] = "text/plain";
		if(__map_reserved[".xpm"] != null) _g.setReserved(".xpm","image/x-xpixmap"); else _g.h[".xpm"] = "image/x-xpixmap";
		if(__map_reserved[".xps"] != null) _g.setReserved(".xps","application/vnd.ms-xpsdocument"); else _g.h[".xps"] = "application/vnd.ms-xpsdocument";
		if(__map_reserved[".xrm-ms"] != null) _g.setReserved(".xrm-ms","text/xml"); else _g.h[".xrm-ms"] = "text/xml";
		if(__map_reserved[".xsc"] != null) _g.setReserved(".xsc","application/xml"); else _g.h[".xsc"] = "application/xml";
		if(__map_reserved[".xsd"] != null) _g.setReserved(".xsd","text/xml"); else _g.h[".xsd"] = "text/xml";
		if(__map_reserved[".xsf"] != null) _g.setReserved(".xsf","text/xml"); else _g.h[".xsf"] = "text/xml";
		if(__map_reserved[".xsl"] != null) _g.setReserved(".xsl","text/xml"); else _g.h[".xsl"] = "text/xml";
		if(__map_reserved[".xslt"] != null) _g.setReserved(".xslt","text/xml"); else _g.h[".xslt"] = "text/xml";
		if(__map_reserved[".xsn"] != null) _g.setReserved(".xsn","application/octet-stream"); else _g.h[".xsn"] = "application/octet-stream";
		if(__map_reserved[".xss"] != null) _g.setReserved(".xss","application/xml"); else _g.h[".xss"] = "application/xml";
		if(__map_reserved[".xtp"] != null) _g.setReserved(".xtp","application/octet-stream"); else _g.h[".xtp"] = "application/octet-stream";
		if(__map_reserved[".xwd"] != null) _g.setReserved(".xwd","image/x-xwindowdump"); else _g.h[".xwd"] = "image/x-xwindowdump";
		if(__map_reserved[".z"] != null) _g.setReserved(".z","application/x-compress"); else _g.h[".z"] = "application/x-compress";
		if(__map_reserved[".zip"] != null) _g.setReserved(".zip","application/x-zip-compressed"); else _g.h[".zip"] = "application/x-zip-compressed";
		$r = _g;
		return $r;
	}(this));
};
ce_util_FileTools.getMimeType = function(filename) {
	var se = filename.lastIndexOf(".");
	if(se == -1) return null; else return ce_util_FileTools.mimeTypeByExt().get(HxOverrides.substr(filename,se,null));
};
ce_util_FileTools.getExtension = function(mimetype) {
	var mtc = ce_util_FileTools.mimeTypeByExt();
	var $it0 = mtc.keys();
	while( $it0.hasNext() ) {
		var ext = $it0.next();
		if((__map_reserved[ext] != null?mtc.getReserved(ext):mtc.h[ext]) == mimetype.toLowerCase()) return ext;
	}
	return null;
};
var ce_util_HtmlTools = function() { };
ce_util_HtmlTools.__name__ = true;
ce_util_HtmlTools.classes = function(el,cl) {
	if(cl != null) el.className = cl.join(" ");
	return el.className.split(" ").filter(function(s) {
		return s != "";
	}).map(function(s1) {
		return s1.toLowerCase();
	});
};
ce_util_HtmlTools.toggleClass = function(el,cl,flag) {
	if(flag) ce_util_HtmlTools.addClass(el,cl); else ce_util_HtmlTools.removeClass(el,cl);
	return el;
};
ce_util_HtmlTools.hasClass = function(el,cl) {
	return Lambda.has(ce_util_HtmlTools.classes(el),cl.toLowerCase());
};
ce_util_HtmlTools.addClass = function(el,cl) {
	var cls = ce_util_HtmlTools.classes(el);
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
	if(changed) ce_util_HtmlTools.classes(el,cls);
	return el;
};
ce_util_HtmlTools.removeClass = function(el,cl) {
	var cls = ce_util_HtmlTools.classes(el);
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
	if(changed) ce_util_HtmlTools.classes(el,cls);
	return el;
};
ce_util_HtmlTools.offset = function(el) {
	var pos = { x : el.offsetLeft, y : el.offsetTop};
	var parent = ce_util_HtmlTools.parentElement(el);
	while(parent != null) {
		pos.x += parent.offsetLeft;
		pos.y += parent.offsetTop;
		parent = ce_util_HtmlTools.parentElement(parent);
	}
	return pos;
};
ce_util_HtmlTools.parentElement = function(el) {
	var parent = el.parentNode;
	if(parent != null && parent.nodeType == 1) return parent;
	return null;
};
ce_util_HtmlTools.vendorPrefixCall = function(el,field,args) {
	if(args == null) args = [];
	var _g = 0;
	var _g1 = ce_util_HtmlTools.vendorPrefix(field);
	while(_g < _g1.length) {
		var prefixed = _g1[_g];
		++_g;
		var v = Reflect.field(el,prefixed);
		if(typeof v != "undefined") return v.apply(el,args);
	}
	return null;
};
ce_util_HtmlTools.vendorPrefix = function(field,capitalize) {
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
ce_util_HtmlTools.vendorPrefixProperty = function(el,field) {
	var _g = 0;
	var _g1 = ce_util_HtmlTools.vendorPrefix(field);
	while(_g < _g1.length) {
		var prefixed = _g1[_g];
		++_g;
		var v = Reflect.field(el,prefixed);
		if(typeof v != "undefined") return v;
	}
	return null;
};
ce_util_HtmlTools.addEvent = function(el,event,callback) {
	ce_util_HtmlTools.addEvents(el,event.split(" "),callback);
};
ce_util_HtmlTools.addEvents = function(el,events,callback) {
	var _g = 0;
	while(_g < events.length) {
		var e = events[_g];
		++_g;
		el.addEventListener(e,callback);
	}
};
var ce_util_OptionTools = function() { };
ce_util_OptionTools.__name__ = true;
ce_util_OptionTools.normalizePickOptions = function(o) {
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
ce_util_OptionTools.normalizeExportOptions = function(o) {
	if(o == null) return o;
	if(o.mimetype != null) o.mimetype = o.mimetype.toLowerCase();
	if(o.extension != null) o.extension = o.extension.toLowerCase();
	return o;
};
ce_util_OptionTools.normalizeReadOptions = function(o) {
	return o;
};
ce_util_OptionTools.normalizeWriteOptions = function(o) {
	return o;
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = true;
haxe_Timer.delay = function(f,time_ms) {
	var t = new haxe_Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe_Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
};
var haxe_ds__$StringMap_StringMapIterator = function(map,keys) {
	this.map = map;
	this.keys = keys;
	this.index = 0;
	this.count = keys.length;
};
haxe_ds__$StringMap_StringMapIterator.__name__ = true;
haxe_ds__$StringMap_StringMapIterator.prototype = {
	hasNext: function() {
		return this.index < this.count;
	}
	,next: function() {
		return this.map.get(this.keys[this.index++]);
	}
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
	,iterator: function() {
		return new haxe_ds__$StringMap_StringMapIterator(this,this.arrayKeys());
	}
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
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
var __map_reserved = {}
ce_core_config_Config.PROP_NAME_UNIFILE_ENDPOINT = "unifile-url";
ce_core_config_Config.PROP_NAME_CE_PATH = "path";
ce_core_config_Config.PROP_VALUE_DEFAULT_UNIFILE_ENDPOINT = "http://localhost:6805/api/1.0/";
ce_core_config_Config.PROP_VALUE_DEFAULT_CE_PATH = "";
ce_core_model_CEError.CODE_BAD_PARAMETERS = 400;
ce_core_model_CEError.CODE_UNAUTHORIZED = 401;
ce_core_model_CEError.CODE_INVALID_REQUEST = 403;
ce_core_parser_oauth_Str2OAuthResult.PARAM_NOT_APPROVED = "not_approved";
ce_core_parser_oauth_Str2OAuthResult.PARAM_OAUTH_TOKEN = "oauth_token";
ce_core_parser_oauth_Str2OAuthResult.PARAM_UID = "uid";
ce_core_service_UnifileSrv.ENDPOINT_LIST_SERVICES = "services/list";
ce_core_service_UnifileSrv.ENDPOINT_CONNECT = "{srv}/connect";
ce_core_service_UnifileSrv.ENDPOINT_LOGIN = "{srv}/login";
ce_core_service_UnifileSrv.ENDPOINT_ACCOUNT = "{srv}/account";
ce_core_service_UnifileSrv.ENDPOINT_LOGOUT = "{srv}/logout";
ce_core_service_UnifileSrv.ENDPOINT_LS = "{srv}/exec/ls/{path}";
ce_core_service_UnifileSrv.ENDPOINT_RM = "{srv}/exec/rm/{path}";
ce_core_service_UnifileSrv.ENDPOINT_MKDIR = "{srv}/exec/mkdir/{path}";
ce_core_service_UnifileSrv.ENDPOINT_CP = "exec/cp";
ce_core_service_UnifileSrv.ENDPOINT_MV = "{srv}/exec/mv/{path}";
ce_core_service_UnifileSrv.ENDPOINT_GET = "{srv}/exec/get/{uri}";
ce_core_service_UnifileSrv.ENDPOINT_PUT = "{srv}/exec/put/{path}";
ce_core_view_AlertPopup.CLASS_ERROR = "error";
ce_core_view_AlertPopup.CLASS_WARNING = "warning";
ce_core_view_AlertPopup.SELECTOR_TEXT = ".txt";
ce_core_view_AlertPopup.SELECTOR_CHOICE_TMPL = ".choice";
ce_core_view_Application.PLACE_HOLDER_LOGOUT_NAME = "{name}";
ce_core_view_Application.ID_APPLICATION = "cloud-explorer";
ce_core_view_Application.CLASS_LOADING = "loading";
ce_core_view_Application.CLASS_STARTING = "starting";
ce_core_view_Application.CLASS_BROWSING = "browsing";
ce_core_view_Application.CLASS_AUTHORIZING = "authorizing";
ce_core_view_Application.CLASS_LOGGED_IN = "loggedin";
ce_core_view_Application.CLASS_ALERTING = "alerting";
ce_core_view_Application.CLASS_MAKING_NEW_FOLDER = "making-new-folder";
ce_core_view_Application.CLASS_SELECTING = "selecting";
ce_core_view_Application.CLASS_EXPORT_OVERWRITING = "export-overwriting";
ce_core_view_Application.CLASS_MODE_SINGLE_FILE_SELECTION = "single-file-sel-mode";
ce_core_view_Application.CLASS_MODE_SINGLE_FILE_EXPORT = "single-file-exp-mode";
ce_core_view_Application.CLASS_MODE_IS_LOGGED_IN = "is-logged-in-mode";
ce_core_view_Application.CLASS_MODE_REQUEST_AUTHORIZE = "request-authorize-mode";
ce_core_view_Application.CLASS_ITEMS_LIST = "items-list";
ce_core_view_Application.CLASS_ITEMS_ICONS = "items-icons";
ce_core_view_Application.CLASS_PREFIX_SORTEDBY = "sortedby-";
ce_core_view_Application.CLASS_PREFIX_SERVICE = "srv-";
ce_core_view_Application.SELECTOR_LOGOUT_BTN = ".logoutBtn";
ce_core_view_Application.SELECTOR_CLOSE_BTN = ".closeBtn";
ce_core_view_Application.SELECTOR_HOME = ".home";
ce_core_view_Application.SELECTOR_FILE_BROWSER = ".fileBrowser";
ce_core_view_Application.SELECTOR_ALERT_POPUP = ".alertPopup";
ce_core_view_Application.SELECTOR_AUTH_POPUP = ".authPopup";
ce_core_view_Application.SELECTOR_BREADCRUMB = ".breadcrumb";
ce_core_view_Application.SELECTOR_DROPZONE = ".dropzone";
ce_core_view_Application.SELECTOR_EXPORT = ".export";
ce_core_view_Application.SELECTOR_NEW_FOLDER_BTN = ".newFolderBtn";
ce_core_view_Application.SELECTOR_PARENT_FOLDER_BTN = ".parentFolderBtn";
ce_core_view_Application.SELECTOR_DELETE_BTN = ".deleteBtn";
ce_core_view_Application.SELECTOR_ITEMS_LIST_BTN = ".listItemsBtn";
ce_core_view_Application.SELECTOR_ITEMS_ICON_BTN = ".iconItemsBtn";
ce_core_view_AuthPopup.SELECTOR_LINK = "a";
ce_core_view_AuthPopup.SELECTOR_TEXT = "span";
ce_core_view_AuthPopup.PLACE_HOLDER_SRV_NAME = "{srvName}";
ce_core_view_Breadcrumb.SELECTOR_PATH_ITEM_TMPL = "span.pathIt";
ce_core_view_Breadcrumb.SELECTOR_PATH_SEP_TMPL = "span.sep";
ce_core_view_Button.ATTR_DISABLED = "disabled";
ce_core_view_Button.ATTR_VALUE_DISABLED = "disabled";
ce_core_view_DropZone.SELECTOR_INPUT = "div input";
ce_core_view_DropZone.SELECTOR_BUTTON = "div button";
ce_core_view_DropZone.CLASS_DRAGGINGOVER = "draggingover";
ce_core_view_Export.SELECTOR_INPUT = "input";
ce_core_view_Export.SELECTOR_PATH = "span.path";
ce_core_view_Export.SELECTOR_EXT = "span.ext";
ce_core_view_Export.SELECTOR_SAVE_BUTTON = ".saveBtn";
ce_core_view_Export.SELECTOR_OVERWRITE_BUTTON = ".overwriteBtn";
ce_core_view_FileBrowser.SELECTOR_SRV_LIST = ".services ul";
ce_core_view_FileBrowser.SELECTOR_FILES_LIST = ".files ul";
ce_core_view_FileBrowser.SELECTOR_SRV_ITEM_TMPL = "li";
ce_core_view_FileBrowser.SELECTOR_NEW_FOLDER_ITEM = ".folder.new";
ce_core_view_FileBrowser.SELECTOR_FOLDER_ITEM_TMPL = ".folder:nth-last-child(-n+1)";
ce_core_view_FileBrowser.SELECTOR_FILE_ITEM_TMPL = ".file";
ce_core_view_FileBrowser.SELECTOR_CONTEXT_MENU_ITEMS = "ul.contextMenu li";
ce_core_view_FileBrowser.SELECTOR_NAME_BTN = ".titles .fileName";
ce_core_view_FileBrowser.SELECTOR_TYPE_BTN = ".titles .fileType";
ce_core_view_FileBrowser.SELECTOR_DATE_BTN = ".titles .lastUpdate";
ce_core_view_FileBrowser.CLASS_SELECT_FOLDER = "selectFolders";
ce_core_view_FileBrowser.CLASS_SRV_CONNECTED = "connected";
ce_core_view_FileListItem.CLASS_RENAMING = "renaming";
ce_core_view_FileListItem.CLASS_NOT_SELECTABLE = "nosel";
ce_core_view_FileListItem.CLASS_FILTERED_OUT = "filteredOut";
ce_core_view_FileListItem.CLASS_FOLDER = "folder";
ce_core_view_FileListItem.CLASS_IMAGE = "image";
ce_core_view_FileListItem.CLASS_SOUND = "sound";
ce_core_view_FileListItem.CLASS_VIDEO = "video";
ce_core_view_Home.SELECTOR_SRV_LIST = "ul";
ce_core_view_Home.SELECTOR_SRV_ITEM_TMPL = "li";
ce_util_FileTools.DIRECTORY_MIME_TYPE = "text/directory";
})(typeof console != "undefined" ? console : {log:function(){}}, typeof window != "undefined" ? window : exports);
