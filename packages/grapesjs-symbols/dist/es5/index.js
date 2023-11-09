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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdCreateSymbol = exports.cmdUnlinkSymbol = exports.cmdRemoveSymbol = exports.cmdAddSymbol = void 0;
var storage_1 = __importDefault(require("./storage"));
var Symbols_1 = require("./model/Symbols");
var SymbolsView_1 = __importDefault(require("./view/SymbolsView"));
var SymbolsCommands_1 = __importStar(require("./SymbolsCommands")), cmd = SymbolsCommands_1;
var traits_1 = __importDefault(require("./view/traits"));
exports.cmdAddSymbol = cmd.cmdAdd;
exports.cmdRemoveSymbol = cmd.cmdRemove;
exports.cmdUnlinkSymbol = cmd.cmdUnlink;
exports.cmdCreateSymbol = cmd.cmdCreate;
exports.default = (function (editor, opts) {
    if (opts === void 0) { opts = {}; }
    var options = __assign({
        appendTo: '#symbols',
        emptyText: 'No symbol yet.',
        primaryColor: '#b9a5a6',
        secondaryColor: '#463a3c',
        highlightColor: '#d97aa6',
    }, opts);
    // store the symbols data with the site
    (0, storage_1.default)(editor);
    // keep track of symbols and changes
    editor.Symbols = new Symbols_1.Symbols([], { options: options, editor: editor });
    editor.on('load', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Display symbols
        new SymbolsView_1.default(__assign(__assign({}, options), { editor: editor, model: editor.Symbols }));
        // Commands to create/delete symbols
        (0, SymbolsCommands_1.default)(editor, options);
        // Add traits like a plugin
        (0, traits_1.default)(editor, options);
    });
});
