/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 */
/**
 * @class default config for Silex server
 */
import { Config, Plugin } from '@silexlabs/silex-plugins';
import { Application } from 'express';
import { HostingConnector, StorageConnector } from './connectors/connectors';
import { Connector } from './connectors/connectors';
import { ConnectorType } from '../types';
/**
 * Config types definitions
 */
export declare class ServerConfig extends Config {
    expressOptions: {
        jsonLimit: string;
        textLimit: string;
        urlencodedLimit: string;
        sessionName: string;
        sessionSecret: string;
        cors: string;
    };
    port: string;
    debug: boolean;
    url: string;
    userConfigPath: Plugin | undefined;
    configFilePath: Plugin;
    getConnectors(type?: ConnectorType | string | null): Connector[];
    private storageConnectors;
    addStorageConnector(storage: StorageConnector | StorageConnector[]): void;
    setStorageConnectors(storageConnectors: StorageConnector[]): void;
    getStorageConnectors(): StorageConnector[];
    private hostingConnectors;
    addHostingConnector(hosting: HostingConnector | HostingConnector[]): void;
    setHostingConnectors(hostings: HostingConnector[]): void;
    getHostingConnectors(): HostingConnector[];
    /**
     * Add routes to serve the client config file
     */
    addRoutes(app: Application): Promise<void>;
    /**
     * Load config files
     * This is the main config file and the user config file
     */
    loadConfigFiles(): Promise<void>;
    /**
     * Load user config file
     * This is the config file passed as env var CONFIG
     */
    loadUserConfig(): Promise<void>;
    /**
     * Load .silex.js in the root folder
     * This is the main config file
     */
    loadSilexConfig(): Promise<void>;
    initDefaultConnectors(): Promise<void>;
}
