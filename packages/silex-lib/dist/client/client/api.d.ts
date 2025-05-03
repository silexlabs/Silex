import { ConnectorId, JobId, PublicationJobData, WebsiteId, ConnectorData, ConnectorType, WebsiteData, ClientSideFile, PublicationData, ConnectorUser, WebsiteMeta, WebsiteMetaFileContent, ConnectorOptions } from '../types';
export declare enum ApiRoute {
    PUBLICATION_PUBLISH = "/api/publication/",
    PUBLICATION_STATUS = "/api/publication/publication/status",
    CONNECTOR_USER = "/api/connector/user",
    CONNECTOR_LOGOUT = "/api/connector/logout",
    CONNECTOR_LIST = "/api/connector/",
    WEBSITE_READ = "/api/website/",
    WEBSITE_WRITE = "/api/website/",
    WEBSITE_DELETE = "/api/website/",
    WEBSITE_DUPLICATE = "/api/website/duplicate",
    WEBSITE_CREATE = "/api/website/",
    WEBSITE_LIST = "/api/website/",
    WEBSITE_ASSETS_READ = "/api/website/assets",
    WEBSITE_ASSETS_WRITE = "/api/website/assets",
    WEBSITE_META_READ = "/api/website/meta",
    WEBSITE_META_WRITE = "/api/website/meta"
}
export declare function setServerUrl(url: string): void;
export declare function getServerUrl(): string;
export declare function getUser({ type, connectorId }: {
    type: ConnectorType;
    connectorId?: ConnectorId;
}): Promise<ConnectorUser>;
export declare function logout({ type, connectorId }: {
    type: ConnectorType;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function publish({ websiteId, hostingId, storageId, data, options }: {
    websiteId: WebsiteId;
    hostingId: ConnectorId;
    storageId: ConnectorId;
    data: PublicationData;
    options: ConnectorOptions;
}): Promise<[url: string, job: PublicationJobData]>;
export declare function publicationStatus({ jobId }: {
    jobId: JobId;
}): Promise<PublicationJobData>;
export declare function connectorList({ type }: {
    type: ConnectorType;
}): Promise<ConnectorData[]>;
export declare function websiteList({ connectorId }: {
    connectorId?: ConnectorId;
}): Promise<WebsiteMeta[]>;
export declare function websiteLoad({ websiteId, connectorId }: {
    websiteId: WebsiteId;
    connectorId?: ConnectorId;
}): Promise<WebsiteData>;
export declare function websiteSave({ websiteId, data, connectorId }: {
    websiteId: WebsiteId;
    data: WebsiteData;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function websiteDelete({ websiteId, connectorId }: {
    websiteId: WebsiteId;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function websiteDuplicate({ websiteId, connectorId }: {
    websiteId: WebsiteId;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function websiteCreate({ websiteId, data, connectorId }: {
    websiteId: WebsiteId;
    data: WebsiteMetaFileContent;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function websiteMetaWrite({ websiteId, data, connectorId }: {
    websiteId: WebsiteId;
    data: WebsiteMetaFileContent;
    connectorId?: ConnectorId;
}): Promise<void>;
export declare function websiteMetaRead({ websiteId, connectorId }: {
    websiteId: WebsiteId;
    connectorId?: ConnectorId;
}): Promise<WebsiteMeta>;
export declare function websiteAssetsLoad({ path, websiteId, connectorId }: {
    path: string;
    websiteId: WebsiteId;
    connectorId: ConnectorId;
}): Promise<string>;
/**
 * Not used directly, grapesjs handles the upload
 * @see assetManager in src/ts/client/grapesjs/index.ts
 */
export declare function websiteAssetsSave({ websiteId, connectorId, files }: {
    websiteId: WebsiteId;
    connectorId: ConnectorId;
    files: ClientSideFile[];
}): Promise<string[]>;
export declare function api<ReqQuery, ReqBody, ResBody>(route: ApiRoute | string, method: string, query?: ReqQuery, payload?: ReqBody): Promise<ResBody>;
