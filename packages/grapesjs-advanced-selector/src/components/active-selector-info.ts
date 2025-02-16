import { html, css, TemplateResult } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, specificity, toString } from '../model/ComplexSelector'
import { createRef, ref } from 'lit/directives/ref.js'
import { animateTextChange } from '../anim'

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
    placeholder = 'Select an option'

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
      font-size: 0.8rem;
      padding: 0.5rem 0;
    }
    .selection {
      text-align: center;
      margin-top: 1rem;
      border-top: 1px solid var(--gjs-primary-color, #333);
      padding: .5rem 0;
      .value {
        display: inline;
        background-color: #f9f9f9;
        padding: 0 5px;
        border-radius: 3px;
        margin: 0;
        text-wrap: wrap;
      }
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
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
        <ul><li>
          <pre
            class="value"
            ${ref(this.selectorRef)}
          ></pre>
        </li><li>
          <span class="label">Specificity:</span>
          <span
            class="value"
            ${ref(this.specificityRef)}
          ></span>
        </li></ul>
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
    animateTextChange(this.specificityRef.value!, this.specificity.toString())
  }
}

if (!customElements.get('current-selector-display')) {
  customElements.define('current-selector-display', CurrentSelectorDisplay)
}
