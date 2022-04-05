import * as grapesjs from 'grapesjs/dist/grapes.min.js'

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
    // create container for panel
    const el = document.createElement('div')
    el.classList.add('project-bar__panel', panel.attributes.containerClassName, 'gjs-hidden')

    if(panel.attributes.containerClassName) {
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
        }
      },
      stop() {
        if(panel.attributes.containerClassName) {
          containerPanel.set('visible', false)
          el.classList.add('gjs-hidden')
        }
      },
    })
  })
})
