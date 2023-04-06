import {html, render} from 'lit-html'
import {styleMap} from 'lit-html/directives/style-map.js'
import grapesjs from 'grapesjs/dist/grapes.min.js'
import { onAll } from '../utils'

const pluginName = 'template'
const templateType = 'templateType'
const templateKey = 'template'

export const templatePlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  // Add the new trait to all component types
  editor.DomComponents.getTypes().map(type => {
    editor.DomComponents.addType(type.id, {
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...editor.DomComponents.getType(type.id).model.prototype.defaults.traits,
            // Add the new trait
            {
              label: false,
              type: templateType,
              name: pluginName,
            },
          ]
        }
      }
    })
  })

  function doRender(el) {
    const template = editor.getSelected()?.get(templateKey) || {}
    const taStyle = opts.styles?.textarea ?? styleMap({
      backgroundColor: 'var(--darkerPrimaryColor)',
    })
    const sepStyle = opts.styles?.sep ?? styleMap({ height: '10px' })
    const labels = {
      before: html`<strong>Before</strong> the element`,
      replace: html`<strong>Replace</strong> the element's children`,
      after: html`<strong>After</strong> the element`,
      attributes: html`HTML attributes`,
      classname: html`CSS classes`,
      style: html`CSS styles`,
    }
    render(html`
      <div>
        <h3>Template</h3>
        <p>This will be inserted in the published version</p>
      </div>
      ${['classname', 'attributes', 'style'].map(id => html`
      <label>
        ${labels[id]}
        <input
          id="template-${id}"
          .value=${template[id] || ''}
          style=${taStyle}
          />
      </label>
      `)}
      ${['before', 'replace', 'after'].map(id => html`
        <label
          for="template-${id}"
          >${labels[id]}</label>
        <textarea
          id="template-${id}"
          style=${taStyle}
          .value=${template[id] || ''}
          ></textarea>
      `)}
    `, el)
  }

  editor.TraitManager.addType(templateType, {
    createInput({ trait }) {
      // Create a new element container and add some content
      const el = document.createElement('div')
      el.classList.add('gjs-one-bg')
      // update the UI when a page is added/renamed/removed
      editor.on('page', () => doRender(el))
      doRender(el)
      // this will be the element passed to onEvent and onUpdate
      return el
    },
    // Update the component based on UI changes
    // `elInput` is the result HTMLElement you get from `createInput`
    onEvent({ elInput, component, event }) {
      const template = {
        before: elInput.querySelector('#template-before').value,
        replace: elInput.querySelector('#template-replace').value,
        after: elInput.querySelector('#template-after').value,
        attributes: elInput.querySelector('#template-attributes').value,
        classname: elInput.querySelector('#template-classname').value,
        style: elInput.querySelector('#template-style').value,
      }

      // Store the new template
      if(Object.values(template).filter(val => !!val && !!cleanup(val)).length > 0) {
        component.set(templateKey, template)
      } else {
        component.set(templateKey)
      }
    },
    // Update UI on the component change
    onUpdate({ elInput, component }) {
      doRender(elInput)
    },
  })

  // Make html attribute
  // Quote strings, no values for boolean
  function makeAttribute(key, value) {
    switch(typeof value) {
    case 'boolean': return value ? key : ''
    default: return `${key}="${value}"`
    }
  }
  // Remove empty lines in templates
  function cleanup(template) {
    return template
      // split in lines
      .split('\n')
      // remove lines with only spaces
      .map(line => line.trim())
      .filter(line => !!line)
      // put back together
      .join('\n')
  }
  editor.on(opts.eventStart || 'publish:before', () => {
    // Insert templates
    onAll(editor, c => {
      const template = c.get(templateKey)
      const toHTML = c.toHTML
      const classes = c.getClasses()
      const before = cleanup(template?.before || '')
      const replace = cleanup(template?.replace || '')
      const after = cleanup(template?.after || '')
      const classname = cleanup(template?.classname || '')
      const style = cleanup(template?.style || '')
      const attributes = cleanup(template?.attributes || '')
      // Store the initial method
      if(!c.has('tmpHtml')) c.set('tmpHtml', toHTML)
      // Override the method
      c.toHTML = () => {
        return `
          ${ before }
          ${ c.get('tagName') ? `<${c.get('tagName')}
            ${Object.entries(c.get('attributes')).map(([key, value]) => makeAttribute(key, value)).join(' ')}
            ${classes.length || classname ? `class="${classes.join(' ')} ${classname}"` : ''}
            ${attributes}
            ${style ? `style="${style}"` : ''}
            >` : '' }
            ${replace || c.getInnerHTML()}
          ${ c.get('tagName') ? `</${c.get('tagName')}>` : '' }
          ${ after }
        `
      }
    })
  })
  editor.on(opts.eventStop || 'publish:stop', () => {
    onAll(editor, c => {
      // Restore the original method
      c.toHTML = c.get('tmpHtml')
    })
  })
})

