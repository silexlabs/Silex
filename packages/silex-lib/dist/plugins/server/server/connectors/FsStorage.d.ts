import { ConnectorFile, StorageConnector, StatusCallback, ConnectorSession, ConnectorFileContent } from './connectors';
import { ConnectorUser, WebsiteMeta, WebsiteId, ConnectorType, WebsiteMetaFileContent, WebsiteData, ConnectorOptions } from '../../types';
import { ServerConfig } from '../config';
type FsSession = ConnectorSession;
interface FsOptions {
    path: string;
    assetsFolder: string;
}
export declare class FsStorage implements StorageConnector<FsSession> {
    connectorId: string;
    displayName: string;
    icon: string;
    disableLogout: boolean;
    options: FsOptions;
    connectorType: ConnectorType;
    color: string;
    background: string;
    constructor(config: ServerConfig | null, opts: Partial<FsOptions>);
    protected initFs(): Promise<void>;
    private updateStatus;
    private initStatus;
    getOptions(formData: object): ConnectorOptions;
    getOAuthUrl(session: FsSession): Promise<null>;
    getLoginForm(session: FsSession, redirectTo: string): Promise<string | null>;
    getSettingsForm(session: FsSession, redirectTo: string): Promise<string | null>;
    isLoggedIn(session: FsSession): Promise<boolean>;
    setToken(session: FsSession, query: object): Promise<void>;
    logout(session: FsSession): Promise<void>;
    getUser(session: FsSession): Promise<ConnectorUser>;
    setWebsiteMeta(session: any, id: string, data: WebsiteMetaFileContent): Promise<void>;
    getWebsiteMeta(session: FsSession, id: WebsiteId): Promise<WebsiteMeta>;
    createWebsite(session: FsSession, meta: WebsiteMetaFileContent): Promise<WebsiteId>;
    readWebsite(session: FsSession, websiteId: WebsiteId): Promise<WebsiteData>;
    updateWebsite(session: FsSession, websiteId: WebsiteId, data: WebsiteData): Promise<void>;
    deleteWebsite(session: FsSession, websiteId: WebsiteId): Promise<void>;
    duplicateWebsite(session: FsSession, websiteId: WebsiteId): Promise<void>;
    listWebsites(session: any): Promise<WebsiteMeta[]>;
    getAsset(session: FsSession, id: WebsiteId, path: string): Promise<ConnectorFile>;
    writeAssets(session: FsSession, id: WebsiteId, files: ConnectorFile[], statusCbk?: StatusCallback): Promise<void>;
    write(session: FsSession, id: WebsiteId, files: ConnectorFile[], assetsFolder: string, statusCbk?: StatusCallback): Promise<void>;
    deleteAssets(session: FsSession, id: WebsiteId, paths: string[]): Promise<void>;
    readAsset(session: object, websiteId: string, fileName: string): Promise<ConnectorFileContent>;
}
export {};
