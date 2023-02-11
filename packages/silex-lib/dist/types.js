"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unit = exports.defaultSite = exports.defaultSettings = exports.WEBSITE_CONTEXT_EDITOR_CLASS_NAME = exports.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = void 0;
exports.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime';
exports.WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor';
exports.defaultSettings = {
    assets: { path: 'assets' },
    html: { path: '' },
    css: { path: 'css' },
    prefix: '',
};
exports.defaultSite = {
    pages: [],
    files: [],
    assets: [],
    styles: [],
    name: 'New website',
    settings: {
        description: '',
        title: '',
        head: '',
        lang: 'en',
        favicon: 'https://editor.silex.me/assets/favicon.png',
        'og:title': '',
        'og:description': '',
        'og:image': '',
    },
    fonts: [
        { name: 'Arial', value: 'Arial, Helvetica, sans-serif', variants: [] },
        { name: 'Times New Roman', value: '"Times New Roman", Times, serif', variants: [] },
    ],
    symbols: [],
};
var Unit;
(function (Unit) {
    Unit["PX"] = "px";
})(Unit = exports.Unit || (exports.Unit = {}));
