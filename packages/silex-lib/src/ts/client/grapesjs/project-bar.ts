/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Editor, Panel } from 'grapesjs'
import {html, render} from 'lit-html'

export const PROJECT_BAR_PANEL_ID = 'project-bar-panel'
export const containerPanelId = 'project-bar-container'

export interface PanelObject {
  command: string | ((editor: Editor) => void)
  text: string
  className: string
  name?: string
  attributes: {
    title?: string
    containerClassName?: string
  }
  buttons?: {
    command: string
    text: string
    className: string
  }[]
  onClick?: (editor: Editor) => void
}

export const projectBarPlugin = (editor, opts) => {
  // create the panels container for all panels in grapesjs
  const containerPanel = editor.Panels.addPanel({
    id: containerPanelId,
    visible: false,
    // resize project panel button
    buttons: [{
      id: 'resizeBlocks',
      className: 'viewsOptionsProjectPanel__size-btn',
      command: 'resize-ProjectPanel',
      attributes: { title: 'Resize Project Panel' },
    }],
  })
  // resize project panel command
  editor.Commands.add('resize-ProjectPanel', {
    run: (editor, sender) => {
      document.documentElement.style.setProperty('--viewsProjectPanelWidth', '26%')
    },
    stop: (editor, sender) => {
      document.documentElement.style.setProperty('--viewsProjectPanelWidth', '13%')
    },
  })
  // create the project bar panel in grapesjs
  editor.Panels.addPanel({
    id: PROJECT_BAR_PANEL_ID,
    buttons: opts.panels,
    visible: true,
  })
  // add the panels to the container
  opts.panels.map(panel => addButton(editor, panel))

  // Handle the preview mode which behaves oddly
  editor.on('stop:preview', () => {
    containerPanel.set('visible', false)
    updateSqueez(editor)
  })

  // Also listen to the preview button state changes
  let wasVisible = false
  const previewButton = editor.Panels.getButton('options', 'preview')
  if (previewButton) {
    previewButton.on('change:active', (button, active) => {
      console.log({button, active, wasVisible})
      if (active) wasVisible = containerPanel.get('visible')
      else setTimeout(() => containerPanel.set('visible', wasVisible))
    })
  }

  // All other events where the canvas is resized
  editor.on('load device:select page', () => {
    updateSqueez(editor)
  })
}

function updateSqueez(editor: Editor) {
  const containerPanel = editor.Panels.getPanel(containerPanelId)
  // make sure the squeez corresponds to the state (reset when change page)
  if(containerPanel.get('visible')) document.body.classList.add('silex-squeeze-left')
  else document.body.classList.remove('silex-squeeze-left')
  editor.refresh()
}

export function addButton(editor: Editor, panel: PanelObject) {
  const containerPanel = editor.Panels.getPanel(containerPanelId)
  const el = document.createElement('div')
  // create container for panel
  if(panel.attributes.containerClassName) {
    el.classList.add('project-bar__panel', panel.attributes.containerClassName, 'gjs-hidden')
    // add header
    const title = panel.name ?? panel.attributes.title
    if(title) {
      render(html`
        <header class="project-bar__panel-header">
          <h3 class="project-bar__panel-header-title">${ title }</h3>
          ${ panel.buttons?.map(button => {
    return html`
              <div
                class="project-bar__panel-header-button ${ button.className }"
                @click=${e => editor.runCommand(button.command)}
              ><span>${ button.text }</span></div>
            `
  }) }
        </header>
      `, el)
    }
    // temporarily attach it to the body
    // this lets the block manager and other plugins attach to their container
    document.body.appendChild(el)
    // on load attach the panels to the main container
    // this is when the main containerPanel has an element
    editor.on('load', () => {
      const containerPanelEl = containerPanel.view.el
      containerPanelEl.appendChild(el)
    })
  }
  // commands for show / hide panels
  // handle the case where command is a normal command, then let the Panel handle it
  typeof panel.command === 'string' && editor.Commands.add(panel.command, {
    run() {
      if(panel.attributes.containerClassName) {
        containerPanel.set('visible', true)
        el.classList.remove('gjs-hidden')
        document.body.classList.add('silex-squeeze-left')
        editor.refresh()
      }
      // Call the onClick function if it exists
      if(panel.onClick) panel.onClick(editor)
      // Remove the dirty flag
      el.classList.remove('project-bar__dirty')
    },
    stop() {
      if(panel.attributes.containerClassName) {
        containerPanel.set('visible', false)
        el.classList.add('gjs-hidden')
        document.body.classList.remove('silex-squeeze-left')
        editor.refresh()
      }
      // Call the onClick function if it exists
      if(panel.onClick) panel.onClick(editor)
      // Remove the dirty flag
      el.classList.remove('project-bar__dirty')
    },
  })
}
