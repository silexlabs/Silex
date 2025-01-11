import { ConnectorData, PublicationData, PublicationJobData, PublicationSettings, WebsiteFile, WebsiteId, WebsiteSettings } from '../../types';
import { Editor } from 'grapesjs';
import { PublicationUi } from './PublicationUi';
/**
 * @fileoverview Publication manager for Silex
 * This plugin adds a publication feature to Silex
 * It lets the user publish the website to a hosting service
 * It can optionally display a button and a dialog
 * Useful commands:
 * - publish: starts the publication process and optionally open the dialog
 * - publish-login: open the login dialog
 * - publish-logout: logout from the hosting service and let the user choose a hosting service again
 */
export declare const cmdPublicationStart = "publish";
export declare const cmdPublicationLogin = "publish-login";
export declare const cmdPublicationLogout = "publish-logout";
export type PublishableEditor = Editor & {
    PublicationManager: PublicationManager;
};
export declare enum PublicationStatus {
    STATUS_NONE = "STATUS_NONE",
    STATUS_PENDING = "STATUS_PENDING",
    STATUS_ERROR = "STATUS_ERROR",
    STATUS_SUCCESS = "STATUS_SUCCESS",
    STATUS_LOGGED_OUT = "STATUS_AUTH_ERROR"
}
export type PublicationManagerOptions = {
    appendTo?: string;
    websiteId: WebsiteId;
};
export default function publishPlugin(editor: any, opts: any): void;
export declare class PublicationManager {
    private editor;
    /**
     * Publication dialog
     * This class is responsible for the  UI
     */
    dialog?: PublicationUi;
    /**
     * Publication settings
     * This is the data which is stored in the website settings
     */
    _settings: PublicationSettings;
    get settings(): PublicationSettings;
    set settings(newSettings: PublicationSettings);
    /**
     * Plugin options
     * This is the data which is passed to the plugin by grapesjs
     */
    options: PublicationManagerOptions;
    /**
     * Publication job during the publication process
     */
    job: PublicationJobData | null;
    /**
     * Publication state
     * This is the state of the publication process
     */
    status: PublicationStatus;
    constructor(editor: PublishableEditor, opts: PublicationManagerOptions);
    goLogin(connector: ConnectorData): Promise<void>;
    goLogout(): Promise<void>;
    getPublicationData(projectData: any, siteSettings: any, preventDefault: () => void): Promise<PublicationData>;
    /**
     * Start the publication process
     * This is the command "publish"
     */
    startPublication(): Promise<void>;
    getHtmlFiles(siteSettings: WebsiteSettings, preventDefault: any): Promise<WebsiteFile[]>;
    trackProgress(): Promise<void>;
    private setPublicationTransformers;
    private resetPublicationTransformers;
}
