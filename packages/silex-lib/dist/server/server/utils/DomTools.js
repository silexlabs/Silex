"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
class DomTools {
    /**
     * This method is the entry point for modifying all the URLs in a dom tree
     * with a function you provide
     * The algorithm will call your function with the URLs found in the stylsheets, the html markup, and the JSON data stored by Silex
     */
    static transformPaths(win, data, fn) {
        // images, videos, stylesheets, iframes...
        ['src', 'href'].forEach((attr) => {
            const elements = Array.from(win.document.querySelectorAll(`[${attr}]`));
            for (const el of elements) {
                if (el.tagName.toLowerCase() === 'a') {
                    // do nothing with <a> links
                    continue;
                }
                if (el.tagName.toLowerCase() === 'link' &&
                    el.hasAttribute('rel') &&
                    el.getAttribute('rel').toLowerCase() !== 'stylesheet' &&
                    el.getAttribute('rel').toLowerCase() !== 'shortcut icon') {
                    // do nothing with <link> tags unless it is an external stylesheet or the favicon
                    continue;
                }
                if (el.hasAttribute(constants_1.Constants.STATIC_ASSET_ATTR)) {
                    continue;
                }
                const val = el.getAttribute(attr);
                const newVal = fn(val, el, el.parentElement === win.document.head);
                if (newVal) {
                    el.setAttribute(attr, newVal);
                }
            }
        });
        // CSS rules
        // FIXME: it would be safer (?) to use CSSStyleSheet::ownerNode instead of browsing the DOM
        // see the bug in jsdom: https://github.com/jsdom/jsdom/issues/992
        const tags = win.document.querySelectorAll('style');
        const stylesheets = win.document.styleSheets;
        const matches = [];
        for (let stylesheetIdx = 0; stylesheetIdx < stylesheets.length; stylesheetIdx++) {
            const stylesheet = stylesheets[stylesheetIdx];
            if (tags[stylesheetIdx]) { // seems to happen sometimes?
                const tag = tags[stylesheetIdx];
                const cssText = DomTools.transformStylesheet(stylesheet, tag.parentElement === win.document.head, fn);
                matches.push({
                    tag,
                    innerHTML: cssText,
                });
            }
        }
        matches.forEach(({ tag, innerHTML }) => tag.innerHTML = innerHTML);
        if (data) {
            // JSON object of Silex (components and styles)
            return DomTools.transformPersistantData(data, fn);
        }
        else {
            // no JSON data is normal, this is the case when publishing
            return null;
        }
    }
    /**
     * if value conatains `url('...')` this will be "transformed" by the provided function `fn`
     * @param {string} value, e.g. "transparent" or "100px" or "url('image/photo%20page%20accueil.png')"
     * @param {?CSSStyleSheet} stylesheet or null if the value comes from the JSON object holding silex data
     * @param {boolean} isInHead, true if the stylesheet is in the head tag
     * @param {function} fn
     */
    static transformValueUrlKeyword(value, stylesheet, isInHead, fn) {
        if (typeof value === 'string' && value.indexOf('url(') === 0) {
            // support url(...), url('...'), url("...")
            return `url(${value.replace(/url\('(.*)'\)|url\("(.*)"\)|url\((.*)\)/, (str, match1, match2, match3) => {
                const match = match1 || match2 || match3;
                return fn(match, stylesheet, isInHead) || match;
            })})`;
        }
        return null;
    }
    /**
     * FIXME: this removes comments from CSS
     */
    static transformStylesheet(stylesheet, isInHead, fn, isMediaQuerySubRule = false) {
        let cssText = '';
        for (const sheetOrRule of Array.from(stylesheet.cssRules)) {
            // have to play with types
            const rule = sheetOrRule;
            const sheet = sheetOrRule;
            if (rule.style) {
                for (const valName of Array.from(rule.style)) {
                    const value = rule.style[valName];
                    rule.style[valName] = DomTools.transformValueUrlKeyword(value, stylesheet, isInHead, fn) || value;
                }
            }
            else if (sheet.cssRules) {
                // case of a mediaquery
                DomTools.transformStylesheet(sheet, isInHead, fn, true);
            }
            else {
            }
            if (!isMediaQuerySubRule) {
                // if it is a media query then the parent rule will be written
                cssText += rule.cssText;
            }
        }
        return cssText;
    }
    /**
     * Transform the JSON object stored by Silex in the DOM
     * It contains all the components data, the elements styles, etc.
     * This is even more important than the URLs in the dom and stylesheets since it is re-applyed by Silex when the site is loaded in the editor
     */
    static transformPersistantData(data, fn) {
        function checkItOut(name, value) {
            const valueUrlKeyword = DomTools.transformValueUrlKeyword(value, null, true, fn);
            if (valueUrlKeyword) {
                return valueUrlKeyword;
            }
            else {
                if (['src', 'href'].indexOf(name) >= 0) {
                    return fn(value) || value;
                }
                return value;
            }
        }
        function recursiveCheck(name, dataObj) {
            if (typeof dataObj === 'object') {
                for (const elementId in dataObj) {
                    dataObj[elementId] = recursiveCheck(elementId, dataObj[elementId]);
                }
                return dataObj;
            }
            else {
                return checkItOut(name, dataObj);
            }
        }
        const { elements, site, pages } = data;
        const result = {
            site,
            pages,
            elements: elements.map((el) => ({
                ...el,
                // do not change links:
                // link: el.link ? {
                //   ...el.link,
                //   href: checkItOut('href', el.link.href),
                // } : null,
                // I remove this since it mess up the links in the hamburger menu component when they start with "/": data: recursiveCheck('', el.data),
                style: recursiveCheck('', el.style),
            })),
        };
        return result;
    }
    /**
     * Split the user editable head tag and silex head tags
     * the head tag edited by the user is a portion of the real head tag
     * it is delimited by specific comments
     * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
     * @param {string} headString   initial head tag
     * @return {{html: string, userHead: string}} split initial head tag and user editable head tag
     */
    static extractUserHeadTag(headString) {
        const regExp = new RegExp(constants_1.Constants.HEAD_TAG_START + '([\\\s\\\S.]*)' + constants_1.Constants.HEAD_TAG_STOP);
        const found = headString.match(regExp);
        if (found) {
            return {
                userHead: found[1],
                html: headString.replace(regExp, ''),
            };
        }
        return {
            userHead: '',
            html: headString,
        };
    }
    /**
     * insert the HEAD tag back into an HTML string
     * the head tag edited by the user is a portion of the real head tag
     * it is delimited by specific comments
     * it can not be interpreted while editing, in case it has bad HTML tags, it could break the whole site, insert tags into the body instead of the head...
     */
    static insertUserHeadTag(htmlString, userHead) {
        if (userHead) {
            return htmlString.replace(/<\/head>/i, constants_1.Constants.HEAD_TAG_START + userHead + constants_1.Constants.HEAD_TAG_STOP + '</head>');
        }
        else {
            return htmlString;
        }
    }
}
exports.default = DomTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9tVG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL3V0aWxzL0RvbVRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsK0NBQTJDO0FBSzNDLE1BQXFCLFFBQVE7SUFDM0I7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBYyxFQUFFLElBQW9CLEVBQUUsRUFBZ0U7UUFDMUgsMENBQTBDO1FBQzFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQy9CLE1BQU0sUUFBUSxHQUFrQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDdEYsS0FBSyxNQUFNLEVBQUUsSUFBSSxRQUFRLEVBQUU7Z0JBQ3pCLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxHQUFHLEVBQUU7b0JBQ3BDLDRCQUE0QjtvQkFDNUIsU0FBUTtpQkFDVDtnQkFDRCxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssTUFBTTtvQkFDckMsRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7b0JBQ3RCLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssWUFBWTtvQkFDckQsRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxlQUFlLEVBQ3hEO29CQUNBLGlGQUFpRjtvQkFDakYsU0FBUTtpQkFDVDtnQkFDRCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMscUJBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO29CQUNoRCxTQUFRO2lCQUNUO2dCQUNELE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENB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