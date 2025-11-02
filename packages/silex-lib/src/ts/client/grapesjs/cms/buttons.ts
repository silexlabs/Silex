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
    command: () => {
      // Refresh all data sources
      editor.runCommand(COMMAND_REFRESH)
    },
    togglable: false,
    attributes: { title: 'Refresh data sources (reload dynamic content) - Ctrl+Alt+R' },
  }, {
    id: 'toggle-data-source-preview',
    className: 'fa fa-fw data-source-preview-toggle fa-table',
    command: {
      run: () => editor.runCommand(COMMAND_PREVIEW_ACTIVATE),
      stop: () => editor.runCommand(COMMAND_PREVIEW_DEACTIVATE),
    },
    togglable: true,
    active: true,
    attributes: { title: 'Enable data source preview (Ctrl+Alt+V)' },
  }, {
    // Visual separator after data source buttons
    id: 'data-source-separator',
    className: 'data-source-separator',
    command: () => {}, // No action on click
    togglable: false,
    attributes: { title: '' },
  }], { at: 0 })

  // Listen for preview activation/deactivation events to update the button icon and tooltip
  editor.on(PREVIEW_ACTIVATED, () => {
    const button = editor.Panels.getButton('options', 'toggle-data-source-preview')
    if (button) {
      button.set('active', true)
      button.set('attributes', { title: 'Disable data source preview (Ctrl+Alt+V)' })
    }
  })
  editor.on(PREVIEW_DEACTIVATED, () => {
    const button = editor.Panels.getButton('options', 'toggle-data-source-preview')
    if (button) {
      button.set('active', false)
      button.set('attributes', { title: 'Enable data source preview (Ctrl+Alt+V)' })
    }
  })

  // Listen for preview activation/deactivation events to update the button tooltip and style
  // The button now handles its own state, so these listeners are not needed.
  editor.on(DATA_SOURCE_DATA_LOAD_START, () => {
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (button) {
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-spinner`)
      button.set('title', 'Refreshing data sources (loading dynamic content)...')
    }
  })
  editor.on(`
    ${ DATA_SOURCE_DATA_LOAD_END }
    ${ DATA_SOURCE_DATA_LOAD_CANCEL }
  `, () => {
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (button) {
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-refresh`)
      button.set('title', 'Refresh data sources (reload dynamic content) - Ctrl+Alt+R')
    }
  })
  editor.on(DATA_SOURCE_ERROR, (error: Error) => {
    console.error('Data source error', error)
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (button) {
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-exclamation-triangle`)
      button.set('title', 'Error refreshing data sources, check the notifications')
    }
  })

  // Add keyboard shortcuts
  editor.Keymaps.add('data-source:refresh', 'ctrl+alt+r', COMMAND_REFRESH, {
    prevent: true,
  })
  editor.Keymaps.add('data-source:preview-toggle', 'ctrl+alt+v', COMMAND_PREVIEW_TOGGLE, {
    prevent: true,
  })
}
