import {html, render} from 'lit-html'
import {live} from 'lit-html/directives/live.js'
import * as grapesjs from 'grapesjs/dist/grapes.min.js'

import { WebsiteSettings } from '../../types'

const pluginName = 'settings-dialog'
const el = document.createElement('div')
let modal

export const cmdOpenSettings = 'open-settings'

export const settingsDialog = grapesjs.plugins.add(pluginName, (editor, opts) => {
  editor.Commands.add(cmdOpenSettings, {
    run: (_, sender, {page}) => {
      modal = editor.Modal.open({
        title: page ? 'Page settings' : 'Site Settings',
        content: '',
        attributes: { class: 'settings-dialog' },
      })
        .onceClose(() => {
          editor.stopCommand(cmdOpenSettings) // apparently this is needed to be able to run the command several times
        })
      displaySettings(editor, opts, page)
      modal.setContent(el)
      const form = el.querySelector('form')
      form.onsubmit = event => {
        event.preventDefault()
        saveSettings(editor, opts, page)
        editor.stopCommand(cmdOpenSettings)
      }
      form.querySelector('input')?.focus()
      return modal
    },
    stop: () => {
      modal.close()
    },
  })
  // add settings to the website
  editor.on('storage:start:store', (data) => {
    data.settings = editor.getModel().get('settings')
    data.name = editor.getModel().get('name')
  })
  editor.on('storage:end:load', (data) => {
    editor.getModel().set('settings', data.settings || {})
    editor.getModel().set('name', data.name)
  })
})

function displaySettings(editor, config, model = editor.getModel()) {
  const settings = model.get('settings') || {} as WebsiteSettings
  model.set('settings', settings)
  render(html`
    <p>The page settings will override site settings, <a href="https://github.com/silexlabs/Silex/wiki/Settings" target="_blank">more info about settings here</a>.</p>
    <form class="silex-form">
      <h2>General settings</h2>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3>${model.getHtml ? 'Site name' : 'Page name'}</h3>
          <p>${model.getHtml ? 'The project name in the editor, for you and your team.' : 'Label of the page in the editor, and file name of the HTML page.'}</p>
          <input type="text" name="name" .value=${live(model.get('name') || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Website language</h3>
          <p>This is the default language code for this website. Example: en, fr, es...</p>
          <input type="text" name="lang" .value=${live(settings.lang || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Title</h3>
          <p>Title of the browser window, and title in the search engines results. It is used by search engines to find out what your site is talking about. The title should be a maximum of 70 characters long, including spaces.</p>
          <input type="text" name="title" .value=${live(settings.title || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Description</h3>
          <p>Description displayed by the search engines in search results. It is used by search engines to find out what your site is talking about. It is best to keep meta descriptions between 150 and 160 characters.</p>
          <input type="text" name="description" .value=${live(settings.description || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Favicon</h3>
          <p>Small image displayed in the browser's address bar and in tabs. The recommended size is 16×16 or 32×32 pixels. This can be a URL or a relative path.</p>
          <input type="text" name="favicon" .value=${live(settings.favicon || '')}/>
        </label>
      </div>
      <h2>Social networks sharing</h2>
      <div>
        <p>Once your website is live, you can use these tools to test sharing:&nbsp;<a target="_blank" href="https://developers.facebook.com/tools/debug/">Facebook</a>,
        <a target="_blank" href="https://cards-dev.twitter.com/validator">Twitter</a>,
        <a target="_blank" href="https://www.linkedin.com/post-inspector/inspect/">Linkedin</a></p>
      </div>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3>Title</h3>
          <p>The title of your website displayed when a user shares your website on a social network.
        Do not include any branding in this title, just eye-catching phrase, e.g. "Learn everything about fishing".
        Title should be between 60 and 90 characters long.</p>
          <input type="text" name="og:title" .value=${live(settings['og:title'] || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Description</h3>
          <p>Description displayed when a user shares your website on a social network. Make it catchy, and invite readers to visit your website too, e.g. "Sam's website about fishing, check it out!" Title should be between 60 and 90 characters long.</p>
          <input type="text" name="og:description" .value=${live(settings['og:description'] || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Image</h3>
          <p>Thumbnail image which is displayed when your website is shared on a social network. The optimal size is 1200×627 pixels. At this size, your thumbnail will be big and stand out from the crowd. But do not exceed the 5MB size limit. If you use an image that is smaller than 400 pixels x 209 pixels, it will render as a much smaller thumbnail.</p>
          <p>Please enter the full URL here, e.g. "http://mysite.com/path/to/image.jpg"</p>
          <input type="text" name="og:image" .value=${live(settings['og:image'] || '')}/>
        </label>
      </div>
      <h2>Code</h2>
      <div class="silex-form__group">
        <label class="silex-form__element">
          <h3>HTML head</h3>
          <p>HTML code which will be inserted in the HEAD tag.</p>
          <textarea name="head" .value=${live(settings.head || '')}></textarea>
        </label>
      </div>
      <footer>
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenSettings)} value="Cancel">
        <input class="silex-button" type="submit" value="Ok">
      </footer>
    </form>
  `, el)
}

function saveSettings(editor, config, model = editor.getModel()) {
  const form = el.querySelector('form')
  const formData = new FormData(form)
  const data = Array.from(formData as any)
    .reduce((aggregate, [key, value]) => {
      aggregate[key] = value
      return aggregate
    }, {}) as {[key: string]: any}
    // take the name out to the main model (by design in grapesjs pages)
  const { name, ...settings } = data
  model.set({
    settings,
    name,
  })
  // save if auto save is on
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
}
