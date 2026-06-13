"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = stringify;
exports.split = split;
exports.merge = merge;
exports.getPagesFolder = getPagesFolder;
const types_1 = require("../../common/types");
const page_1 = require("../../common/page");
const constants_1 = require("../../common/constants");
function stringify(data) {
    return JSON.stringify(data, sortKeys, 2);
}
function sortKeys(key, value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sorted = {};
        Object.keys(value).sort().forEach(k => {
            sorted[k] = value[k];
        });
        return sorted;
    }
    return value;
}
function split(websiteData) {
    const files = [];
    const pagesFolder = websiteData.pagesFolder || constants_1.LEGACY_WEBSITE_PAGES_FOLDER;
    const pages = websiteData.pages?.map((page) => {
        const pageName = getPageName(page);
        const slug = (0, page_1.getPageSlug)(pageName);
        const fileName = `${slug}-${page.id}.json`;
        const filePath = `${pagesFolder}/${fileName}`;
        if (!page.id)
            return page;
        files.push({
            path: filePath,
            content: stringify(page)
        });
        return {
            name: pageName,
            id: page.id,
            isFile: true,
        };
    }) || types_1.EMPTY_PAGES;
    const websiteDataLinkedPages = {
        ...websiteData,
        pagesFolder,
        pages,
    };
    files.push({
        path: constants_1.WEBSITE_DATA_FILE,
        content: stringify(websiteDataLinkedPages)
    });
    return files;
}
async function merge(websiteDataContent, pageLoader) {
    const websiteData = JSON.parse(websiteDataContent);
    const pagesFolder = websiteData.pagesFolder || constants_1.LEGACY_WEBSITE_PAGES_FOLDER;
    if (!websiteData.pages || websiteData.pages.length === 0) {
        return websiteData;
    }
    if (websiteData.pages[0] && !websiteData.pages[0].isFile) {
        return websiteData;
    }
    const pages = await Promise.all(websiteData.pages.map(async (pageRef) => {
        if (pageRef.isFile) {
            const pageName = pageRef.name;
            const slug = (0, page_1.getPageSlug)(pageName);
            const fileName = `${slug}-${pageRef.id}.json`;
            const filePath = `${pagesFolder}/${fileName}`;
            try {
                const pageContent = await pageLoader(filePath);
                return JSON.parse(pageContent);
            }
            catch (error) {
                console.warn(`Could not load page file: ${filePath}`, error);
                return pageRef;
            }
        }
        return pageRef;
    }));
    return {
        ...websiteData,
        pages,
    };
}
function getPagesFolder(websiteData) {
    return websiteData.pagesFolder || constants_1.LEGACY_WEBSITE_PAGES_FOLDER;
}
function getPageName(page) {
    return page.getName ? page.getName() : page.name;
}
