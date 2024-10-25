import { Selector } from 'grapesjs'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

/**
 * @fileoverview This component handles a "tag" in the list of tags of the selected components
 * The tag will have
 * - a selector - i.e a css class or a tag name
 * - it may have a related selector - i.e `button.primary#first-button:hover`
 * - if it has a related selector it will have an operator, i.e `+`, `>`, ` `, `~`
 *
 */

@customElement('as-tag')
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
      this.makeEditable()
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
  private openCheckboxRef = createRef<HTMLInputElement>()
  private formRef = createRef<HTMLFormElement>()

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
          @dblclick=${() => this.makeEditable()}
        >${ this.selector }</span>
        ${isEditable ? '' : html`
          <label
            for=${this.openCheckboxRef}
            class="as-tag__open"
            @click=${(event: Event) => {
              console.log('CLICK', event)
              this.openCheckboxRef.value?.click()
            }}
          >v</label>
          <input
            ref=${ref(this.openCheckboxRef)}
            type="checkbox"
            class="as-tag__open"
          />
          <form
            ref=${ref(this.formRef)}
            class="as-tag__properties"
            @submit=${(event: Event) => {
              console.log('SUBMIT', event)
              event.preventDefault()
              const form = this.formRef.value
              if (!form) throw new Error('Form not found')
              if (!this.selector) throw new Error('Selector not found')
              this.selector = (form.querySelector('input[name="full-name"]') as HTMLInputElement).value
              //this.dispatchEvent(new CustomEvent('change', { detail: { selector: this.selector } }))
              this.openCheckboxRef.value && (this.openCheckboxRef.value.checked = false)
            }}
            @reset=${() => {
              this.openCheckboxRef.value && (this.openCheckboxRef.value.checked = false)
            }}
          >
            <main>
              <h3>Properties</h3>
              <details>
                <summary>Advanced</summary>
                <label>Selector
                  <input
                    name="full-name"
                    type="text"
                    value=${this.selector}
                  />
                </label>
              </details>
              <div>
                When
                <select name="operator">
                  <option value=" ">Nested in</option>
                  <option value=" > ">Direct child of</option>
                  <option value=" + ">Next sibling of</option>
                  <option value=" ~ ">After sibling of</option>
                </select>
              </div>
            </main>
            <footer
              class="as-tag__footer"
            >
              <button
                class="as-tag__remove"
                @click=${() => this.dispatchEvent(new CustomEvent('remove', { detail: { selector: this.selector } }))}
              >Remove</button>
              <button
                type="reset"
                class="as-tag__cancel"
              >Cancel</button>
              <button
                type="submit"
                class="as-tag__apply"
              >Apply</button>
            </footer>
          </form>
        `}
      </div>
    `
  }

  makeEditable() {
    console.log('MAKE EDITABLE', this.inputRef.value)
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
    return this.selector.startsWith('.') ? 'class' : 'tag'
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'as-tag': AsTag
  }
}
