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
import {defaultSections, idCodeWrapper, isSite} from './settings-sections'

/**
 * @fileoverview This file contains the settings dialog. The config API lets plugins add sections to the settings dialog.
 */

import { WebsiteSettings } from '../../types'
import { ClientEvent } from '../events'

const sectionsSite = [...defaultSections]
const sectionsPage = [...defaultSections]

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
        editor.trigger(ClientEvent.SETTINGS_SAVE_START, page)
        saveSettings(editor, opts, page)
        editor.trigger(ClientEvent.SETTINGS_SAVE_END, page)
        editor.stopCommand(cmdOpenSettings)
      }
      form.querySelector('input')?.focus()
      // Notify other plugins
      editor.trigger(ClientEvent.SETTINGS_OPEN, page)
      // Return the dialog
      return modal
    },
    stop: () => {
      modal.close()
      editor.trigger(ClientEvent.SETTINGS_CLOSE)
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
    model.set('name', data.name)
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

export function addSection(section, siteOrPage: 'site' | 'page', position: 'first' | 'last' | number) {
  const sections = siteOrPage === 'site' ? sectionsSite : sectionsPage
  if (position === 'first') {
    sections.unshift(section)
  } else if (position === 'last') {
    sections.push(section)
  } else if (typeof position === 'number') {
    sections.splice(position, 0, section)
  } else {
    throw new Error('Invalid position for settings section')
  }
}

export function removeSection(id, siteOrPage: 'site' | 'page') {
  const sections = siteOrPage === 'site' ? sectionsSite : sectionsPage
  const index = sections.findIndex(section => section.id === id)
  if(index === -1) throw new Error(`Cannot find section with id ${id}`)
  sections.splice(index, 1)
}


function displaySettings(editor, config, model = editor.getModel()) {
  // Update the model with the current settings
  const settings = model.get('settings') || {} as WebsiteSettings
  model.set('settings', settings)
  // Get the current sections for page or site
  const menuItemsCurrent = isSite(model) ? sectionsSite : sectionsPage
  // Init the current section selection
  let sections = menuItemsCurrent[0]
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
            ${menuItemsCurrent.map(item => html`
              <li
                class=${item.id === sections.id ? 'active' : ''}
                @click=${e => {
    e.preventDefault()
    sections = item
    const li = e.target as HTMLElement
    const ul = li.closest('ul')
    const section = li.closest('section')
    const mainItem = section.querySelector(`#settings-${item.id}`)
    // Update active
    Array.from(ul.querySelectorAll('.active')).forEach(el => el.classList.remove('active'))
    li.classList.add('active')
    // Update hidden
    Array.from(section.querySelectorAll('.silex-hideable')).forEach(el => el.classList.add('silex-hidden'))
    mainItem.classList.remove('silex-hidden')
    // This messes up with the save / cancel mechanism
    // displaySettings(editor, config, model)
  }}
              >
                ${item.label}
              </li>
            `)}
          </ul>
        </aside>
        <main>
            ${menuItemsCurrent.map(item => item.render(settings, model))}
        </main>
      </section>
      <footer>
        <p class="silex-version">Silex ${version}</p>
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenSettings)} value="Cancel">
        <input class="silex-button" type="submit" value="Apply">
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
      // Keep only the values that are set
      if(value !== '') {
        aggregate[key] = value
      }
      return aggregate
    }, {}) as {[key: string]: any}
  // take the name out to the main model (by design in grapesjs pages)
  const { name, ...settings } = data
  model.set({
    settings: {
      ...data,
      head: headEditor.getContent(),
    },
    name,
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

