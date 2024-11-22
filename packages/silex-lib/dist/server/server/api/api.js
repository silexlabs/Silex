"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const Cache_1 = require("../../plugins/server/Cache");
const connectorApi_1 = __importDefault(require("./connectorApi"));
const websiteApi_1 = __importDefault(require("./websiteApi"));
const publicationApi_1 = __importDefault(require("./publicationApi"));
const constants_1 = require("../../constants");
function default_1(config) {
    const router = (0, express_1.Router)();
    router.use(Cache_1.noCache);
    router.use(constants_1.API_CONNECTOR_PATH, (0, connectorApi_1.default)(config));
    router.use(constants_1.API_WEBSITE_PATH, (0, websiteApi_1.default)(config));
    router.use(constants_1.API_PUBLICATION_PATH, (0, publicationApi_1.default)(config));
    return router;
}
