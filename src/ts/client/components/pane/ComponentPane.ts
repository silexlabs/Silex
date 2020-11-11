import {html, render} from 'lit-html'
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js'

import { ComponentsDefinition } from '../../externs'
import { Constants } from '../../../constants'
import { ElementState, ElementType } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { isDialogVisible } from '../../ui-store/utils'
import {
  getBody,
  getSelectedElements,
  isBody
} from '../../element-store/filters'
import {
  getComponentsDef,
  updateComponents,
  updateComponentsDependencies
} from '../../element-store/component'
import { getUi } from '../../ui-store'
import { subscribeElements } from '../../element-store/index'
import { subscribeUi } from '../../ui-store/index'
import { updateElements } from '../../element-store'

export class ComponentPane extends PaneBase {
  template = (
    componentsDef: ComponentsDefinition,
    selected: string,
    disabled: boolean,
    listener: (e: InputEvent) => void
  ) => html`
    <div title=${
      disabled ? 'Currently disabled because you have selected a container' : ''
    }>
      <label for="select-component-type">Component type selector${
        disabled ? unsafeHTML('&nbsp;<small>- disabled for selection</small>') : ''
      }</label>
      <select @change=${listener} ?disabled=${disabled} id="select-component-type">
        <option value="" ?selected=${selected===''}>-</option>
        ${
          unsafeHTML(
            Object.entries(componentsDef)
            .filter(([id, def]) => !def.isPrivate)
            .map(([id, def]) => `
              <option value=${id}${selected === id ? ' selected' : ''}>${def.name}</option>
            `)
            .join('')
          )
        }
      </select>
    </div>
  `
  constructor(element: HTMLElement) {
    super(element)
    subscribeUi(() => {
      if (isDialogVisible('params', 'properties')) {
        this.redraw(getSelectedElements())
        this.element.style.display = ''
      } else {
        this.element.style.display = 'none'
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
  redraw(selectElements: ElementState[]) {
    super.redraw(selectElements)
    const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE)
    const first = selectElements.length ? selectElements[0].data.component?.templateName : undefined
    const same = selectElements
      .every((el) => first === el.data.component?.templateName)
    const disabled = selectElements
      .some((el) => [
        ElementType.CONTAINER,
        ElementType.SECTION]
        .includes(el.type) || isBody(el))
    const selected = same && first ? first : ''
    render(
      this.template(componentsDef,
      selected,
      disabled,
      (e) => this.applyComponent((e.target as HTMLSelectElement).value))
    , this.element)
  }

  applyComponent(templateName) {
    const body = getBody()
    const selection = getSelectedElements().filter((el) => el !== body)
    if(selection.length) {
      if(templateName === '') {
        updateElements(
          selection
          .map((el) => ({
            ...el,
            innerHtml: el.data.component.data.preview || '',
            data: {
              ...el.data,
              component: null,
            },
          }))
        )
      } else {
        updateElements(
          selection
          .map((el) => ({
            ...el,
            data: {
              ...el.data,
              component: {
                ...el.data.component,
                templateName,
                data: {
                  preview: el.innerHtml,
                },
              },
            },
          }))
        )
        // update selection since it just changed
        const newSelection = getSelectedElements().filter((el) => el !== body)
        // render component
        updateComponentsDependencies()
        updateComponents(newSelection)
      }
    }
  }
}
