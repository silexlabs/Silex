import { Editor } from 'grapesjs';
import { ConnectorId, ConnectorType, ConnectorUser } from '../../types';
import { WebsiteId } from '../../types';
export declare const cmdLogin = "silex:auth:login";
export declare const cmdLogout = "silex:auth:logout";
export declare const eventLoggingIn = "silex:auth:logging-in";
export declare const eventLoggedIn = "silex:auth:logged-in";
export declare const eventLoginFailed = "silex:auth:login-failed";
export declare const eventLoggedOut = "silex:auth:logged-out";
export interface LoginDialogOptions {
    id: WebsiteId;
}
export declare function getCurrentUser(editor: Editor): Promise<ConnectorUser>;
export declare function updateUser(editor: Editor, type: ConnectorType, connectorId?: ConnectorId): Promise<ConnectorUser>;
export default function loginDialogPlugin(editor: any, opts: any): void;
