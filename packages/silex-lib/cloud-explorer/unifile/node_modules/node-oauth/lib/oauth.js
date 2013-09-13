var fs = require('fs'),
    crypto= require('crypto'),
    sha1= require('./sha1'),
    http= require('http'),
    https= require('https'),
    URL= require('url'),
    querystring= require('querystring'); 
module.exports = OAuth;
function OAuth( settings ) {
  if( !(this instanceof OAuth))
    return new OAuth( settings );
  try {
    if( typeof settings == "object" )
      this.settings = settings;
    else if( typeof settings == "string" )
      this.settings = require(settings);
    else
      throw new Error('Unresolved setting.');
  } catch(e) {
    console.error(e);
    throw e;
  }
}
OAuth.prototype.authorize = function( type ,options ){
  return new Authorizer( this, type, options );
};
OAuth.prototype.access = function( type ,options, callback ){
  return new Tokenizer( this, type, options, callback );
};

// ============== Authorizer ============== //
function Authorizer( oauth, type, options ){
  if( !( this instanceof Authorizer ) )
    return new Authorizer( oauth, type, options );
  var self = this;
  
  this.oauth = oauth;
  if(!this.oauth.settings[type])
    throw new Error('API Keys are not defined.');
  _mixin(self, this.oauth.settings[type]);
  
  this.options = _mixin({signatureMethod:"HMAC-SHA1", requestTokenCallback:function(err, res){
    if(err instanceof Error)
      throw err;
    else
      (_arg2arr(arguments).pop())(); // execute callback function
  }, endCallback:function(err){
    if(err instanceof Error)
      throw err;
  }, auto: true}, options);
  if(this.options['auto']!==false){
    switch(this.version){
    case "1.0":
      _chain([this.getRequestToken, this.options['requestTokenCallback'], this.redirectToAuthorize, this.options['endCallback']], self);
      break;
    case "2.0":
      _chain([this.redirectToAuthorize, this.options['endCallback']], self);
      break;
    }
  }
};
Authorizer.prototype.getRequestToken= function( callback ) {
  var self = this, request_type = 'requestToken';
  var request_param = this[request_type], extra_param = {_nonceSize: 32};
  // Callbacks are 1.0A related
  /*
   * if( this._authorize_callback ) extraParams["oauth_callback"]=
   * this._authorize_callback;
   */
  this._performSecureRequest( "POST", request_type, request_param, extra_param, function(error, data, response) {
    if( error ) 
      callback(error);
    else {
      var results= querystring.parse(data);
      if(self.version == "1.0") {
        self.request_token = results["oauth_token"];
        self.request_token_secret = results["oauth_token_secret"];
      } else {
        self.code = results["code"];
      }
      callback( null, results );
    }
  });
};

Authorizer.prototype.redirectToAuthorize = function( callback ){
  var request_type = 'authorize';
  var request_param = this[request_type], extra_param = {_simpleArgs: true};
  this._performSecureRequest( "GET", request_type, request_param, extra_param, function(error, data, response){
    if( error ) 
      callback(error);
    else {
      // TODO need ?
      callback(null, data);
    }
  });
};

// ============== Tokenizer ============== //
function Tokenizer( oauth, type, options, callback ){
  if( !( this instanceof Tokenizer ) )
    return new Tokenizer( oauth, type, options, callback );
  var self = this;
  
  this.oauth = oauth;
  this.type = type;
  if(!this.oauth.settings[type])
    throw new Error('API Keys are not defined.');
  _mixin(self, this.oauth.settings[type]);
  
  this.options = _mixin({signatureMethod:"HMAC-SHA1", accessTokenCallback:function(err, res){
    if(err instanceof Error)
      throw err;
    else
      (_arg2arr(arguments).pop())(); // execute callback function
  }, endCallback:function(err){
    if(err instanceof Error)
      throw err;
    else if(typeof callback == "function")
      callback();
  }, auto: true}, options);
  if(this.options['auto']!==false){
    if( !this.options['href'])
      throw new Error(' Location Full Url or Request Token must be set to get OAuth access_token. ');
    var purl = URL.parse(this.options['href'], true);
    var pquery = purl.query;
    switch(this.version){
    case "1.0":
      this.request_token= pquery['oauth_token'];
      this.oauth_verifier = pquery['oauth_verifier'];
      _chain([this.getAccessToken, this.options['accessTokenCallback'], this.options['endCallback']], self);
      break;
    case "2.0":
      this.code = pquery['code'];
      _chain([this.getAccessToken, this.options['endCallback']], self);
      break;
    default:
      throw new Error('version not correct.');
    }
  }else
    if(typeof callback == "function")
      callback();
};

Tokenizer.prototype.getAccessToken= function( callback ) {
  var self = this, request_type = 'accessToken';
  var request_param = this[request_type], extra_param = {_nonceSize: 32};
  // Callbacks are 1.0A related
  /*
   * if( this._authorize_callback ) extraParams["oauth_callback"]=
   * this._authorize_callback;
   */
  this._performSecureRequest( request_param['method'] || "POST", request_type, request_param, extra_param, function(error, data, response) {
    if( error ) 
      callback(error);
    else {
      var results= querystring.parse(data);
      switch(self.version){
      case "1.0":
        self.access_token = results["oauth_token"];
        self.access_token_secret = results["oauth_token_secret"];
        break;
      case "2.0":
        self.access_token = results["access_token"];
        break;
      }
      callback( null, results );
    }
  });
  /*
   * var extraParams= {}; if( typeof oauth_verifier == "function" ) { callback=
   * oauth_verifier; } else { extraParams.oauth_verifier= oauth_verifier; }
   * this._performSecureRequest( oauth_token, oauth_token_secret, "POST",
   * this._accessUrl, extraParams, null, null, function(error, data, response) {
   * if( error ) callback(error); else { var results= querystring.parse( data );
   * callback(null, oauth_access_token, oauth_access_token_secret, results ); }
   * });
   */
};
Tokenizer.prototype.set = function( parameters ){
  _mixin(this, parameters);
};
Tokenizer.prototype.apiCommon = function(url, options){
  switch(options['version']){
  case "1.0":
    if(options['request_token'])
      this.request_token = options['request_token'];
    else if(!this.request_token)
      throw new Error("request_token is not set yet.");
    if(options['access_token_secret'])
      this.access_token_secret = options['access_token_secret'];
    else if(!this.access_token_secret)
      throw new Error("access_token_secret is not set yet.");
  case "2.0":
    ;
  default:
    if(options['access_token'])
      this.access_token = options['access_token'];
    else if(!this.access_token)
      throw new Error("access_token is not set yet.");
  }
  
  options['_extra'] = _mixin({_nonceSize:32}, options['_extra']);
  return _mixin(/^https?:/.test(url)?{url:url} : this.oauth.settings[this.type][url], options);
};
Tokenizer.prototype.del= function(url, options, callback) {
  options = this.apiCommon(url, options);
  return this._performSecureRequest( "DEL", "api", options, options._extra, null, null, callback );
};

Tokenizer.prototype.get= function(url, options, callback) {
  options = this.apiCommon(url, options);
  return this._performSecureRequest( "GET", "api", options, options._extra, null, null, callback );
};

Tokenizer.prototype._putOrPost= function(method, url, options, callback) {
  options = this.apiCommon(url, options);
  var extra_param= options._extra, post_body = options['post_body'], post_content_type = options['post_content_type'];
  if( !post_content_type ) 
    post_content_type= null;
  if( post_body != "string" ) {
    post_content_type= "application/x-www-form-urlencoded";
    extra_param= post_body;
    post_body= null;
  }
  return this._performSecureRequest( method, "api", options, extra_param, post_body, post_content_type, callback );
};
Tokenizer.prototype.put= function(url, options, callback) {
  return this._putOrPost("PUT", url, options, callback);
};
OAuth.prototype.post= function(url, options, callback) {
  return this._putOrPost("POST", url, options, callback);
};

// ============== Both prototype ============== //
Authorizer.prototype._getSignature = 
  Tokenizer.prototype._getSignature = 
    function(method, url, parameters, tokenSecret) {
  var signatureBase = _createSignatureBase( method, url, parameters );
  // encodedSecret is already encoded in getRequestToken() .
  var hash= "", key= this.encodedSecret + "&" + (_encodeData(tokenSecret) || "");
  if( this.options.signatureMethod == "PLAINTEXT" ) 
    hash= _encodeData(key);
  else {
     if( crypto.Hmac ) 
       hash = crypto.createHmac("sha1", key).update(signatureBase).digest("base64");
     else 
       hash= sha1.HMACSHA1(key, signatureBase);  
  }
  return hash;
};

// subroutined prototype methods
Authorizer.prototype._performSecureRequest = 
  Tokenizer.prototype._performSecureRequest = 
    function( method, request_type, request_param, extra_param, post_body, post_content_type,  callback ) {
  var orderedParameters = this._prepareParameters(method, request_param, extra_param);
  // args
  if( typeof post_body == "function"){
    callback = post_body;
    post_body = "";
  }
  if( !post_content_type ) 
    post_content_type= "application/x-www-form-urlencoded";

  // parsedUrl port set
  var parsedUrl= URL.parse( request_param.url, false );
  if( parsedUrl.protocol == "http:" && !parsedUrl.port ) 
    parsedUrl.port= 80;
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) 
    parsedUrl.port= 443;

  var headers= {
      "Accept" : "*/*",
      "Connection" : "close",
      "User-Agent" : "Node authentication"
    };
  var authorization = this._buildAuthorizationHeaders(orderedParameters);

  if ( /authorize|api/.test( request_type ) ) // OAuth Echo header require.
    headers["X-Verify-Credentials-Authorization"]= authorization;
  else 
    headers["Authorization"]= authorization;

  headers["Host"] = parsedUrl.host;

  for( var key in this._headers ) 
    if (this._headers.hasOwnProperty(key)) 
      headers[key]= this._headers[key];

  // Filter out any passed extra_param that are really to do with OAuth
  for(var key in extra_param) 
    if( this._hasOAuthPrefix( key )) 
      delete extra_param[key];
  
  /** TODO
  if( (method == "POST" || method == "PUT")  
      && ( !post_body && orderedParameters ) ) 
    post_body= querystring.stringify(orderedParameters);
  **/

  headers["Content-length"] = Buffer.byteLength(post_body || "");
  headers["Content-Type"] = post_content_type;
  
  var path;
  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) 
    parsedUrl.pathname ="/";
  if( parsedUrl.query ) 
    path= parsedUrl.pathname + "?"+ parsedUrl.query ;
  else if(method == "GET")
    path=_makeUrl(parsedUrl.pathname, orderedParameters, true);
  else 
    path= parsedUrl.pathname;

  if( method == "GET" && this.options['response'])
      return this.options['response'].redirect( _makeUrl(request_param.url, orderedParameters) );
  
  // ajax request start .
  var request = parsedUrl.protocol == "https:" ?
    _createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers, true):
    _createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers);
    
  if( (method == "POST" || method =="PUT") && post_body ) 
    request.write(post_body);
  // #### get Request Token ####
  // oauth_consumer_key="",oauth_nonce="",oauth_signature_method="",oauth_timestamp="",oauth_version="",oauth_signature=""
  // key = encodedConsumerSecret ( no tkn_scr )
  // #### getAccessToken ####
  // oauth_consumer_key="",oauth_nonce="",oauth_signature_method="",oauth_timestamp="",oauth_token="",oauth_verifier="",oauth_version="",oauth_signature=""
  // key = encodedConsumerSecret + request_token_scr
  // #### access api ####
  // oauth_consumer_key="",oauth_nonce="",oauth_signature_method="",oauth_timestamp="",oauth_token="",oauth_version="",oauth_signature=""
  // key = encodedConsumerSecret + access_token_scr
  request
    .on('response', accept)
    .on("error", callback)
    .end();

  var self = this;
  function accept(response){
    var data=""; 
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      data+=chunk;
    });
    response.on('end', function () {
      // TODO api response can choice "JSON.parse()" or "PLAIN TEXT"
      if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
        try{
          data = JSON.parse(data);
        }catch(e){};
        var after = request_param['callback'];
        if(typeof after == "function")
          data = after(data);
        callback(null, data, response);
      } else {
        // Follow 302 redirects with Location HTTP header
        if(response.statusCode == 302 && response.headers && response.headers.location) {
          _mixin(request_param, {url: response.headers.location});
          self._performSecureRequest( method, request_param , extra_param, post_body, post_content_type,  callback);
        }
        else {
          callback(new Error(['OAuth performing failed. ( request_type = "', request_type, '" )'].join("")), data, response);
        }
      }
    });
  }
};

// Is the parameter considered an OAuth parameter
Authorizer.prototype._hasOAuthPrefix = 
  Tokenizer.prototype._hasOAuthPrefix = 
    function(parameter) {
  var prefix = this['arg_prefix'];
  if(typeof prefix == "undefined")
    return true;
  var m = parameter.match(new RegExp(['^',prefix].join("")));
  return m && ( m[0] == prefix);
};

Authorizer.prototype._prepareParameters = 
  Tokenizer.prototype._prepareParameters = 
    function(method, request_param, extra_param ) {
  var sig = "", parsedUrl = URL.parse(request_param.url, false);
  
  var oauthParameters= {};
  
  // set setting.arg values.
  for( var i in request_param.arg){
    var val = request_param.arg[i],key, send_name;
    if(typeof val == "object"){
      key = Object.keys(val)[0];
      send_name = val[key];
    }else
      key = send_name = val;
      
    if(!this._hasOAuthPrefix(send_name))
      send_name = [this.arg_prefix, send_name].join("");
    if(this[key]){
      // TODO check : need _normalizeUrl() ?
      oauthParameters[ send_name ] = this[ key ];
    }
  }

  if( extra_param )
    for( var i in extra_param ) 
      if(!/^_/.test(i))
         oauthParameters[i]= extra_param[i];
  
  if( extra_param['_simpleArgs'] )
    return oauthParameters;
  
  _mixin(oauthParameters,   {
      "oauth_timestamp":             _getTimestamp(),
      "oauth_nonce":                   _getNonce(extra_param._nonceSize),
      "oauth_version":                 this.version,
      "oauth_signature_method":  this.options.signatureMethod
  });
  
  var tkn_scr = request_param.key ? this[request_param.key]:null;
  // TODO check
  if( parsedUrl.query ) {
    var extraParameters= querystring.parse(parsedUrl.query);
    for(var key in extraParameters ) {
      var value= extraParameters[key];
      if( typeof value == "object" ){
        // TODO: This probably should be recursive
        for(var key2 in value)
          oauthParameters[key + "[" + key2 + "]"] = value[key2];
      } else 
        oauthParameters[key]= value;
    }
  }
  
  var orderedParameters= _sortRequestParams( _makeArrayOfArgumentsHash(oauthParameters) );
  if(this.version == "1.0" ){
    this.encodedSecret = _encodeData( this['consumer_secret'] );
    sig = this._getSignature( method,  request_param.url,  _normaliseRequestParams(oauthParameters), tkn_scr );
    orderedParameters[orderedParameters.length]= ["oauth_signature", method == "GET"?_encodeData(sig):sig];
  }
  return orderedParameters;
};

// build the OAuth request authorization header
Authorizer.prototype._buildAuthorizationHeaders = 
  Tokenizer.prototype._buildAuthorizationHeaders = 
    function(orderedParameters) {
  var authHeader="OAuth ";
  
  // TODO check
  /*
   * if( this._isEcho ) { authHeader += 'realm="' + this._realm + '",'; }
   */

  for( var i= 0 ; i < orderedParameters.length; i++) 
    // Whilst the all the parameters should be included within the signature,
    // only the oauth_ arguments
    // should appear within the authorization header.
    // if( this._hasOAuthPrefix(orderedParameters[i][0]) )
      authHeader+= "" + _encodeData(orderedParameters[i][0])+"=\""+ _encodeData(orderedParameters[i][1])+"\",";
  return authHeader.substring(0, authHeader.length-1);
};

/** TODO not need ?  >> **/
/*
 * OAuth.prototype.signUrl= function(url, oauth_token, oauth_token_secret,
 * method) { if( method === undefined ) method= "GET"; var orderedParameters=
 * this._prepareParameters(request_param, extra_param); var parsedUrl=
 * URL.parse( url, false ); var query=""; for( var i= 0 ; i <
 * orderedParameters.length; i++) { query+= orderedParameters[i][0]+"="+
 * _encodeData(orderedParameters[i][1]) + "&"; } query= query.substring(0,
 * query.length-1); return parsedUrl.protocol + "//"+ parsedUrl.host +
 * parsedUrl.pathname + "?" + query; };
 */
/** << **/

// generic functions

// arguments change to array
function _arg2arr(args){
  return Array.prototype.slice.call(args);
}

// extend object
function _mixin(target, source, safe) {
  for( var key in source)
   if(source.hasOwnProperty(key))
       if(!safe || !target[key])
           target[key] = source[key];
  return target;
}

// chain asynchronous functions
function _chain(actors, self, args) {
  if(!self)
   self = this;
  next.apply(self, [null].concat(typeof args == "undefined"? []:args));
  function next(err) {
   var actor = null ,args;
   try {
       if(err)
         return actors.pop().call(self, err);
       actor = actors.shift();
       if(typeof actor != "function")
         throw new Error('Unexpected chain member.');
       args = Array.prototype.slice.call(arguments);
       if(actors.length > 0) {
           args = args.slice(1).concat(next);
       }
       process.nextTick(function() {
           actor.apply(self, args);
       });
   } catch(error) {
       if(actors.length === 0)
         if(actor)
           actor.call(self, error);
         else
           throw error;
       else
         next(error);
   }
  }
}

var NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
                  'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
                  'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
                  'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
                  '4','5','6','7','8','9'];
function _getNonce(nonceSize) {
   var result = [];
   var chars= NONCE_CHARS;
   var char_pos;
   var nonce_chars_length= chars.length;
   for (var i = 0; i < nonceSize; i++) {
       char_pos= Math.floor(Math.random() * nonce_chars_length);
       result[i]=  chars[char_pos];
   }
   return result.join('');
}
function _getTimestamp() {
  return Math.floor( (new Date()).getTime() / 1000 );
}
function _encodeData(toEncode){
 if( toEncode == null || toEncode == "" ) 
   return "";
 else {
    var result= encodeURIComponent(toEncode);
    // Fix the mismatch between OAuth's RFC3986's and Javascript's beliefs in
    // what is right and wrong ;)
    return result.replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
 }
}
function _decodeData(toDecode) {
  if( toDecode != null ) {
    toDecode = toDecode.replace(/\+/g, " ");
  }
  return decodeURIComponent( toDecode);
}
function _normaliseRequestParams(arguments) {
  var argument_pairs= _makeArrayOfArgumentsHash(arguments);
  // First encode them #3.4.1.3.2 .1
  for(var i=0;i<argument_pairs.length;i++) {
    argument_pairs[i][0]= _encodeData( argument_pairs[i][0] );
    argument_pairs[i][1]= _encodeData( argument_pairs[i][1] );
  }
  
  // Then sort them #3.4.1.3.2 .2
  argument_pairs= _sortRequestParams( argument_pairs );
  
  // Then concatenate together #3.4.1.3.2 .3 & .4
  var args= "";
  for(var i=0;i<argument_pairs.length;i++) {
      args+= argument_pairs[i][0];
      args+= "=";
      args+= argument_pairs[i][1];
      if( i < argument_pairs.length-1 ) args+= "&";
  }     
  return args;
}

function _createSignatureBase(method, url, parameters) {
  url= _encodeData( _normalizeUrl(url) ); 
  parameters= _encodeData( parameters );
  return method.toUpperCase() + "&" + url + "&" + parameters;
}
// Sorts the encoded key value pairs by encoded name, then encoded value
function _sortRequestParams(argument_pairs) {
  // Sort by name, then value.
  argument_pairs.sort(function(a,b) {
      if ( a[0]== b[0] )  {
        return a[1] < b[1] ? -1 : 1; 
      }
      else return a[0] < b[0] ? -1 : 1;  
  });

  return argument_pairs;
}
// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
function _makeArrayOfArgumentsHash(argumentsHash) {
var argument_pairs= [];
for(var key in argumentsHash ) {
    var value= argumentsHash[key];
    if( Array.isArray(value) ) 
      for(var i=0;i<value.length;i++) 
        argument_pairs.push([key, value[i]]);
    else 
      argument_pairs.push([key, value]);
}
return argument_pairs;  
} 
function _createClient( port, hostname, method, path, headers, sslEnabled ) {
  var options = {
    host: hostname,
    port: port,
    path: path,
    method: method,
    headers: headers
  };
  var httpModel;
  if( sslEnabled ) {
    httpModel= https;
  } else {
    httpModel= http;
  }
  return httpModel.request(options);     
};
function _normalizeUrl(url) {
  var parsedUrl= URL.parse(url, true);
   var port ="";
   if( parsedUrl.port ) { 
     if( (parsedUrl.protocol == "http:" && parsedUrl.port != "80" ) ||
         (parsedUrl.protocol == "https:" && parsedUrl.port != "443") ) {
           port= ":" + parsedUrl.port;
         }
   }

  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) 
    parsedUrl.pathname ="/";
   
  return parsedUrl.protocol + "//" + parsedUrl.hostname + port + parsedUrl.pathname;
}
function _makeUrl(url, headers, array){
  var mrk = "?";
  if(array){
    for(var i=0;i<headers.length;i++){
      url = [url, mrk, headers[i][0],"=",headers[i][1]].join("");
      mrk = "&";
    }
  }else{
    for(var i in headers){
      url = [url, mrk, i,"=",headers[i]].join("");
      mrk = "&";
    }
  }
  return url;
}