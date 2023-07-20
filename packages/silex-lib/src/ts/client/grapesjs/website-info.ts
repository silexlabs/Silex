import { ClientEvent } from "../events"
import { websiteMetaRead } from '../api'
import { WebsiteMeta, WebsiteMetaFileContent } from "../../types"

export default (config, opts: any = {}) => {
  config.on(ClientEvent.STARTUP_END, async ({ editor }) => {
    console.log('websiteMetaPlugin STARTUP')
      console.log('websiteMetaPlugin storage:end:load')
      // Get website meta data
      const websiteMeta = await websiteMetaRead({websiteId: config.websiteId, connectorId: config.connectorId})
      // Display in the editor
      displayWebsiteMeta(editor, websiteMeta)
    editor.on('storage:end:load', async () => {
    })
  })
}

function displayWebsiteMeta(editor, websiteMeta: WebsiteMeta) {
  // Check if the container exists in the UI
  let container = document.querySelector('.gjs-website-meta')
  if(!container) {
    // Create the container
    container = document.createElement('div')
    container.classList.add('gjs-website-meta')
    // Add the container to the UI
    editor.Panels.add('gjs-website-meta', {
      id: 'gjs-website-meta',
      el: container,
      visible: true,
    })
  }
  // Display the website meta data
  container.innerHTML = `
      <div class="gjs-website-meta-title">Website</div>
      <div class="gjs-website-meta-name">${websiteMeta.name}</div>
      <div class="gjs-website-meta-image" style="background: ${websiteMeta.imageUrl}"></div>
    `
    console.log('displayWebsiteMeta', websiteMeta, container)
}
