"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlugins = void 0;
/**
 *
 * @param config The initial config object
 * @param plugins The plugins to load
 * @returns Merged results objects
 */
function loadPlugins(config, plugins, options, baseUrl) {
    if (baseUrl === void 0) { baseUrl = null; }
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all(plugins
                    // Load plugins
                    .map(function (plugin) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, construct, name;
                    var _this = this;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = typeof plugin;
                                                switch (_a) {
                                                    case 'function': return [3 /*break*/, 1];
                                                    case 'string': return [3 /*break*/, 2];
                                                }
                                                return [3 /*break*/, 4];
                                            case 1: return [2 /*return*/, [plugin, plugin.toString(),]];
                                            case 2: return [4 /*yield*/, loadPlugin(plugin, baseUrl)];
                                            case 3: return [2 /*return*/, [_b.sent(), plugin]];
                                            case 4: throw new Error("Unknown type for plugin: ".concat(typeof plugin));
                                        }
                                    });
                                }); })()];
                            case 1:
                                _a = _c.sent(), construct = _a[0], name = _a[1];
                                return [2 /*return*/, construct(config, name && options ? (_b = options[name]) !== null && _b !== void 0 ? _b : options : options)];
                        }
                    });
                }); }))
                    // Merge the results
                    .then(function (results) {
                    return results.reduce(function (finalConfig, result) {
                        return __assign(__assign({}, finalConfig), result);
                    }, config);
                })];
        });
    });
}
exports.loadPlugins = loadPlugins;
/**
 * Load a plugin
 * @param location The path, absolute, relative or online
 * @returns The result of the plugin default function
 */
function loadPlugin(location, baseUrl) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var path, imported, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    path = getLocation(location, baseUrl);
                    return [4 /*yield*/, dynamicImport(path)];
                case 1:
                    imported = _b.sent();
                    result = (_a = imported === null || imported === void 0 ? void 0 : imported.default) !== null && _a !== void 0 ? _a : imported;
                    return [2 /*return*/, result];
            }
        });
    });
}
function getLocation(urlOrPath, baseUrl) {
    if (baseUrl === void 0) { baseUrl = null; }
    try {
        return new URL(urlOrPath, baseUrl).toString();
    }
    catch (e) {
        return urlOrPath;
    }
}
/**
 * This is isolated here for unit tests to mock it
 * @param path The absolute path to laod
 * @returns The loaded module
 */
function dynamicImport(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.resolve("".concat(path)).then(function (s) { return __importStar(require(s)); })];
        });
    });
}
