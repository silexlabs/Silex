var fs      = require("fs")
var prompt  = require("prompt")

exports.auth = function(app, callback){
  var tokenPath = __dirname + "/" + app.root + "/access_token.json"
  var token = JSON.parse(fs.readFileSync(tokenPath))
  var client = app.client(token)

  client.account(function(status, account){
    if(status == 200){
      callback(token)
    }else{
      app.requesttoken(function(status, request_token){
        prompt.start()
        prompt.get(['please authorize application at the following url and enter when done\n' + request_token.authorize_url], function (err, result) {
          if (err) { return 1 }
          app.accesstoken(request_token, function(status, access_token){
            fs.writeFile(tokenPath, JSON.stringify(access_token), function(err){
              if (err) throw err;
              callback(access_token)
            })
          })
        })
      })        
    }
  })
}