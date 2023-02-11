"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageLink = exports.getPageSlug = void 0;
function getPageSlug(pageName = 'index') {
    return pageName
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
exports.getPageSlug = getPageSlug;
function getPageLink(pageName = 'index') {
    return `./${getPageSlug(pageName)}.html`;
}
exports.getPageLink = getPageLink;
