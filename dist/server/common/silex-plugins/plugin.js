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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlugins = loadPlugins;
async function loadPlugins(config, plugins, options, baseUrl = null) {
    return Promise.all(plugins
        .map(async (plugin) => {
        const [construct, name,] = await (async () => {
            switch (typeof plugin) {
                case 'function': return [plugin, plugin.toString(),];
                case 'string': return [await loadPlugin(plugin, baseUrl), plugin,];
                default: throw new Error(`Unknown type for plugin: ${typeof plugin}`);
            }
        })();
        return construct(config, name && options ? options[name] ?? options : options);
    }))
        .then((results) => {
        return results.reduce((finalConfig, result) => {
            return {
                ...finalConfig,
                ...result,
            };
        }, config);
    });
}
async function loadPlugin(location, baseUrl) {
    const path = getLocation(location, baseUrl);
    const imported = await dynamicImport(path);
    const result = imported?.default ?? imported;
    return result;
}
function getLocation(urlOrPath, baseUrl = null) {
    try {
        return new URL(urlOrPath, baseUrl).toString();
    }
    catch {
        return urlOrPath;
    }
}
async function dynamicImport(path) {
    return Promise.resolve(`${path}`).then(s => __importStar(require(s)));
}
