"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SILEX_VERSION = exports.API_WEBSITE_META_WRITE = exports.API_WEBSITE_META_READ = exports.API_WEBSITE_ASSETS_WRITE = exports.API_WEBSITE_ASSET_READ = exports.API_WEBSITE_LIST = exports.API_WEBSITE_DUPLICATE = exports.API_WEBSITE_DELETE = exports.API_WEBSITE_CREATE = exports.API_WEBSITE_WRITE = exports.API_WEBSITE_READ = exports.API_WEBSITE_PATH = exports.API_PUBLICATION_STATUS = exports.API_PUBLICATION_PUBLISH = exports.API_PUBLICATION_PATH = exports.API_CONNECTOR_LOGIN_CALLBACK = exports.API_CONNECTOR_SETTINGS = exports.API_CONNECTOR_LOGIN = exports.API_CONNECTOR_LOGOUT = exports.API_CONNECTOR_LIST = exports.API_CONNECTOR_USER = exports.API_CONNECTOR_PATH = exports.API_PATH = exports.CLIENT_CONFIG_FILE_NAME = exports.DEFAULT_LANGUAGE = exports.DEFAULT_WEBSITE_ID = exports.WEBSITE_META_DATA_FILE = exports.WEBSITE_DATA_FILE = void 0;
exports.WEBSITE_DATA_FILE = 'website.json';
exports.WEBSITE_META_DATA_FILE = 'meta.json';
exports.DEFAULT_WEBSITE_ID = 'default';
exports.DEFAULT_LANGUAGE = 'en';
exports.CLIENT_CONFIG_FILE_NAME = 'silex.js';
exports.API_PATH = '/api';
exports.API_CONNECTOR_PATH = '/connector';
exports.API_CONNECTOR_USER = '/user';
exports.API_CONNECTOR_LIST = '/';
exports.API_CONNECTOR_LOGOUT = '/logout';
exports.API_CONNECTOR_LOGIN = '/login';
exports.API_CONNECTOR_SETTINGS = '/settings';
exports.API_CONNECTOR_LOGIN_CALLBACK = '/login/callback';
exports.API_PUBLICATION_PATH = '/publication';
exports.API_PUBLICATION_PUBLISH = '/';
exports.API_PUBLICATION_STATUS = '/publication/status';
exports.API_WEBSITE_PATH = '/website';
exports.API_WEBSITE_READ = '/';
exports.API_WEBSITE_WRITE = '/';
exports.API_WEBSITE_CREATE = '/';
exports.API_WEBSITE_DELETE = '/';
exports.API_WEBSITE_DUPLICATE = '/duplicate';
exports.API_WEBSITE_LIST = '/';
exports.API_WEBSITE_ASSET_READ = '/assets';
exports.API_WEBSITE_ASSETS_WRITE = '/assets';
exports.API_WEBSITE_META_READ = '/meta';
exports.API_WEBSITE_META_WRITE = '/meta';
try {
    exports.SILEX_VERSION = SILEX_VERSION_ENV;
}
catch (e) {
    exports.SILEX_VERSION = exports.SILEX_VERSION || '3.0.0';
}
