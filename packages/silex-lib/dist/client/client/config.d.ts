import { Config } from '@silexlabs/silex-plugins';
import { ConnectorId, WebsiteId } from '../types';
import { Editor, EditorConfig } from 'grapesjs';
import { PublicationTransformer } from './publication-transformers';
import * as api from './api';
import { SettingsSection } from './grapesjs/settings-sections';
/**
 * @fileoverview Silex client side config
 */
export declare class ClientConfig extends Config {
    api: typeof api;
    /**
     * The website to load
     * This is the id of the website in the storage connector
     */
    websiteId: WebsiteId;
    /**
     * The storage connector to use
     * If not found in the URL and the user is not logged in to any storage, use the first storage
     */
    storageId: ConnectorId;
    /**
     * language for I18n module
     */
    lang: string;
    /**
     * root url of Silex app
     */
    rootUrl: string;
    /**
     * debug mode
     */
    debug: boolean;
    /**
     * Add hash in the file name of CSS at the time of publication
     * If true, CSS files of generated pages will look like `page-name.123456.css`  instead of `page-name.css`
     * This is useful to avoid caching issues
     * @default true
     */
    addHashInCssFileName: boolean;
    /**
     * Replaced elements
     * This is a list of elements which support the object-fit and object-position CSS properties
     * https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element
     * When selected, Silex will show the object-fit and object-position properties in the style panel
     */
    replacedElements: string[];
    /**
     * Grapesjs config
     */
    grapesJsConfig: EditorConfig;
    /**
     * Client config url
     * This is the url of the config file which is a plugin
     */
    clientConfigUrl: string;
    /**
     * Google fonts API key, see this doc to get an API key: https://developers.google.com/fonts/docs/developer_api#APIKey
     * @default Test key for local dev
     */
    fontsApiKey: string;
    /**
     * Google fonts server or a free privacy-friendly drop-in replacement for Google Fonts or a proxy server to speed up the load and protect privacy
     * @see https://github.com/coollabsio/fonts
     * @see https://fontlay.com/
     * @default Google Fonts
     */
    fontsServerUrl: string;
    fontsApiUrl: string;
    /**
     * Init GrapesJS config which depend on the config file properties
     */
    initGrapesConfig(): void;
    /**
     * Get grapesjs editor
     */
    getEditor(): Editor;
    /**
     * Publication transformers let plugins change files before they are published
     */
    publicationTransformers: Array<PublicationTransformer>;
    /**
     * Reset publication transformers
     */
    resetPublicationTransformers(): void;
    /**
     * Add a publication transformer(s)
     */
    addPublicationTransformers(transformers: PublicationTransformer | PublicationTransformer[]): void;
    /**
     * Add a section to the settings dialog
     */
    addSettings(section: SettingsSection, siteOrPage: 'site' | 'page', position?: 'first' | 'last' | number): void;
    /**
     * Remove a section from the settings dialog
     */
    removeSettings(id: string, siteOrPage: 'site' | 'page'): void;
    /**
     * Add default plugins
     */
    addDefaultPlugins(): Promise<void>;
}
