import { LitElement } from 'lit';
/**
 * @element popin-dialog
 * @fires {CustomEvent} popin-dialog-closed - Fires when the dialog is closed
 * @fires {CustomEvent} popin-dialog-opened - Fires when the dialog is opened
 * @cssprop {Color} --popin-dialog-background - The background color of the dialog
 * @cssprop {Color} --popin-dialog-header-background - The background color of the header
 * @cssprop {Color} --popin-dialog-body-background - The background color of the body
 * @cssprop {Color} --popin-dialog-footer-background - The background color of the footer
 * @cssprop {Color} --popin-dialog-header-color - The text color of the header
 * @cssprop {Color} --popin-dialog-body-color - The text color of the body
 * @cssprop {Color} --popin-dialog-footer-color - The text color of the footer
 * @cssprop {Border} --popin-dialog-header-border-bottom - The border of the header
 * @cssprop {Border} --popin-dialog-footer-border-top - The border of the footer
 * @cssprop {Padding} --popin-dialog-header-padding - The padding of the header
 * @cssprop {Padding} --popin-dialog-body-padding - The padding of the body
 * @cssprop {Padding} --popin-dialog-footer-padding - The padding of the footer
 *
 * This PopinDialog component is a simple dialog that can be used to display any html on top of your UI
 * It is not a modal, it is not blocking the UI, it is just a simple dialog that will catch focus and hide when the user press escape or click outside of it
 * The dialog will be automatically positioned where placed in the DOM but it will be moved and resized to be fully visible on all screen sizes
 * Usage:
 * ```
 * <popin-dialog hidden style="width: 400px">
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-dialog>
 * ```
 */
export declare class PopinDialog extends LitElement {
    static styles: import("lit").CSSResult;
    hidden: boolean;
    constructor();
    render(): import("lit").TemplateResult<1>;
    private ensureElementInView_;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private blured;
    private keydown;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    private ensureElementInView;
}
declare global {
    interface HTMLElementTagNameMap {
        'popin-dialog': PopinDialog;
    }
}
//# sourceMappingURL=popin-dialog.d.ts.map