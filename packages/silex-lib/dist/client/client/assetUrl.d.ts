import { Asset, ClientSideFileType, ConnectorId, Page, Style, WebsiteId } from '../types';
/**
 * Function to convert a path from it stored version to the displayed version
 * Stored version is like `/assets/image.webp`
 * Grapesjs version is like `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * Exported for unit tests
 */
export declare function storedToDisplayed(path: string, websiteId: WebsiteId, storageId: ConnectorId): string;
/**
 * Function to convert a path from the one we give to grapesjs to the stored version
 * Grapesjs version is like `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * Stored version is like `/assets/image.webp`
 * @param path the path to convert
 * @returns the converted path
 * Exported for unit tests
 */
export declare function displayedToStored(path: string): string;
/**
 * Publication transformer to convert the asset URL during publication
 */
export declare const assetsPublicationTransformer: {
    transformPath(path: string, type: ClientSideFileType): string;
    transformPermalink(path: string, type: ClientSideFileType): string;
};
/**
 * Update asset URL to use the current storage connector and website ID
 * Assets URLs are stored in the project data in the form `/assets/image.webp`
 * This function adds the API path and the connectorId and websiteId like so: `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 */
export declare function addTempDataToAssetUrl(assets: Asset[], websiteId: WebsiteId, storageId: ConnectorId): Asset[];
/**
 * Remove the temporary data from the asset URL
 * Remove the API path and the connectorId and websiteId like so: `/assets/image.webp`
 */
export declare function removeTempDataFromAssetUrl(assets: Asset[]): Asset[];
/**
 * Add temp data to pages
 */
export declare function addTempDataToPages(pages: Page[], websiteId: WebsiteId, storageId: ConnectorId): Page[];
/**
 * Remove temp data from asset URL in the components
 */
export declare function removeTempDataFromPages(pages: Page[]): Page[];
/**
 * Add data to stylesheets
 *   e.g. linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url('/assets/qIg7JPRc.webp'), linear-gradient(#0ca311 0%, #0ca311 100%)
 */
export declare function addTempDataToStyles(styles: Style[], websiteId: WebsiteId, storageId: ConnectorId): Style[];
/**
 * Remove temp data from stylesheets
 * The property `background-image` contains the URLs of the assets and other values,
 *   e.g. `linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url('/api/website/assets/qIg7JPRc.webp?websiteId=default&connectorId=fs-storage'), linear-gradient(#0ca311 0%, #0ca311 100%)`
 */
export declare function removeTempDataFromStyles(styles: Style[]): Style[];
