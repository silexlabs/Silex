import { css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { AttributeSelector, SimpleSelector, SimpleSelectorWithCreateText } from '../model/SimpleSelector'
import StylableElement from '../StylableElement'
import { toString, getDisplayType, isSameSelector, getFilterFromSelector, suggest, validate } from '../utils/SimpleSelectorUtils'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

const ERROR_NO_SELECTOR = 'No selector provided to the component'

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
    this.requestUpdate()
  }
  private _selector: SimpleSelector | undefined

  /**
   * A list of all the available selectors to choose from
   */
  @property({ type: Object, attribute: true, reflect: false })
  public get suggestions(): SimpleSelector[] {
    return this._suggestions
  }
  public set suggestions(value: SimpleSelector[] | string) {
    try {
      this._suggestions = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      console.error('Error parsing value for relatedSuggestions', { value, error })
    }
  }
  private _suggestions: SimpleSelector[] = []

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
    } else {
    }
  }
  private _editing = false

  // /////////////////
  // Properties

  private filterInputRef = createRef<HTMLInputElement>()
  private filter = ''
  private attributeOptionsAttrValueRef = createRef<HTMLInputElement>()

  // /////////////////
  // Element overrides
  override get title() {
    if (!this.selector) throw new Error(ERROR_NO_SELECTOR)
    return toString(this.selector)
  }

  static override styles = css`
    :focus {
      outline: 2px solid red !important;
    }
    :focus-visible {
      border: 2px solid blue !important;
    }
    :invalid {
      border: 2px solid red;
      background: #fdd;
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
        @change=${() => {
          // Handled by the parent
          // if (!this.selector) return
          // this.selector.active = (event.target as HTMLInputElement).checked
          // this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
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

  private select(selector: SimpleSelectorWithCreateText) {
    // Remove the createText property
    const newSelector = { ...selector }
    delete newSelector.createText
    // Reactive: this.selector = newSelector
    this.editing = false
    this.dispatchEvent(new CustomEvent('change', { detail: newSelector }))
  }

  private cancelEdit() {
    if (!this.editing) return
    if(!this.selector) throw new Error(ERROR_NO_SELECTOR)
    this.editing = false
    this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
  }

  // /////////////////
  // Lifecycle methods
  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties)
    this.filterInputRef.value?.setCustomValidity(validate(this.filter) ? '' : 'Invalid selector')
  }
  // /////////////////
  // Render methods
  private renderMain() {
    const suggestions = suggest(this.filter, this.suggestions)
    const valid = validate(this.filter)
    const filter = valid || this.filter
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
        }}
        >
        <input
          ${ref(this.filterInputRef)}
          type="text"
          autocomplete="off"
          .value=${this.editing ? filter : toString(this.selector!)}
          .disabled=${!this.editing}
          class=${classMap({
            'gjs-input': true,
            'asm-simple-selector__filter-input--readonly': !this.editing,
          })}
          @keydown=${(event: KeyboardEvent) => {
            if (!this.selector) return
            if (!this.editing) return
            if (event.key === 'ArrowDown') {
              const li = this.shadowRoot!.querySelector('aside li') as HTMLElement
              li && li.focus()
              event.stopPropagation()
            } else if (event.key === 'Escape') {
              this.cancelEdit()
              event.stopPropagation()
            } else if (event.key === 'Enter') {
              this.select(suggestions[0])
              event.stopPropagation()
            }
          }}
          @keyup=${() => {
            this.filter = this.filterInputRef.value!.value
            this.requestUpdate()
          }}
          .valid=${!!valid}
        />
        ${this.editing ? this.renderSuggestionList(suggestions) : this.renderOptionsEditor()}
      </main>
    `
  }

  private renderSuggestionList(suggestions: SimpleSelectorWithCreateText[]) {
    return html`
      <aside class="asm-simple-selector__suggestions-list">
        <ul
          @keydown=${(event: KeyboardEvent) => {
            if (!this.selector) return
            if (!this.editing) return
            const target = event.target as HTMLElement
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
            }
          }}
        >
        ${ suggestions
          .map((sel) => html`
            <li
              @click=${() => this.select(sel)}
              @keydown=${(event: KeyboardEvent) => event.key === 'Enter' && this.select(sel)}
              ?data-selected=${isSameSelector(this.selector!, sel)}
              tabindex="0"
            >${sel.createText ?? toString(sel)}</option>
            </li>
        `)}
      </aside>
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
              const operator = (event.target as HTMLSelectElement).value as '=' | '~=' | '|=' | '^=' | '$=' | '*='
              attributeSelector.operator = operator
              attributeSelector.attributeValue = operator ? this.attributeOptionsAttrValueRef.value?.value : ''
              this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
            }}
          >
            <option value="">Select operator</option>
            <option value="=" .selected=${attributeSelector.operator === '='}>=</option>
            <option value="~=" .selected=${attributeSelector.operator === '~='}>~=</option>
            <option value="|=" .selected=${attributeSelector.operator === '|='}>|=</option>
            <option value="^=" .selected=${attributeSelector.operator === '^='}>^=</option>
            <option value="$=" .selected=${attributeSelector.operator === '$='}>$=</option>
            <option value="*=" .selected=${attributeSelector.operator === '*='}>*=</option>
          </select>
          ${attributeSelector.operator ? html`
            <label for="value">Value</label>
            <input
              id="value"
              type="text"
              ${ref(this.attributeOptionsAttrValueRef)}
              autocomplete="off"
              .value=${attributeSelector.attributeValue ?? ''}
              @keyup=${(event: MouseEvent) => {
                attributeSelector.attributeValue = (event.target as HTMLInputElement).value
                this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
              }}
            />
          ` : ''}
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
