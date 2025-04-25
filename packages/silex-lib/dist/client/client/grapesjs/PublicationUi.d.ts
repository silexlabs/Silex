import { TemplateResult } from 'lit-html';
import { PublicationStatus, PublishableEditor } from './PublicationManager';
import { PublicationJobData, PublicationSettings } from '../../types';
/**
 * @fileoverview define the publication dialog
 * This is the UI of the publication feature
 * It is a dialog which allows the user to login to a connector and publish the website
 * It also displays the publication status and logs during the publication process
 * This class is used by the PublicationManager
 * This is optional, you can use the PublicationManager without this UI
 * @TODO Use publication events instead of calls from the PublicationManager
 */
export declare const cmdPublish = "publish-open-dialog";
export type PublicationDialogOptions = {
    appendTo: string;
};
/**
 * Class to manage the publication dialog
 */
export declare class PublicationUi {
    private editor;
    private options;
    /**
     * Dialog state
     */
    isOpen: boolean;
    /**
     * Dialog content
     */
    private errorMessage;
    /**
     * Dialog element
     * This is the DOM element of the dialog
     */
    private el;
    settings: PublicationSettings;
    private sender;
    /**
     * Initialize the dialog and the publish button
     */
    constructor(editor: PublishableEditor, options: PublicationDialogOptions);
    isSuccess(status: PublicationStatus): status is PublicationStatus.STATUS_SUCCESS;
    isPending(status: PublicationStatus): status is PublicationStatus.STATUS_PENDING;
    isError(status: PublicationStatus): status is PublicationStatus.STATUS_ERROR;
    isLoggedOut(status: PublicationStatus): status is PublicationStatus.STATUS_LOGGED_OUT;
    isReady(status: PublicationStatus): status is PublicationStatus.STATUS_NONE;
    userContent: TemplateResult | null;
    setUserContent(content: TemplateResult): void;
    createDialogElements(): HTMLElement;
    move(rect: any): void;
    private renderDialog;
    renderOpenDialog(job: PublicationJobData, status: PublicationStatus): Promise<TemplateResult>;
    renderLoginDialog(status: PublicationStatus): Promise<TemplateResult>;
    displayPending(job: PublicationJobData, status: PublicationStatus): void;
    displayError(message: string, job: PublicationJobData, status: PublicationStatus): void;
    closeDialog(): Promise<void>;
    toggleDialog(): Promise<void>;
    openDialog(): Promise<void>;
}
