"use strict";
/**
 * @fileoverview Helper class for common tasks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgbaToArray = exports.rgbaToHex = exports.rgbToHex = exports.hexToArray = exports.hexToRgba = exports.hexToRgb = exports.styleToString = exports.styleToObject = exports.addToMobileOrDesktopStyle = exports.fixStyleForElement = void 0;
const types_1 = require("../element-store/types");
/**
 * handle the specificities of each element type, e.g. section have no width
 * TODO: also use element's position (static or not)
 */
function fixStyleForElement(element, isSectionContent, style) {
    const result = {
        ...style,
    };
    if (style.position === 'static') {
        delete result.left;
        delete result.top;
    }
    if (element.type === types_1.ElementType.SECTION || isSectionContent) {
        delete result.width; // always 100% for sections and "site width" for section content
        delete result.left; // section content are relative because of auto z-index
        delete result.top; // section content are relative because of auto z-index
    }
    if (element.type === types_1.ElementType.SECTION)
        delete result.height;
    return result;
}
exports.fixStyleForElement = fixStyleForElement;
// TODO: use a dynamic key instead of this method: [mobileEditor ? 'mobile' : 'desktop']
function addToMobileOrDesktopStyle(mobileEditor, originalStyle, style) {
    return {
        ...originalStyle,
        mobile: mobileEditor ? {
            ...originalStyle.mobile,
            ...style,
        } : originalStyle.mobile,
        desktop: mobileEditor ? originalStyle.desktop : {
            ...originalStyle.desktop,
            ...style,
        },
    };
}
exports.addToMobileOrDesktopStyle = addToMobileOrDesktopStyle;
/**
 * convert style object to object
 * with only the keys which are set
 */
function styleToObject(styleObj) {
    const res = {};
    for (const styleName of styleObj) {
        res[styleName] = styleObj[styleName];
    }
    return res;
}
exports.styleToObject = styleToObject;
/**
 * convert style object to string
 * this does handle height / min-height
 */
function styleToString(style, useMinHeight, opt_tab = '') {
    return Object.keys(style)
        // remove undefined keys
        // this removes properties with empty string value, on purpose
        .filter((key) => !!style[key])
        .map((key) => ({
        key,
        val: style[key],
    }))
        .reduce((result, { key, val }) => {
        if (useMinHeight && key === 'height') {
            result += opt_tab + 'min-height: ' + val + '; ';
        }
        else {
            result += `${opt_tab}${key}: ${val}; `;
        }
        return result;
    }, '');
}
exports.styleToString = styleToString;
function hexToRgb(hexColor) {
    console.warn('why convert', hexColor, 'to RGB?');
    const rgb = parseInt(hexColor.substr(1), 16);
    const r = rgb >> 16;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    return [r, g, b];
}
exports.hexToRgb = hexToRgb;
/**
 * convert hex color to rgba values
 * example: #000000FF will return rgba(0, 0, 0, 1)
 */
function hexToRgba(hex) {
    if (hex.indexOf('#') !== 0) {
        return hex;
    }
    if (hex.length !== 9) {
        console.error('Error in length ' + hex + ' - ' + hex.length);
        return hex;
    }
    const hexArr = hexToArray(hex);
    const r = hexArr[0];
    const g = hexArr[1];
    const b = hexArr[2];
    const a = hexArr[3];
    const result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    return result;
}
exports.hexToRgba = hexToRgba;
/**
 * convert rgba to array of values
 * example:    #000000FF will return [0, 0, 0, 1]
 */
function hexToArray(hex) {
    if (hex.indexOf('#') !== 0) {
        return null;
    }
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    const result = [r, g, b, a];
    return result;
}
exports.hexToArray = hexToArray;
/**
 * convert rgb to hex
 * example:    rgb(0, 0, 0) will return #000000
 */
function rgbToHex(rgb) {
    const hexWithA = rgbaToHex(rgb);
    return hexWithA.substr(0, 7);
}
exports.rgbToHex = rgbToHex;
/**
 * convert rgba to hex
 * example:    rgba(0, 0, 0, 1) will return #000000FF
 */
function rgbaToHex(rgba) {
    // has to be rgb or rgba
    if (rgba.indexOf('rgb') !== 0) {
        return rgba;
    }
    // get the array version
    const rgbaArr = rgbaToArray(rgba);
    let r = rgbaArr[0].toString(16);
    if (r.length < 2) {
        r = '0' + r;
    }
    let g = rgbaArr[1].toString(16);
    if (g.length < 2) {
        g = '0' + g;
    }
    let b = rgbaArr[2].toString(16);
    if (b.length < 2) {
        b = '0' + b;
    }
    let a = rgbaArr[3].toString(16);
    if (a.length < 2) {
        a = '0' + a;
    }
    const result = '#' + (r + g + b + a);
    return result;
}
exports.rgbaToHex = rgbaToHex;
/**
 * convert rgba to array of values
 * example:    rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
 */
function rgbaToArray(rgba) {
    // not rgb nor rgba
    if (rgba.indexOf('rgb') !== 0) {
        return null;
    }
    if (rgba.indexOf('rgba') !== 0) {
        // rgb
        rgba = rgba.replace('rgb', '');
    }
    else {
        // rgba
        rgba = rgba.replace('rgba', '');
    }
    rgba = rgba.replace(' ', '');
    const rgbaArr = rgba.substring(1, rgba.length - 1).split(',');
    // add alpha if needed
    if (rgbaArr.length < 4) {
        rgbaArr.push('1');
    }
    const r = parseInt(rgbaArr[0], 10);
    const g = parseInt(rgbaArr[1], 10);
    const b = parseInt(rgbaArr[2], 10);
    const a = parseFloat(rgbaArr[3]) * 255;
    const result = [r, g, b, a];
    return result;
}
exports.rgbaToArray = rgbaToArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC91dGlscy9zdHlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFHSCxrREFBa0U7QUFFbEU7OztHQUdHO0FBQ0gsU0FBZ0Isa0JBQWtCLENBQUMsT0FBcUIsRUFBRSxnQkFBeUIsRUFBRSxLQUFjO0lBQ2pHLE1BQU0sTUFBTSxHQUFHO1FBQ2IsR0FBRyxLQUFLO0tBQ1QsQ0FBQTtJQUNELElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7UUFDL0IsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFBO1FBQ2xCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQTtLQUNsQjtJQUNELElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxtQkFBVyxDQUFDLE9BQU8sSUFBSSxnQkFBZ0IsRUFBRTtRQUM1RCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUEsQ0FBQyxnRUFBZ0U7UUFDcEYsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFBLENBQUMsdURBQXVEO1FBQzFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQSxDQUFDLHVEQUF1RDtLQUMxRTtJQUNELElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxtQkFBVyxDQUFDLE9BQU87UUFBRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUE7SUFDOUQsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBZkQsZ0RBZUM7QUFFRCx3RkFBd0Y7QUFDeEYsU0FBZ0IseUJBQXlCLENBQUMsWUFBcUIsRUFBRSxhQUFvRCxFQUFFLEtBQWM7SUFDbkksT0FBTztRQUNMLEdBQUcsYUFBYTtRQUNoQixNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNyQixHQUFHLGFBQWEsQ0FBQyxNQUFNO1lBQ3ZCLEdBQUcsS0FBSztTQUNULENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1FBQ3hCLE9BQU8s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