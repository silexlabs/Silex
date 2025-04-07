import { ComponentView } from 'grapesjs'
import { DataSourceEditor } from '../types'

function updateView(type: string, view: ComponentView) {
  console.log('UPDATE VIEW', type, view)
  const el = view.el
  // Get grapesjs data source properties
  const data = view.model.get('privateStates')

  // Test render the content multiple times to simulate loop with expressions and data source
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
    // el.appendChild(wrapper)
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
          typeObj?.view.onRender && typeObj.view.onRender.call(this) // call original
          console.log('RENDER', type, this)
          updateView(type, view)
        },
      },
      model: {
        ...typeObj?.model,
        init() {
          typeObj?.model.init && typeObj.model.init.call(this) // call original
          this.on('change', () => {
            console.log('CHANGE', type, this)
            if(this.view) {
              updateView(type, this.view)
            }
          })
        },
      },
    })
  })
}
