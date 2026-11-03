import {
  DataSourceEditorOptions,
  COMMAND_REFRESH,
  COMMAND_PREVIEW_ACTIVATE,
  COMMAND_PREVIEW_DEACTIVATE,
  COMMAND_PREVIEW_REFRESH,
  COMMAND_PREVIEW_TOGGLE,
  PREVIEW_ACTIVATED,
  PREVIEW_DEACTIVATED,
} from './types'
import { refreshDataSources } from './model/dataSourceManager'
import { Editor } from 'grapesjs'
import { doRender, restoreOriginalRender } from './view/canvas'

// Global state for preview activation
let isPreviewActive = true

export function getPreviewActive(): boolean {
  return isPreviewActive
}

// Function to force GrapesJS to re-render all components
function forceRender(editor: Editor) {
  // Force a complete re-render by refreshing the canvas
  doRender(editor)
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
        // Emit event
        editor.trigger(PREVIEW_ACTIVATED)
      }
    },
  })

  // Deactivate preview mode
  editor.Commands.add(COMMAND_PREVIEW_DEACTIVATE, {
    run() {
      if (isPreviewActive) {
        isPreviewActive = false
        // Force GrapesJS to re-render to show original content
        const main = editor.Pages.getSelected()?.getMainComponent()
        if (main) restoreOriginalRender(main)
        // Emit event
        editor.trigger(PREVIEW_DEACTIVATED)
      }
    },
  })

  // Toggle preview mode
  editor.Commands.add(COMMAND_PREVIEW_TOGGLE, {
    run() {
      isPreviewActive = !isPreviewActive
      // Emit event
      if (isPreviewActive) {
        // Force GrapesJS to re-render to reflect the toggled state
        forceRender(editor)
        // Trigger event
        editor.trigger(PREVIEW_ACTIVATED)
      } else {
        // Force GrapesJS to re-render to show original content
        const main = editor.Pages.getSelected()?.getMainComponent()
        if (main) restoreOriginalRender(main)
        // Trigger event
        editor.trigger(PREVIEW_DEACTIVATED)
      }
    },
  })

  // Refresh preview data
  editor.Commands.add(COMMAND_PREVIEW_REFRESH, {
    run() {
      if (isPreviewActive) {
        forceRender(editor)
      }
    },
  })
}
