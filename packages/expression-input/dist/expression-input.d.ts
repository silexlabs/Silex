import { InputChain } from './input-chain.js';
/**
 * @element expression-input
 * Web component to create an expression
 * Extends the InputChain component and adds
 * - [x] fixed value UI
 * - [x] dirty state
 * - [x] placeholder
 * - [x] reset mechanism
 * - [ ] copy/paste hole expressions (using clipboard API)
 *
 * It adds these properties
 * - [x] value and initial value
 * - [ ] dirty
 *
 * It adds these attributes
 * - [x] allowFixed
 * - [x] fixed
 *
 * It has these spots
 *
 * - [x] default: the select elements for the expression
 * - [x] label
 * - [x] dirty-icon
 */
export declare class ExpressionInput extends InputChain {
    /**
     * Read only property dirty
     * @readonly
     */
    get dirty(): boolean;
    /**
     * Value is the concatenation of all options' values
     * @readonly
     */
    get value(): string[];
    /**
     * Initial value to be set to track changes
     */
    allowFixed: boolean;
    private _fixed;
    get fixed(): boolean;
    set fixed(value: boolean);
    placeholder: string;
    connectedCallback(): void;
    /**
     * Render the component
     */
    render(): import("lit").TemplateResult<1>;
    /**
     * Reset dirty flag and restore the initial value
     */
    reset(): void;
    getFixedInput(): HTMLInputElement | null;
}
declare global {
    interface HTMLElementTagNameMap {
        'expression-input': ExpressionInput;
    }
}
//# sourceMappingURL=expression-input.d.ts.map