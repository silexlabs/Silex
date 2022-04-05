import * as grapesjs from 'grapesjs/dist/grapes.min.js'
import {html, render} from 'lit-html'
import {live} from 'lit-html/directives/live.js'


const name = 'page-settings'
const el = document.createElement('div')
let modal

export const cmdOpenPageSettings = 'open-page-settings'

export const pageSettings = grapesjs.plugins.add(name, (editor, opts) => {
  editor.Commands.add(cmdOpenPageSettings, {
    run: (editor, sender, {page}) => {
      modal = editor.Modal.open({
        title: 'Page Settings',
        content: '',
        attributes: { class: 'page-settings' },
      })
      .onceClose(() => {
        editor.stopCommand(cmdOpenPageSettings) // apparently this is needed to be able to run the command several times
      })
      displaySettings(editor, opts, page)
      modal.setContent(el)
      const form = el.querySelector('form')
      form.onsubmit = event => {
        event.preventDefault()
        saveSettings(editor, opts, page)
        editor.stopCommand(cmdOpenPageSettings)
      }
      form.querySelector('input')?.focus()
      return modal
    },
    stop: () => {
      modal.close()
      //el.innerHTML = ''
    },
  })
})

function displaySettings(editor, config, page) {
  render(html`
    <form class="silex-form">
      <div class="silex-form__group">
        <label class="silex-form__element">
          Name
          <input type="text" name="name" .value=${live(page.getName() || '')}/>
        </label>
        <label class="silex-form__element">
          Title
          <input type="text" name="title" .value=${live(page.get('title') || '')}/>
        </label>
        <label class="silex-form__element">
          Description
          <input type="text" name="description" .value=${live(page.get('description') || '')}/>
        </label>
      </div>
      <footer>
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenPageSettings)} value="Cancel">
        <input class="silex-button" type="submit" value="Ok">
      </footer>
    </form>
  `, el)
}

function saveSettings(editor, config, page) {
  const form = el.querySelector('form')
  const formData = new FormData(form)
  const settings = Array.from(formData)
  .reduce((aggregate, [key, value]) => {
    aggregate[key] = value
    return aggregate
  }, {})
  page.set(settings)
}
