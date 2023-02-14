import {html, render} from 'lit-html'
import {map} from 'lit-html/directives/map.js'
import grapesjs from 'grapesjs/dist/grapes.min.js'
import { projectId, ROOT_URL } from '../config'

// constants
const pluginName = 'publish'
export const cmdPublish = 'publish-open-dialog'

// plugin code
export const publishPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  opts = {
    appendTo: 'options',
    ...opts,
  }
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
function update(editor) {
  render(html`
    ${ open ? html`
      <main>
        ${ status === STATUS_PENDING ? html`
          <p>Publication in progress</p>
        ` : ''}
        ${ status === STATUS_SUCCESS ? html`
          <p>Publication success</p>
        ` : ''}
        ${ status === STATUS_ERROR ? html`
          <p>Publication error</p>
          <div>${ errorMessage }</div>
        ` : ''}
      </main>
      <footer>
      ${ status === STATUS_PENDING ? '' : html`
        <button
          class="silex-button silex-button--primary"
          id="publish-button--primary"
          @click=${() => startPublication(editor)}
        >Publish</button>
      `}
        <button
          class="silex-button silex-button--secondary"
          id="publish-button--secondary"
          @click=${() => editor.Commands.stop(cmdPublish)}
        >Close</button>
      </footer>
    ` : ''}
  `, dialog)
  if(open) {
    dialog.classList.remove('silex-dialog-hide')
  } else {
    dialog.classList.add('silex-dialog-hide')
  }
}
export const STATUS_NONE='STATUS_NONE'
export const STATUS_PENDING='STATUS_PENDING'
export const STATUS_ERROR='STATUS_ERROR'
export const STATUS_SUCCESS='STATUS_SUCCESS'
export let status = STATUS_NONE
export let open = false
let errorMessage = ''
let dialog

function displayError(editor, message) {
  console.error(message)
  errorMessage = message
  status = STATUS_ERROR
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

  const width = 350
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
export async function startPublication(editor) {
  if(status === STATUS_PENDING) throw new Error('Publication is already in progress')
  status = STATUS_PENDING
  update(editor)
  const data = {
    ...editor.getProjectData(),
    settings: editor.getModel().get('settings'),
    projectId,
    files: editor.Pages.getAll().map(page => {
      const component = page.getMainComponent()
      return {
        html: editor.getHtml({ component }),
        css: editor.getCss({ component })
      }
    })
  }
  console.log('storage:start:store', data)
  let res
  let json
  try {
    res = await fetch(`${ ROOT_URL }/publish`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
    })
  } catch(e) {
    displayError(editor, `An error occured, your site is not published. ${e.message}`)
    return
  }
  try {
    json = await res.json()
  } catch(e) {
    displayError(editor, `Could not parse the server response, your site may be published. ${e.message}`)
    return
  }
  if(!res.ok) {
    displayError(editor, `An network error occured, your site is not published. ${json.message}`)
    return
  }
  console.log('DONE', json)
  status = STATUS_SUCCESS
  update(editor)
}

