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
    controller.menuCallback({type:'insert.container'});
    controller.menuCallback({type:'insert.html'});
    controller.menuCallback({type:'insert.text'});
    controller.menuCallback({type:'view.open.textEditor'});
  }