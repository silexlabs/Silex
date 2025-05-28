import { html, render } from 'lit-html'
import { SymbolEvents } from '../events'
import { Component, Editor } from 'grapesjs'
import { confirmDialog } from './SymbolsView'
import { getSymbol, unbindSymbolInstance } from '../utils'
import { SymbolOptions } from '..'

// Same signature as a grapesjs plugin
export default function (editor: Editor, options: SymbolOptions) {
  function unlink(component: Component) {
    // FIXME: Handle the case when the component is the main symbol
    confirmDialog({
      editor,
      title: 'Unlink from symbol',
      content: `
        <p>Are you sure you want to unlink this component from the symbol? This is a <em>definitive action<em></p>
        <p>Unlinking this component <em>will not</em> delete the symbol, just disconnects it. Confirm to proceed or cancel to maintain the current link.</p>
      `,
      primaryLabel: 'Unlink',
      cbk: () => {
        unbindSymbolInstance(editor, component)
      },
      lsKey: 'unlink-symbol',
    })
  }
  function updateUi(el: HTMLElement, component?: Component) {
    const symbolInfo = component && getSymbol(editor, component)
    if(symbolInfo) {
      el.style.display = 'initial'
      render(html`<fieldset class="gjs-trt-trait__wrp gjs-trt-trait__wrp-title" style="
        border-color: ${options.primaryColor};
        padding: 10px;
      ">
        <legend class="fa fa-ban on fa-diamond">&nbsp;<em>${ symbolInfo.main?.getName() ?? 'symbol' }</em></legend>
        <div class="gjs-field">
          <button
            class="gjs-btn-prim gjs-btn--full"
            style="
              margin: 10px 0;
              border: 1px solid ${options.primaryColor};
            "
            @click=${() => unlink(component)}>Unlink</button>
        </div>
      </fieldset>`, el)
    } else {
      el.style.display = 'none'
    }
  }
  // Create a new trait type
  editor.TraitManager.addType('symbol-trait', {
    noLabel: true,
    createInput() {
      // Create a new element container and add some content
      const el = document.createElement('div')
      // update the UI when a new symbol is selected or created/deleted etc
      Object.values(SymbolEvents).forEach(event => editor.on(event, () => updateUi(el)))
      // Initial ui update
      updateUi(el)
      // this will be the element passed to onEvent and onUpdate
      return el
    },
    // Update the component based on UI changes
    // `elInput` is the result HTMLElement you get from `createInput`
    //onEvent({ elInput, component, event }) {
    //},
    // Update UI on the component change
    onUpdate({ elInput, component }) {
      updateUi(elInput, component)
    },
  })
  // Add trait to symbols when the user selects one
  editor.on('component:selected symbol', () => {
    const component = editor.getSelected() as Component
    const symbolId = component && getSymbol(editor, component)?.main?.getId()
    if(symbolId) {
      component.addTrait([{
        type: 'symbol-trait',
        name: 'Symbol',
      }])
    }
  })
  // Add the new trait to all component types
  editor.DomComponents.getTypes().forEach(type => {
    editor.DomComponents.addType(type.id, {
      //isComponent: el => isComponent(el),
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...editor.DomComponents.getType(type.id)!.model.prototype.defaults.traits,
            // Add the new trait
            {
              type: 'symbol-trait',
              name: 'Symbol',
            }
          ]
        }
      }
    })
  })
}