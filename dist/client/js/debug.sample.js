silex.Config.debug.doAfterReady = function (model, view, controller) {
  setTimeout(function(){
    // insert elements
    controller.insertMenuController.addElement('text');
    controller.insertMenuController.addElement('html');
    controller.insertMenuController.addElement('container');
  }, 2000);
}
