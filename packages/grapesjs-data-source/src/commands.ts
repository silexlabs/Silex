import { DataSourceEditorOptions } from "./types"
import { refreshDataSources } from "./model/dataSourceManager"
import { getAllDataSources } from "./model/dataSourceRegistry"
import { Editor } from "grapesjs"

// GrapesJS plugin to add commands to the editor
export default (editor: Editor, opts: DataSourceEditorOptions) => {
  // Refresh all data sources
  editor.Commands.add(opts.commands.refresh, {
    run() {
      refreshDataSources()
    },
  })
}
