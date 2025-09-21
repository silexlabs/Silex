import { DataSourceEditorOptions, COMMAND_REFRESH, COMMAND_PREVIEW_ACTIVATE, COMMAND_PREVIEW_DEACTIVATE, COMMAND_PREVIEW_REFRESH } from "./types"
import { refreshDataSources } from "./model/dataSourceManager"
import { Editor } from "grapesjs"

// Global state for preview activation
let isPreviewActive = true

export function setPreviewActive(active: boolean) {
  isPreviewActive = active
}

export function getPreviewActive(): boolean {
  return isPreviewActive
}

// Function to force GrapesJS to re-render all components
function forceRender(editor: Editor) {
  // Force a complete re-render by refreshing the canvas
  editor.refresh()
}

// GrapesJS plugin to add commands to the editor
export default (editor: Editor, opts: DataSourceEditorOptions) => {
  // Set initial preview state
  isPreviewActive = opts.previewActive

  // Refresh all data sources
  editor.Commands.add(COMMAND_REFRESH, {
    run() {
      refreshDataSources()
    },
  })

  // Activate preview mode
  editor.Commands.add(COMMAND_PREVIEW_ACTIVATE, {
    run() {
      if (!isPreviewActive) {
        isPreviewActive = true
        // Force GrapesJS to re-render to show preview data
        forceRender(editor)
      }
    },
  })

  // Deactivate preview mode
  editor.Commands.add(COMMAND_PREVIEW_DEACTIVATE, {
    run() {
      if (isPreviewActive) {
        isPreviewActive = false
        // Force GrapesJS to re-render to show original content
        forceRender(editor)
      }
    },
  })

  // Refresh preview data
  editor.Commands.add(COMMAND_PREVIEW_REFRESH, {
    run() {
      if (isPreviewActive) {
        // Refresh data sources and force re-render
        refreshDataSources()
      } else {
        console.info('📊 Preview is deactivated - use preview:activate first')
      }
    },
  })
}
