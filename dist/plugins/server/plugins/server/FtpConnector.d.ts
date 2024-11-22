import { Readable } from 'stream';
import { ConnectorFile, ConnectorFileContent, StatusCallback, StorageConnector } from '../../server/connectors/connectors';
import { ConnectorType, ConnectorUser, WebsiteMeta, JobData, WebsiteId, WebsiteMetaFileContent, WebsiteData, ConnectorOptions } from '../../types';
import { ServerConfig } from '../../server/config';
import { JobManager } from '../../server/jobs';
/**
 * @fileoverview FTP connector for Silex
 * This is a connector for Silex, which allows to store the website on a FTP server
 *   and to publish the website on a FTP server
 * FIXME: As a hosting connector, this connector should only store the password in the session and the rest in the website data
 *   to prevent publishing a site on the wrong server + multiple sites on 1 server
 * FIXME: Allow reuse of FTP session between calls
 */
export interface FtpSessionData {
    host: string;
    user: string;
    pass: string;
    port: number;
    secure: boolean;
    storageRootPath?: string;
    publicationPath?: string;
    websiteUrl?: string;
}
export interface FtpSession {
    [ConnectorType.STORAGE]?: FtpSessionData;
    [ConnectorType.HOSTING]?: FtpSessionData;
}
export interface FtpOptions {
    type: ConnectorType;
    path: string;
    assetsFolder: string;
    cssFolder: string;
    authorizeUrl: string;
    authorizePath: string;
}
/**
 * @class FtpConnector
 * @implements {HostingConnector}
 * @implements {StorageConnector}
 */
export default class FtpConnector implements StorageConnector<FtpSession> {
    connectorId: string;
    displayName: string;
    icon: string;
    options: FtpOptions;
    connectorType: ConnectorType;
    color: string;
    background: string;
    constructor(config: ServerConfig, opts: Partial<FtpOptions>);
    sessionData(session: FtpSession): FtpSessionData;
    rootPath(session: FtpSession): string;
    private write;
    private read;
    private readdir;
    private mkdir;
    private rmdir;
    private unlink;
    private getClient;
    private closeClient;
    getOptions(formData: object): ConnectorOptions;
    getOAuthUrl(session: FtpSession): Promise<null>;
    getLoginForm(session: FtpSession, redirectTo: string): Promise<string | null>;
    getSettingsForm(session: FtpSession, redirectTo: string): Promise<string | null>;
    setToken(session: FtpSession, token: object): Promise<void>;
    logout(session: FtpSession): Promise<void>;
    getUser(session: FtpSession): Promise<ConnectorUser>;
    isLoggedIn(session: FtpSession): Promise<boolean>;
    setWebsiteMeta(session: FtpSession, id: string, data: WebsiteMetaFileContent): Promise<void>;
    getWebsiteMeta(session: FtpSession, id: WebsiteId): Promise<WebsiteMeta>;
    /**
     * Create necessary folders
     * Assets and root folders
     */
    createWebsite(session: FtpSession): Promise<WebsiteId>;
    listWebsites(session: FtpSession): Promise<WebsiteMeta[]>;
    readWebsite(session: FtpSession, websiteId: string): Promise<WebsiteData | Readable>;
    updateWebsite(session: FtpSession, websiteId: string, data: WebsiteData): Promise<void>;
    deleteWebsite(session: FtpSession, websiteId: string): Promise<void>;
    duplicateWebsite(session: FtpSession, websiteId: string): Promise<void>;
    writeAssets(session: any, id: WebsiteId, files: ConnectorFile[], statusCbk?: StatusCallback): Promise<void>;
    writeFile(session: any, id: WebsiteId, files: ConnectorFile[], relativePath: string, statusCbk?: StatusCallback): Promise<void>;
    readAsset(session: FtpSession, id: string, path: string): Promise<ConnectorFileContent>;
    deleteAssets(session: FtpSession, id: WebsiteId, paths: string[]): Promise<void>;
    getUrl(session: FtpSession, id: WebsiteId): Promise<string>;
    publish(session: FtpSession, id: WebsiteId, files: ConnectorFile[], { startJob, jobSuccess, jobError }: JobManager): Promise<JobData>;
}
