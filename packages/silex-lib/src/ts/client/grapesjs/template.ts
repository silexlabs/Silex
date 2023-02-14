import {html, render} from 'lit-html'
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
              label: null,
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
    render(html`
      <textarea id="template-before" class="template-plugin__input" .value=${template.before || ''}></textarea>
      <textarea id="template-replace" class="template-plugin__input" .value=${template.replace || ''}></textarea>
      <textarea id="template-after" class="template-plugin__input" .value=${template.after || ''}></textarea>
    `, el)
  }

  editor.TraitManager.addType(templateType, {
    createInput({ trait }) {
      // Create a new element container and add some content
      const el = document.createElement('div')
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

