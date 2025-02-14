import { css, html, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { AttributeSelector, SimpleSelector, SimpleSelectorSuggestion, toString, getDisplayType, getDisplayName, suggest, validate, getCreationSuggestions, SimpleSelectorType, getEditableName } from '../model/SimpleSelector'
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
  public get value(): SimpleSelector | undefined {
    return this._value
  }
  public set value(sel: SimpleSelector | string | undefined) {
    try {
      this._value = typeof sel === 'string' ? JSON.parse(sel) : sel
    } catch (error) {
      console.error('Error parsing value for selector', { sel, error })
    }
    this.requestUpdate()
  }
  private _value: SimpleSelector | undefined

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
  public set editing(isEditing: boolean) {
    this._editing = isEditing
  }
  private _editing = false

  // /////////////////
  // Properties

  private selectorInputRef = createRef<HTMLInputElement>()
  private attributeOptionsAttrValueRef = createRef<HTMLInputElement>()
  private mainRef = createRef<HTMLElement>()

  // /////////////////
  // Element overrides
  static override styles = css`
    *:focus, *:focus-visible {
      outline: revert !important;
      box-shadow: revert !important;
    }
    :invalid {
      border: 2px solid red !important;
      background: #fdd !important;
    }
    section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 0.2rem;
      cursor: pointer;
    }
    header {
      width: 12px;
      text-wrap: nowrap;
      transition: all .2s ease-out;
      overflow: hidden;
    }
    section:focus-within header,
    section:hover header {
      width: 0;
    }
    footer {
      width: 0;
      transition: all .2s ease-out;
      overflow: hidden;
    }
    section:focus-within footer,
    section:hover footer {
      width: 12px;
    }
    select {
      text-align: center;
    }
    section:not(:has(.asm-simple-selector__active:checked)) {
      opacity: 0.5;
    }
    .asm-simple-selector__delete-button {
      padding: 0;
      line-height: 1;
      margin: 1px;
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
      display: inline-block;
      text-wrap: wrap;
      line-height: 1.25rem;
    }
    .asm-simple-selector__selector {
      cursor: text;
    }
  `

  override focus() {
    this.selectorInputRef.value?.focus()
  }
  override render(): TemplateResult {
    if(!this.value) return html`<div>Initializing</div>`
    return html`
    <section
      tabindex="0"
      @keydown=${(event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
        this.value!.active = !this.value!.active
        this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
    }
  }}
      @dblclick=${() => this.edit()}
      @click=${() => {
        this.value!.active = !this.value!.active
        this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }}
    >
      <header>
        ${!this.editing ? getDisplayType(this.value) : ''}
      </header>
      ${ this.renderMain() }
      <footer>
        <button
          title="Delete selector"
          class="gjs-btn-prim asm-simple-selector__delete-button"
          @keydown=${(event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation()
    }
  }}
          @click=${(event: MouseEvent) => {
    this.dispatchEvent(new CustomEvent('delete', { detail: this.value }))
    // Avoid check/uncheck the "active" checkbox
    event.stopPropagation()
  }}
        >
          &times;
        </button>
        <input
          type="checkbox"
          autocomplete="off"
          class="asm-simple-selector__active"
          .checked=${this.value.active}
        />
      </footer>
    </section>
    `
  }

  override dispatchEvent(event: Event): boolean {
    console.info('[SIMPLE] Dispatching event', event)
    return super.dispatchEvent(event)
  }

  // /////////////////
  // Methods
  private edit() {
    if(!this.value) throw new Error(ERROR_NO_SELECTOR)
    this.editing = true
    requestAnimationFrame(() => this.focus())
  }

  private select(selector: SimpleSelectorSuggestion) {
    // Remove the createText property
    const newSelector = { ...selector }
    delete newSelector.createText
    delete newSelector.createValue
    // Reactive: this.selector = newSelector
    if (!selector || selector.keepEditing) {
      requestAnimationFrame(() => this.focus())
    } else {
      this.editing = false
      this.attributeOptionsAttrValueRef.value?.blur()
    }
    this.dispatchEvent(new CustomEvent('change', { detail: newSelector }))
  }

  private cancelEdit() {
    this.attributeOptionsAttrValueRef.value?.blur()
    if (!this.editing) return
    if(!this.value) throw new Error(ERROR_NO_SELECTOR)
    this.editing = false
    this.dispatchEvent(new CustomEvent('cancel', { detail: this.value }))
  }

  // /////////////////
  // Lifecycle methods
  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties)
    if (this.value) {
      const selectorString = this.selectorInputRef.value?.value || ''
      this.selectorInputRef.value?.setCustomValidity(validate(selectorString) === false ? 'Invalid selector' : '')
    }
  }

  // /////////////////
  // Render methods
  private renderMain(): TemplateResult {
    const selectorString = this.selectorInputRef.value?.value || ''
    const valid = validate(selectorString)
    const suggestions = getCreationSuggestions(selectorString).concat(suggest(selectorString, this.suggestions))
    return html`
      ${ this.renderLayout(html`
        ${ this.editing ? this.renderSelectorInput({
    suggestions,
    valid: valid !== false, // Can be false or a string
  }) : ''
}
      ${ this.editing && this.value?.type === SimpleSelectorType.ATTRIBUTE ? this.renderOptionsEditor() : html``}
      ${ !this.editing ? this.renderSelector(html`
      ${this.value?.type === SimpleSelectorType.ATTRIBUTE ? this.renderOptionsEditor() : html``}
  `) : '' }
        ${this.editing ? this.renderSuggestionList(suggestions, selectorString) : '' }
      `, { valid: valid !== false, suggestions }) }
    `
  }

  private renderLayout(content: TemplateResult, { valid, suggestions }: {suggestions: SimpleSelectorSuggestion[], valid: boolean}): TemplateResult {
    return html`
      <main
        class="gjs-selector-name"
        tabindex="0"
        ${ ref(this.mainRef) }
        @keydown=${(event: KeyboardEvent) => {
    if (
      !this.editing
            && event.target === this.mainRef.value
            && event.key === 'Enter'
    ) {
      this.edit()
      event.stopPropagation()
    }
  }}
        @focusout=${(event: FocusEvent) => {
    if(!this.editing) return
    const newFocus = event.relatedTarget as HTMLElement
    if (this.renderRoot.querySelector('main')!.contains(newFocus)) {
      // Focus is still inside the component
      return
    }
    if (valid) this.select(suggestions[0])
    else requestAnimationFrame(() => this.focus())
    event.stopPropagation()
  }}
      >
        ${content}
      </main>
    `
  }

  private renderSelector(content: TemplateResult): TemplateResult {
    return html`
      <span
        class="gjs-selector-name asm-simple-selector__name"
      >
        ${this.value ? html`
          ${ getDisplayName(this.value!) }
          ${content}
        ` : 'No selector'}
      </span>
    `
  }

  private renderSelectorInput({ suggestions, valid }: {suggestions: SimpleSelectorSuggestion[], valid: boolean}) {
    return html`
      <input
        ${ref(this.selectorInputRef)}
        list="suggestions"
        is="resize-input"
        type="text"
        autocomplete="off"
        .value=${getEditableName(this.value!)}
        .disabled=${!this.editing}
        class="asm-simple-selector__like-text asm-simple-selector__selector"
        @keydown=${(event: KeyboardEvent) => {
    if (!this.value) return
    if (event.key === 'Escape') {
      this.cancelEdit()
      event.stopPropagation()
    } else if (event.key === 'Enter') {
      if (valid) this.select(suggestions[0])
      event.stopPropagation()
    }
  }}
        @keyup=${() => {
    this.requestUpdate()
  }}
    @click=${(event: MouseEvent) => {
    event.stopPropagation()
  }}
        .valid=${valid}
      />
    `
  }

  private renderSuggestionList(suggestions: SimpleSelectorSuggestion[], selectorString: string): TemplateResult {
    return html`
      <datalist
        id="suggestions"
      >
        ${ suggestions
    .sort((a, b) => {
      if (toString(a) === selectorString) return -1
      if (toString(b) === selectorString) return 1
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
  private renderOptionsEditor(): TemplateResult {
    if (this.value?.type !== SimpleSelectorType.ATTRIBUTE) throw new Error('Invalid selector type, only attribute selectors have options')
    const selector = this.value as AttributeSelector
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
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
  }}
              @keydown=${(event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.stopPropagation()
    }
  }}
          >
            <option value="">...</option>
            <option value="=" .selected=${selector.operator === '='}>=</option>
            <option value="~=" .selected=${selector.operator === '~='}>~=</option>
            <option value="|=" .selected=${selector.operator === '|='}>|=</option>
            <option value="^=" .selected=${selector.operator === '^='}>^=</option>
            <option value="$=" .selected=${selector.operator === '$='}>$=</option>
            <option value="*=" .selected=${selector.operator === '*='}>*=</option>
          </select>
          ${selector.operator ? html`
            "&nbsp;
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
              @keydown=${(event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      selector.attributeValue = (event.target as HTMLInputElement).value
      this.select(this.value!)
      event.stopPropagation()
    } else if (event.key === 'Escape') {
      ;(event.target as HTMLInputElement).value = selector.attributeValue ?? ''
      this.cancelEdit()
      event.stopPropagation()
    }
  }}
    @focusout=${(event: FocusEvent) => {
    selector.attributeValue = (event.target as HTMLInputElement).value
    this.select(this.value!)
  }}
            />
            &nbsp;"
          ` : ''}
        `
  }
}

if (!customElements.get('simple-selector')) {
  customElements.define('simple-selector', SimpleSelectorComponent)
}
