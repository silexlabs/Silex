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


const name = 'new-page-dialog'
const el = document.createElement('div')
let modal

export const cmdOpenNewPageDialog = 'new-page-dialog'

export const newPageDialog = (editor, opts) => {
  editor.Commands.add(cmdOpenNewPageDialog, {
    run: (_, sender, {page}) => {
      modal = editor.Modal.open({
        title: 'New Page',
        content: '',
        attributes: { class: 'new-page-dialog' },
      })
        .onceClose(() => {
          editor.stopCommand(cmdOpenNewPageDialog) // apparently this is needed to be able to run the command several times
        })
      displayDialog(editor, opts, page)
      modal.setContent(el)
      const form = el.querySelector('form')
      form.onsubmit = event => {
        event.preventDefault()
        saveDialog(editor, opts, page)
        editor.stopCommand(cmdOpenNewPageDialog)
      }
      form.querySelector('input')?.focus()
      return modal
    },
    stop: () => {
      modal.close()
      // el.innerHTML = ''
    },
  })
}

function onImport(editor, page) {
  editor.Pages.select(page)
  editor.runCommand('gjs-open-import-webpage')
}

function displayDialog(editor, config, page) {
  render(html`
    <form class="silex-form">
      <label class="silex-form__element">
        <h3>Name</h3>
        <input type="text" name="name" .value=${live(page.getName() || '')}/>
      </label>
      <footer>
        <input class="silex-button" type="button" @click=${e => onImport(editor, page)} value="Import from website">
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenNewPageDialog)} value="Cancel">
        <input class="silex-button" type="submit" value="Ok">
      </footer>
    </form>
  `, el)
}

function saveDialog(editor, config, page) {
  const form = el.querySelector('form')
  const formData = new FormData(form)
  const data = Array.from(formData)
    .reduce((aggregate, [key, value]) => {
      aggregate[key] = value
      return aggregate
    }, {})
  page.set(data)
  // save if auto save is on
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
}
