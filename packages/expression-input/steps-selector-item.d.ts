import { LitElement } from 'lit';
import { Ref } from 'lit/directives/ref.js';
import './popin-dialog.js';
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
export declare class StepsSelectorItem extends LitElement {
    static styles: import("lit").CSSResult;
    private _selectedItem;
    get selectedItem(): string;
    set selectedItem(value: string);
    noOptionsEditor: boolean;
    noDelete: boolean;
    noArrow: boolean;
    noInfo: boolean;
    get values(): string[];
    helpTextPopin: Ref<HTMLElement>;
    helpTextSlot: Ref<HTMLElement>;
    valuesPopin: Ref<HTMLElement>;
    optionsPopin: Ref<HTMLElement>;
    constructor();
    render(): import("lit").TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    editOptions(): void;
    editValue(): void;
    showHelpText(): void;
    delete(): void;
    selectValue(e: MouseEvent): void;
    selectOptions(e: SubmitEvent): void;
    cancelOptions(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'steps-selector-item': StepsSelectorItem;
    }
}
//# sourceMappingURL=steps-selector-item.d.ts.map