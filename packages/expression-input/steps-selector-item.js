var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { customElement, property } from 'lit/decorators.js';
import './popin-dialog';
/**
 * @element steps-selector-item
 * This class is a step in the selection of the steps-selector component
 *
 * It has these events:
 * - set
 * - delete
 * - edit-options
 * - edit-value
 *
 * These actions can be done by clicking on buttons in the UI:
 * - open popin with list of choices to select from
 * - open popin with form to edit the options
 * - delete the step
 *
 * It displays these texts:
 * - icon
 * - name
 * - tags
 * - type
 * - help text
 * - error or warning text
 *
 * Usage:
 * ```
 * <steps-selector-item>
 *   <div slot="icon"><svg>...</svg></div>
 *   <div slot="name">My step</div>
 *   <ul slot="tags">
 *     <li>tag1</li>
 *     <li>tag2</li>
 *   </ul>
 *   <div slot="type">string</div>
 *   <div slot="helpText"><p>Some help text</p></div>
 *   <div slot="errorText"><p>Some error text</p></div>
 * </steps-selector-item>
 * ```
 */
let StepsSelectorItem = class StepsSelectorItem extends LitElement {
    constructor() {
        super();
        this._selectedItem = "";
        this.helpTextPopin = createRef();
        this.valuesPopin = createRef();
        this.optionsPopin = createRef();
    }
    get selectedItem() {
        return this._selectedItem;
    }
    set selectedItem(value) {
        this._selectedItem = value;
        this.dispatchEvent(new CustomEvent('set'));
    }
    get selectedIndex() {
        return this.selectedItem ? this.values.indexOf(this.selectedItem) : -1;
    }
    set selectedIndex(index) {
        this.selectedItem = this.values[index];
    }
    get values() {
        const list = this.querySelector('[name="values"]');
        return Array.from(list.querySelectorAll('li')).map(li => { var _a; return (_a = li.getAttribute('value')) !== null && _a !== void 0 ? _a : ''; });
    }
    render() {
        return html `
      <div class="value" @click=${() => this.editValue()}>
        <slot name="icon"></slot>
        <slot name="name"></slot>
        <popin-dialog hidden ${ref(this.valuesPopin)} @click=${(e) => this.selectValue(e)}>
          <slot name="values"></slot>
        </popin-dialog>
      </div>
      <div class="meta">
        <slot name="tags"></slot>
        <slot name="type"></slot>
      </div>
      <slot name="helpTitle" @click=${() => this.showHelpText()}>?</slot>
      <popin-dialog hidden ${ref(this.helpTextPopin)}>
        <slot name="helpText"></slot>
      </popin-dialog>
      <slot name="errorText"></slot>
      <div class="buttons">
        <button @click=${() => this.editOptions()}>
          <slot name="edit-options-button">
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
          </slot>
        </button>
        <popin-dialog hidden ${ref(this.optionsPopin)} @submit=${(e) => this.selectOptions(e)}>
          <slot name="options"></slot>
        </popin-dialog>
        <button @click=${() => this.delete()}>
          <slot name="delete-button">
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M576 128c0-35.3-28.7-64-64-64H205.3c-17 0-33.3 6.7-45.3 18.7L9.4 233.4c-6 6-9.4 14.1-9.4 22.6s3.4 16.6 9.4 22.6L160 429.3c12 12 28.3 18.7 45.3 18.7H512c35.3 0 64-28.7 64-64V128zM271 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>
          </slot>
        </button>
      </div>
    `;
    }
    connectedCallback() {
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    attributeChangedCallback(name, _old, value) {
        super.attributeChangedCallback(name, _old, value);
    }
    editOptions() {
        var _a;
        console.log("editOptions");
        this.dispatchEvent(new CustomEvent('edit-options'));
        (_a = this.optionsPopin.value) === null || _a === void 0 ? void 0 : _a.toggleAttribute('hidden');
    }
    editValue() {
        var _a;
        console.log("editValue");
        this.dispatchEvent(new CustomEvent('edit-value'));
        (_a = this.valuesPopin.value) === null || _a === void 0 ? void 0 : _a.toggleAttribute('hidden');
    }
    showHelpText() {
        var _a;
        console.log("showHelpText", this.helpTextPopin.value);
        (_a = this.helpTextPopin.value) === null || _a === void 0 ? void 0 : _a.toggleAttribute('hidden');
    }
    delete() {
        console.log("delete");
        this.dispatchEvent(new CustomEvent('delete'));
    }
    selectValue(e) {
        var _a;
        if (e.target instanceof HTMLElement) {
            const li = e.target.closest('li');
            if (li) {
                this.selectedItem = (_a = li.getAttribute('value')) !== null && _a !== void 0 ? _a : '';
            }
        }
    }
    selectOptions(e) {
        var _a;
        (_a = this.optionsPopin.value) === null || _a === void 0 ? void 0 : _a.setAttribute('hidden', '');
        this.dispatchEvent(new CustomEvent('set-options'));
        e.preventDefault();
    }
};
StepsSelectorItem.styles = css `
    :host {
      display: inline-flex;
      border: solid 1px gray;
      max-width: 100%;
      flex-direction: column;
    }
    [name="icon"]::slotted(*), [name="name"]::slotted(*) {
      padding: 0;
    }
    [name="tags"]::slotted(ul), [name="values"]::slotted(ul) {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
  `;
__decorate([
    property()
], StepsSelectorItem.prototype, "selectedItem", null);
__decorate([
    property()
], StepsSelectorItem.prototype, "selectedIndex", null);
StepsSelectorItem = __decorate([
    customElement('steps-selector-item')
], StepsSelectorItem);
export { StepsSelectorItem };
//# sourceMappingURL=steps-selector-item.js.map