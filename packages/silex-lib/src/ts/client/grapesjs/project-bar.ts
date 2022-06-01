import * as grapesjs from 'grapesjs/dist/grapes.min.js'
import {html, render} from 'lit-html'

const name = 'project-bar'
const panelId = 'project-bar-panel'
const containerPanelId = 'project-bar-container'

export const projectBarPlugin = grapesjs.plugins.add(name, (editor, opts) => {
  // create the panels container for all panels in grapesjs
  const containerPanel = editor.Panels.addPanel({
    id: containerPanelId,
    visible  : false,
  })
  // create the project bar panel in grapesjs
  const projectBarPanel = editor.Panels.addPanel({
    id: panelId,
    buttons: opts.panels,
    visible  : true,
  })
  const panelsEl = opts.panels.map(panel => {
    const el = document.createElement('div')

    // create container for panel
    if(panel.attributes.containerClassName) {
      el.classList.add('project-bar__panel', panel.attributes.containerClassName, 'gjs-hidden')

      // add header
      if(panel.attributes.title) {
        render(html`
          <header class="project-bar__panel-header">
            <h3 class="project-bar__panel-header-title">${ panel.attributes.title }</h3>
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
    editor.Commands.add(panel.command, {
      run() {
        if(panel.link) {
          window.open(panel.link)
        }
        if(panel.attributes.containerClassName) {
          containerPanel.set('visible', true)
          el.classList.remove('gjs-hidden')
          editor.Canvas.getFrameEl().classList.add('silex-squeeze-left')
        }
      },
      stop() {
        if(panel.attributes.containerClassName) {
          containerPanel.set('visible', false)
          el.classList.add('gjs-hidden')
          editor.Canvas.getFrameEl().classList.remove('silex-squeeze-left')
        }
      },
    })
  })
  function updateSqueez() {
    const containerPanelEl = containerPanel.view.el
    const iframe = editor.Canvas.getFrameEl()
    iframe.classList.remove('enable-squeeze')
    setTimeout(() => {
      const left = iframe.getClientRects()[0]?.left
      const right = containerPanelEl.getClientRects()[0]?.right
      if(left < right || !right) iframe.classList.add('enable-squeeze')
      else iframe.classList.remove('enable-squeeze')
    }, 400) // More than the transition duration
  }
  editor.on('load', () => {
    updateSqueez()
  })
  editor.on('device:select', device => {
    updateSqueez()
  })
})
