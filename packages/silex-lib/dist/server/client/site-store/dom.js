"use strict";
/**
 * @fileoverview Site dom manipulation. Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFonts = exports.setTwitterSocial = exports.setThumbnailSocialPath = exports.setDescriptionSocial = exports.setTitleSocial = exports.setFaviconPath = exports.setLang = exports.setTitle = exports.setDescription = exports.setWebsiteWidthInDom = exports.setEnableMobile = exports.setMeta = exports.setHeadStyle = exports.setHeadScript = void 0;
const constants_1 = require("../../constants");
/**
 * set/get silex editable js script
 * @param jsString   the string defining Silex script
 */
function setHeadScript(doc, jsString) {
    let scriptTag = doc.head.querySelector('.' + constants_1.Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS);
    if (!scriptTag) {
        scriptTag = doc.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.className = constants_1.Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS;
        doc.head.appendChild(scriptTag);
    }
    scriptTag.innerHTML = jsString;
}
exports.setHeadScript = setHeadScript;
/**
 * set/get silex editable css styles
 * @param cssString   the css string defining all Silex styles
 */
function setHeadStyle(doc, cssString) {
    let silexStyle = doc.head.querySelector('.' + constants_1.Constants.SILEX_STYLE_ELEMENT_CSS_CLASS);
    if (!silexStyle) {
        silexStyle = doc.createElement('style');
        silexStyle.className = constants_1.Constants.SILEX_STYLE_ELEMENT_CSS_CLASS;
        doc.head.appendChild(silexStyle);
    }
    silexStyle.innerHTML = cssString;
}
exports.setHeadStyle = setHeadStyle;
/**
 * get/set a meta data
 */
function setMeta(doc, name, opt_value, opt_propertyOrName = 'property') {
    // update the DOM element
    let metaNode = doc.querySelector(`meta[${opt_propertyOrName}="${name}"], meta[name="${name}"]`); // additional `meta[name="${name}]"` is for backward compat
    if (!metaNode && opt_value && opt_value !== '') {
        // create the DOM element
        metaNode = doc.createElement('meta');
        metaNode.setAttribute(opt_propertyOrName, name);
        metaNode.content = opt_value;
        doc.head.appendChild(metaNode);
    }
    else {
        if (opt_value && opt_value !== '') {
            // update opt_value
            metaNode.setAttribute('content', opt_value);
            metaNode.removeAttribute('name'); // for backward compat
            metaNode.setAttribute(opt_propertyOrName, name); // for backward compat
        }
        else {
            // remove the opt_value
            if (metaNode) {
                metaNode.parentElement.removeChild(metaNode);
            }
        }
    }
}
exports.setMeta = setMeta;
/**
 * enable/disable the mobile version
 */
function setEnableMobile(doc, enable) {
    if (doc.body === null) {
        // body is null, this happens while undoing or redoing
        return;
    }
    let viewport = doc.querySelector('meta[name=viewport]');
    if (enable === true) {
        doc.body.classList.add(constants_1.Constants.ENABLE_MOBILE_CSS_CLASS);
        if (!viewport) {
            viewport = doc.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1';
            doc.head.appendChild(viewport);
        }
    }
    else {
        doc.body.classList.remove(constants_1.Constants.ENABLE_MOBILE_CSS_CLASS);
        if (viewport) {
            doc.head.removeChild(viewport);
        }
    }
}
exports.setEnableMobile = setEnableMobile;
/**
 * get/set the website width
 */
function setWebsiteWidthInDom(doc, width) {
    let silexStyle = doc.head.querySelector('.silex-style-settings');
    if (!silexStyle) {
        silexStyle = doc.createElement('style');
        silexStyle.className = 'silex-style-settings';
        doc.head.appendChild(silexStyle);
    }
    silexStyle.innerHTML = `
  .${constants_1.Constants.WEBSITE_WIDTH_CLASS_NAME} {
    width: ${width}px;
  }
  @media (min-width: ${constants_1.Constants.MOBILE_BREAKPOINT + 1}px) {
    .silex-editor {
      min-width: ${width + 200}px;
    }
  }
`;
}
exports.setWebsiteWidthInDom = setWebsiteWidthInDom;
/**
 * get/set the description
 */
function setDescription(doc, opt_description) {
    setMeta(doc, 'description', opt_description);
}
exports.setDescription = setDescription;
/**
 * website title
 */
function setTitle(doc, name) {
    // find or create the title tag in the head section
    let titleNode = doc.head.querySelector('title');
    if (!titleNode) {
        titleNode = doc.createElement('title');
        doc.head.appendChild(titleNode);
    }
    // update website title
    titleNode.innerHTML = name || '';
}
exports.setTitle = setTitle;
/**
 * website default website language
 */
function setLang(doc, name) {
    doc.querySelector('html').lang =
        name || '';
}
exports.setLang = setLang;
/**
 * website favicon
 */
function setFaviconPath(doc, opt_path) {
    let faviconTag = doc.head.querySelector('link[rel="shortcut icon"]');
    if (!faviconTag) {
        if (opt_path) {
            faviconTag = doc.createElement('link');
            faviconTag.setAttribute('href', opt_path);
            faviconTag.setAttribute('rel', 'shortcut icon');
            doc.head.appendChild(faviconTag);
        }
    }
    else {
        if (!opt_path) {
            faviconTag.parentElement.removeChild(faviconTag);
        }
    }
    if (opt_path) {
        // update website title
        faviconTag.setAttribute('href', opt_path);
    }
}
exports.setFaviconPath = setFaviconPath;
/**
 * get/set the title for social networks
 */
function setTitleSocial(doc, opt_data) {
    setMeta(doc, 'twitter:card', opt_data ? 'summary_large_image' : '', 'name');
    setMeta(doc, 'og:type', opt_data ? 'website' : '');
    setMeta(doc, 'twitter:title', opt_data);
    setMeta(doc, 'og:title', opt_data);
}
exports.setTitleSocial = setTitleSocial;
/**
 * get/set the description for social networks
 */
function setDescriptionSocial(doc, opt_data) {
    setMeta(doc, 'twitter:card', opt_data ? 'summary' : '');
    setMeta(doc, 'twitter:description', opt_data);
    setMeta(doc, 'og:description', opt_data);
}
exports.setDescriptionSocial = setDescriptionSocial;
/**
 * get/set the thumbnail image for social networks
 */
function setThumbnailSocialPath(doc, opt_path) {
    setMeta(doc, 'twitter:card', opt_path ? 'summary' : '');
    setMeta(doc, 'twitter:image', opt_path);
    setMeta(doc, 'og:image', opt_path);
}
exports.setThumbnailSocialPath = setThumbnailSocialPath;
/**
 * get/set the twitter account
 */
function setTwitterSocial(doc, opt_data) {
    setMeta(doc, 'twitter:card', opt_data ? 'summary' : '');
    setMeta(doc, 'twitter:site', opt_data);
}
exports.setTwitterSocial = setTwitterSocial;
function setFonts(doc, fonts) {
    // remove all fonts
    Array.from(doc.head.querySelectorAll(`link.${constants_1.Constants.CUSTOM_FONTS_CSS_CLASS}`))
        .forEach((tag) => {
        tag.remove();
    });
    // add new fonts
    fonts
        .forEach((font) => {
        const link = doc.createElement('link');
        link.href = font.href;
        link.rel = 'stylesheet';
        link.className = constants_1.Constants.CUSTOM_FONTS_CSS_CLASS;
        doc.head.appendChild(link);
    });
}
exports.setFonts = setFonts;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9zaXRlLXN0b3JlL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFFSCwrQ0FBMkM7QUFHM0M7OztHQUdHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLEdBQWlCLEVBQUUsUUFBZ0I7SUFDL0QsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLHFCQUFTLENBQUMsOEJBQThCLENBQXNCLENBQUE7SUFDM0csSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLFNBQVMsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3ZDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUE7UUFDbEMsU0FBUyxDQUFDLFNBQVMsR0FBRyxxQkFBUyxDQUFDLDhCQUE4QixDQUFBO1FBQzlELEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0tBQ2hDO0lBQ0QsU0FBUyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUE7QUFDaEMsQ0FBQztBQVRELHNDQVNDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLEdBQWlCLEVBQUUsU0FBaUI7SUFDL0QsSUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLHFCQUFTLENBQUMsNkJBQTZCLENBQXFCLENBQUE7SUFDMUcsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLFVBQVUsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3ZDLFVBQVUsQ0FBQyxTQUFTLEdBQUcscUJBQVMsQ0FBQyw2QkFBNkIsQ0FBQTtRQUM5RCxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUNqQztJQUNELFVB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