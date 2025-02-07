import { css, html, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { AttributeSelector, SimpleSelector, SimpleSelectorSuggestion, toString, getDisplayType, getFilterFromSelector, suggest, validate, getCreationSuggestions, SimpleSelectorType, toStrings } from '../model/SimpleSelector'
import StylableElement from '../StylableElement'
import { createRef, ref } from 'lit/directives/ref.js'
import { INVISIBLE_INPUT, INVISIBLE_SELECT } from '../styles'

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
   * A list of all the classes, IDs, tags, custom tags, attributes, custom attributes
   * that are available in the document, applicable to the current selection
   */
  @property({ type: Object, attribute: true, reflect: false })
  private suggestions: SimpleSelector[] = []

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
    *:focus, *:focus-visible {
      outline: revert !important;
      box-shadow: revert !important;
    }
    :invalid {
      border: 2px solid red;
      background: #fdd;
    }
    section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 0.5rem;
    }
    section:not(:has(.asm-simple-selector__active:checked)) {
      opacity: 0.5;
    }
    .asm-simple-selector__filter {
      min-width: 200px;
    }
    .asm-simple-selector__active {
      display: none;
    }
    .asm-simple-selector__like-text {
      ${ INVISIBLE_INPUT }
    }
    .asm-simple-selector__options-select {
      ${ INVISIBLE_SELECT }
    }
    .asm-simple-selector__name {
      min-width: 200px;
      display: inline-block;
      cursor: pointer;
    }
  `

  override dispatchEvent(event: Event): boolean {
    console.info('[SimpleSelectorComponent] Dispatching ', event.type, (event as CustomEvent).detail)
    return super.dispatchEvent(event)
  }
  override render(): TemplateResult {
    if(!this.selector) return html`<div>Initializing</div>`
    return html`
    <section>
      <header>${getDisplayType(this.selector)}</header>
      ${ this.renderMain() }
      <footer>
      <!--
        <button
          class="gjs-btn-prim"
          @click=${() => this.edit()}
          >Edit</button>
      -->
        <button
          class="gjs-btn-prim"
          @click=${() => this.dispatchEvent(new CustomEvent('delete', { detail: this.selector }))}
        >
          &#10006;
        </button>
        <input
          type="checkbox"
          autocomplete="off"
          class="asm-simple-selector__active"
          .checked=${this.selector.active}
        />
      </footer>
    </section>
    `
  }

  // /////////////////
  // Methods
  private edit() {
    if(!this.selector) throw new Error(ERROR_NO_SELECTOR)
    this.editing = true
    requestAnimationFrame(() => this.filterInputRef.value!.focus())
  }

  private select(selector: SimpleSelectorSuggestion) {
    // Remove the createText property
    const newSelector = { ...selector }
    delete newSelector.createText
    // Reactive: this.selector = newSelector
    if (!selector || selector.keepEditing) {
      this.filterInputRef.value!.focus()
    } else {
      this.editing = false
    }
    this.dispatchEvent(new CustomEvent('change', { detail: newSelector }))
  }

  private cancelEdit() {
    if (!this.editing) return
    if(!this.selector) throw new Error(ERROR_NO_SELECTOR)
    this.editing = false
    this.dispatchEvent(new CustomEvent('cancel', { detail: this.selector }))
  }

  // /////////////////
  // Lifecycle methods
  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties)
    this.filterInputRef.value?.setCustomValidity(validate(this.filter) === false ? 'Invalid selector' : '')
  }

  // /////////////////
  // Render methods
  private renderMain() {
    const suggestions = getCreationSuggestions(this.filter).concat(suggest(this.filter, this.suggestions))
    const valid = validate(this.filter)
    return html`
      ${ this.renderLayout(html`
        ${ this.editing ? this.renderFilterInput({
    suggestions,
    valid: !!valid
  }) : ''
}
      ${ this.editing && this.selector?.type === SimpleSelectorType.ATTRIBUTE ? this.renderOptionsEditor() : html``}
      ${ !this.editing ? this.renderSelector(html`
      ${this.selector?.type === SimpleSelectorType.ATTRIBUTE ? this.renderOptionsEditor() : html``}
  `) : '' }
        ${this.editing ? this.renderSuggestionList(suggestions) : '' }
      `)}
    `
  }

  private renderLayout(content: TemplateResult) {
    return html`
      <main
        class="gjs-selector-name"
        @dblclick=${() => this.edit()}
        @click=${() => {
        this.selector!.active = !this.selector!.active
        this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
  }}
        @focusout=${(event: FocusEvent) => {
    const newFocus = event.relatedTarget as HTMLElement
    if (this.renderRoot.querySelector('main')!.contains(newFocus)) {
      // Focus is still inside the component
      return
    }
    this.cancelEdit()
  }}
      >
        ${content}
      </main>
    `
  }

  private renderSelector(content: TemplateResult) {
    const [pre, post] = toStrings(this.selector!)
    return html`
      <span
        class="gjs-selector-name asm-simple-selector__name"
      >
        ${this.selector ? html`
          ${pre}
          ${content}
          ${post}
        ` : 'No selector'}
      </span>
    `
  }

  private renderFilterInput({ suggestions, valid }: {suggestions: SimpleSelectorSuggestion[], valid: boolean}) {
    return html`
      <input
        ${ref(this.filterInputRef)}
        list="suggestions"
        is="resize-input"
        type="text"
        autocomplete="off"
        .value=${this.editing ? this.filter : toString(this.selector!)}
        .disabled=${!this.editing}
        class="asm-simple-selector__like-text asm-simple-selector__filter"
        @keydown=${(event: KeyboardEvent) => {
    if (!this.selector) return
    if (event.key === 'Escape') {
      this.cancelEdit()
      event.stopPropagation()
    } else if (event.key === 'Enter') {
      if (valid) this.select(suggestions[0])
      event.stopPropagation()
    }
  }}
        @keyup=${() => {
    this.filter = this.filterInputRef.value!.value
    this.requestUpdate()
  }}
    @click=${(event: MouseEvent) => {
    event.stopPropagation()
  }}
        .valid=${valid}
      />
    `
  }

  private renderSuggestionList(suggestions: SimpleSelectorSuggestion[]) {
    return html`
      <datalist
        id="suggestions"
      >
        ${ suggestions
    .sort((a, b) => {
      if (a.createValue ?? toString(a) === this.filter) return -1
      if (b.createValue ?? toString(b) === this.filter) return 1
      return 0
    })
    .map((sel) => html`
            <option
              value=${sel.createValue ?? toString(sel)}
            >${sel.createText ?? toString(sel)}</option>
        `)}
      </datalist>
    `
  }

  /**
   * Option editor to edit the selector options, depending on the type
   * Only the attribute selectors have options: `operator` and `value2`
   */
  private renderOptionsEditor() {
    if (this.selector?.type !== SimpleSelectorType.ATTRIBUTE) throw new Error('Invalid selector type, only attribute selectors have options')
    const selector = this.selector as AttributeSelector
    return html`
          <select
            class="asm-simple-selector__options-select"
            id="operator"
            @click=${ (event: MouseEvent) => {
    // Avoid check/uncheck the "active" checkbox
    event.stopPropagation()
  }}
            @change=${(event: Event) => {
    const operator = (event.target as HTMLSelectElement).value as '=' | '~=' | '|=' | '^=' | '$=' | '*='
    selector.operator = operator
    selector.attributeValue = operator ? this.attributeOptionsAttrValueRef.value?.value : ''
    this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
  }}
          >
            <option value=""></option>
            <option value="=" .selected=${selector.operator === '='}>=</option>
            <option value="~=" .selected=${selector.operator === '~='}>~=</option>
            <option value="|=" .selected=${selector.operator === '|='}>|=</option>
            <option value="^=" .selected=${selector.operator === '^='}>^=</option>
            <option value="$=" .selected=${selector.operator === '$='}>$=</option>
            <option value="*=" .selected=${selector.operator === '*='}>*=</option>
          </select>
          ${selector.operator ? html`
            <input
              is="resize-input"
              type="text"
              ${ref(this.attributeOptionsAttrValueRef)}
              autocomplete="off"
              class="asm-simple-selector__like-text"
              .value=${selector.attributeValue ?? ''}
          @click=${ (event: MouseEvent) => {
    // Avoid check/uncheck the "active" checkbox
    event.stopPropagation()
  }}
              @keyup=${(event: MouseEvent) => {
    selector.attributeValue = (event.target as HTMLInputElement).value
    this.dispatchEvent(new CustomEvent('change', { detail: this.selector }))
  }}
            />
          ` : ''}
        `
  }
}

if (!customElements.get('simple-selector')) {
  customElements.define('simple-selector', SimpleSelectorComponent)
}
