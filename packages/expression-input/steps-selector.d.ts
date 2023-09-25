import { LitElement } from 'lit';
import './steps-selector-item';
/**
 * @element steps-selector
 * Web component to select a sequence of steps
 *
 * It has these events:
 * - load
 * - change
 *
 * It has these properties:
 * - steps
 * - dirty
 *
 * It has these slots:
 * - placeholder
 * - dirty-icon
 *
 * User actions:
 * - add a next step at the end of the selection
 * - reset to default value
 * - copy value to clipboard
 * - paste value from clipboard
 */
export interface Step {
    name: string;
    icon: string;
    type: string;
    tags?: string[];
    helpText?: string;
    errorText?: string;
    options?: any;
    optionsForm?: string;
}
export declare class StepsSelector extends LitElement {
    static styles: import("lit").CSSResult;
    get dirty(): boolean;
    protected _steps: Step[];
    get steps(): Step[];
    set steps(value: Step[]);
    protected initialValue: Step[];
    completion: (steps: Step[]) => Step[];
    allowFixed: boolean;
    fixed: boolean;
    fixedType: 'text' | 'date' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url';
    render(): import("lit").TemplateResult<1>;
    connectedCallback(): void;
    isFixedValue(): boolean;
    fixedValueChanged(value: string): void;
    /**
     * Set the step at the given index
     */
    setStepAt(at: number, step: Step | undefined): void;
    setOptionsAt(at: number, options: unknown): void;
    /**
     * Delete the step at the given index and all the following steps
     */
    deleteStepAt(at: number): void;
    /**
     * Reset dirty flag and store the current value as initial value
     */
    save(): void;
    /**
     * Reset dirty flag and restore the initial value
     */
    reset(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'steps-selector': StepsSelector;
    }
}
//# sourceMappingURL=steps-selector.d.ts.map