import { Readable } from 'stream';
import { ServerConfig } from '../config';
import { JobStatus, JobData, ConnectorData, ConnectorId, WebsiteId, ConnectorType, ConnectorUser, WebsiteMeta, WebsiteMetaFileContent, WebsiteData, ConnectorOptions } from '../../types';
import { JobManager } from '../jobs';
/**
 * @fileoverview define types for Silex connectors
 * Bakends can provide storage for website data and assets, and/or hosting to publish the website online
 */
/**
 * Connector data stored in the website meta file
 */
export type ConnectorFileContent = string | Buffer | Readable;
/**
 * Files are stored in connector as a File object
 * @see types/ClientSideFile
 * @see contentToString()
 */
export interface ConnectorFile {
    path: string;
    content: ConnectorFileContent;
}
/**
 * Callback to update the publication status
 */
export type StatusCallback = ({ message, status }: {
    message: string;
    status: JobStatus;
}) => Promise<void>;
export type ConnectorSession = object;
/**
 * Connectors are the base interface for Storage and Hosting connectors
 */
export interface Connector<Session extends ConnectorSession = ConnectorSession> {
    connectorId: ConnectorId;
    connectorType: ConnectorType;
    displayName: string;
    icon: string;
    disableLogout?: boolean;
    color: string;
    background: string;
    getOAuthUrl(session: Session): Promise<string | null>;
    getLoginForm(session: Session, redirectTo: string): Promise<string | null>;
    getSettingsForm(session: Session, redirectTo: string): Promise<string | null>;
    isLoggedIn(session: Session): Promise<boolean>;
    setToken(session: Session, token: object): Promise<void>;
    logout(session: Session): Promise<void>;
    getUser(session: Session): Promise<ConnectorUser | null>;
    getOptions(formData: object): ConnectorOptions;
}
/**
 * Storage are used to store the website data and assets
 * And possibly rename files and directories, and get the URL of a file
 *
 */
export interface StorageConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
    listWebsites(session: Session): Promise<WebsiteMeta[]>;
    readWebsite(session: Session, websiteId: WebsiteId): Promise<WebsiteData | Readable>;
    createWebsite(session: Session, data: WebsiteMetaFileContent): Promise<WebsiteId>;
    updateWebsite(session: Session, websiteId: WebsiteId, data: WebsiteData): Promise<void>;
    deleteWebsite(session: Session, websiteId: WebsiteId): Promise<void>;
    duplicateWebsite(session: Session, websiteId: WebsiteId): Promise<void>;
    writeAssets(session: Session, websiteId: WebsiteId, files: ConnectorFile[], status?: StatusCallback): Promise<string[] | void>;
    readAsset(session: Session, websiteId: WebsiteId, fileName: string): Promise<ConnectorFileContent>;
    deleteAssets(session: Session, websiteId: WebsiteId, fileNames: string[]): Promise<void>;
    getWebsiteMeta(session: Session, websiteId: WebsiteId): Promise<WebsiteMeta>;
    setWebsiteMeta(session: Session, websiteId: WebsiteId, data: WebsiteMetaFileContent): Promise<void>;
}
/**
 * Hosting connectors are used to publish the website
 */
export interface HostingConnector<Session extends ConnectorSession = ConnectorSession> extends Connector<Session> {
    publish(session: Session, websiteId: WebsiteId, files: ConnectorFile[], jobManager: JobManager): Promise<JobData>;
    getUrl(session: Session, websiteId: WebsiteId): Promise<string>;
}
export declare function toConnectorEnum(type: string | ConnectorType): ConnectorType;
/**
 * Get a connector by id or by type
 */
export declare function getConnector<T extends Connector>(config: ServerConfig, session: any, type: ConnectorType, connectorId?: ConnectorId): Promise<T | undefined>;
/**
 * Convert a connector to a ConnectorData object to be sent to the frontend
 */
export declare function toConnectorData(session: any, connector: Connector): Promise<ConnectorData>;
export declare function contentToString(content: ConnectorFileContent): Promise<string>;
export declare function contentToBuffer(content: ConnectorFileContent): Promise<Buffer>;
export declare function contentToReadable(content: ConnectorFileContent): Readable;
