import {html, render} from 'lit-html'
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js'

import { ComponentsDefinition } from '../../externs';
import { Constants } from '../../../constants';
import { ElementState } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { Toolboxes } from '../../ui-store/types';
import { getBody, getSelectedElements } from '../../element-store/filters';
import {
  getComponentsDef,
  updateComponents
} from '../../element-store/component';
import { getUi } from '../../ui-store';
import { subscribeElements } from '../../element-store/index';
import { subscribeUi } from '../../ui-store/index'
import { updateElements } from '../../element-store';

export class ComponentPane extends PaneBase {
  template = (componentsDef: ComponentsDefinition, selected: string, listener: (e: InputEvent) => void) => html`
    <label for="select-component-type">Component type</label>
    <select @change=${listener} id="select-component-type">
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
  `
  constructor(element: HTMLElement) {
    super(element)
    subscribeUi(() => {
      if(getUi().currentToolbox === Toolboxes.PARAMS) {
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
    const selected = same && first ? first : ''
    render(
      this.template(componentsDef,
      selected,
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
        updateComponents(newSelection)
      }
    }
  }
}
