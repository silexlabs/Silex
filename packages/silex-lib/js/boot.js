goog.require('goog.dom');
goog.require('goog.events');

window.onload = function() {
	console.log('onload');

	var element = goog.dom.getElement('_silex_menu');

	silex.view.Menu.getInstance().attachTo(element, function (){
		console.log('menu ready');

		silex.controller.Main.getInstance().initView(silex.view.Menu.getInstance(), silex.view.Stage.getInstance());
		silex.controller.Main.getInstance().initModel(silex.model.File.getInstance());

		var element = goog.dom.getElement('_silex_stage');

		silex.view.Stage.getInstance().attachTo(element, function (){
			console.log('stage ready');
			silex.model.File.getInstance().load(null);
		});
	});


}
