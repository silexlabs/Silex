"use strict";
/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerConfig = void 0;
/**
 * @fileoverview This is where the default config is defined. Also use this object as an event emitter to listen to Silex events
 * The values can be overriden with env vars or before passing the config to Silex
 */
/**
 * @class default config for Silex server
 */
const silex_plugins_1 = require("@silexlabs/silex-plugins");
const path_1 = require("path");
const constants_1 = require("../constants");
const promises_1 = require("fs/promises");
const connectors_1 = require("./connectors/connectors");
const FsStorage_1 = require("./connectors/FsStorage");
const types_1 = require("../types");
const FsHosting_1 = require("./connectors/FsHosting");
/**
 * Config types definitions
 */
class ServerConfig extends silex_plugins_1.Config {
    expressOptions = {
        jsonLimit: process.env.SILEX_EXPRESS_JSON_LIMIT,
        textLimit: process.env.SILEX_EXPRESS_TEXT_LIMIT,
        urlencodedLimit: process.env.SILEX_EXPRESS_URLENCODED_LIMIT,
        sessionName: process.env.SILEX_SESSION_NAME,
        sessionSecret: process.env.SILEX_SESSION_SECRET,
        cors: process.env.SILEX_CORS_URL,
    };
    port = process.env.SILEX_PORT;
    debug = process.env.SILEX_DEBUG === 'true';
    url = process.env.SILEX_URL?.replace(/\/$/, '') ?? `${process.env.SILEX_PROTOCOL}://${process.env.SILEX_HOST}:${process.env.SILEX_PORT}`;
    userConfigPath = process.env.SILEX_SERVER_CONFIG;
    configFilePath = (0, path_1.resolve)(__dirname, '../../../.silex.js');
    // All connectors or just the storage or hosting connectors
    getConnectors(type = null) {
        // All connectors including storage and hosting connectors
        if (!type) {
            // Concat storage and hosting connectors
            const allConnectors = this.getStorageConnectors().concat(this.getHostingConnectors());
            // Remove duplicates (if a connector is both a storage and a hosting connector)
            return [...new Set(allConnectors)];
        }
        // Convert to enum in case it is a string
        const connectorType = (0, connectors_1.toConnectorEnum)(type.toString());
        // Only one type of connector
        switch (connectorType) {
            case types_1.ConnectorType.HOSTING: return this.getHostingConnectors();
            case types_1.ConnectorType.STORAGE: return this.getStorageConnectors();
            default: throw new Error(`Unknown connector type ${type}`);
        }
    }
    // Storage connectors to store the website data and assets
    storageConnectors = [];
    addStorageConnector(storage) {
        this.setStorageConnectors(this.storageConnectors.concat(storage));
    }
    setStorageConnectors(storageConnectors) {
        this.storageConnectors = storageConnectors;
    }
    getStorageConnectors() {
        return this.storageConnectors;
    }
    // Hosting connectors to publish the website online
    hostingConnectors = [];
    addHostingConnector(hosting) {
        this.setHostingConnectors(this.hostingConnectors.concat(hosting));
    }
    setHostingConnectors(hostings) {
        this.hostingConnectors = hostings;
    }
    getHostingConnectors() { return this.hostingConnectors; }
    /**
     * Add routes to serve the client config file
     */
    async addRoutes(app) {
        const path = process.env.SILEX_CLIENT_CONFIG;
        if (path) {
            console.info(`> Serving client side config ${path} at ${constants_1.CLIENT_CONFIG_FILE_NAME}`);
            try {
                // Load the client config file
                let clientConfig = (await (0, promises_1.readFile)(path)).toString();
                // Serve the config file
                app.get(`/${constants_1.CLIENT_CONFIG_FILE_NAME}`, async (req, res) => {
                    // Reload each time in debug mode
                    if (this.debug) {
                        console.info('[Debug mode] Reloading config file', path);
                        clientConfig = (await (0, promises_1.readFile)(path)).toString();
                    }
                    // Send the config file
                    res
                        .contentType('application/javascript')
                        .send(clientConfig);
                });
            }
            catch (e) {
                console.error(`Error loading client config file ${path}`, e);
                throw new Error(`Error loading client config file ${path}: ${e.message}`);
            }
        }
    }
    /**
     * Load config files
     * This is the main config file and the user config file
     */
    async loadConfigFiles() {
        // Load the user config file
        await this.loadUserConfig();
        // Load the main config file
        await this.loadSilexConfig();
    }
    /**
     * Load user config file
     * This is the config file passed as env var CONFIG
     */
    async loadUserConfig() {
        if (this.userConfigPath) {
            console.info('> Loading user config', this.userConfigPath);
            try {
                // Initiate the process with the config file which is just another plugin
                await this.addPlugin(this.userConfigPath, {});
            }
            catch (e) {
                throw new Error(`\nUser config file ${this.userConfigPath} error:\n\n\t${e.message}\n\n`);
            }
        }
    }
    /**
     * Load .silex.js in the root folder
     * This is the main config file
     */
    async loadSilexConfig() {
        console.info('> Loading config', this.configFilePath);
        try {
            // Initiate the process with the config file which is just another plugin
            await this.addPlugin(this.configFilePath, {});
        }
        catch (e) {
            // Check if the error is about the config file not found and not another module not found in the config file
            if (e.code === 'MODULE_NOT_FOUND' && (!e.requireStack || !e.requireStack.find(path => path === this.configFilePath))) {
                console.info('> /!\\ Config file not found', this.configFilePath);
            }
            else {
                throw new Error(`Error in config file ${this.configFilePath}: ${e.message}`);
            }
        }
    }
    async initDefaultConnectors() {
        // Add default storage connectors
        if (!this.storageConnectors.length) {
            this.addStorageConnector(new FsStorage_1.FsStorage(null, {
                path: process.env.SILEX_FS_ROOT || (0, path_1.join)(process.cwd(), '/silex/storage'),
            }));
        }
        // Add default hosting connectors
        if (!this.hostingConnectors.length) {
            this.addHostingConnector(new FsHosting_1.FsHosting(null, {
                path: process.env.SILEX_FS_HOSTING_ROOT || (0, path_1.join)(process.cwd(), '/silex/hosting'),
            }));
        }
    }
}
exports.ServerConfig = ServerConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7O0FBRUg7OztHQUdHO0FBRUg7O0dBRUc7QUFFSCw0REFBeUQ7QUFDekQsK0JBQW9DO0FBQ3BDLDRDQUFzRDtBQUV0RCwwQ0FBc0M7QUFDdEMsd0RBQTZGO0FBQzdGLHNEQUFrRDtBQUVsRCxvQ0FBd0M7QUFDeEMsc0RBQWtEO0FBRWxEOztHQUVHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsc0JBQU07SUFDL0IsY0FBYyxHQUFHO1FBQ3RCLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QjtRQUMvQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0I7UUFDL0MsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCO1FBQzNELFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtRQUMzQyxhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7UUFDL0MsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztLQUNqQyxDQUFBO0lBQ00sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFBO0lBQzdCLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUE7SUFDMUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3hJLGNBQWMsR0FBdUIsT0FBTyxDQUFD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