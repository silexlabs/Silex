/**
 * patch from https://codereview.appspot.com/6115045/patch/1/2
 * Parses a style attribute value.  Converts CSS property names to camel case.
 * @param {string} value The style attribute value.
 * @return {!Object} Map of CSS properties to string values.
 */
goog.style.parseStyleAttribute = function(value) {
	var splitStyleAttributeOnSemicolonsRe_ = /[;]+(?=(?:(?:[^"]*"){2})*[^"]*$)(?=(?:(?:[^']*'){2})*[^']*$)(?=(?:[^()]*\([^()]*\))*[^()]*$)/;
	var styleArray = value.split(splitStyleAttributeOnSemicolonsRe_);
	var result = {};
	goog.array.forEach(styleArray, function(pair) {
		var i = pair.indexOf(':');
		if (i > 0 && pair.length > i) {
			var key = goog.string.trim(pair.slice(0, i)).toLowerCase();
			var value = goog.string.trim(pair.slice(i + 1));
			result[goog.string.toCamelCase(key)] = value;
		}
	});
	return result;
}
