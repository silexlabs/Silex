import { LitElement } from 'lit';
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
    reactive: boolean;
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
    private onChange_;
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
    private onChangeValue;
    private redrawing;
    /**
     * Reset the steps after the given index
     */
    protected changeAt(idx: number, reset?: boolean): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'input-chain': InputChain;
    }
}
//# sourceMappingURL=input-chain.d.ts.map