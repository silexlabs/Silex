import {html, render} from 'lit-html'
import {map} from 'lit-html/directives/map.js'
import grapesjs from 'grapesjs/dist/grapes.min.js'

import { Page } from '../../types'
import { getPageLink } from '../../page'

// constants
const pluginName = 'internal-links'
const options: grapesjs.SelectOption = [
  { id: '', name: '-' },
  { id: 'url', name: 'URL' },
  { id: 'email', name: 'Email' },
  { id: 'page', name: 'Page' },
]

// plugin code
export const internalLinksPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  // update links when a page link changes
  function onAll(cbk) {
    editor.Pages.getAll()
      .forEach(page => {
        page.getMainComponent()
          .onAll(cbk)
      })
  }
  editor.on('page', ({ event, page }) => {
    if(!page) return; // fixes UT
    switch (event) {
    case 'change:name':
      // update all links to this page
      onAll(component => {
        if(component.getAttributes().href === getPageLink(page.previous('name'))) {
          component.setAttributes({
            href: getPageLink(page.get('name')),
          })
        }
      })
      break
    case 'remove':
      // mark all links as issues
      const issues = []
      onAll(component => {
        console.log(component.getAttributes().href, getPageLink(page.previous('name')), page.previous('name'))
        if(component.getAttributes().href === getPageLink(page.previous('name'))) {
          issues.push(component)
        }
      })
      opts?.onError(issues)
      break
    }
  })
  // utility functions to render the UI
  function getUi(type, href) {
    switch (type) {
    case 'email':
      const mailTo = href.replace('mailto:', '').split('?')
      const email = mailTo[0]
      const params = (mailTo[1] || '').split('&').reduce((acc, item) => {
        const items = item.split('=')
        acc[items[0]] = items[1]
        return acc
      }, {})
      return html`<div class="href-next__email-inputs">
            <label for="href-next__email" class="gjs-one-bg silex-label">Email address</label>
            <input class="href-next__email" placeholder="Insert email" type="email" value=${email || ''}/>
            <label for="href-next__email-subject" class="gjs-one-bg silex-label">Subject</label>
            <input class="href-next__email-subject" placeholder="Insert subject" value=${ params.subject || '' }/>
          </div>`
    case 'page':
      return html`<div class="href-next__page-inputs">
            <label for="href-next__page" class="gjs-one-bg silex-label">Page name</label>
            <select id="href-next__page" class="href-next__page">
              ${
  map<grapesjs.Page>(editor.Pages.getAll(), page => html`<option
                  ?selected=${getPageLink(page.getName()) === href}
                  value=${getPageLink(page.getName())}>
                    ${page.getName() || 'Main'}
                </option>`)
}
            </select>
          </div>`
    case 'url':
      return html`<div class="href-next__url-inputs">
          <label for="href-next__url" class="gjs-one-bg silex-label">URL</label>
          <input class="href-next__url" placeholder="Insert URL" type="url" value=${ href }/>
        </div>`
    default:
      return ''
    }
  }
  function getDefaultHref(type) {
    switch(type) {
    case 'email': return 'mailto:'
    case 'page': return getPageLink()
    case 'url': return 'https://'
    }
  }
  function doRender(el: HTMLElement, href = '') {
    const type = getType(href)
    const ui = getUi(type, href)

    render(html`
      <label for="href-next__type" class="gjs-one-bg silex-label">Type</label>
      <select id="href-next__type" class="href-next__type" @change=${event => doRender(el, getDefaultHref(event.target.value))}>
        ${map<grapesjs.SelectOption>(options, opt => html`
          <option value="${opt.id}" ?selected=${type === opt.id}>${opt.name}</option>
        `)}
      </select>
      ${ ui }
    `, el)
  }
  function getType(href: string) {
    if (href.indexOf('mailto:') === 0) {
      return 'email'
    } else if(href.indexOf('./') === 0){
      return 'page'
    } else if(href){
      return 'url'
    }
    return ''
  }
  function doRenderCurrent(el) {
    doRender(el, editor.getSelected()?.getAttributes().href || '')
  }

  // Add the new trait to all component types
  editor.DomComponents.getTypes().map(type => {
    editor.DomComponents.addType(type.id, {
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...editor.DomComponents.getType(type.id).model.prototype.defaults.traits
            // Filter original href trait
              .filter(trait => trait.name ? trait.name !== 'href' : trait !== 'href'),
            // Add the new trait
            {
              label: 'Link',
              type: 'href-next',
              name: 'href',
            },
          ]
        }
      }
    })
  })

  editor.TraitManager.addType('href-next', {
    createInput({ trait }) {
      // Create a new element container and add some content
      const el = document.createElement('div')
      // update the UI when a page is added/renamed/removed
      editor.on('page', () => doRenderCurrent(el))
      doRenderCurrent(el)
      // this will be the element passed to onEvent and onUpdate
      return el
    },
    // Update the component based on UI changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const inputType = elInput.querySelector('.href-next__type')
      let href = ''
      // Compute the new HREF value
      switch (inputType.value) {
      case 'page':
        const valPage = elInput.querySelector('.href-next__page')?.value
        href = valPage || getDefaultHref('page')
        break
      case 'url':
        const valUrl = elInput.querySelector('.href-next__url')?.value
        href = valUrl || getDefaultHref('url')
        break
      case 'email':
        const valEmail = elInput.querySelector('.href-next__email')?.value
        const valSubj = elInput.querySelector('.href-next__email-subject')?.value
        href = valEmail ? `mailto:${valEmail}${valSubj ? `?subject=${valSubj}` : ''}` :  getDefaultHref('email')
        break
      default:
        href = ''
      }

      // Store the new HREF value
      component.addAttributes({ href })

      // Handle the tag name
      if(href === '') {
        // Not a link
        if(component.get('tagName').toUpperCase() === 'A'){
          // Retrieve the original stored value
          const original = component.get('originalTagName') ?? 'DIV'
          // Case of the inline A tags inserted by the text bar
          const value = original.toUpperCase() === 'A' ? 'SPAN' : original
          component.set('tagName', value)
        }
      } else {
        // Link
        if(component.get('tagName').toUpperCase() !== 'A') {
          component.set('originalTagName', component.get('tagName'))
          component.set('tagName', 'A')
        }
      }
    },
    // Update UI on the component change
    onUpdate({ elInput, component }) {
      const href = component.getAttributes().href || ''
      doRender(elInput, href)
    },
  })
})
