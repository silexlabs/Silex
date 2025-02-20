import { html, css, TemplateResult } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, specificity, toString } from '../model/ComplexSelector'
import { createRef, ref } from 'lit/directives/ref.js'
import { animateTextChange } from '../anim'
import { IdSelector, SimpleSelectorType } from '../model/SimpleSelector'

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

  @property({ type: Object, attribute: true, reflect: false })
  public selectedId = ''

  private specificity = 0
  private selectorRef = createRef<HTMLDivElement>()
  private specificityRef = createRef<HTMLDivElement>()

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
        display: inline;
        background-color: var(--gjs-primary-color, #333)
        padding: 0 5px;
        border-radius: 3px;
        margin: 0;
        text-wrap: wrap;
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
    requestAnimationFrame(() => {
      this.updateSpecificity()
      this.updateSelector()
    })
    return html`
      <section id="pre" class="selection">
        <pre
          class="value"
          title="Currently styling for this selector"
          ${ref(this.selectorRef)}
        ></pre>
        <select
          @change=${(event: Event) => {
    event.stopPropagation()
    const target = event.target as HTMLSelectElement
    if (!target.value) {
      this.changeSelector({
        mainSelector: { selectors: [{
          type: SimpleSelectorType.ID,
          value: this.selectedId,
          active: true,
        } as IdSelector] },
      })
    } else {
      const sel = this.selectors[parseInt(target.value)]
      this.changeSelector(sel)
    }
  }}
        >
          <option
            value=""
            ?selected=${!this.value}
          >
            ${ this.selectedId ? `#${ this.selectedId }` : this.placeholder }
          </option>
          ${this.selectors
    .map((sel, idx) => html`
          <option
            value=${idx}
            ?selected=${toString(sel) === toString(this.value!)}
          >
            ${ toString(sel) }
          </option>`) }
        </select>
        <span
          title="Specificity"
          ${ref(this.specificityRef)}
        ></span>
      </section>
    `
  }

  private updateSelector() {
    if (this.value) {
      try {
        animateTextChange(this.selectorRef.value!, toString(this.value) || this.placeholder)
      } catch (error: any) {
        console.error('Error updating selector', { error })
        animateTextChange(this.selectorRef.value!, error.toString())
      }
    } else {
      animateTextChange(this.selectorRef.value!, this.placeholder)
    }
  }

  updateSpecificity() {
    if (this.value) {
      this.specificity = specificity(this.value)
    } else {
      this.specificity = 0
    }
    this.specificityRef.value!.innerHTML = `(${ this.specificity.toString() })`
  }

  private changeSelector(sel: ComplexSelector) {
    this.value = sel
    this.dispatchEvent(new CustomEvent('change', { detail: sel }))
  }
}

if (!customElements.get('current-selector-display')) {
  customElements.define('current-selector-display', CurrentSelectorDisplay)
}
