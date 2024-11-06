import { Selector } from 'grapesjs'
import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { live } from 'lit/directives/live.js'
import { classMap } from 'lit/directives/class-map.js'

/**
 * @fileoverview This component handles a "tag" in the list of tags of the selected components
 * The tag will have
 * - a selector - i.e a css class or a tag name
 * - it may have a related selector - i.e `button.primary#first-button:hover`
 * - if it has a related selector it will have an operator, i.e `+`, `>`, ` `, `~`
 *
 */

interface CustomEventDetail {
  input: HTMLElement
  bindedBlurListener?: (event: Event) => void
  bindedKeyDownListener?: (event: KeyboardEvent) => void
  originalEvent?: Event
}

export class AsTag extends LitElement {
  private _selector: string = ''
  @property({ type: String })
  public get selector(): string {
    return this._selector
  }
  public set selector(value: string) {
    //this._selector?.off('change')
    //value?.on('change', () => this.requestUpdate())
    //const oldValue = this._selector
    //this._selector = value
    //this.requestUpdate('selector', oldValue)
    this._selector = value
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
      this.setEditable()
    })
  }

  @property({ type: Boolean })
  public active: boolean = true

  @property({ type: Object })
  public relativeSelector: Selector | null = null

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
      &.as-tag--active,
      &:has(input[type="checkbox"].as-tag__open:checked) {
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
        font-size: .8em;
      }
      .as-tag__open {
        cursor: pointer;
        padding: 5px;
      }
      input[type="checkbox"].as-tag__open {
        display: none;
      }
      .as-tag__properties {
        display: none;
        position: absolute;
        background-color: var(--gjs-main-color);
        color: var(--gjs-secondary-light-color);
        border-radius: 5px;
        padding: 10px;
        z-index: 1;
        main {
          display: flex;
          flex-direction: column;
          h3 {
            margin: 0;
            padding: 0;
          }
          div {
            display: flex;
            flex-direction: column;
            label {
              margin: 0;
              padding: 0;
            }
            input {
              margin: 5px 0;
              padding: 5px;
              background-color: var(--gjs-secondary-dark-color);
              color: var(--gjs-secondary-light-color);
              border: none;
              border-radius: 5px;
            }
          }
        }
        footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
      }
      button {
        cursor: pointer;
        margin: 0 5px;
        padding: 5px;
        background-color: var(--gjs-tertiary-color);
        color: var(--gjs-secondary-light-color);
        border: none;
        border-radius: 5px;
      }
      button.as-button--primary {
        background-color: var(--gjs-primary-color);
      }
      input[type="checkbox"].as-tag__open:checked + .as-tag__properties {
        display: block;
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
    'as-tag--active': this.active,
    'as-tag__class': this.getType() === 'class',
    'as-tag__tag': this.getType() === 'tag',
    'as-tag__editable': isEditable,
  })}
      >
        <span
          ${ref(this.inputRef)}
          @dblclick=${(event: KeyboardEvent) => {
    event.preventDefault() // Don't click to toggle
    this.setEditable()
  }}
          @click=${() => this.dispatchEvent(new CustomEvent('toggle'))}
          .innerText=${live( this.selector )}
        ></span>
        ${isEditable ? '' : html`
          <button
            class="as-tag__remove"
            @click=${() => this.dispatchEvent(new CustomEvent('remove', { detail: { selector: this.selector } }))}
          >x</button>
        `}
      </div>
    `
  }

  setEditable() {
    console.log('MAKE EDITABLE', this.inputRef.value)
    if (this.inputRef.value) {
      // Create the detail object, used mainly to remove event listeners
      const detail = {
        input: this.inputRef.value,
      } as CustomEventDetail
      detail.bindedBlurListener = this.getBinded<Event>(this.blurListener.bind(this), detail)
      detail.bindedKeyDownListener = this.getBinded<KeyboardEvent>(this.keyDownListener.bind(this), detail)
      console.log('EDITABLE', detail)
      // Start the editable mode
      detail.input.contentEditable = 'true'
      detail.input.focus()
      detail.input.addEventListener('blur', detail.bindedBlurListener)
      detail.input.addEventListener('keydown', detail.bindedKeyDownListener)
      // Redraw the ui
      this.requestUpdate()
    }
  }

  unsetEditable(detail: CustomEventDetail) {
    console.log('NOT EDITABLE', detail)
    detail.input.removeEventListener('blur', detail.bindedBlurListener!)
    detail.input.removeEventListener('keydown', detail.bindedKeyDownListener!)
    detail.input.contentEditable = 'false'
    if(!this.selector) this.dispatchEvent(new CustomEvent('remove'))
    this.requestUpdate()
  }

  getBinded<T extends Event>(cbk: (event: CustomEvent) => void, detail: CustomEventDetail): (event: T) => void {
    return (event: T) => {
      const newEvent = new CustomEvent(event.type, { detail: {
        ...detail,
        originalEvent: event,
      }})
      cbk(newEvent)
    }
  }

  keyDownListener(event: CustomEvent) {
    const detail: CustomEventDetail = event.detail
    if (event.detail.originalEvent.key === 'Enter') {
      // Apply change
      console.log('enter', detail)
      if(detail.input.innerText) {
        this.selector = detail.input.innerText // FIXME: this should be reactive and set by the parent
        this.dispatchEvent(new CustomEvent('change', { detail: { selector: detail.input.innerText } }))
      }
      detail.input.blur()
    } else if (event.detail.originalEvent.key === 'Escape') {
      console.log('cancel', detail)
      detail.input.blur()
    }
  }

  blurListener(event: CustomEvent) {
    console.log('blur', event.detail)
    console.log('blur', event.detail, this.selector, event.detail.input.innerText)
    this.unsetEditable(event.detail)
  }

  getType() {
    return this.selector.startsWith('.') ? 'class' : 'tag'
  }
}

if (!customElements.get('as-tag')) {
  customElements.define('as-tag', AsTag)
}
