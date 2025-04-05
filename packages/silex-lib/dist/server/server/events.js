"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvent = void 0;
var ServerEvent;
(function (ServerEvent) {
    ServerEvent["STARTUP_START"] = "startup-start";
    ServerEvent["STARTUP_END"] = "startup-end";
    ServerEvent["PUBLISH_START"] = "publish-start";
    ServerEvent["PUBLISH_END"] = "publish-end";
    ServerEvent["WEBSITE_STORE_START"] = "store-start";
    ServerEvent["WEBSITE_STORE_END"] = "store-end";
    ServerEvent["WEBSITE_ASSET_STORE_START"] = "asset-store-start";
    ServerEvent["WEBSITE_ASSET_STORE_END"] = "asset-store-end";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
