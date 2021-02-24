import {html, render} from 'lit-html'

import { ComponentsDefinition } from '../../externs'
import { Constants } from '../../../constants'
import { ElementState } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import {
  getBody,
  getChildren,
  getSelectedElements
} from '../../element-store/filters'
import { getComponentsDef } from '../../element-store/component'
import { getElements } from '../../element-store'
import { isDialogVisible } from '../../ui-store/utils'
import { selectElements } from '../../element-store/dispatchers'
import { subscribeElements } from '../../element-store/index'
import { subscribeUi } from '../../ui-store/index'

export class TreePane extends PaneBase {
  template = (
    componentsDef: ComponentsDefinition,
    root: ElementState,
    elements: ElementState[],
    listener: (e: ElementState) => void
  ) => root ? html`
    <details style="padding: 5px 15px;" key=${root.id} open>
      <summary class="${root.selected ? 'selected' : ''}${root.children.length ? '' : ' hide-details-marker'}">
        <span @click=${(e) => {
            listener(root)
            e.preventDefault()
            e.stopPropagation()
            return false
          }}>
          ${root.tagName}.${root.classList.join('.')}
        </span>
      </summary>
      ${
        getChildren(root, elements)
        .map((el) => this.template(componentsDef, el, elements, listener))
      }
    </details>
  ` : '' // root is undefined when opening a website
  constructor(element: HTMLElement) {
    super(element)
    subscribeUi(() => {
      if (isDialogVisible('tree-editor', 'properties')) {
        this.redraw(getSelectedElements())
        element.style.display = ''
      } else {
        element.style.display = 'none'
      }
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  /**
   * redraw the properties
   * @param states the elements currently selected
   */
  redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)
    const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE)
    const elements = getElements()
    render(
      this.template(
        componentsDef,
        getBody(elements),
        elements,
        (el) => selectElements([el]),
      )
    , this.element)
  }
}
