silex.model.Config.debug.doAfterReady = function (
      controller,
      workspace,
      menu,
      stage,
      pageTool,
      propertiesTool,
      htmlEditor,
      textEditor,
      fileExplorer,
      publishSettings,
      file,
      selection
    ) {
    // insert elements
    controller.menuController.menuCallback('insert.container');
    controller.menuController.menuCallback('insert.html');
    controller.menuController.menuCallback('insert.text');
    controller.menuController.menuCallback('view.open.textEditor');
  }
