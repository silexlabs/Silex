/** 
 * functions used to display links to help navigate in the routes
 * the data displayed is from the unifile-config.js file
 */

/** 
 * load the routes data
 */
var routes = require("../core/config-manager.js").getConfig("routes");

/** 
 * init the mechanism used to catch the api routes 
 */
exports.init = function(app){
	init_routes_recursive("/", routes, app);
}

/** 
 * parse the routes discribed in routes.json and call add_route
 */
function init_routes_recursive(parentPath, route_obj, app){
	console.log(init_routes_recursive, parentPath)
	for (var path in route_obj){
		var html_string = display_routes(route_obj[path]);
		if (html_string!=""){
			add_route(parentPath + path, html_string, app);
			init_routes_recursive(parentPath + path, route_obj[path], app);
		}
	}
}
/** 
 * attach a nodejs router event to the given path
 */
function add_route(path, html_string, app){
	app.get(path, function(request, response) {
		response.send(html_string)
	});
}

/**
 * called when the user accesses a path which is not handled by the router
 * @returns a list of links to help navigate in the routes or null if the route is supposed to be handled by the router
 */
function display_routes(route_obj){
	var found = false;
	var reply = "";

	reply += '<html><head><link rel="stylesheet" href="/unifile-assets/style.css" /></head><body>';
	reply += '<a href="https://github.com/silexlabs/unifile"><img style="position: absolute; top: 0; right: 0; border: 0;" src="/unifile-assets/forkme.png"></a>';
	reply += '<ul>';
	reply += '<li class="link up-link"><a href="../">../</a></li>';

	for (var path in route_obj){
		found=true;
		reply += '<li class="link down-link"><a href="./' + path + '">' + path + '</a></li>';
	}
	reply += '</ul></body></html>';

	if (found)
		return reply;
	else 
		return '';
}

