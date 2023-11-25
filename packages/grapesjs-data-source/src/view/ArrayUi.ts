
/**
 * @fileoverview This file defines the ArrayUi class.
 * This class is used to display the UI to edit an array of items. It has buttons to add, remove and reorder items.
 */

import { TemplateResult, html, render } from "lit"

/**
 * ArrayUi class
 * @class
 */
export class ArrayUi<Item=unknown> {
  private items: Item[]
  private wrapper: HTMLElement | null = null
  private renderItem: (item: Item) => TemplateResult
  private onChange: (items: Item[]) => void
  private renameItem: (item: Item) => Item
  private createItem: () => Item | null

  constructor(options: {
    renderItem: (item: Item) => TemplateResult,
    createItem: () => Item | null,
    renameItem: (item: Item) => Item,
    onChange: (items: Item[]) => void,
  }) {
    this.items = []
    this.renderItem = options.renderItem
    this.onChange = options.onChange
    this.createItem = options.createItem
    this.renameItem = options.renameItem
    this.renderUi()
  }
  setData(items: Item[], wrapper: HTMLElement) {
    this.items = items
    this.wrapper = wrapper
    this.renderUi()
  }
  renderUi() {
    console.log('renderUi', this.items, this.wrapper)
    if(!this.wrapper) {
      console.warn('No wrapper')
      return
    }
    render(html`
      <style>
        .ds-array {
          display: flex;
          flex-direction: column;
        }
        .ds-array__buttons {
          display: flex;
          flex-direction: row;
          margin: 0 5px;
        }
        .ds-array__button {
          cursor: pointer;
          border: 1px solid var(--ds-button-border);
          border-radius: 2px;
          padding: 5px;
          background: var(--ds-button-bg);
          color: var(--ds-button-color);
          flex: 1;
          margin: 5px;
        }
        .ds-array__button--disabled {
          opacity: 0.5;
          cursor: default;
        }
        .ds-array__remove-button {
          margin-left: 1em;
        }
        .ds-array__add-button {
          margin: 10px;
          margin-bottom: 30px;
        }
        .ds-array__sep {
          width: 100%;
          border: none;
          height: 1px;
          background: var(--ds-button-bg);
        }
      </style>
      <div class="ds-array">
        <div class="ds-array__items">
          ${this.items.map((item, index) => html`
            <div class="ds-array__item">
              ${this.renderItem(item)}
              <div class="ds-array__buttons">
                <button
                  class="ds-array__remove-button ds-array__button"
                  @click=${() => {
                    this.items.splice(index, 1)
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >x</button>
                <button
                  class="ds-array__rename-button ds-array__button"
                  @click=${() => {
                    const newItem = this.renameItem(item)
                    if(!newItem) return
                    this.items.splice(index, 1, newItem)
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u270F</button>
                <button
                  class="ds-array__item-move-up ds-array__button${ index === 0 ? ' ds-array__button--disabled' : '' }"
                  @click=${() => {
                    this.items.splice(index - 1, 0, this.items.splice(index, 1)[0]);
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u2191</button>
                <button
                  class="ds-array__item-move-down ds-array__button${ index === this.items.length - 1 ? ' ds-array__button--disabled' : '' }"
                  @click=${() => {
                    this.items.splice(index + 1, 0, this.items.splice(index, 1)[0]);
                    this.onChange(this.items)
                    this.renderUi()
                  }}
                  >\u2193</button>
              </div>
            </div>
            <hr class="ds-array__sep" />
          `)}
        </div>
        <button
          class="ds-array__add-button ds-array__button"
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