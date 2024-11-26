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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.start = start;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const cors_1 = __importDefault(require("cors"));
const events_1 = require("./events");
function create(config) {
    // Express app
    const app = (0, express_1.default)();
    app.set('config', config);
    // CORS
    const options = config.expressOptions;
    if (options.cors) {
        console.info('> CORS are ENABLED:', options.cors);
        app.use((0, cors_1.default)({
            origin: options.cors,
        }));
    }
    // compress gzip when possible
    app.use((0, compression_1.default)());
    // cookie & session
    app.use(body_parser_1.default.json({ limit: options.jsonLimit }));
    app.use(body_parser_1.default.text({ limit: options.textLimit }));
    app.use(body_parser_1.default.urlencoded({ limit: options.urlencodedLimit }));
    console.info('> Session name:', options.sessionName);
    app.use((0, cookie_parser_1.default)());
    app.use((0, cookie_session_1.default)({
        name: options.sessionName,
        secret: options.sessionSecret,
    }));
    return app;
}
async function start(app) {
    const config = app.get('config');
    // Plugins hook to create API routes
    config.emit(events_1.ServerEvent.STARTUP_START, { app });
    // Start server
    return new Promise((resolve, reject) => {
        app.listen(config.port, () => {
            config.emit(events_1.ServerEvent.STARTUP_END, { app });
            resolve(app);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cy9zZXJ2ZXIvZXhwcmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHOzs7OztBQVlILHdCQTJCQztBQUVELHNCQWFDO0FBcERELHNEQUE4QztBQUM5Qyw4REFBb0M7QUFDcEMsOERBQXFDO0FBQ3JDLGtFQUF3QztBQUN4QyxvRUFBb0M7QUFDcEMsZ0RBQXVCO0FBR3ZCLHFDQUFzQztBQUV0QyxTQUFnQixNQUFNLENBQUMsTUFBb0I7SUFDekMsY0FBYztJQUNkLE1BQU0sR0FBRyxHQUFHLElBQUEsaUJBQU8sR0FBRSxDQUFBO0lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBRXpCLE9BQU87SUFDUCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFBO0lBQ3JDLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSxjQUFJLEVBQUM7WUFDWCxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUk7U0FDckIsQ0FBQyxDQUFDLENBQUE7SUFDTCxDQUFDO0lBQ0QsOEJBQThCO0lBQzlCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSxxQkFBVyxHQUFTLENBQUMsQ0FBQTtJQUU3QixtQkFBbUI7SUFDbkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3RELEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN0RCxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbEUsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDcEQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHVCQUFZLEdBQVMsQ0FBQyxDQUFBO0lBQzlCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBTyxFQUFDO1FBQ2QsSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXO1FBQ3pCLE1BQU0sRUFBRSxPQUFPLENBQUMsYUFBYTtLQUM5QixDQUFRLENBQUMsQ0FBQTtJQUNWLE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQztBQUVNLEtBQUssVUFBVSxLQUFLLENBQUMsR0FBZ0I7SUFDMUMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQWlCLENBQUE7SUFFaEQsb0NBQW9DO0lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQVcsQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBRS9DLGVBQWU7SUFDZixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBVyxDQUFDLFdBQVcsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7WUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==