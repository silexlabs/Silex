"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerConfig = void 0;
const silex_plugins_1 = require("@silexlabs/silex-plugins");
const path_1 = require("path");
const constants_1 = require("../constants");
const promises_1 = require("fs/promises");
const connectors_1 = require("./connectors/connectors");
const FsStorage_1 = require("./connectors/FsStorage");
const types_1 = require("../types");
const FsHosting_1 = require("./connectors/FsHosting");
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
    getConnectors(type = null) {
        if (!type) {
            const allConnectors = this.getStorageConnectors().concat(this.getHostingConnectors());
            return [...new Set(allConnectors)];
        }
        const connectorType = (0, connectors_1.toConnectorEnum)(type.toString());
        switch (connectorType) {
            case types_1.ConnectorType.HOSTING: return this.getHostingConnectors();
            case types_1.ConnectorType.STORAGE: return this.getStorageConnectors();
            default: throw new Error(`Unknown connector type ${type}`);
        }
    }
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
    hostingConnectors = [];
    addHostingConnector(hosting) {
        this.setHostingConnectors(this.hostingConnectors.concat(hosting));
    }
    setHostingConnectors(hostings) {
        this.hostingConnectors = hostings;
    }
    getHostingConnectors() { return this.hostingConnectors; }
    async addRoutes(app) {
        const path = process.env.SILEX_CLIENT_CONFIG;
        if (path) {
            console.info(`> Serving client side config ${path} at ${constants_1.CLIENT_CONFIG_FILE_NAME}`);
            try {
                let clientConfig = (await (0, promises_1.readFile)(path)).toString();
                app.get(`/${constants_1.CLIENT_CONFIG_FILE_NAME}`, async (req, res) => {
                    if (this.debug) {
                        console.info('[Debug mode] Reloading config file', path);
                        clientConfig = (await (0, promises_1.readFile)(path)).toString();
                    }
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
    async loadConfigFiles() {
        await this.loadUserConfig();
        await this.loadSilexConfig();
    }
    async loadUserConfig() {
        if (this.userConfigPath) {
            console.info('> Loading user config', this.userConfigPath);
            try {
                await this.addPlugin(this.userConfigPath, {});
            }
            catch (e) {
                throw new Error(`\nUser config file ${this.userConfigPath} error:\n\n\t${e.message}\n\n`);
            }
        }
    }
    async loadSilexConfig() {
        console.info('> Loading config', this.configFilePath);
        try {
            await this.addPlugin(this.configFilePath, {});
        }
        catch (e) {
            if (e.code === 'MODULE_NOT_FOUND' && (!e.requireStack || !e.requireStack.find(path => path === this.configFilePath))) {
                console.info('> /!\\ Config file not found', this.configFilePath);
            }
            else {
                throw new Error(`Error in config file ${this.configFilePath}: ${e.message}`);
            }
        }
    }
    async initDefaultConnectors() {
        if (!this.storageConnectors.length) {
            this.addStorageConnector(new FsStorage_1.FsStorage(null, {
                path: process.env.SILEX_FS_ROOT || (0, path_1.join)(process.cwd(), '/silex/storage'),
            }));
        }
        if (!this.hostingConnectors.length) {
            this.addHostingConnector(new FsHosting_1.FsHosting(null, {
                path: process.env.SILEX_FS_HOSTING_ROOT || (0, path_1.join)(process.cwd(), '/silex/hosting'),
            }));
        }
    }
}
exports.ServerConfig = ServerConfig;
