import { LitElement, TemplateResult } from 'lit';
import './steps-selector-item.js';
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
export type StepId = string;
export interface Step {
    name: string;
    id: StepId;
    icon: string;
    type: string;
    tags?: string[];
    helpText?: string;
    errorText?: string;
    options?: any;
    optionsForm?: TemplateResult | string | null;
    meta?: any;
    category?: string;
}
export type FixedType = 'text' | 'date' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url';
export declare class StepsSelector extends LitElement {
    static styles: import("lit").CSSResult;
    getFixedValueStep(value: string): Step;
    get dirty(): boolean;
    protected __steps: Step[];
    get steps(): Step[];
    set steps(value: Step[]);
    protected get _steps(): Step[];
    protected set _steps(value: Step[]);
    protected initialValue: Step[];
    completion: (steps: Step[]) => Step[];
    allowFixed: boolean;
    inputType: FixedType;
    fixed: boolean;
    placeholder: string;
    fixedPlaceholder: string;
    maxSteps: number | undefined;
    groupByCategory: boolean;
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
    /**
     * Value setter/getter
     * This will parse the value as JSON and set the steps
     * This is the same API as input elements
     */
    get value(): string;
    set value(newValue: string);
    /**
     * Form setter
     * Handle formdata event to add the current value to the form
     */
    protected _form: HTMLFormElement | null;
    set form(newForm: HTMLFormElement | null);
    get form(): HTMLFormElement | null;
    /**
     * Handle formdata event to add the current value to the form
     */
    protected onFormdata: (event: FormDataEvent) => void;
    /**
     * Render the component
     */
    render(): TemplateResult<1>;
    group(completion: Step[]): Map<string, Step[]>;
    renderValues(completion: Step[], completionMap: Map<string, Step[]>, currentStep?: Step): TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    isFixedValue(): boolean;
    fixedValueChanged(value: string): void;
    /**
     * Set the step at the given index
     */
    setStepAt(at: number, step: Step | undefined): void;
    setOptionsAt(at: number, options: unknown, optionsForm: TemplateResult): void;
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