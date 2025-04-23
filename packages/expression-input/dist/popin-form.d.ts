import { PopinOverlay } from './popin-overlay.js';
/**
 * This component extends the `<popin-overlay>` component and the native `<form>` tag
 * It handles form submissions both as an input for the parent form and with it's children inputs
 *
 * Usage:
 *
 * ```
 * <popin-form hidden style="width: 400px" no-auto-close>
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-form>
 * ```
 *
 * @element popin-form
 * @htmltag popin-form
 * @htmlslot header - The header of the dialog
 * @htmlslot default - The body of the dialog
 * @htmlslot footer - The footer of the dialog
 * @cssprop {Color} --popin-form-header-background - The background color of the header
 * @cssprop {Color} --popin-form-body-background - The background color of the body
 * @cssprop {Color} --popin-form-footer-background - The background color of the footer
 * @cssprop {Color} --popin-form-header-color - The text color of the header
 * @cssprop {Color} --popin-form-body-color - The text color of the body
 * @cssprop {Color} --popin-form-footer-color - The text color of the footer
 * @cssprop {Border} --popin-form-header-border-bottom - The border of the header
 * @cssprop {Border} --popin-form-footer-border-top - The border of the footer
 * @cssprop {Padding} --popin-form-header-padding - The padding of the header
 * @cssprop {Padding} --popin-form-body-padding - The padding of the body
 * @cssprop {Padding} --popin-form-footer-padding - The padding of the footer
 * @cssprop {Color} --popin-button-background - The background color of the button
 * @cssprop {Color} --popin-button-color - The text color of the button
 * @cssprop {Color} --popin-button-hover-background - The background color of the button when hovered
 * @cssprop {Color} --popin-button-hover-color - The text color of the button when hovered
 * @cssprop {Border} --popin-button-border - The border of the button
 * @cssprop {Border} --popin-button-hover-border - The border of the button when hovered
 * @cssprop {Padding} --popin-button-padding - The padding of the button
 * @cssprop {Padding} --popin-button-hover-padding - The padding of the button when hovered
 * @cssprop {Margin} --popin-button-margin - The margin of the button
 * @cssprop {Margin} --popin-button-hover-margin - The margin of the button when hovered
 * @cssprop {BorderRadius} --popin-form-border-radius - The border radius of the dialog
 * @cssprop {Color} --popin-button-background--secondary - The background color of the secondary button
 * @cssprop {Color} --popin-button-color--secondary - The text color of the secondary button
 * @cssprop {Color} --popin-button-hover-background--secondary - The background color of the secondary button when hovered
 * @cssprop {Color} --popin-button-hover-color--secondary - The text color of the secondary button when hovered
 * @cssprop {Border} --popin-button-border--secondary - The border of the secondary button
 * @cssprop {Border} --popin-button-hover-border--secondary - The border of the secondary button when hovered
 * @cssprop {Padding} --popin-button-padding--secondary - The padding of the secondary button
 * @cssprop {Padding} --popin-button-hover-padding--secondary - The padding of the secondary button when hovered
 * @cssprop {Margin} --popin-button-margin--secondary - The margin of the secondary button
 * @cssprop {Margin} --popin-button-hover-margin--secondary - The margin of the secondary button when hovered
 *
 */
export declare class PopinForm extends PopinOverlay {
    /**
     * Form id
     * This is the same API as input elements
     */
    for: string;
    name: string;
    private formData;
    private onFormdata_;
    private slotChanged_;
    /**
     * Form setter
     * Handle formdata event to add the current value to the form
     */
    protected _form: HTMLFormElement | null;
    set form(newForm: HTMLFormElement | null);
    get form(): HTMLFormElement | null;
    get value(): Record<string, unknown>;
    render(): import("lit").TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * Handle slot change to update the form
     */
    private inputs;
    private slotChanged;
    /**
     * Handle formdata event to add the current value to the form
     */
    private onFormdata;
    private updateFormData;
    private submit;
    private change;
}
declare global {
    interface HTMLElementTagNameMap {
        'popin-form': PopinForm;
    }
}
//# sourceMappingURL=popin-form.d.ts.map