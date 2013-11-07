exports.route = function(req, res, next, task){
	console.log('route', req.body);
	switch(task){
		case 'publish':
			return exports.publish(req.params.html, req.params.css, req.params.files);
		break;
	}
}
exports.publish = function(html, css, files){
	console.log('publish', html, css, files)
	var tmpPath = '/exports/' + (new Date().getTime()) + Math.round(Math.random() * 1000000000) + '/';
	
	return tmpPath;
}