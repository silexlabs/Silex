silex.Config.debug.doAfterReady = function (model, view, controller) {
    // insert elements
    controller.menuController.menuCallback('insert.container');
    controller.menuController.menuCallback('insert.html');
    controller.menuController.menuCallback('insert.text');
    controller.menuController.menuCallback('view.open.textEditor');
  }
