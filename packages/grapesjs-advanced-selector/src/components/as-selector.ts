import { Editor } from 'grapesjs'
import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'

export class ASSelector extends LitElement {
  @property({ type: String })
  public state = ''
  private _editor: Editor | null = null
  @property({ type: Object })
  public get editor() {
    return this._editor
  }
  public set editor(value: Editor | null) {
    const oldValue = this._editor
    this._editor = value
    this.requestUpdate('editor', oldValue)
    oldValue?.off('component:selected', this.onComponentSelected)
    value?.on('component:selected', this.onComponentSelected)
  }

  public showNewTag = false

  static override styles = css`
    * {
      font-family: var(--gjs-main-font);
    }
    .as-selector {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      background-color: var(--gjs-main-dark-color);
      padding: var(--gjs-input-padding);
    }
    .as-selector__add {
      color: var(--gjs-secondary-color);
      background-color: var(--gjs-main-light-color);
      border-radius: 2px;
      padding: var(--gjs-input-padding);
      margin: 3px;
      border: 1px solid rgba(0,0,0,.15);
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      cursor: pointer;
    }
  `

  constructor() {
    super()
  }

  override render() {
    return html`
      <div>State: ${this.state}</div>
      <div class="as-selector">
        <slot name="label"></slot>
        <slot></slot>
        ${this.showNewTag ? html`
          <as-tag
            contenteditable="true"
            @change=${(event: CustomEvent) => {
    if(event.detail.selector) {
      this.dispatchEvent(new CustomEvent('add', { detail: event.detail }))
    }
    this.showNewTag = false
    this.requestUpdate()
  }}
          ></as-tag>
        ` : html`
          <button
            class="as-selector__add"
            @click=${() => {
    this.showNewTag = true
    this.requestUpdate()
  }}>+</button>
        `}
      </div>
    `
  }

  private onComponentSelected = () => {
    this.showNewTag = false
    this.requestUpdate()
  }
}

if (!customElements.get('as-selector')) {
  customElements.define('as-selector', ASSelector)
}
