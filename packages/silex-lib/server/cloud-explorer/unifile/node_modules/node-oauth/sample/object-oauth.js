var exports = {
    twitter: {
      "version": "1.0",
      "consumer_key": "set your app's consumer_key",
      "consumer_secret": "set your app's consumer_secret",
      "arg_prefix": "oauth_",
      // authentication
      "requestToken": {
        "url": "https://api.twitter.com/oauth/request_token",
        "arg": ["consumer_key"]
      },
      "authorize": {
        "url": "https://api.twitter.com/oauth/authorize",
        "arg": [{
          "request_token": "oauth_token"
        }]
      },
      "accessToken": {
        "key": "request_token_secret",
        "url": "https://api.twitter.com/oauth/access_token",
        "arg": ["consumer_key", {"request_token":"oauth_token"}, "oauth_verifier"]
      },
      // api
      "credentials": {
        "key": "access_token_secret",
        "url": "http://api.twitter.com/1/account/verify_credentials.json",
        "arg": ["consumer_key", {
          "access_token": "oauth_token"
        }],
        "account_name": "screen_name"
      }
    },
    facebook: { // GRAPH API : http://developers.facebook.com/docs/reference/api/
      "version": "2.0",
      "app_id": "set your app_id",
      "app_secret":"set your app_secret",
      "redirect_uri": "set your redirect url",
      // authentication
      "authorize": {
        "url": "https://www.facebook.com/dialog/oauth",
        "arg": [{"app_id":"client_id"}, "redirect_uri"]
      },
      "accessToken":{
        "method":"GET",
        "key":"app_secret",
        "url":"https://graph.facebook.com/oauth/access_token",
        "arg":[{"app_id":"client_id"}, "redirect_uri",{"app_secret":"client_secret"},"code"]
      },
      // api
      "credentials": {
        "url": "https://graph.facebook.com/me/feed",
        "arg":["access_token"],
        "callback":function(feed){
          return feed['data'][0]['from'];
        },
        "account_name": "name"
      },
      "apps":{
        "url":"https://graph.facebook.com/me/accounts",
        "arg":["access_token"]
      }
    }
  };
module.exports = exports;

