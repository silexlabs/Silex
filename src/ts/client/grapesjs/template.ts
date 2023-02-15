import {html, render} from 'lit-html'
import {styleMap} from 'lit-html/directives/style-map.js'
import grapesjs from 'grapesjs/dist/grapes.min.js'

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
      backgroundColor: 'var(--darkerPrimaryColor);',
    })
    const sepStyle = opts.styles?.sep ?? styleMap({ height: '10px' })
    const labels = {
      before: html`<strong>Before</strong> the element`,
      replace: html`<strong>Replace</strong> the element`,
      after: html`<strong>After</strong> the element`,
    }
    render(html`
      <div>
        <h3>Template</h3>
        <p>This will be inserted in the published version</p>
      </div>
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
      const inputBefore = elInput.querySelector('#template-before')
      const inputReplace = elInput.querySelector('#template-replace')
      const inputAfter = elInput.querySelector('#template-after')

      let template = {
        before: inputBefore.value,
        replace: inputReplace.value,
        after: inputAfter.value,
      }

      // Store the new template
      if(template.before || template.replace || template.after) {
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

})

