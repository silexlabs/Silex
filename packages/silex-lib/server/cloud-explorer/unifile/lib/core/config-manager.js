fs = require('fs');
pathModule = require('path');

/**
 * get config value
 * take several config files into account
 */
exports.getConfig = function(propName){
	var firstConfig = require('../../unifile-config.js');
	var propValue = firstConfig[propName];
	return exports.getConfigRecursive(firstConfig.otherConfFiles, propName, propValue);
}
exports.getConfigRecursive = function(files, propName, propValue){
	var propValue;
	for(var fileNameIdx in files){
		var fileName = files[fileNameIdx];
		var exists = fs.existsSync(pathModule.resolve(__dirname, fileName));
		if (exists){
			var otherConfig = require(pathModule.resolve(__dirname, fileName));
			var otherPropValue = otherConfig[propName];
			if (otherPropValue){
				if (typeof(otherPropValue) == 'object'){
					if (otherPropValue.push==undefined){
						// object
						if (!propValue) propValue = {};
						propValue = exports.mergeObjects(propValue, otherPropValue);
					}
					else{
						// array
						if (!propValue) propValue = [];
						propValue = exports.mergeArray(propValue, otherPropValue);
					}
				}
				else{
					// other
					propValue = otherPropValue;
				}
			}
			// also take into account the other conf files in the loaded conf
			if (otherConfig.otherConfFiles){
				propValue = exports.getConfigRecursive(otherConfig.otherConfFiles, propName, propValue);
			}
		}
	}
	return propValue;
}
/**
 * merge two objects or arrays and return the mix of the two
 */
exports.mergeObjects = function(obj1, obj2){
	var res = {};
	for(var propName in obj1){
		res[propName] = obj1[propName]
	}
	for(var propName in obj2){
		res[propName] = obj2[propName]
	}
	return res;
}
/**
 * merge two objects or arrays and return the mix of the two
 */
exports.mergeArray = function(obj1, obj2){
	var res = [];
	for(var propName in obj1){
		res.push(obj1[propName]);
	}
	for(var propName in obj2){
		res.push(obj2[propName]);
	}
	return res;
}
