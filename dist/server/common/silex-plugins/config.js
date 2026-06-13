"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
exports.default = default_1;
const plugin_1 = require("./plugin");
const component_emitter_1 = __importDefault(require("component-emitter"));
function default_1(baseUrl = null) {
    return new Config(baseUrl);
}
class Config extends component_emitter_1.default {
    baseUrl;
    constructor(baseUrl = null) {
        super();
        this.baseUrl = baseUrl;
    }
    async addPlugin(plugin, options) {
        const result = await (0, plugin_1.loadPlugins)(this, [].concat(plugin), options, this.baseUrl);
        Object.assign(this, result);
        return this;
    }
}
exports.Config = Config;
