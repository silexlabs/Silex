import { css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ATTRIBUTES, AttributeSelector, SimpleSelector, SimpleSelectorType, TAGS } from '../model/SimpleSelector'
import StylableElement from '../StylableElement'
import { simpleSelectorToString, getDisplayName, getDisplayType, isSameSelector, getFilterFromSelector } from '../utils/SimpleSelectorUtils'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

const ERROR_NO_SELECTOR = 'No selector provided to the component'
const MAX_SUGGEST_ATTR = 5
const MAX_SUGGEST_RELATED = 5

export default class SimpleSelectorComponent extends StylableElement {

  // /////////////////
  // Attributes
  /**
   * The selector to display
   */
  @property({ type: Object, attribute: true, reflect: true })
  public get selector(): SimpleSelector | undefined {
    return this._selector
  }
  public set selector(value: SimpleSelector | string | undefined) {
    try {
      this._selector = typeof value === 'string' ? JSON.parse(value) : value
      this.filter = getFilterFromSelector(this.selector!)
    } catch (error) {
      console.error('Error parsing value for selector', { value, error })
    }
    // this.requestUpdate()
  }
  private _selector: SimpleSelector | undefined

  /**
   * A list of all the available selectors to choose from
   */
  @property({ type: Object, attribute: true, reflect: false })
  public get relatedSuggestions(): SimpleSelector[] {
    return this._relatedSuggestions
  }
  public set relatedSuggestions(value: SimpleSelector[] | string) {
    try {
      this._relatedSuggestions = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      console.error('Error parsing value for relatedSuggestions', { value, error })
    }
  }
  private _relatedSuggestions: SimpleSelector[] = []

  /**
   * Whether the selector is editable
   */
  @property({ type: Boolean, attribute: true, reflect: true, state: true })
  public get editing(): boolean {
    return this._editing
  }
  public set editing(value: boolean) {
    this._editing = value
    if (value) {
      this.filter = getFilterFromSelector(this.selector!)
      this.filterInputRef.value!.value = this.filter
    } else {
      this.filterInputRef.value!.value = getDisplayName(this.selector!)
    }
  }
  private _editing = false

  // /////////////////
  // Properties

  private filterInputRef = createRef<HTMLInputElement>()
  private filter = ''

  // /////////////////
  // Element overrides
  override get title() {
    if (!this.selector) throw new Error(ERROR_NO_SELECTOR)
    return simpleSelectorToString(this.selector)
  }

  static override styles = css`
    :focus {
      outline: 2px solid red !important;
    }
    :focus-visible {
      border: 2px solid blue !important;
    }
    ul:not(:focus-within) li:first-of-type,
    li:focus,
    li[data-selected] {
      background: #eee;
      list-style-type: disc;
    }
    .asm-simple-selector__filter-input--readonly {
      border: none;
      background: none;
      pointer-events: none;
    }
  `

  // /////////////////
  // LitElement overrides
  override dispatchEvent(event: Event): boolean {
    console.info('[SimpleSelectorComponent] Dispatching ', event.type, (event as CustomEvent).detail)
    return super.dispatchEvent(event)
  }
  override render() {
    if(!this.selector) return html`<div>Initializing</div>`
    return html`
    <header>${getDisplayType(this.selector)}</header>
    ${ this.renderMain() }
    <footer>
      <button
        class="gjs-btn-prim"
        @click=${() => this.edit()}
        >Edit</button>
      <button
        class="gjs-btn-prim"
        @click=${() => this.dispatchEvent(new CustomEvent('delete', { detail: this.selector }))}>Delete</button>
      <input
        type="checkbox"
        autocomplete="off"
        .checked=${this.selector.active}
        @change=${(event: Event) => {
          if (!this.selector) return
          this.selector.active = (event.target as HTMLInputElement).checked
          this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
        }}
      />
    </footer>
    `
  }

  // /////////////////
  // Methods
  private edit() {
    if(!this.selector) throw new Error(ERROR_NO_SELECTOR)
    this.editing = true
    requestAnimationFrame(() => this.filterInputRef.value!.focus())
  }

  private selectSuggestionRelated(newSelector: SimpleSelector) {
    // Reactive: this.selector = newSelector
    this.editing = false
    this.dispatchEvent(new CustomEvent('change', { detail: newSelector }))
  }

  private selectSuggestion(type: SimpleSelectorType, value?: string) {
    // Reactive: this.selector = { type, value, active: true }
    this.editing = false
    this.dispatchEvent(new CustomEvent('change', { detail: { value: value || this.filter, type } }))
  }

  private cancelEdit() {
    if (!this.editing) return
    if(!this.selector) throw new Error(ERROR_NO_SELECTOR)
    this.editing = false
    this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
  }

  private selectFirstSuggestion() {
    this.shadowRoot!.querySelector('aside li')?.dispatchEvent(new Event('click', { bubbles: true }))
  }

  // /////////////////
  // Render methods
  private renderMain() {
    return html`
      <main
        class="gjs-selector-name"
        @dblclick=${() => this.edit()}
        @click=${() => {
          this.selector!.active = !this.selector!.active
          this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
        }}
        @focusout=${(event: MouseEvent) => {
          const newFocus = event.relatedTarget as HTMLElement;
          if (this.renderRoot.querySelector('main')!.contains(newFocus)) {
            // Focus is still inside the component
            return
          }
          this.cancelEdit()
          //if (this.filter.length) {
          //  // Same as pressing enter
          //  this.confirmCreate(SimpleSelectorType.CLASS)
          //} else {
          //  // Same as escape
          //  this.cancelEdit()
          //}
        }}
        >
        <input
          ${ref(this.filterInputRef)}
          type="text"
          autocomplete="off"
          .value=${getDisplayName(this.selector!)}
          .disabled=${!this.editing}
          class=${classMap({
            'gjs-input': true,
            'asm-simple-selector__filter-input--readonly': !this.editing,
          })}
          @keydown=${(event: KeyboardEvent) => {
            if (!this.selector) return
            if (!this.editing) return
            this.filter = this.filterInputRef.value!.value
            if (event.key === 'ArrowDown') {
              const li = this.shadowRoot!.querySelector('aside li') as HTMLElement
              li && li.focus()
              event.stopPropagation()
            } else if (event.key === 'Escape') {
              this.cancelEdit()
              event.stopPropagation()
            } else if (event.key === 'Enter') {
              this.selectFirstSuggestion()
              event.stopPropagation()
            } else {
              this.requestUpdate()
            }
          }}
        />
        ${this.editing ? this.renderSuggestions() : this.renderOptionsEditor()}
      </main>
    `
  }
  private renderSuggestions() {
    return html`
      <aside class="asm-simple-selector__suggestions-list">
        <ul
          @click=${(event: Event) => {
            const target = (event.target as HTMLElement).closest('li') as HTMLElement
            const attr = target.getAttribute('data-idx')
            if (!attr) throw new Error('No data-idx attribute, wrong target')
            const idx = parseInt(attr)
            const newSelector = this.relatedSuggestions[idx]
            if (newSelector) {
              this.selectSuggestionRelated(newSelector)
            } else {
              switch (target.getAttribute('data-type')) {
                case 'class': this.selectSuggestion(SimpleSelectorType.CLASS, this.filter); break
                case 'attribute': this.selectSuggestion(SimpleSelectorType.ATTRIBUTE, target.getAttribute('data-value') || this.filter); break
                case 'universal': this.selectSuggestion(SimpleSelectorType.UNIVERSAL); break
                case 'custom-tag': this.selectSuggestion(SimpleSelectorType.CUSTOM_TAG, this.filter); break
              }
            }
          }}
          @keydown=${(event: KeyboardEvent) => {
            if (!this.selector) return
            if (!this.editing) return
            const target = event.target as HTMLElement
            const attr = target.getAttribute('data-idx')
            if (!attr) throw new Error('No data-idx attribute, wrong target')
            const idx = parseInt(attr)
            if (event.key === 'ArrowDown') {
              const next = target.nextElementSibling as HTMLElement
              if (next) {
                next.focus()
              }
              event.stopPropagation()
            } else if (event.key === 'ArrowUp') {
              const prev = target.previousElementSibling as HTMLElement
              if (prev) {
                prev.focus()
              } else {
                this.filterInputRef.value!.focus()
              }
              event.stopPropagation()
            } else if (event.key === 'Escape') {
              this.cancelEdit()
              event.stopPropagation()
            } else if (event.key === 'Enter') {
              const newSelector = this.relatedSuggestions[idx]
              if (newSelector) {
                this.selectSuggestionRelated(newSelector)
              } else {
                this.selectSuggestion(target.getAttribute('data-type') as SimpleSelectorType, target.getAttribute('data-value')!)
              }
              event.stopPropagation()
            }
          }}
        >
        ${ this.renderCreateSelector() }
        ${ this.renderClasses() }
      </aside>
    `
  }

  private renderClasses() {
    return this.relatedSuggestions
      .map((sel, idx) => idx < MAX_SUGGEST_RELATED && simpleSelectorToString(sel).includes(this.filter) ? html`
        <li
          data-idx="${idx}"
          ?data-selected=${isSameSelector(this.selector!, sel)}
          tabindex="0"
        >${simpleSelectorToString(sel)}</option>
        </li>
      ` : ''
    )
  }

  private renderCreateSelector() {
    const enableCreateClass = this.filter.length > 0
      && !TAGS.includes(this.filter as any)
    const enableCreateAttribute = this.filter.length > 0 && (
      this.filter.startsWith('data-'.substring(0, this.filter.length))
      || this.filter.startsWith('aria-'.substring(0, this.filter.length))
      || ATTRIBUTES.some(attr => attr.includes(this.filter))
    )
    const enableCreateCustomTag = this.filter.split('-').filter(Boolean).length > 1

    return html`
    ${enableCreateClass ? html`
      <li
        data-idx="-1"
        data-type="class"
        tabindex="0"
        >
        Create <pre>.${this.filter}</pre> class
      </li>
    ` : '' }
    ${enableCreateAttribute ? html`
      <li
        data-idx="-1"
        data-type="attribute"
        tabindex="0"
        >
        Select <pre>[${this.filter}]</pre> attribute
      </li>
    ` : '' }
    ${ATTRIBUTES
      .filter((attr, idx) => idx < MAX_SUGGEST_ATTR && attr.includes(this.filter))
      .map(attr => html`
      <li
        data-idx="-1"
        data-type="attribute"
        data-value="${attr}"
        tabindex="0"
        >
        Select <pre>[${attr}]</pre> attribute
      </li>
    `)}
    ${enableCreateCustomTag ? html`
      <li
        data-idx="-1"
        data-type="custom-tag"
        tabindex="0"
        >
        Create <pre>${this.filter}</pre> custom tag
      </li>
    ` : '' }
    <li
      data-idx="-1"
      data-type="universal"
      tabindex="0"
      >
      Select <pre>*</pre> universal selector
    </li>
    `
  }

  /**
   * Option editor to edit the selector options, depending on the type
   * Only the attribute selectors have options: `operator` and `value2`
   */
  private renderOptionsEditor() {
    if (!this.selector) return
    const attributeSelector = this.selector as AttributeSelector
    switch (this.selector?.type) {
      case 'attribute':
        return html`
        <aside>
          <label for="operator">Operator</label>
          <select
            id="operator"
            @change=${(event: Event) => {
              const value = (event.target as HTMLSelectElement).value as '=' | '~=' | '|=' | '^=' | '$=' | '*='
              attributeSelector.operator = value
              this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
            }}
          >
            <option value="=" .selected=${attributeSelector.operator === '='}>=</option>
            <option value="~=" .selected=${attributeSelector.operator === '~='}>~=</option>
            <option value="|=" .selected=${attributeSelector.operator === '|='}>|=</option>
            <option value="^=" .selected=${attributeSelector.operator === '^='}>^=</option>
            <option value="$=" .selected=${attributeSelector.operator === '$='}>$=</option>
            <option value="*=" .selected=${attributeSelector.operator === '*='}>*=</option>
          </select>
          <label for="value">Value</label>
          <input
            id="value"
            type="text"
            autocomplete="off"
            .value=${attributeSelector.attributeValue}
            @change=${(event: Event) => {
              attributeSelector.attributeValue = (event.target as HTMLInputElement).value
              this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
            }}
          />
        </aside>
        `
      default:
        return html`
        `
    }
  }
}

if (!customElements.get('simple-selector')) {
  customElements.define('simple-selector', SimpleSelectorComponent)
}
