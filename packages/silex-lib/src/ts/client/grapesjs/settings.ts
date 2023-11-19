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
import {live} from 'lit-html/directives/live.js'

import { WebsiteSettings } from '../../types'

const menuItems = [{
  id: 'general',
  label: 'General',
}, {
  id: 'seo',
  label: 'SEO',
}, {
  id: 'social',
  label: 'Social',
}, {
  id: 'code',
  label: 'Code',
}]
let currentMenuItem = menuItems[0]

const idCodeWrapper = 'settings-head-wrapper'
const el = document.createElement('div')
let modal

// Get version from webpack (see plugin in webpack.config.js)
declare const VERSION: string

export const cmdOpenSettings = 'open-settings'

let version = 'v3'
let headEditor = null
export const settingsDialog = (editor, opts) => {
  // Display Silex version from package.json
  try {
    version = VERSION
  } catch (error) {
    // Cannot get version from webpack (see plugin in webpack.config.js)
  }
  console.info('Silex version:', version)
  editor.Commands.add(cmdOpenSettings, {
    run: (_, sender, {page}) => {
      modal = editor.Modal.open({
        title: page ? 'Page settings' : 'Site Settings',
        content: '',
        attributes: { class: 'settings-dialog' },
      })
        .onceClose(() => {
          sender?.set && sender.set('active', 0) // Deactivate the button to make it ready to be clicked again, only in case of a grapesjs button (not in the pages panel)
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
    const model = editor.getModel()
    model.set('settings', data.settings || {})
    //model.set('name', data.name)
    updateDom(editor)
  })
  editor.on('page', (e) => {
    editor.Canvas.getFrameEl().addEventListener('load', () => {
      updateDom(editor)
    })
  })
  headEditor = editor.CodeManager.createViewer({
    readOnly: false,
    codeName: 'htmlmixed',
    lineNumbers: true,
    lineWrapping: true,
  })
}

// Is the model a site or a page?
function isSite(model) { return !!model.getHtml }

function displaySettings(editor, config, model = editor.getModel()) {
  const settings = model.get('settings') || {} as WebsiteSettings
  model.set('settings', settings)
  render(html`
    <form class="silex-form">
      <div class="silex-help">
        ${isSite(model) ? html`
          <p>Here you can set the name of your website, SEO and social networks sharing data.</p>
          <p>These settings are overriden by the page settings, <a href="https://github.com/silexlabs/Silex/wiki/Settings" target="_blank">more info about settings here</a>.</p>
        ` : html`
          <p>Here you can set the name of your page, SEO and social networks sharing data.</p>
          <p>These settings override the site settings, <a href="https://github.com/silexlabs/Silex/wiki/Settings" target="_blank">more info about settings here</a>.</p>
        `}
      </div>
      <section class="silex-sidebar-dialog">
        <aside class="silex-bar">
          <ul class="silex-list silex-list--menu">
            ${menuItems.map(item => html`
              <li
                class=${item.id === currentMenuItem.id ? 'active' : ''}
                @click=${e => {
                  saveSettings(editor, model)
                  currentMenuItem = item
                  displaySettings(editor, model)
                  e.preventDefault()
                }}
              >
                ${item.label}
              </li>
            `)}
          </ul>
        </aside>
        <main>
          ${currentMenuItem.id === 'general' ? html`
            <div class="gjs-sm-sector-title">General</div>
            <div class="silex-form__group col2">
              <label class="silex-form__element">
                <h3>${isSite(model) ? 'Site name' : 'Page name'}</h3>
                <p class="silex-help">${isSite(model) ? 'The project name in the editor, for you to remember what it is about.' : 'Label of the page in the editor, and file name of the published HTML page.'}</p>
                <input type="text" name="name" .value=${live(model.get('name') || '')}/>
              </label>
              <label class="silex-form__element">
                <h3>Website language</h3>
                <p class="silex-help">This is the default language code for this website. Example: en, fr, es...</p>
                <input type="text" name="lang" .value=${live(settings.lang || '')}/>
              </label>
            </div>
          ` : ''}
          ${currentMenuItem.id === 'seo' ? html`
            <div class="gjs-sm-sector-title">SEO</div>
            <div class="silex-form__group col2">
              <label class="silex-form__element">
                <h3>Title</h3>
                <p class="silex-help">Title of the browser window, and title in the search engines results. It is used by search engines to find out what your site is talking about. The title should be a maximum of 70 characters long, including spaces.</p>
                <input type="text" name="title" .value=${live(settings.title || '')}/>
              </label>
              <label class="silex-form__element">
                <h3>Description</h3>
                <p class="silex-help">Description displayed by the search engines in search results. It is used by search engines to find out what your site is talking about. It is best to keep meta descriptions between 150 and 160 characters.</p>
                <input type="text" name="description" .value=${live(settings.description || '')}/>
              </label>
              <label class="silex-form__element">
                <h3>Favicon</h3>
                <p class="silex-help">Small image displayed in the browser's address bar and in tabs. The recommended size is 16×16 or 32×32 pixels. This can be a URL or a relative path.</p>
                <input type="text" name="favicon" .value=${live(settings.favicon || '')}/>
              </label>
            </div>
          ` : ''}
          ${currentMenuItem.id === 'social' ? html`
            <div class="gjs-sm-sector-title">Social</div>
            <div class="silex-help">
              <p>Once your website is live, you can use these tools to test sharing:&nbsp;<a target="_blank" href="https://developers.facebook.com/tools/debug/">Facebook</a>,
              <a target="_blank" href="https://cards-dev.twitter.com/validator">Twitter</a>,
              <a target="_blank" href="https://www.linkedin.com/post-inspector/inspect/">Linkedin</a></p>
            </div>
            <div class="silex-form__group col2">
              <label class="silex-form__element">
                <h3>Title</h3>
                <p class="silex-help">The title of your website displayed when a user shares your website on a social network.
              Do not include any branding in this title, just eye-catching phrase, e.g. "Learn everything about fishing".
              Title should be between 60 and 90 characters long.</p>
                <input type="text" name="og:title" .value=${live(settings['og:title'] || '')}/>
              </label>
              <label class="silex-form__element">
                <h3>Description</h3>
                <p class="silex-help">Description displayed when a user shares your website on a social network. Make it catchy, and invite readers to visit your website too, e.g. "Sam's website about fishing, check it out!" Title should be between 60 and 90 characters long.</p>
                <input type="text" name="og:description" .value=${live(settings['og:description'] || '')}/>
              </label>
              <label class="silex-form__element">
                <h3>Image</h3>
                <div class="silex-help">
                  <p>Thumbnail image which is displayed when your website is shared on a social network. The optimal size is 1200×627 pixels. At this size, your thumbnail will be big and stand out from the crowd. But do not exceed the 5MB size limit. If you use an image that is smaller than 400 pixels x 209 pixels, it will render as a much smaller thumbnail.</p>
                  <p>Please enter the full URL here, e.g. "http://mysite.com/path/to/image.jpg"</p>
                </div>
                <input type="text" name="og:image" .value=${live(settings['og:image'] || '')}/>
              </label>
            </div>
          ` : ''}
          ${currentMenuItem.id === 'code' ? html`
            <div class="gjs-sm-sector-title">Code</div>
            <div class="silex-form__group">
              <label class="silex-form__element" id="${idCodeWrapper}">
                <h3>HTML head</h3>
                <p class="silex-help">HTML code which will be inserted in the HEAD tag.</p>
              </label>
            </div>
        ` : ''}
        </main>
      </section>
      <footer>
        <p class="silex-version">Silex ${version}</p>
        <!-- <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenSettings)} value="Cancel"> -->
        <input class="silex-button" type="submit" value="Close">
      </footer>
    </form>
  `, el)
  el.querySelector(`#${idCodeWrapper}`)?.appendChild(headEditor.getElement())
  headEditor.setContent(settings.head || '')
}

function saveSettings(editor, config, model = editor.getModel()) {
  const form = el.querySelector('form')
  const formData = new FormData(form)
  const data = Array.from(formData as any)
    .reduce((aggregate, [key, value]) => {
      aggregate[key] = value
      return aggregate
    }, {}) as {[key: string]: any}
  //// take the name out to the main model (by design in grapesjs pages)
  //const { name, ...settings } = data
  model.set({
    settings: {
      ...data,
      head: headEditor.getContent(),
    },
    //name,
  })
  // save if auto save is on
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
  // update the DOM
  updateDom(editor)
}
function getHeadContainer(doc, className) {
  const container = doc.head.querySelector(`.${className}`)
  if(container) {
    return container
  }
  const newContainer = doc.createElement('div')
  newContainer.classList.add(className)
  doc.head.appendChild(newContainer)
  return newContainer
}
function updateDom(editor) {
  const doc = editor.Canvas.getDocument()
  if(doc) {
    // Site head
    getHeadContainer(doc, 'site-head')
      .innerHTML = editor.getModel().get('settings').head || ''
    // Pages head
    getHeadContainer(doc, 'page-head')
      .innerHTML = editor.Pages.getSelected().get('settings')?.head || ''
  } else {
    // No document??
  }
}

