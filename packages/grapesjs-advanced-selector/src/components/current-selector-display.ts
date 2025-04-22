import { html, css, TemplateResult } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, fromString, same, specificity, toString } from '../model/ComplexSelector'
import { createRef, ref } from 'lit/directives/ref.js'
import { FOCUS_VISIBLE, customizeSelect } from '../styles'

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

  @property({ type: String, attribute: true, reflect: false })
  public helpLink = ''

  @property({ type: String, attribute: true, reflect: false })
  public error = ''

  @property({ type: String, attribute: true, reflect: false })
  public warning = ''


  public specificity = 0
  private selectRef = createRef<HTMLSelectElement>()

  static override styles = css`
  :host {
    ${ FOCUS_VISIBLE }
    & {
      font-size: 0.65rem;
      padding: 0.5rem 0;
    }
    .selection {
      display: flex;
      border-top: 1px solid var(--gjs-primary-color, #333);
      background-color: var(--gjs-main-dark-color, #222);
      ${ customizeSelect('select.value') }
      select.value {
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
      aside {
        ul {
          display: flex;
          align-items: center;
          height: 100%;
        }
        button {
          background-color: transparent;
          color: var(--gjs-font-color-active, #f8f8f8);
          cursor: pointer;
          padding: 0;
          margin: 0;
          border: 1px solid transparent;
          opacity: 0.8;
          &:hover {
            transform: translateY(-1px);
            opacity: 1;
            background-color: var(--gjs-primary-color, #444);
          }
        }
        .specificity {
          font-size: small;
          padding-top: 2px;
          cursor: default;
        }
      }
    }
    .asm-display__help {
      text-decoration: none;
      border-radius: 50%;
      color: var(--gjs-secondary-color, #333);
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      text-align: center;
      line-height: 0.7rem;
      font-size: 0.7rem;
      padding: 4px;
      &:hover {
        background-color: var(--gjs-secondary-color, #fff);
        color: var(--gjs-main-dark-color, #333);
      }
    }

    .asm-display__error {
      color: var(--gjs-warning-color, #f90);
      margin: 0;
    }
    .asm-display__warning {
      color: var(--gjs-warning-color, #f90);
      margin: 0;
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
      <footer>
        ${ this.error ? html`
          <p class="asm-display__error">\u26A0 ${ this.error }</p>
        ` : ''}
        ${ this.warning ? html`
          <p class="asm-display__warning">\u26A0 ${ this.warning }</p>
        ` : ''}
      </footer>
      <main id="pre" class="selection">
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
        <aside>
          <ul>
            <li
              .title=${ this.t('Specificity') }
              class="specificity"
              >
              ${this.specificity}
            </li>
            <li>
              <button
                .title=${ this.t('Edit selector') }
                @click=${() => {
    const newSelector = prompt(this.t('Edit selector'), toString(this.value!))
    this.changeSelector(newSelector ? fromString(newSelector, this.value!.atRule ?? '') : this.value!)
  }}
              >✏️</button>
            </li>
            <li>
              <button
                .title=${ this.t('Copy style') }
                @click=${() => this.dispatchEvent(new CustomEvent('copy'))}
              >📋</button>
            </li>
            <li>
              <button
                .title=${ this.t('Paste style') }
                @click=${() => this.dispatchEvent(new CustomEvent('paste'))}
              >📥</button>
            </li>
            <li>
              <button
                .title=${ this.t('Clear style for this selector') }
                @click=${() => {
    this.clearStyle()
  }}
              >️🧹</button>
            </li>
            ${ this.helpLink ? html`
            <li>
              <a
                class="asm-display__help"
                .title=${ this.t('Help') }
                .href=${ this.helpLink }
                target="_blank"
              >?</a>
            </li>
            ` : ''}
          </ul>
        </aside>
      </main>
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
