import { Editor } from 'grapesjs'
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('as-selector')
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
    .as-class {
      background-color: var(--gjs-main-dark-color);
      text-align: left;
    }
  `

  constructor() {
    super()
  }

  override render() {
    return html`
      <div>State: ${this.state}</div>
      <div class="as-class">
        <slot name="label"></slot>
        <slot></slot>
        ${this.showNewTag ? html`
          <as-tag
            contenteditable="true"
            @change=${(event: CustomEvent) => {
              this.dispatchEvent(new CustomEvent('add', { detail: event.detail }))
              this.showNewTag = false
              this.requestUpdate()
            }}
          ></as-tag>
        ` : html`
          <button
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

declare global {
  interface HTMLElementTagNameMap {
    'as-selector': ASSelector
  }
}
