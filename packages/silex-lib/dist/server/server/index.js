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
const constants_1 = require("../constants");
// Expose API to calling app as function silex()
__exportStar(require("./expose"), exports);
// Main app
async function silex() {
    // Log Silex version
    console.info(constants_1.DEV_MESSAGE);
    console.info(`Node version: ${process.version}`);
    console.info(`CWD: ${process.cwd()}`);
    // Load env vars from .env file if any
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
    // Load default env vars
    // This will not override existing env vars
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
    // Get the default config object
    const config = new config_1.ServerConfig();
    // start silex
    const app = silexApp.create(config);
    // Serve the client config file
    await config.addRoutes(app);
    // Load the config files
    await config.loadConfigFiles();
    // Init the connectors in case no plugin adds them
    await config.initDefaultConnectors();
    // APIs
    app.use('/api', (0, api_1.default)(config));
    // Start the server
    await silexApp.start(app);
    // All good, server is ready
    console.info(`\nSilex is ready, open http://localhost:${config.port} in your browser\n`);
    if (config.debug) {
        startLiverReload();
    }
}
// livereload
async function startLiverReload() {
    // Load modules only when needed (they may not even be installed)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdHMvc2VydmVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhSCx3QkF5REM7QUFwRUQsb0RBQXFDO0FBQ3JDLG9EQUEyQjtBQUMzQixxQ0FBdUM7QUFDdkMsb0RBQTJCO0FBQzNCLCtCQUEyQjtBQUMzQiw0Q0FBMEM7QUFFMUMsZ0RBQWdEO0FBQ2hELDJDQUF3QjtBQUV4QixXQUFXO0FBQ0ksS0FBSyxVQUFVLEtBQUs7SUFDakMsb0JBQW9CO0lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQVcsQ0FBQyxDQUFBO0lBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBRXJDLHNDQUFzQztJQUN0QyxNQUFNLFNBQVMsR0FBRyxnQkFBTSxDQUFDLE1BQU0sRUFBRSxDQUFBO0lBQ2pDLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BCLElBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxPQUFPLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUE7UUFDM0QsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUE7UUFDdkIsQ0FBQztJQUNILENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFBO0lBQ2xELENBQUM7SUFFRCx3QkFBd0I7SUFDeEIsMkNBQTJDO0lBQzNDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHVCQUF1QixDQUFDLENBQUE7SUFDakUsTUFBTSxVQUFVLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBQzVELElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLElBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLHVEQUF1RCxnQkFBZ0IsTUFBTSxDQUFDLENBQUE7UUFDaEcsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxnQkFBZ0IsS0FBTSxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQVEsTUFBTSxDQUFDLENBQUE7UUFDekgsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUE7SUFFekMsZ0NBQWdDO0lBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUkscUJBQVksRUFBRSxDQUFBO0lBRWpDLGNBQWM7SUFDZCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRW5DLCtCQUErQjtJQUMvQixNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUE7SUFFM0Isd0JBQXdCO0lBQ3hCLE1BQU0sTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBRTlCLGtEQUFrRDtJQUNsRCxNQUFNLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFBO0lBRXBDLE9BQU87SUFDUCxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFBLGFBQUcsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBRTVCLG1CQUFtQjtJQUNuQixNQUFNLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7SUFFekIsNEJBQTRCO0lBQzVCLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkNBQTJDLE1BQU0sQ0FBQyxJQUFJLG9CQUFvQixDQUFDLENBQUE7SUFDeEYsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakIsZ0JBQWdCLEVBQUUsQ0FBQTtJQUNwQixDQUFDO0FBQ0gsQ0FBQztBQUVELGFBQWE7QUFDYixLQUFLLFVBQVUsZ0JBQWdCO0lBQzdCLGlFQUFpRTtJQUNqRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsd0RBQWEsWUFBWSxHQUFDLENBQUE7SUFDbkQsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLHdEQUFhLE1BQU0sR0FBQyxDQUFBO0lBQ3hDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFDL0MsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO1FBQzFCLEtBQUssRUFBRSxDQUFDO0tBQ1QsRUFBRSxHQUFHLEVBQUU7UUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLGdFQUFnRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3RGLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNwQixDQUFDO0FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLEtBQUssRUFBRSxDQUFBO0FBQ1QsQ0FBQyJ9