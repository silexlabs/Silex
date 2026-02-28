import { html, css, TemplateResult, svg } from 'lit'
import StylableElement from '../StylableElement'
import { property } from 'lit/decorators.js'
import { ComplexSelector, fromString, specificity, toString } from '../model/ComplexSelector'
import { createRef, ref } from 'lit/directives/ref.js'
import { customizeSelect, FOCUS_VISIBLE } from '../styles'

// Inline SVG icons (stroke-based, inherit color via currentColor)
const ICON_SIZE = 14
const iconEdit = svg`<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
const iconCopy = svg`<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const iconPaste = svg`<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
const iconClear = svg`<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/></svg>`
const iconHelp = svg`<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
const iconWarning = svg`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`

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
      border: 1px solid var(--gjs-primary-color, #333);
      font-size: .85rem;
      ${ customizeSelect('select.value') }
      select.value {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: 1px solid var(--gjs-light-border, #333);
        font-size: inherit;
        font-family: monospace;
        text-align: center;
        margin: .25rem;
        padding: .15rem 0;
        text-align: center;
        text-wrap: wrap;
        width: 100%;
        cursor: pointer;
        background: var(--gjs-primary-color);
        color: inherit;
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
        button, a {
          background-color: transparent;
          color: var(--gjs-font-color-active, #f8f8f8);
          cursor: pointer;
          padding: 0;
          margin: 0;
          border: 1px solid transparent;
          opacity: 0.8;
          display: inline-flex;
          align-items: center;
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
      color: var(--gjs-secondary-color, #333);
      &:hover {
        color: var(--gjs-font-color-active, #fff);
      }
    }

    .asm-display__error {
      color: var(--gjs-warning-color, #f90);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      a {
        text-decoration: none;
        color: var(--gjs-secondary-color, #333);
        display: inline-flex;
        margin-left: 0.5rem;
        &:hover {
          color: var(--gjs-font-color-active, #fff);
        }
      }
    }
    .asm-display__warning {
      color: var(--gjs-warning-color, #f90);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      a {
        text-decoration: none;
        color: var(--gjs-secondary-color, #333);
        display: inline-flex;
        margin-left: 0.5rem;
        &:hover {
          color: var(--gjs-font-color-active, #fff);
        }
      }
    }
  }
  `

  override render(): TemplateResult {
    if (!this.value) {
      return html``
    }
    const thisSelectorString = toString(this.value)
    const selectors = [
      { selector: this.value, selectorString: thisSelectorString },
      ...this.selectors
        .sort((a, b) => specificity(b) - specificity(a))
        .map(s => ({ selector: s, selectorString: toString(s) }))
        .filter(({ selector, selectorString }) =>
          thisSelectorString !== selectorString
          || selector.atRule !== this.value?.atRule
        )
    ]
    const selectorsStrings = selectors
      .map(({ selectorString, selector }) => {
        return html`
          ${ selector.atRule ? selector.atRule.replace(/@media \(max-width: (.+)\)/, '@$1') : '' }
          ${ selectorString }
        `
      })
    //const uniqueStrings = new Set(selectorsStrings)
    // Workaround: the selected option do not update when the value changes after user selects an option
    requestAnimationFrame(() => this.selectRef.value ? this.selectRef.value!.selectedIndex = 0 : '')
    return html`
      <main id="pre" class="selection">
        <select
          ${ ref(this.selectRef) }
          class="value"
          @change=${(event: Event) => {
    event.stopPropagation()
    const target = event.target as HTMLSelectElement
    const sel = selectors[parseInt(target.value)].selector
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
              >${iconEdit}</button>
            </li>
            <li>
              <button
                .title=${ this.t('Copy style') }
                @click=${() => this.dispatchEvent(new CustomEvent('copy'))}
              >${iconCopy}</button>
            </li>
            <li>
              <button
                .title=${ this.t('Paste style') }
                @click=${() => this.dispatchEvent(new CustomEvent('paste'))}
              >${iconPaste}</button>
            </li>
            <li>
              <button
                .title=${ this.t('Clear style for this selector') }
                @click=${() => {
    this.clearStyle()
  }}
              >${iconClear}</button>
            </li>
            ${ this.helpLink ? html`
            <li>
              <a
                class="asm-display__help"
                .title=${ this.t('Help') }
                .href=${ this.helpLink }
                target="_blank"
              >${iconHelp}</a>
            </li>
            ` : ''}
          </ul>
        </aside>
      </main>
      <footer>
        ${ this.error ? html`
          <p class="asm-display__error">${iconWarning} ${ this.error } <a href="https://docs.silex.me/en/user/selectors#troubleshooting" target="_blank" title="${this.t('Troubleshooting guide')}">${iconHelp}</a></p>
        ` : ''}
        ${ this.warning ? html`
          <p class="asm-display__warning">${iconWarning} ${ this.warning } <a href="https://docs.silex.me/en/user/selectors#troubleshooting" target="_blank" title="${this.t('Troubleshooting guide')}">${iconHelp}</a></p>
        ` : ''}
      </footer>
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
