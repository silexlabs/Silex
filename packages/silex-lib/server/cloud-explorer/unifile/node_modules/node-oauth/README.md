:: node-oauth ::
=

##Abstract
#### An adaptor for OAuth 1.0 and OAuth 2.0 API.

##Install##

To install the most recent release from npm, run:

	npm install node-oauth

##Usage##

> require `node-oauth`  

	var OAuth = require('node-oauth');

> set your application OAuth setting file.  

	OAuth = OAuth("../sample/object-oauth.js")

> jump to Login page.  
> "response" is necessary for redirect.  

	OAuth.authorize('facebook',{
	    response: res,
	    endCallback: function(err) {
	      if(err)
	        onError(err);
	    }
	  });

> (OAuth 1.0)  
> if you don't want to go authorize page everytime, you can control after getting request token.  
> Authorizer object returns. It have setting datas on its fields.  

	var oauthAuthorizer = OAuth.authorize('twitter', {
	    auto: false
	  });

> get access token in redirect page  
> Tokener object returns.  

	var oauthTokener = OAuth.access(oauth['type'], {
	  href: location.href
	}, authorized);

> if you want to set access_token externaly, ( that is , not via url )  

	oauthTokener.set({
	  request_token: oauth['req_tkn'],
	  access_token: oauth['oac_tkn'],
	  access_token_secret: oauth['oac_tkn_scr']
	});

> access to api with name (set in setting file) / url.   
> data returns after JSON.parse(api-response).  

	oauthTokener.get("credentials", {}, function(err, data){
	  if(err)
	    return ...
	  ...
	  });

##Change Log##

* 2013/4/16
	+ 0.1.2 release  
	+ repository owner is changed to ystskm  
