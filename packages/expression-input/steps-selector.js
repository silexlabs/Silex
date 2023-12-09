var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { stepsSelectorStyles } from './styles.js';
import './steps-selector-item.js';
let StepsSelector = class StepsSelector extends LitElement {
    constructor() {
        super(...arguments);
        // Steps currently selected
        this.__steps = [];
        // Initial value
        this.initialValue = [];
        // Get the list of steps that can be added after the given selection
        this.completion = () => [];
        this.allowFixed = false;
        this.inputType = 'text';
        this.fixed = false;
        this.placeholder = 'Add a first step';
        this.fixedPlaceholder = 'Enter a fixed value or switch to expression';
        this.groupByCategory = false;
        /**
         * Form id
         * This is the same API as input elements
         */
        this.for = '';
        /**
         * Name of the property
         * This is the same API as input elements
         */
        this.name = '';
        /**
         * Form setter
         * Handle formdata event to add the current value to the form
         */
        this._form = null;
        /**
         * Handle formdata event to add the current value to the form
         */
        this.onFormdata = (event) => {
            if (!this.name) {
                throw new Error('Attribute name is required for steps-selector');
            }
            event.formData.append(this.name, JSON.stringify(this._steps));
        };
    }
    getFixedValueStep(value) {
        return {
            name: 'Fixed value',
            id: 'fixed',
            icon: '',
            type: 'fixed',
            options: {
                value,
                inputType: this.inputType,
            },
            optionsForm: html `<form>
        <input name="value" type=${this.inputType} value=${value} />
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
    get steps() {
        return this.__steps;
    }
    set steps(value) {
        const oldValue = this.__steps;
        this.__steps = value;
        this.requestUpdate('steps', oldValue);
    }
    // Steps with change events - internal use only
    get _steps() {
        return this.steps;
    }
    set _steps(value) {
        this.steps = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
    }
    /**
     * Value setter/getter
     * This will parse the value as JSON and set the steps
     * This is the same API as input elements
     */
    get value() {
        return JSON.stringify(this.steps);
    }
    set value(newValue) {
        if (newValue) {
            this.steps = JSON.parse(newValue);
        }
        else {
            this.steps = [];
        }
        this.dispatchEvent(new Event('change'));
    }
    set form(newForm) {
        if (this._form) {
            this._form.removeEventListener('formdata', this.onFormdata);
        }
        if (newForm) {
            newForm.addEventListener('formdata', this.onFormdata);
        }
    }
    get form() {
        return this._form;
    }
    /**
     * Render the component
     */
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
        ` : html ``}
      </header>
      <!-- fixed value -->
      ${this.fixed ? html `
        <div part="property-container" class="property-container">
          <input
            part="property-input" class="property-input"
            placeholder=${this.fixedPlaceholder}
            type=${this.inputType}
            value=${((_a = this._steps[0]) === null || _a === void 0 ? void 0 : _a.options) ? this._steps[0].options['value'] : ''}
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
                @set=${(event) => this.setStepAt(index, completion.find(s => s.id === event.detail.value))}
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
                <div slot="options">${typeof step.optionsForm === 'string' ? unsafeHTML(step.optionsForm) : step.optionsForm}</div>
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
            @set=${(event) => this.setStepAt(this._steps.length, nextSteps.find(step => step.id === event.detail.value))}
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
          ${steps.map(step => html `<li class=${classMap({ 'values-li': true, active: step.id === (currentStep === null || currentStep === void 0 ? void 0 : currentStep.id) })} value=${step.id}>
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
            .map(step => html `<li class=${classMap({ 'values-li': true, active: step.id === (currentStep === null || currentStep === void 0 ? void 0 : currentStep.id) })} value=${step.id}>
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
        // Use the form to add formdata
        if (this.for) {
            const form = document.querySelector(`form#${this.for}`);
            if (form) {
                this.form = form;
            }
        }
        else {
            this.form = this.closest('form');
        }
        // Notify the parent app
        this.dispatchEvent(new Event('load'));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.form = null;
    }
    isFixedValue() {
        return this.allowFixed && this.fixed && (this._steps.length === 0 || this._steps[0].type === 'fixed');
    }
    fixedValueChanged(value) {
        if (value && value !== '') {
            this._steps = [
                this.getFixedValueStep(value),
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
StepsSelector.styles = stepsSelectorStyles;
__decorate([
    property({ type: Array })
], StepsSelector.prototype, "__steps", void 0);
__decorate([
    property({ type: Function })
], StepsSelector.prototype, "completion", void 0);
__decorate([
    property({ type: Boolean, attribute: 'allow-fixed' })
], StepsSelector.prototype, "allowFixed", void 0);
__decorate([
    property({ type: String, attribute: 'input-type' })
], StepsSelector.prototype, "inputType", void 0);
__decorate([
    property({ type: Boolean, attribute: 'fixed', reflect: true })
], StepsSelector.prototype, "fixed", void 0);
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
__decorate([
    property({ type: String, attribute: 'for' })
], StepsSelector.prototype, "for", void 0);
__decorate([
    property({ type: String })
], StepsSelector.prototype, "name", void 0);
__decorate([
    property({ type: String, attribute: 'value' })
], StepsSelector.prototype, "value", null);
StepsSelector = __decorate([
    customElement('steps-selector')
], StepsSelector);
export { StepsSelector };
//# sourceMappingURL=steps-selector.js.map