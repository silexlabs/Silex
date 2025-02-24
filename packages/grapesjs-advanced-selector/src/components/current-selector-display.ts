import { html, css, TemplateResult } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, same, specificity, toString } from '../model/ComplexSelector'
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
    } catch (error) {
      console.error('Error parsing value for selector', { value, error })
    }
  }
  private _value: ComplexSelector | undefined

  @property({ type: String, attribute: true, reflect: false })
  public placeholder = 'Select an option'

  @property({ type: Array, attribute: true, reflect: false })
  public selectors: ComplexSelector[] = []

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
      text-align: center;
      border-top: 1px solid var(--gjs-primary-color, #333);
      background-color: var(--gjs-main-dark-color, #222);
      padding: .5rem 0;
      .value {
        background-color: transparent;
        border: none;
        color: var(--gjs-font-color-active, #f8f8f8);
        color: var(--gjs-color-highlight, #71b7f1);
        font-size: inherit;
        font-family: monospace;
        text-align: center;
        padding: 0 5px;
        margin: 0;
        text-wrap: wrap;
        width: 100%;
      }
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        & > li {
          display: inline;
          margin: 0 0.5rem;
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
      specificity: specificity(s),
      atRule: s.atRule,
    }))
      .map(({ string, atRule }) => {
        return html`
          ${atRule ? atRule.replace(/@media \(max-width: (.+)\)/, '@$1') : ''}
          ${string}
        `
        //( ${specificity} )
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
      </section>
    `
  }

  private changeSelector(sel: ComplexSelector) {
    this.value = sel
    this.dispatchEvent(new CustomEvent('change', { detail: sel }))
  }
}

if (!customElements.get('current-selector-display')) {
  customElements.define('current-selector-display', CurrentSelectorDisplay)
}
