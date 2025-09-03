import { Editor } from 'grapesjs'
import { ClientConfig } from '../../config'
import { COMMAND_REFRESH, DATA_SOURCE_CHANGED, DATA_SOURCE_ERROR } from '@silexlabs/grapesjs-data-source'

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
      // Change the icon to a loading icon
      const button = editor.Panels.getButton('options', 'refresh-data-sources')
      if (button) {
        button.set('className', `${REFRESH_BUTTON_BASE_CLASS} fa-spinner`)
      }
    },
    togglable: false,
    attributes: { title: 'Refresh data sources' },
  })
  editor.on(DATA_SOURCE_CHANGED, () => {
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
