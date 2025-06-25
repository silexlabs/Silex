import { ComponentView } from 'grapesjs'
import { DataSourceEditor } from '../types'

function updateView(type: string, view: ComponentView) {
  const el = view.el
  // Get grapesjs data source properties
  // const data = view.model.get('privateStates')
  const children = view.model.components()
  if (type === 'container' && children.length > 0) {
    el.querySelectorAll('.tmp-wrapper').forEach((w) => w.remove())
    const wrapper = document.createElement('div')
    wrapper.classList.add('tmp-wrapper')
    //children
    //    .map((c) => c.toHTML())
    //    .forEach((c) => {
    //        wrapper.insertAdjacentHTML('beforeend', c)
    //    })
    //children
    //    .map((c) => c.toHTML())
    //    .forEach((c) => {
    //        wrapper.insertAdjacentHTML('beforeend', c)
    //    })
    wrapper.innerHTML = 'xxxxxxxxxxxxx'
    el.appendChild(wrapper)
  }
}
export default (editor: DataSourceEditor) => {
  const domc = editor.DomComponents
    ;['container', 'text', 'image'].forEach((type) => {
    const typeObj = domc.getType(type)
    domc.addType(type, {
      ...typeObj,
      isComponent() {
        return true
      },
      view: {
        ...typeObj?.view,
        onRender() {
          const view = this as ComponentView
          if (typeObj?.view.onRender) typeObj.view.onRender.call(this) // call original
          updateView(type, view)
        },
      },
      model: {
        ...typeObj?.model,
        init() {
          if (typeObj?.model.init) typeObj.model.init.call(this) // call original
          this.on('change', () => {
            if(this.view) {
              updateView(type, this.view)
            }
          })
        },
      },
    })
  })
}
