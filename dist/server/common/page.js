"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageSlug = getPageSlug;
exports.getPageLink = getPageLink;
function getPageSlug(pageName) {
    return (pageName || 'index')
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
function getPageLink(pageName) {
    return `./${getPageSlug(pageName)}.html`;
}
