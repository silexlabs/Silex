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
    &.fa-eye:before {
      content: "\\f06e";
      font-weight: 900;
    }
    &.fa-eye-slash:before {
      content: "\\f070";
      font-weight: 900;
    }
  }
  </style>
`)

const REFRESH_BUTTON_BASE_CLASS = 'fa fa-fw data-source-refresh'

export default function(editor: Editor/*, opts: EleventyPluginOptions*/): void {
  editor.Panels.addButton('options', {
    id: 'refresh-data-sources',
    className: `${REFRESH_BUTTON_BASE_CLASS} fa-refresh`,
    command: () => {
      // Refresh all data sources
      editor.runCommand(COMMAND_REFRESH)
    },
    togglable: false,
    attributes: { title: 'Refresh data sources' },
  })

  editor.Panels.addButton('options', {
    id: 'toggle-data-source-preview',
    className: 'fa fa-fw data-source-preview-toggle fa-eye',
    command: COMMAND_PREVIEW_TOGGLE,
    togglable: true,
    active: true, // Preview is active by default
    attributes: { title: 'Disable data source preview' },
  })

  // Listen for preview activation/deactivation events to update the button icon and tooltip
  editor.on(PREVIEW_ACTIVATED, () => {
    const button = editor.Panels.getButton('options', 'toggle-data-source-preview')
    if (button) {
      button.set('className', 'fa fa-fw data-source-preview-toggle fa-eye')
      button.set('attributes', { title: 'Disable data source preview' })
    }
  })
  editor.on(PREVIEW_DEACTIVATED, () => {
    const button = editor.Panels.getButton('options', 'toggle-data-source-preview')
    if (button) {
      button.set('className', 'fa fa-fw data-source-preview-toggle fa-eye-slash')
      button.set('attributes', { title: 'Enable data source preview' })
    }
  })
  editor.on(DATA_SOURCE_DATA_LOAD_START, () => {
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (button) {
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-spinner`)
      button.set('title', 'Refreshing data sources')
    }
  })
  editor.on(`
    ${ DATA_SOURCE_DATA_LOAD_END }
    ${ DATA_SOURCE_DATA_LOAD_CANCEL }
  `, () => {
    const button = editor.Panels.getButton('options', 'refresh-data-sources')
    if (button) {
      button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-refresh`)
      button.set('title', 'Refresh data sources')
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
}
