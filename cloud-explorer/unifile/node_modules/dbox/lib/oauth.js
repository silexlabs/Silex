module.exports = function (consumerKey, consumerSecret){

  var encode = function(data){
    return encodeURIComponent(data || "").
      replace(/\!/g, "%21").
      replace(/\'/g, "%27").
      replace(/\(/g, "%28").
      replace(/\)/g, "%29").
      replace(/\*/g, "%2A")
  }


  var getSignature = function(tokenSecret){
    return encode(consumerSecret) + "&" + encode(tokenSecret)
  }
  
  var getTimestamp = function(){
    return (Math.floor((new Date()).getTime() / 1000)).toString()
  }
  
  var getNonce = function(timestamp){
    return timestamp + Math.floor( Math.random() * 100000000)
  }
  
  return function (options){
    var options   = JSON.parse(JSON.stringify(options))
    var secret    = options["oauth_token_secret"]
    var signature = getSignature(secret)
    var timestamp = getTimestamp()
    var nonce     = getNonce(timestamp)

    options["oauth_consumer_key"]     = consumerKey,
    options["oauth_signature"]        = signature,
    options["oauth_timestamp"]        = timestamp,
    options["oauth_nonce"]            = nonce,
    options["oauth_signature_method"] = "PLAINTEXT",
    options["oauth_version"]          = "1.0"

    delete options["authorize_url"]
    delete options["oauth_token_secret"]
    delete options["uid"]

    return options
  } 
}
