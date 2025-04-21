import { DataSourceEditor, DataSourceEditorOptions } from "./types";

// GrapesJS plugin to add commands to the editor
export default (editor: DataSourceEditor, opts: DataSourceEditorOptions) => {
  editor.Commands.add(opts.commands.refresh, {
    run() {
      editor.DataSourceManager.getAll()
        .forEach((ds) => {
          console.info('Refreshing data source', ds.id);
          ds.connect()
        });
    },
  });
}