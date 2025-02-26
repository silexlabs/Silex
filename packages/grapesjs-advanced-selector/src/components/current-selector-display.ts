import { html, css, TemplateResult } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, fromString, same, specificity, toString } from '../model/ComplexSelector'
import { createRef, ref } from 'lit/directives/ref.js'

export class CurrentSelectorDisplay extends StylableElement {
  /**
   * The selector to display
   */
  @property({ type: Object, attribute: true, reflect: false })
  public get value(): ComplexSelector | undefined {
    return this._value
  }
  public set value(value: ComplexSelector | string | undefined) {
    try {
      this._value = typeof value === 'string' ? JSON.parse(value) : value
      this.specificity = specificity(this._value!)
    } catch (error) {
      console.error('Error parsing value for selector', { value, error })
    }
  }
  private _value: ComplexSelector | undefined

  @property({ type: String, attribute: true, reflect: false })
  public placeholder = 'Select an option'

  @property({ type: Array, attribute: true, reflect: false })
  public selectors: ComplexSelector[] = []

  public specificity = 0
  private selectRef = createRef<HTMLSelectElement>()

  static override styles = css`
    select:focus-visible,
    input:focus-visible,
    button:focus-visible,
    a:focus-visible {
      outline: initial !important;
      box-shadow: revert !important;
      border: 1px solid !important;
    }
    :host {
      font-size: 0.65rem;
      padding: 0.5rem 0;
    }
    .selection {
      display: flex;
      border-top: 1px solid var(--gjs-primary-color, #333);
      background-color: var(--gjs-main-dark-color, #222);
      select.value {
        background-color: transparent;
        border: none;
        color: var(--gjs-font-color-active, #f8f8f8);
        color: var(--gjs-color-highlight, #71b7f1);
        font-size: inherit;
        font-family: monospace;
        text-align: center;
        padding: .5rem;
        margin: 0;
        text-align: center;
        text-wrap: wrap;
        width: 100%;
        cursor: pointer;
        background-color: var(--gjs-main-dark-color, #333);
        color: var(--gjs-secondary-color);
      }
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        & > li {
          display: inline;
          margin: 0 0.25rem;
        }
      }
      sidebar {
        ul {
          display: flex;
          align-items: center;
          height: 100%;
        }
        button {
          background-color: transparent;
          border: none;
          color: var(--gjs-font-color-active, #f8f8f8);
          cursor: pointer;
          padding: 0;
          margin: 0;
        }
        button:hover {
          color: var(--gjs-color-highlight, #71b7f1);
        }
        .specificity {
          font-size: small;
          padding-top: 2px;
        }
      }
    }
  `

  override render(): TemplateResult {
    if (!this.value) {
      return html``
    }
    const selectors = [
      this.value,
      ...this.selectors
        .filter((sel) => !same([sel, this.value!]))
        .sort((a, b) => specificity(b) - specificity(a))
    ]
    const selectorsStrings = selectors.map(s => ({
      string: toString(s),
      atRule: s.atRule,
    }))
      .map(({ string, atRule }) => {
        return html`
          ${atRule ? atRule.replace(/@media \(max-width: (.+)\)/, '@$1') : ''}
          ${string}
        `
      })
    //const uniqueStrings = new Set(selectorsStrings)
    // Workaround: the selected option do not update when the value changes after user selects an option
    requestAnimationFrame(() => this.selectRef.value ? this.selectRef.value!.selectedIndex = 0 : '')
    return html`
      <section id="pre" class="selection">
        <select
          ${ ref(this.selectRef) }
          class="value"
          @change=${(event: Event) => {
    event.stopPropagation()
    const target = event.target as HTMLSelectElement
    const sel = selectors[parseInt(target.value)]
    this.changeSelector(sel)
  }}
        >
          ${selectorsStrings
    .map((selectorString, idx) => {
      return html`
          <option
            value=${idx}
            ?selected=${idx === 0}
          >
            ${ selectorString }
          </option>`
    })}
        </select>
        <sidebar>
          <ul>
            <li
              title="Specificity"
              class="specificity"
              >
              ${this.specificity}
            </li>
            <li>
              <button
                title="Edit selector"
                @click=${() => {
    const newSelector = prompt('Edit selector', toString(this.value!))
    this.changeSelector(newSelector ? fromString(newSelector, this.value!.atRule ?? '') : this.value!)
  }}
              >✏️</button>
            </li>
            <li>
              <button
                title="Copy style"
                @click=${() => this.dispatchEvent(new CustomEvent('copy'))}
              >📋</button>
            </li>
            <li>
              <button
                title="Paste style"
                @click=${() => this.dispatchEvent(new CustomEvent('paste'))}
              >📥</button>
            </li>
            <li>
              <button
                title="Clear style for this selector"
                @click=${() => {
    this.clearStyle()
  }}
              >️🧹</button>
          </ul>
        </sidebar>
      </section>
    `
  }

  private changeSelector(sel: ComplexSelector) {
    this.value = sel
    this.dispatchEvent(new CustomEvent('change', { detail: sel }))
  }

  private clearStyle() {
    this.dispatchEvent(new CustomEvent('delete', { detail: this.value }))
  }
}

if (!customElements.get('current-selector-display')) {
  customElements.define('current-selector-display', CurrentSelectorDisplay)
}
