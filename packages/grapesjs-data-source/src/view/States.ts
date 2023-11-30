
/**
 * @fileoverview This file defines the States class.
 * This class is used to display the UI to edit an array of items. It has buttons to add, remove and reorder items.
 */

import { TemplateResult, html, render } from "lit"

export interface Item {
  hide?: boolean
}

/**
 * States class
 * @class
 */
export class States<T extends Item> {
  private items: T[]
  private wrapper: HTMLElement | null = null
  private renderItem: (item: T) => TemplateResult
  private onChange: (items: T[]) => void
  private renameItem: (item: T) => T
  private createItem: () => T | null

  constructor(options: {
    renderItem: (item: T) => TemplateResult,
    createItem: () => T | null,
    renameItem: (item: T) => T,
    onChange: (items: T[]) => void,
  }) {
    this.items = []
    this.renderItem = options.renderItem
    this.onChange = options.onChange
    this.createItem = options.createItem
    this.renameItem = options.renameItem
    this.renderUi()
  }
  setData(items: T[], wrapper: HTMLElement) {
    this.items = items
    this.wrapper = wrapper
    this.renderUi()
  }
  renderUi() {
    if(!this.wrapper) {
      console.warn('No wrapper')
      return
    }
    render(html`
      <div class="ds-states">
        <details class="ds-states__help">
          <summary>Help</summary>
          Custom states are used to store data in the component.
          They are useful to store data that is not displayed in the page, but that is used in the expressions of the properties section bellow.
          <a target="_blank" href="https://docs.silex.me/en/user/cms#custom-states">Learn more about custom states</a>
        </details>
        <div class="ds-states__items">
          ${this.items
            .filter(item => !item.hide)
            .map((item, index) => html`
            <div class="ds-states__item">
              ${this.renderItem(item)}
              <div class="ds-states__buttons">
                <button
                  title="Remove this state"
                  class="ds-states__remove-button ds-states__button"
                  @click=${() => {
                    this.items.splice(index, 1)
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >x</button>
                <button
                  title="Rename this state"
                  class="ds-states__rename-button ds-states__button"
                  @click=${() => {
                    const newItem = this.renameItem(item)
                    if(!newItem) return
                    this.items.splice(index, 1, newItem)
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u270F</button>
                <button
                  title="Move this state up"
                  class="ds-states__item-move-up ds-states__button${ index === 0 ? ' ds-states__button--disabled' : '' }"
                  @click=${() => {
                    this.items.splice(index - 1, 0, this.items.splice(index, 1)[0]);
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u2191</button>
                <button
                  title="Move this state down"
                  class="ds-states__item-move-down ds-states__button${ index === this.items.length - 1 ? ' ds-states__button--disabled' : '' }"
                  @click=${() => {
                    this.items.splice(index + 1, 0, this.items.splice(index, 1)[0]);
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u2193</button>
              </div>
            </div>
            <hr class="ds-states__sep" />
          `)}
        </div>
        <button
          title="Add a new state"
          class="ds-states__add-button ds-states__button"
          @click=${() => {
            const item = this.createItem()
            if(!item) return
            this.items.push(item)
            this.onChange(this.items)
            this.renderUi()
          }}
          >+</button>
        </div>
    `, this.wrapper)
  }
}