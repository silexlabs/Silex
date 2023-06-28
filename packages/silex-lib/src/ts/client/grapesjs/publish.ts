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

import {html, render} from 'lit-html'
import {map} from 'lit-html/directives/map.js'
import grapesjs from 'grapesjs/dist/grapes.min.js'
import { getPageSlug } from '../../page'
import { onAll } from '../utils'
import { start } from 'repl'

// constants
const pluginName = 'publish'
export const cmdPublish = 'publish-open-dialog'
// let _token = null
let id
let rootUrl

// plugin code
export const publishPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  opts = {
    appendTo: 'options',
    ...opts,
  }
  // Global config
  rootUrl = opts.rootUrl
  id = opts.id
  // // Keep track of the token
  // editor.on('login:success', async ({ getUser, getToken }) => {
  //   _token = await getToken()
  // })
  // add publication settings to the website
  editor.on('storage:start:store', (data) => {
    data.publication = editor.getModel().get('publication')
  })
  editor.on('storage:end:load', (data) => {
    const model = editor.getModel()
    model.set('publication', data.publication || {})
  })
  editor.Panels.addButton(opts.appendTo, {
    id: 'publish-button',
    className: 'silex-button--size publish-button',
    command: cmdPublish,
    attributes: { title: 'Publish' },
    label: '<span class="fa fa-rocket"></span><span class="silex-button--small">Publish</span>',
  })
  editor.Commands.add(cmdPublish, {
    run(editor) { openDialog(editor) },
    stop(editor) { closeDialog(editor) },
  })
})

export function getDialogElements() {
  const el = document.querySelector('#publish-dialog')
  return el ? {
    dialog: el,
    primary: el.querySelector('#publish-button--primary'),
    secondary: el.querySelector('#publish-button--secondary'),
  } : null
}
function createDialogElements() {
  const el = document.createElement('div')
  el.id = 'publish-dialog'
  el.className = 'silex-dialog-inline silex-dialog gjs-two-color'
  document.body.append(el)
  return getDialogElements()
}
function move(rect) {
  Object.keys(rect).forEach(key => dialog.style[key] = rect[key] + 'px')
}
async function update(editor) {
  console.log('update', editor.getModel().get('publication')) 
  render(html`
    ${ !open ? '' : editor.getModel().get('publication').name ? await getOpenPublishDialog(editor) : await getOpenLoginDialog(editor) }
  `, dialog)
  if(open) {
    dialog.classList.remove('silex-dialog-hide')
  } else {
    dialog.classList.add('silex-dialog-hide')
  }
}
async function getOpenPublishDialog(editor) {
  return html`
    <main>
      ${ status === STATUS_PENDING ? html`
        <p>Publication in progress</p>
      ` : ''}
      ${ status === STATUS_SUCCESS ? html`
        <p>Publication success</p>
        ${ url ? html`<a href="${url}" target="_blank">Click here to view the published website</a>` : ''}
      ` : ''}
      ${ status === STATUS_ERROR || status === STATUS_AUTH_ERROR ? html`
        <p>Publication error</p>
        <div>${ errorMessage }</div>
      ` : ''}
      ${ state?.running ? html`
        <progress
          value=""
          style="width: 100%;"
        ></progress>
      ` : ''}
      ${ state.logs?.length ? html`
        <details>
          <summary>Logs</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${ cleanup(state.logs) }
          </pre>
        </details>
      ` : '' }
      ${ state.errors?.length ? html`
        <details>
          <summary>Errors</summary>
          <pre style="
            max-width: 100%;
            max-height: 50vh;
            overflow: auto;
            font-size: x-small;
            "
          >${ cleanup(state.errors) }
          </pre>
        </details>
      ` : '' }
    </main>
    <footer>
      ${ status === STATUS_PENDING || status === STATUS_AUTH_ERROR ? '' : html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => startPublication(editor)}
        >Publish</button>
      `}
      ${ status === STATUS_AUTH_ERROR ? html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => goLogin(editor)}
        >Login</button>
      `: editor.getModel().get('publication')?.disableLogout ? '' : html`
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => goLogout(editor)}
        >Logout</button>
      `}
      <button
        class="silex-button silex-button--secondary"
        id="publish-button--secondary"
        @click=${() => editor.Commands.stop(cmdPublish)}
      >Close</button>
    </footer>
    `
}
async function getOpenLoginDialog(editor) {
  try {
    const hostingProviders = await fetch(`${rootUrl}api/hosting`).then(res => res.json())
    const logged = hostingProviders.find(provider => provider.isLoggedIn)
    if(logged) {
      editor.getModel().set('publication', logged)
      startPublication(editor)
      return ''
    }
    return html`
      <main>
        <p>You need to login to publish your website</p>
        ${ hostingProviders.map(provider => html`
          <button
            class="silex-button silex-button--primary"
            id="publish-button--primary"
            @click=${() => goLogin(editor, provider)}
          >Login with ${ provider.name }</button>
        `)}
      </main>
      <footer>
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    `
  } catch (err) {
    console.error(err)
    return html`
      <main>
        <h1>Oops</h1>
        <p>Unable to load hosting providers</p>
        <p>Something went wrong: ${ err.message }</p> 
      </main>
      <footer>
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    `
  }
}
export const STATUS_NONE='STATUS_NONE'
export const STATUS_PENDING='STATUS_PENDING'
export const STATUS_ERROR='STATUS_ERROR'
export const STATUS_SUCCESS='STATUS_SUCCESS'
export const STATUS_AUTH_ERROR='STATUS_AUTH_ERROR'
export let status = STATUS_NONE
export let open = false
let errorMessage = ''
let dialog
let url // from the result of the first fetch when publishing
let state = {
  queued: false,
  error: false,
  running: false,
  logs: [],
  errors: [],
}

function cleanup(arr: string[][]): string {
  return arr[arr.length-1]
    ?.map(str => str.replace(/\[.*\]/g, '').trim())
    ?.filter(str => !!str)
    ?.join('\n')
}

function displayError(editor, message, _status = STATUS_ERROR) {
  console.error(message)
  errorMessage = message
  status = _status
  update(editor)
}
export async function closeDialog(editor) {
  open = false
  update(editor)
}
export async function toggleDialog(editor) {
  if(open) closeDialog(editor)
  else openDialog(editor)
}
export async function openDialog(editor) {
  open = true

  // Position
  const buttonEl = editor.Panels.getPanel('options').view.el
    .querySelector('.publish-button')
  const rect = buttonEl.getBoundingClientRect()

  const width = 450
  const padding = 10 * 2
  const minHeight = 50
  if(!dialog) dialog = createDialogElements().dialog
  move({
    left: rect.right - width - padding,
    top: rect.bottom + 10,
    width,
    minHeight,
  })

  // Publication
  if(status === STATUS_NONE) {
    startPublication(editor)
  } else {
    update(editor)
  }
}

export async function goLogin(editor, publicationSettings = editor.getModel().get('publication')) {
  console.log('goLogin', publicationSettings)
  window.open(`${publicationSettings.url}?redirect=/api/hosting/login/success`, '_blank')
  return new Promise(resolve => {
    window.addEventListener('message', async function onMessage(event) {
      if(event.data?.type === 'login') {
        console.log('onMessage', event.data)
        window.removeEventListener('message', onMessage)
        editor.trigger('publish:login')
        if(event.data.error) {
          console.log('login error')
          displayError(editor, event.data.error, STATUS_AUTH_ERROR)
        } else {
          console.log('login success')
          editor.getModel().set('publication', event.data)
          await startPublication(editor)
        }
      }
    }, false)
  })
}

export async function goLogout(editor) {
  console.log('goLogout')
  const publicationSettings = editor.getModel().get('publication')
  await fetch(`${rootUrl}api/hosting/logout/?name=${publicationSettings.name}`, {
    method: 'POST',
    credentials: 'include',
  })
  editor.getModel().set('publication', {})
  update(editor)
}

export async function startPublication(editor) {
  if(status === STATUS_PENDING) throw new Error('Publication is already in progress')
  status = STATUS_PENDING
  const publicationSettings = editor.getModel().get('publication')
  if(!publicationSettings?.name) {
    displayError(editor, 'Please login', STATUS_AUTH_ERROR)
    return
  }
  update(editor)
  editor.trigger('publish:before')
  const projectData = editor.getProjectData()
  const siteSettings = editor.getModel().get('settings')
  // Update assets URL to display outside the editor
  const assetsFolderUrl = publicationSettings?.assets?.url
  if(assetsFolderUrl) {
    const publishedUrl = path => `${assetsFolderUrl}/${path.split('/').pop()}`
    // New URLs for assets, according to site config
    onAll(editor, c => {
      // Attributes
      if(c.get('type') === 'image') {
        const path = c.get('src')
        c.set('tmp-src', path)
        c.set('src', publishedUrl(path))
      }
      //// Inline styles
      //// This is handled by the editor.Css.getAll loop
      //const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
      //if(bgUrl) {
      //  c.set('tmp-bg-url', bgUrl)
      //  c.setStyle({
      //    ...c.getStyle(),
      //    'background-image': `url('${publishedUrl(bgUrl)}')`,
      //  })
      //}
    })
    editor.Css.getAll()
      .forEach(c => {
        const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
        if(bgUrl) {
          c.setStyle({
            ...c.getStyle(),
            'background-image': `url('${publishedUrl(bgUrl)}')`,
          })
          c.set('tmp-bg-url-css', bgUrl)
        }
      })
  }
  // Build the files structure
  const files = await getFiles(editor, {siteSettings, publicationSettings})

  // Create the data to send to the server
  const data = {
    ...projectData,
    settings: siteSettings,
    publication: publicationSettings,
    id,
    files,
  }
  // Reset asset URLs
  if(assetsFolderUrl) {
    onAll(editor, c => {
      if(c.get('type') === 'image' && c.has('tmp-src')) {
        c.set('src', c.get('tmp-src'))
        c.set('tmp-src')
      }
      //// This is handled by the editor.Css.getAll loop
      //if(c.getStyle()['background-image'] && c.has('tmp-bg-url')) {
      //  c.setStyle({
      //    ...c.getStyle(),
      //    'background-image': `url('${c.get('tmp-bg-url')}')`,
      //  })
      //  c.set('tmp-bg-url')
      //}
    })
    editor.Css.getAll()
      .forEach(c => {
        if(c.has('tmp-bg-url-css')) {
          c.setStyle({
            ...c.getStyle(),
            'background-image': `url('${c.get('tmp-bg-url-css')}')`,
          })
          c.set('tmp-bg-url-css')
        }
      })
  }
  editor.trigger('publish:start', data)
  let res
  let json
  try {
    const publicationSettings = editor.getModel().get('publication')
    res = await fetch(`${rootUrl}api/publish/?name=${publicationSettings.name}`, {
      method: 'POST',
      body: JSON.stringify({
        data,
        // token: _token,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    })
  } catch(e) {
    displayError(editor, `An error occured, your site is not published. ${e.message}`)
    editor.trigger('publish:stop', {success: false, message: e.message})
    return
  }
  try {
    json = await res.json()
  } catch(e) {
    displayError(editor, `Could not parse the server response, your site may be published. ${e.message}`)
    editor.trigger('publish:stop', {success: false, message: e.message})
    return
  }
  if(!res.ok) {
    if(res.status === 401) {
      // Auth error, user needs to login again
      displayError(editor, `You need to login again to publish your site. ${json.message}`, STATUS_AUTH_ERROR)

    } else {
      // Other error
      displayError(editor, `An network error occured, your site is not published. ${json.message}`)
    }
    editor.trigger('publish:stop', {success: false, message: json.message})
    return
  }
  url = json.url
  if(json.statusUrl) {
    trackProgress(editor, json.statusUrl)
  } else {
    status = STATUS_SUCCESS
    update(editor)
    editor.trigger('publish:stop', {success: true})
  }
}

async function getFiles(editor, {siteSettings, publicationSettings, }) {
  return editor.Pages.getAll().map(page => {
    const pageSettings = page.get('settings')
    const pageName = publicationSettings?.autoHomePage !== false && page.get('type') === 'main' ? 'index' : (page.get('name') || page.get('type'))
    function getSetting(name) {
      return (pageSettings || {})[name] || (siteSettings || [])[name] || ''
    }
    const component = page.getMainComponent()
    const slug = getPageSlug(pageName)
    return {
      html: `
      <!DOCTYPE html>
      <html lang="${ getSetting('lang') }">
      <head>
      <link rel="stylesheet" href="${publicationSettings?.css?.url || ''}/${slug}.css" />
      ${ siteSettings?.head || '' }
      ${ pageSettings?.head || '' }
      <title>${ getSetting('title') }</title>
      <link rel="icon" href="${ getSetting('favicon') }" />
      ${
  ['description', 'og:title', 'og:description', 'og:image']
    .map(prop => `<meta property="${ prop }" content="${ getSetting(prop) }"/>`)
    .join('\n')
}
      </head>
      ${ editor.getHtml({ component }) }
      </html>
      `,
      css: editor.getCss({ component }),
      cssPath: `${ publicationSettings?.css?.path || '' }/${slug}${publicationSettings?.css?.ext || '.css'}`,
      htmlPath: `${ publicationSettings?.html?.path || '' }/${slug}${publicationSettings?.html?.ext || '.html'}`,
    }
  })
}

export async function trackProgress(editor, statusUrl) {
  let res
  let json
  try {
    res = await fetch(statusUrl)
  } catch(e) {
    displayError(editor, `An error occured, your site is not published. ${e.message}`)
    editor.trigger('publish:stop', {success: false, message: e.message})
    return
  }
  try {
    state = await res.json()
  } catch(e) {
    displayError(editor, `Could not parse the server response, your site may be published. ${e.message}`)
    editor.trigger('publish:stop', {success: false, message: e.message})
    return
  }
  if(!res.ok) {
    displayError(editor, `An network error occured, your site is not published. ${res.statusText}`)
    editor.trigger('publish:stop', {success: false, message: `An network error occured, your site is not published. ${res.statusText}`})
    return
  }
  if(state.running) {
    setTimeout(() => trackProgress(editor, statusUrl), 2000)
  } else {
    status = state.error ? STATUS_ERROR : STATUS_SUCCESS
    editor.trigger('publish:stop', {success: state.error})
  }
  update(editor)
}
