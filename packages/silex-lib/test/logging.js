var Logging = function() {
	this.argsToString = function(args) {
	    var ret = '';
	    for(var idx in args){
	        if (typeof(args[idx]) === 'string'){
	            ret += args[idx] + ', ';
	        }
	    }
	    return ret;
	}
}

module.exports = new Logging();