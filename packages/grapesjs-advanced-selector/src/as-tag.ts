import { Selector } from 'grapesjs'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

@customElement('as-tag')
export class AsTag extends LitElement {
  private _selector: Selector | null = null
  @property({ type: String })
  public get selector(): Selector | null {
    return this._selector
  }
  public set selector(value: Selector | null) {
    this._selector?.off('change')
    value?.on('change', () => this.requestUpdate())
    const oldValue = this._selector
    this._selector = value
    this.requestUpdate('selector', oldValue)
  }

  private _contentEditable = false
  @property({ type: String })
  override get contentEditable(): string {
    return this._contentEditable ? 'true' : 'false'
  }
  override set contentEditable(value: string) {
    super.contentEditable = 'false'
    const oldValue = this._contentEditable
    this._contentEditable = value === 'true'
    this.requestUpdate('contentEditable', oldValue)
    setTimeout(() => {
      this.makeEditable()
    })
  }

  static override styles = css`
    * {
      font-family: var(--gjs-main-font);
    }
    .as-tag {
      border-radius: 5px;
      display: inline-flex;
      justify-content: space-between;
      margin: 3px;
      min-width: 50px;
      opacity: 0.5;
      &.as-tag--active {
        opacity: 1;
      }
      &.as-tag__class {
        background-color: var(--gjs-tertiary-color);
        color: var(--gjs-secondary-light-color);
      }
      &.as-tag__tag {
        background-color: var(--gjs-quaternary-color);
        color: var(--gjs-secondary-light-color);
      }
      span {
        padding: var(--gjs-input-padding);
        cursor: pointer;
        flex-grow: 1;
      }
      span[contenteditable="true"] {
        background-color: var(--gjs-secondary-dark-color);
        color: var(--gjs-secondary-light-color);
        cursor: text;
        width: 100%;
      }
      .as-tag__remove {
        cursor: pointer;
        border: none;
        background-color: transparent;
        color: var(--gjs-font-color);
        &:hover {
          background-color: var(--gjs-color-warn);
          color: var(--gjs-color-red);
        }
      }
    }
  `

  private inputRef = createRef<HTMLSpanElement>()

  constructor() {
    super()
  }

  override render() {
    const isEditable = this.inputRef.value?.contentEditable === 'true'
    return html`
      <div
        class=${classMap({
          'as-tag': true,
          'as-tag--active': !!this.selector?.getActive(),
          'as-tag__class': this.getType() === 'class',
          'as-tag__tag': this.getType() === 'tag',
          'as-tag__editable': isEditable,
        })}
      >
        <span
          ${ref(this.inputRef)}
          @dblclick=${() => this.makeEditable()}
        >${this.selector?.getLabel()}</span>
        ${isEditable ? '' : html`
          <button
            class="as-tag__remove"
            @click=${() => this.dispatchEvent(new CustomEvent('remove', { detail: { selector: this.selector } }))}
          >x</button>
        `}
      </div>
    `
  }

  makeEditable() {
    if (this.inputRef.value) {
      const input = this.inputRef.value
      input.contentEditable = 'true'
      input.focus()
      input.addEventListener('blur', () => {
        input.contentEditable = 'false'
        this.dispatchEvent(new CustomEvent('change', { detail: { selector: input.innerText } }))
      })
      input.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          input.contentEditable = 'false'
          this.dispatchEvent(new CustomEvent('change', { detail: { selector: input.innerText } }))
        } else if (event.key === 'Escape') {
          input.contentEditable = 'false'
        }
      })
      this.requestUpdate()
    }
  }

  getType() {
    console.log('TYPE', this.selector?.getName(), this.selector?.getFullName(), this.selector?.getLabel(), this.selector)
    return this.selector?.getFullName().startsWith('.') ? 'class' : 'tag'
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'as-tag': AsTag
  }
}
