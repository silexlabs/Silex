import { LitElement } from 'lit';
/**
 * This PopinOverlay component is a simple dialog that can be used to display any html on top of your UI
 * It is not a modal, it is not blocking the UI, it is just a simple dialog that will catch focus and hide when the user press escape or click outside of it
 * The dialog will be automatically positioned where placed in the DOM but it will be moved and resized to be fully visible on all screen sizes
 *
 * Usage:
 *
 * ```
 * <popin-overlay hidden style="width: 400px" no-auto-close>
 *   <div slot="header">Header</div>
 *   <div slot="body">Body</div>
 *   <div slot="footer">Footer</div>
 * </popin-overlay>
 * ```
 *
 * @element popin-overlay
 * @htmltag popin-overlay
 * @htmlslot The content of the dialog
 * @htmlattr hidden - Hide the dialog
 * @htmlattr no-auto-close - Do not close the dialog when the user click outside of it
 * @fires {CustomEvent} popin-closed - Fires when the dialog is closed
 * @fires {CustomEvent} popin-opened - Fires when the dialog is opened
 * @cssprop {Color} --popin-background - The background color of the dialog
 * @cssprop {Color} --popin-color - The text color of the dialog
 *
 */
export declare class PopinOverlay extends LitElement {
    static styles: import("lit").CSSResult;
    hidden: boolean;
    noAutoClose: boolean;
    private resized_;
    private blured_;
    private keydown_;
    render(): import("lit-html").TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private getActiveElementRecursive;
    private blured;
    protected close(): void;
    private keydown;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    protected ensureElementInView(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'popin-overlay': PopinOverlay;
    }
}
//# sourceMappingURL=popin-overlay.d.ts.map