import { Editor } from 'grapesjs'
import { ClientConfig } from '../../config'
import { html, render } from 'lit-html'

/**
 * @fileoverview
 * This adds these traits to all components:
 *   - unwrap the component
 */

export const UNWRAP_ID = 'plugin-unwrap'
const LABEL = 'Unwrap content'
const LABEL_DETAILS = 'Remove the component and keep its content'

export default function(editor: Editor/*, opts: EleventyPluginOptions */): void {
  // Add the new trait to all component types
  editor.DomComponents.getTypes().map(type => {
    editor.DomComponents.addType(type.id, {
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...(editor.DomComponents.getType(type.id)?.model.prototype.defaults.traits || []),
            // Add the new trait
            {
              label: LABEL,
              type: UNWRAP_ID,
              name: UNWRAP_ID,
              //type: 'checkbox',
            },
          ]
        }
      }
    })
  })

  function doRender(el: HTMLElement, remove: boolean) {
    render(html`
      <label
        for=${UNWRAP_ID}
        class="gjs-field gjs-field-checkbox silex-label"
        title=${LABEL_DETAILS}
        style="width: 100%; background: var(--primaryColor);"
      >
        <input
          type="checkbox"
          id=${UNWRAP_ID}
          @change=${(event: Event) => doRender(el, (event.target as HTMLInputElement)?.checked)}
            ?checked=${remove}
            style="
            display: initial;
            appearance: none;
            width: 20px;
            height: 20px;
            position: absolute;
            "
            >
          <i
            class="gjs-chk-icon"
            style="
            position: absolute;
            z-index: 1;
            "
          ></i>
      </label>
      `, el)
  }
  function doRenderCurrent(el: HTMLElement) {
    doRender(el, editor.getSelected()?.get(UNWRAP_ID))
  }

  // inspired by https://github.com/olivmonnier/grapesjs-plugin-header/blob/master/src/components.js
  editor.TraitManager.addType(UNWRAP_ID, {
    createInput() {
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
    onEvent({ elInput, component }) {
      const value = (elInput.querySelector(`#${UNWRAP_ID}`) as HTMLInputElement)?.checked
      component.set(UNWRAP_ID, value)
    },
    // Update UI on the component change
    onUpdate({ elInput, component }) {
      const value = component.get(UNWRAP_ID)
      doRender(elInput, value)
    },
  })
}
