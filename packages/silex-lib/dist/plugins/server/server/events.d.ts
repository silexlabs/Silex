import { ConnectorId, PublicationData, WebsiteData, WebsiteId } from '../types';
import { ConnectorFile } from './connectors/connectors';
export declare enum ServerEvent {
    STARTUP_START = "startup-start",
    STARTUP_END = "startup-end",
    PUBLISH_START = "publish-start",
    PUBLISH_END = "publish-end",
    WEBSITE_STORE_START = "store-start",
    WEBSITE_STORE_END = "store-end",
    WEBSITE_ASSET_STORE_START = "asset-store-start",
    WEBSITE_ASSET_STORE_END = "asset-store-end"
}
export type PublishStartEventType = PublicationData;
export type PublishEndEventType = Error | null;
export type WebsiteStoreStartEventType = {
    websiteId: WebsiteId;
    websiteData: WebsiteData;
    connectorId: ConnectorId;
};
export type WebsiteStoreEndEventType = Error | null;
export type WebsiteAssetStoreStartEventType = {
    files: ConnectorFile[];
    websiteId: WebsiteId;
    connectorId: ConnectorId;
};
export type WebsiteAssetStoreEndEventType = Error | null;
