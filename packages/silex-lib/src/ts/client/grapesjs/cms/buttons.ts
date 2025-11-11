import { Editor } from 'grapesjs'
import { ClientConfig } from '../../config'
import { COMMAND_REFRESH, COMMAND_PREVIEW_ACTIVATE, COMMAND_PREVIEW_DEACTIVATE, DATA_SOURCE_CHANGED, DATA_SOURCE_DATA_LOAD_CANCEL, DATA_SOURCE_DATA_LOAD_END, DATA_SOURCE_DATA_LOAD_START, DATA_SOURCE_ERROR, COMMAND_PREVIEW_TOGGLE, PREVIEW_DEACTIVATED, PREVIEW_ACTIVATED } from '@silexlabs/grapesjs-data-source'

document.querySelector('head')?.insertAdjacentHTML('beforeend', `
  <style>
  .data-source-refresh {
    &.fa-refresh:before {
      content: "\\f021";
      font-weight: 900;
    }
    &.fa-refresh:hover {
      transform: rotate(180deg);
      transition: transform 0.5s;
    }
    &.fa-spinner:before {
      content: "\\f110";
      font-weight: 900;
    }
    &.fa-spinner {
      animation: fa-spin 2s infinite linear;
    }
    &.fa-exclamation-triangle:before {
      content: "\\f071";
      font-weight: 900;
    }
  }
  .data-source-preview-toggle {
    &.fa-table:before {
      content: "\\f0ce";
      font-weight: 900;
    }
    &.gjs-pn-active {
      background-color: rgba(0, 0, 0, 0.15);
    }
  }
  .gjs-pn-btn.data-source-separator {
    min-width: 1px;
    height: 24px;
    min-height: auto;
    background-color: rgba(255, 255, 255, 0.2);
    margin: 0 15px 0 10px;
    padding: 0;
    pointer-events: none;
    cursor: default;
  }
  </style>
`)

const REFRESH_BUTTON_BASE_CLASS = 'fa fa-fw data-source-refresh'

export default function(editor: Editor/*, opts: EleventyPluginOptions*/): void {
  // Get the panel to add buttons at specific positions
  const panel = editor.Panels.getPanel('options')
  const panelButtons = panel.get('buttons')

  // Add data source buttons at the beginning of the options panel
  panelButtons.add([{
    id: 'refresh-data-sources',
    className: `${REFRESH_BUTTON_BASE_CLASS} fa-refresh`,
    command: COMMAND_REFRESH,
    togglable: false,
    attributes: { title: 'Refresh data sources (reload dynamic content) - Ctrl+Alt+R' }
  }, {
    id: 'toggle-data-source-preview',
    className: 'fa fa-fw data-source-preview-toggle fa-table gjs-pn-active gjs-four-color',
    command: COMMAND_PREVIEW_TOGGLE,
    togglable: false,
    attributes: { title: 'Enable/Disable data source preview (Ctrl+Alt+V)' }
  }, {
    // Separator for visual grouping of data source buttons in the panel
    id: 'data-source-separator',
    className: 'data-source-separator',
    command: () => {},
    togglable: false,
    attributes: { title: '' }
  }], { at: 0 })

  // Update the preview toggle button's tooltip and visual state based on activation
  let isActive = true
  function updatePreviewActiveButton(editor) {
    const button = editor.Panels.getButton('options', 'toggle-data-source-preview')
    if (button) {
      button.set('attributes', {
        title: isActive
          ? 'Disable data source preview (Ctrl+Alt+V)'
          : 'Enable data source preview (Ctrl+Alt+V)'
      })
    }
    const el = getPanelButtonEl(editor, 'options', '.data-source-preview-toggle')
    if (el) {
      if (isActive) {
        el.classList.add('gjs-pn-active', 'gjs-four-color')
      } else {
        el.classList.remove('gjs-pn-active', 'gjs-four-color')
      }
    }
  }

  // FIXME: This should not be needed as the state is alreay set in the button definition
  setTimeout(() => updatePreviewActiveButton(editor), 1000)

  editor.on(PREVIEW_ACTIVATED, () => {
    isActive = true
    setTimeout(() => updatePreviewActiveButton(editor))
  })
  editor.on(PREVIEW_DEACTIVATED, () => {
    isActive = false
    updatePreviewActiveButton(editor)
  })

  // Returns the DOM element for a button in a panel using a selector
  function getPanelButtonEl(editor, panelId, selector) {
    const panel = editor.Panels.getPanel(panelId)
    if (!panel) return null
    return panel.view
      ?.el
      ?.querySelector(selector)
  }

  // Update the refresh button's visual state and tooltip based on data source loading status
  function setRefreshButtonState(editor, status) {
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (!button) return
    switch (status) {
    case 'loading':
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-spinner`)
      button.set('title', 'Refreshing data sources (loading dynamic content)...')
      break
    case 'error':
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-exclamation-triangle`)
      button.set('title', 'Error refreshing data sources, check the notifications')
      break
    default:
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-refresh`)
      button.set('title', 'Refresh data sources (reload dynamic content) - Ctrl+Alt+R')
    }
  }

  // Update refresh button state on data source events
  editor.on(`
    ${ DATA_SOURCE_DATA_LOAD_END }
    ${ DATA_SOURCE_DATA_LOAD_CANCEL }
  `, () => {
    setRefreshButtonState(editor, 'ready')
  })
  editor.on(DATA_SOURCE_ERROR, (error: Error) => {
    console.error('Data source error', error)
    setRefreshButtonState(editor, 'error')
  })
  editor.on(DATA_SOURCE_DATA_LOAD_START, () => {
    setRefreshButtonState(editor, 'loading')
  })

  // Register keyboard shortcuts for data source actions
  editor.Keymaps.add('data-source:refresh', 'ctrl+alt+r', COMMAND_REFRESH, {
    prevent: true,
  })
  editor.Keymaps.add('data-source:preview-toggle', 'ctrl+alt+v', COMMAND_PREVIEW_TOGGLE, {
    prevent: true,
  })
}
