"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = silex;
const silexApp = __importStar(require("./express"));
const api_1 = __importDefault(require("./api/api"));
const config_1 = require("./config");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
__exportStar(require("./expose"), exports);
async function silex() {
    const curDirEnv = dotenv_1.default.config();
    if (curDirEnv.error) {
        if (curDirEnv.error['code'] === 'ENOENT') {
            console.info('> No .env file found in current directory');
        }
        else {
            throw curDirEnv.error;
        }
    }
    else {
        console.info('> Env vars loaded from .env file');
    }
    const DEFAULT_ENV_FILE = (0, path_1.join)(__dirname, '../../../.env.default');
    const rootDirEnv = dotenv_1.default.config({ path: DEFAULT_ENV_FILE });
    if (rootDirEnv.error) {
        if (rootDirEnv.error['code'] === 'ENOENT') {
            throw new Error(`\n\nFailed to load default env vars. File not found ${DEFAULT_ENV_FILE}\n\n`);
        }
        else {
            throw new Error(`\n\nFailed to load default env vars. Error in ${DEFAULT_ENV_FILE}: ${rootDirEnv.error.message}\n\n`);
        }
    }
    console.info('> Default env vars loaded');
    const config = new config_1.ServerConfig();
    const app = silexApp.create(config);
    await config.addRoutes(app);
    await config.loadConfigFiles();
    await config.initDefaultConnectors();
    app.use('/api', (0, api_1.default)(config));
    await silexApp.start(app);
    console.info(`
I'm ready, listening to port ${config.port}
  `);
    if (config.debug) {
        startLiverReload();
    }
}
async function startLiverReload() {
    const { createServer } = await Promise.resolve().then(() => __importStar(require('livereload')));
    const { resolve } = await Promise.resolve().then(() => __importStar(require('path')));
    const dist = resolve(__dirname, '../../client');
    const server = createServer({
        delay: 0,
    }, () => {
        console.info(`\n> Debug mode\n> Live reload server is running.\n> Watching ${dist}`);
    });
    server.watch(dist);
}
if (require.main === module) {
    silex();
}
