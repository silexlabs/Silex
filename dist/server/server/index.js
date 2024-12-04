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
// Expose API to calling app as function silex()
__exportStar(require("./expose"), exports);
// Main app
async function silex() {
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
    console.info(`
I'm ready, listening to port ${config.port}
  `);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdHMvc2VydmVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZSCx3QkFzREM7QUFoRUQsb0RBQXFDO0FBQ3JDLG9EQUEyQjtBQUMzQixxQ0FBdUM7QUFDdkMsb0RBQTJCO0FBQzNCLCtCQUEyQjtBQUUzQixnREFBZ0Q7QUFDaEQsMkNBQXdCO0FBRXhCLFdBQVc7QUFDSSxLQUFLLFVBQVUsS0FBSztJQUNqQyxzQ0FBc0M7SUFDdEMsTUFBTSxTQUFTLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUNqQyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixJQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDeEMsT0FBTyxDQUFDLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO1FBQzNELENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFBO1FBQ3ZCLENBQUM7SUFDSCxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBRUQsd0JBQXdCO0lBQ3hCLDJDQUEyQztJQUMzQyxNQUFNLGdCQUFnQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sVUFBVSxHQUFHLGdCQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtJQUM1RCxJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixJQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1REFBdUQsZ0JBQWdCLE1BQU0sQ0FBQyxDQUFBO1FBQ2hHLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsZ0JBQWdCLEtBQU0sVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFRLE1BQU0sQ0FBQyxDQUFBO1FBQ3pILENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO0lBRXpDLGdDQUFnQztJQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLHFCQUFZLEVBQUUsQ0FBQTtJQUVqQyxjQUFjO0lBQ2QsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUVuQywrQkFBK0I7SUFDL0IsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBRTNCLHdCQUF3QjtJQUN4QixNQUFNLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUU5QixrREFBa0Q7SUFDbEQsTUFBTSxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQTtJQUVwQyxPQUFPO0lBQ1AsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBQSxhQUFHLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUU1QixtQkFBbUI7SUFDbkIsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBRXpCLDRCQUE0QjtJQUM1QixPQUFPLENBQUMsSUFBSSxDQUFDOytCQUNnQixNQUFNLENBQUMsSUFBSTtHQUN2QyxDQUFDLENBQUE7SUFDRixJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixnQkFBZ0IsRUFBRSxDQUFBO0lBQ3BCLENBQUM7QUFDSCxDQUFDO0FBRUQsYUFBYTtBQUNiLEtBQUssVUFBVSxnQkFBZ0I7SUFDN0IsaUVBQWlFO0lBQ2pFLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyx3REFBYSxZQUFZLEdBQUMsQ0FBQTtJQUNuRCxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsd0RBQWEsTUFBTSxHQUFDLENBQUE7SUFDeEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMvQyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7UUFDMUIsS0FBSyxFQUFFLENBQUM7S0FDVCxFQUFFLEdBQUcsRUFBRTtRQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0VBQWdFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDdEYsQ0FBQyxDQUFDLENBQUE7SUFDRixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3BCLENBQUM7QUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsS0FBSyxFQUFFLENBQUE7QUFDVCxDQUFDIn0=