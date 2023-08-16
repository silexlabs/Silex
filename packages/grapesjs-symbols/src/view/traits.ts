import { html, render } from 'lit-html'
import { SymbolEvents } from '../events'
import { SymbolEditor } from '../model/Symbols'
import { SYMBOL_SYNC_ATTRIBUTE, getSymbolId } from '../model/Symbol'
import { Component } from 'grapesjs'
import { cmdUnlink } from '../SymbolsCommands'
import { confirmDialog } from './SymbolsView'
import { SymbolOptions } from '..'

// Same signature as a grapesjs plugin
export default function (editor: SymbolEditor, options: SymbolOptions) {
  function setSync(el: HTMLElement, component: Component, sync: boolean) {
    component.set(SYMBOL_SYNC_ATTRIBUTE, sync)
    updateUi(el, component)
  }
  function unlink(component: Component) {
    confirmDialog({
      editor,
      title: 'Unlink from symbol',
      content: `
        <p>Are you sure you want to unlink this component from the symbol? This is a <em>definitive action<em></p>
        <p>Unlinking this component <em>will not</em> delete the symbol, just disconnects it. Confirm to proceed or cancel to maintain the current link.</p>
      `,
      primaryLabel: 'Unlink',
      cbk: () => {
        editor.runCommand(cmdUnlink, { component })
      },
      lsKey: 'unlink-symbol',
    })
  }
  function updateUi(el: HTMLElement, component?: Component) {
    const symbolId = component && getSymbolId(component)
    if(symbolId) {
      const sync = component.get(SYMBOL_SYNC_ATTRIBUTE) !== false
      el.style.display = 'initial'
      render(html`<fieldset class="gjs-trt-trait__wrp gjs-trt-trait__wrp-title" style="
        border-color: ${options.primaryColor};
        padding: 10px;
      ">
        <legend class="fa fa-ban on fa-diamond"> <em>${ editor.Symbols.get(symbolId)?.get('label') }</em></legend>
        <div class="gjs-field">
          <button
            class="gjs-btn-prim gjs-btn--full"
            style="
              margin: 10px 0;
              border: 1px solid ${options.primaryColor};
            "
            @click=${() => unlink(component)}>Unlink</button>
          <div class="gjs-radio-items">
            <label class="gjs-radio-item">
              <input type="radio" name="sync" value="on" @click=${() => setSync(el, component, true)} ?checked=${sync}/>
              <span class="gjs-radio-item-label" style="color: ${sync ? options.highlightColor : options.primaryColor}">ON</span>
            </label>
            <label class="gjs-radio-item">
              <input type="radio" name="sync" value="off" @click=${() => setSync(el, component, false)} ?checked=${!sync}/>
              <span class="gjs-radio-item-label" style="color: ${sync ? options.primaryColor : options.highlightColor}">OFF</span>
            </label>
        </div>
      </fieldset>`, el)
    } else {
      el.style.display = 'none'
    }
  }
  // Create a new trait type
  editor.TraitManager.addType('symbol-trait', {
    noLabel: true,
    createInput({ trait }) {
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
  // Add the new trait to all component types
  editor.DomComponents.getTypes().map(type => {
    editor.DomComponents.addType(type.id, {
      //isComponent: el => isComponent(el),
      model: {
        defaults: {
          traits: [
            // Keep the type original traits
            ...editor.DomComponents.getType(type.id).model.prototype.defaults.traits,
            // Add the new trait
            //{
            //  type: 'checkbox',
            //  name: 'In sync',
            //  //valueTrue: 'YES', // Value to assign when is checked, default: `true`
            //  //valueFalse: 'NO', // Value to assign when is unchecked, default: `false`
            //}
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