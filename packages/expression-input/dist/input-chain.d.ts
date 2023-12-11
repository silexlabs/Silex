import { LitElement } from 'lit';
/**
 * @element input-chain
 * Web component to select a sequence of steps, each step being a <select> element.
 *
 * Children are expected to be input or select html elements
 *
 * Features
 * - Nested Select Elements: Allows embedding <select> elements as children.
 * - Dynamic Interaction: Automatically updates subsequent select elements upon a change in any select element, resetting them to a default state.
 * - Event Handling: Emits change events whenever the value of a child select element changes.
 * - Validation Support: Supports form validation attributes like required, minlength, and maxlength.
 * - Combined Options Property: Holds a property with a concatenation of all options from child select elements.
 * - Supports option groups: Allows grouping options in the same select element.
 *
 * It has these events:
 * - [x] change
 *
 * It has these attributes:
 * - [x] name for form submission
 * - [x] for (form id)
 * - [ ] maxlength
 * - [ ] minlength
 *
 * It has these properties:
 * - [x] options: a concatenation of all options from child select elements
 *
 * It has these slots:
 * - [x] default: contains the select elements
 *
 */
export declare class InputChain extends LitElement {
    static styles: import("lit").CSSResult;
    /**
     * Form id
     * This is the same API as input elements
     */
    for: string;
    /**
     * Name of the property
     * This is the same API as input elements
     */
    name: string;
    constructor();
    /**
     * Form setter
     * Handle formdata event to add the current value to the form
     */
    protected _form: HTMLFormElement | null;
    protected set form(newForm: HTMLFormElement | null);
    protected get form(): HTMLFormElement | null;
    /**
     * All selected options
     * @readonly
     */
    get options(): HTMLOptionElement[];
    private onChanged_;
    /**
     * Handle formdata event to add the current value to the form
     */
    protected onFormdata: (event: FormDataEvent) => void;
    /**
     * Render the component
     */
    render(): import("lit").TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * The data changed
     * Reset the steps after the change
     */
    private onChanged;
    /**
     * Reset the steps after the given index
     */
    protected changeAt(idx: number): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'input-chain': InputChain;
    }
}
//# sourceMappingURL=input-chain.d.ts.map