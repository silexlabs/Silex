var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StepsSelector_1;
import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './steps-selector-item.js';
let StepsSelector = StepsSelector_1 = class StepsSelector extends LitElement {
    constructor() {
        super(...arguments);
        // Steps currently selected
        this.steps = [];
        // Initial value
        this.initialValue = [];
        // Get the list of steps that can be added after the given selection
        this.completion = () => [];
        this.allowFixed = false;
        this.fixed = false;
        this.fixedType = 'text';
        this.placeholder = 'Add a first step';
        this.fixedPlaceholder = 'Enter a fixed value or switch to expression';
        this.groupByCategory = false;
    }
    static getFixedValueStep(value) {
        return {
            name: 'Fixed value',
            icon: '',
            type: 'fixed',
            options: {
                value,
            },
            optionsForm: `<form>
        <input name="value" type="text" value="${value}" />
        <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>`,
        };
    }
    // Read only property dirty
    get dirty() {
        return JSON.stringify(this._steps) !== JSON.stringify(this.initialValue);
    }
    // Steps with change events - internal use only
    get _steps() {
        return this.steps;
    }
    set _steps(value) {
        const oldValue = this.steps;
        this.steps = value;
        this.requestUpdate('steps', oldValue);
        this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
    }
    render() {
        var _a;
        const nextSteps = this.completion(this._steps);
        const nextStepsByCategory = this.group(nextSteps);
        return html `
      <!-- header -->
      <header part="header" class="header">
        <div class=${classMap({ dirty: this.dirty, 'property-name': true })} part="property-name">
          <slot></slot>
          ${this.dirty ? html `
            <slot name="dirty-icon" part="dirty-icon" class="dirty-icon" @click=${this.reset}>
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>
            </slot>
          ` : html ``}
        </div>
        ${this.allowFixed ? html `
          <div part="fixed-selector" class="fixed-selector">
            <span
              class=${classMap({ active: this.fixed, 'fixed-selector-fixed': true })}
              @click=${() => this.fixed = true}
              part="fixed-selector-fixed"
            >Fixed</span>
            <span
              class=${classMap({ active: !this.fixed, 'fixed-selector-expression': true })}
              @click=${() => this.fixed = false}
              part="fixed-selector-expression"
            >Expression</span>
          </div>
        ` : ''}
      </header>
      <!-- fixed value -->
      ${this.fixed ? html `
        <div part="property-container" class="property-container">
          <input
            part="property-input" class="property-input"
            .placeholder=${this.fixedPlaceholder}
            .type=${this.fixedType}
            .value=${((_a = this._steps[0]) === null || _a === void 0 ? void 0 : _a.options) ? this._steps[0].options['value'] : ''}
            @change=${(event) => this.fixedValueChanged(event.target.value)}
          >
        </div>
      ` : html `
        <!-- steps -->
        <div part="scroll-container" class="scroll-container">
        <div part="steps-container" class="steps-container">
          ${this._steps
            // Add completion to each step
            .map((step, index) => ({
            step,
            completion: this.completion(this._steps.slice(0, index)),
        }))
            // Group steps by catégory
            .map(({ step, completion }) => {
            return {
                step,
                completion,
                completionMap: this.group(completion),
            };
        })
            // Create the ui
            .map(({ step, completion, completionMap }, index) => {
            var _a;
            return html `
              ${index > 0 ? html `<div class="steps-container__separator"></div>` : html ``}
              <steps-selector-item
                key=${index}
                ?no-options-editor=${!step.optionsForm}
                ?no-info=${!step.helpText}
                @set=${(event) => this.setStepAt(index, completion.find(s => s.name === event.detail.value))}
                @delete=${() => this.deleteStepAt(index)}
                @set-options=${(event) => this.setOptionsAt(index, event.detail.options, event.detail.optionsForm)}
                part="steps-selector-item"
                exportparts="value,delete-button,separator__info,separator__options,separator__delete,type,values,helpText,options,tags,errorText,header,name,icon"
              >
                <div part="icon" slot="icon">${unsafeHTML(step.icon)}</div>
                <div part="name" slot="name">${unsafeHTML(step.name)}</div>
                <div part="type" slot="type">${unsafeHTML(step.type)}</div>
                <slot slot="delete-button" name="delete-button">x</slot>
                <div slot="helpText">${unsafeHTML(step.helpText)}</div>
                <ul slot="tags">
                  ${(_a = step.tags) === null || _a === void 0 ? void 0 : _a.map(tag => html `<li>${unsafeHTML(tag)}</li>`)}
                </ul>
                <div slot="errorText">${unsafeHTML(step.errorText)}</div>
                <div slot="values">
                  ${this.renderValues(completion, completionMap, this._steps[index])}
                </div>
                <div slot="options">${unsafeHTML(step.optionsForm)}</div>
              </steps-selector-item>
            `;
        })}
        <!-- add a step -->
        ${nextSteps.length > 0 && (typeof this.maxSteps === 'undefined' || this.maxSteps === -1 || this._steps.length < this.maxSteps) ? html `
          <div part="separator__add"></div>
          <steps-selector-item
            exportparts="value,delete-button,separator__info,separator__options,separator__delete,type,values,helpText,options,tags,header,errorText,icon"
            class="steps-selector-item__add"
            part="steps-selector-item__add"
            no-options-editor
            no-delete
            no-arrow
            no-info
            @set=${(event) => this.setStepAt(this._steps.length, nextSteps.find(step => step.name === event.detail.value))}
          >
            <div name="add-button" part="add-button" slot="name">+</div>
            <div slot="values">
              ${this.renderValues(nextSteps, nextStepsByCategory)}
            </div>
          </steps-selector-item>
        ` : html ``}
        <!-- no steps -->
        ${this._steps.length > 0 ? html `` : html `
          <slot name="placeholder" part="placeholder" class="placeholder">
            <p>${this.placeholder}</p>
          </slot>
        `}
        </div>
        </div>
      `}
    `;
    }
    group(completion) {
        return completion.reduce((map, step) => {
            var _a, _b;
            const category = (_a = step.category) !== null && _a !== void 0 ? _a : 'Other';
            const steps = (_b = map.get(category)) !== null && _b !== void 0 ? _b : [];
            steps.push(step);
            map.set(category, steps);
            return map;
        }, new Map());
    }
    renderValues(completion, completionMap, currentStep) {
        return this.groupByCategory ? html `
      <ul class="values-ul">
        ${Array.from(completionMap.entries())
            .map(([category, steps]) => html `
          <li class="values-li values__title" value=${category}>
            <span class="values__name">${unsafeHTML(category)}</span>
          </li>
          ${steps.map(step => html `<li class=${classMap({ 'values-li': true, active: step.name === (currentStep === null || currentStep === void 0 ? void 0 : currentStep.name) })} value=${step.name}>
            <span class="values__name">
              <span class="values__icon">${unsafeHTML(step.icon)}</span>
              ${unsafeHTML(step.name)}
            </span>
            <span class="values__type">${unsafeHTML(step.type)}</span>
          </li>`)}
        `)}
      </ul>
    ` : html `
      <ul class="values-ul">
        ${completion
            .map(step => html `<li class=${classMap({ 'values-li': true, active: step.name === (currentStep === null || currentStep === void 0 ? void 0 : currentStep.name) })} value=${step.name}>
              <span class="values__name">
                <span class="values__icon">${unsafeHTML(step.icon)}</span>
                ${unsafeHTML(step.name)}
              </span>
              <span class="values__type">${unsafeHTML(step.type)}</span>
            </li>`)}
      </ul>
    `;
    }
    connectedCallback() {
        super.connectedCallback();
        this.dispatchEvent(new Event('load'));
    }
    isFixedValue() {
        return this.allowFixed && this.fixed && (this._steps.length === 0 || this._steps[0].type === 'fixed');
    }
    fixedValueChanged(value) {
        if (value && value !== '') {
            this._steps = [
                StepsSelector_1.getFixedValueStep(value),
            ];
        }
        else {
            this._steps = [];
        }
    }
    /**
     * Set the step at the given index
     */
    setStepAt(at, step) {
        if (step) {
            this._steps = [
                ...this._steps.slice(0, at),
                step,
            ];
        }
        else {
            console.error(`Step is undefined at ${at}`);
        }
    }
    setOptionsAt(at, options, optionsForm) {
        this._steps = [
            ...this._steps.slice(0, at),
            {
                ...this._steps[at],
                options,
                optionsForm,
            },
            ...this._steps.slice(at + 1),
        ];
    }
    /**
     * Delete the step at the given index and all the following steps
     */
    deleteStepAt(at) {
        this._steps = this._steps.slice(0, at);
    }
    /**
     * Reset dirty flag and store the current value as initial value
     */
    save() {
        this.initialValue = [
            ...this._steps,
        ];
    }
    /**
     * Reset dirty flag and restore the initial value
     */
    reset() {
        this._steps = [
            ...this.initialValue,
        ];
    }
};
StepsSelector.styles = css `
    ::part(header) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .dirty {
      color: var(--steps-selector-dirty-color, red);
    }
    ::part(dirty-icon) {
      display: inline-block;
      width: 1rem;
    }
    ::part(property-container) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    ::part(fixed-selector) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--steps-selector-dirty-border-color, #ccc);
      background-color: var(--steps-selector-dirty-background-color, #ccc);
      border-radius: var(--steps-selector-dirty-border-radius, 3px);
      padding: 3px;
    }
    ul[slot="tags"] {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* an arrow between elements */
    .steps-container__separator {
      display: inline;
    }
    .steps-container__separator::after {
      content: "▶";
      color: var(--steps-selector-separator-color, #333);
      font-size: var(--steps-selector-separator-font-size, 1.5em);
      margin: var(--steps-selector-separator-margin, 0);
      padding: var(--steps-selector-separator-padding, 0);
    }
    /* selector between fixed value (text input) and steps */
    .fixed-selector span {
      padding: 3px;
    }
    .fixed-selector span:not(.active):hover {
      color: var(--steps-selector-dirty-color, #0091ff);
    }
    .fixed-selector span:not(.active) {
      cursor: pointer;
    }
    .fixed-selector span:last-child {
      margin-left: 5px;
    }
    .fixed-selector span.active {
      border-radius: var(--steps-selector-active-border-radius, 3px);
      background-color: var(--steps-selector-active-background-color, #eee);
      color: var(--steps-selector-active-color, #333);
      cursor: default;
    }
    ul.values-ul {
      list-style: none;
      padding: var(--steps-selector-values-ul-padding, 0);
      margin: var(--steps-selector-values-ul-margin, 0);
      color: var(--steps-selector-values-ul-color, #000);
      background-color: var(--steps-selector-values-ul-background-color, transparent);
    }
    li.values-li {
      padding: var(--steps-selector-values-li-padding, 5px);
      margin: var(--steps-selector-values-li-margin, 0);
      background-color: var(--steps-selector-values-li-background-color, transparent);
      border-bottom: var(--steps-selector-values-li-border, 1px solid #ccc);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
    }
    li.values-li:last-child {
      border-bottom: none;
    }
    li.values-li:hover {
      background-color: var(--steps-selector-values-li-hover-background-color, #eee);
    }
    li.values-li.active {
      background-color: var(--steps-selector-values-li-active-background-color, #ccc);
      font-weight: var(--steps-selector-values-li-active-font-weight, bold);
    }
    li.values-li.values__title {
      /* Display this line as an array title */
      color: var(--steps-selector-values-li-title-color, #333);
      background-color: var(--steps-selector-values-li-background-color, #eee);
      text-transform: var(--steps-selector-values-li-title-text-transform, uppercase);
      cursor: default;
    }
    li.values-li.values__title .values__name {
      margin: var(--steps-selector-values-li-title-margin, auto);
    }
    li.values-li .values__icon {
      margin-right: var(--steps-selector-values-li-icon-margin-right, 5px);
    }
    li.values-li .values__name {
      margin-right: var(--steps-selector-values-li-name-margin-right, 25px);
    }
    li.values-li .values__type {
      color: var(--steps-selector-values-li-type-color, #999);
      width: max-content;
    }
    .placeholder > * {
      color: var(--steps-selector-placeholder-color, #999);
      font-style: var(--steps-selector-placeholder-font-style, italic);
      margin: var(--steps-selector-placeholder-margin, 10px 0);
    }
  `;
__decorate([
    property({ type: Array })
], StepsSelector.prototype, "steps", void 0);
__decorate([
    property({ type: Function })
], StepsSelector.prototype, "completion", void 0);
__decorate([
    property({ type: Boolean, attribute: 'allow-fixed' })
], StepsSelector.prototype, "allowFixed", void 0);
__decorate([
    property({ type: Boolean, attribute: 'fixed', reflect: true })
], StepsSelector.prototype, "fixed", void 0);
__decorate([
    property({ type: String, attribute: 'fixed-type' })
], StepsSelector.prototype, "fixedType", void 0);
__decorate([
    property()
], StepsSelector.prototype, "placeholder", void 0);
__decorate([
    property()
], StepsSelector.prototype, "fixedPlaceholder", void 0);
__decorate([
    property({ type: Number, attribute: 'max-steps' })
], StepsSelector.prototype, "maxSteps", void 0);
__decorate([
    property({ type: Boolean, attribute: 'group-by-category' })
], StepsSelector.prototype, "groupByCategory", void 0);
StepsSelector = StepsSelector_1 = __decorate([
    customElement('steps-selector')
], StepsSelector);
export { StepsSelector };
//# sourceMappingURL=steps-selector.js.map