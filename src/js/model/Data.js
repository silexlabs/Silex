/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview
 *   Types for Silex data objects stored in a JSON object in the HTML page of the websites
 */

goog.provide('silex.model.data.SilexId');
goog.provide('silex.model.data.StyleName');
goog.provide('silex.model.data.CssRule');
goog.provide('silex.model.data.ComponentData');
goog.provide('silex.model.data.StyleData');
goog.provide('silex.model.data.ProdotypeData');
goog.provide('silex.model.data.SilexData');
goog.provide('silex.model.data.JsonData');
goog.provide('silex.model.data.ProdotypeTypes');
goog.provide('silex.model.data.VisibilityData');
goog.provide('silex.model.data.PseudoClassData');
goog.provide('silex.model.data.Visibility');
goog.provide('silex.model.data.PseudoClass');
goog.provide('silex.model.data.TagName');
goog.provide('silex.model.data.CssPropertyName');
goog.provide('silex.model.data.CssPropertyValue');
goog.provide('silex.model.data.TemplateName');

/**
 * @typedef {!string}
 * @example "silex-id-1474394621032-2"
 */
silex.model.data.SilexId;


/**
 * @typedef {!string}
 * @example "my-style-2"
 */
silex.model.data.StyleName;


/**
 * @typedef Object<silex.model.data.CssPropertyName, silex.model.data.CssPropertyValue>
 * @example { "min-height": "100px", "background-color": "transparent" }
 */
silex.model.data.CssRule;


/**
 * @typedef {{name:string, templateName:silex.model.data.TemplateName}}
 * @example { name: "share-buttons", templateName: "share", style: "Flat Web Icon Set - Inverted" }
 */
silex.model.data.ComponentData;


/**
 * JSON object to store the data
 * @typedef {{
 *   className: silex.model.data.StyleName,
 *   displayName: string,
 *   templateName: silex.model.data.TemplateName,
 *   styles: Object<silex.model.data.Visibility, silex.model.data.VisibilityData>,
 * }}
 * @example obj will be like this: {
 *   "className": "my-style",
 *   "templateName": "text",
 *   "displayName": "My Style",
 *   "styles": {
 *     "desktop": {
 *       "normal": {
 *         "Heading2": {
 *           "font-weight": "normal"
 *         }
 *       }
 *     }
 *   }
 * }
 */
silex.model.data.StyleData;


/**
 * @typedef {{
 *    component: Object<silex.model.data.SilexId, silex.model.data.ComponentData>,
 *    style: Object<silex.model.data.StyleName, silex.model.data.StyleData>,
 * }}
 */
silex.model.data.ProdotypeData;


/**
 * @typedef {Object<silex.model.data.SilexId, silex.model.data.CssRule>}
 */
silex.model.data.SilexData;


/**
 * @typedef {{
 *   desktop: silex.model.data.SilexData,
 *   mobile: silex.model.data.SilexData,
 *   prodotypeData: silex.model.data.ProdotypeData
 * }}
 */
silex.model.data.JsonData;


/**
 * @enum {string}
 */
silex.model.data.ProdotypeTypes = {
  COMPONENT: 'component',
  STYLE: 'style',
};


/**
 * JSON object to store the data
 * @typedef {Object<silex.model.data.PseudoClass, silex.model.data.PseudoClassData>}
 */
silex.model.data.VisibilityData;


/**
 * JSON object to store the data
 * This is the data we get/put from/to Prodotype with the "text" template
 * @typedef {Object<silex.model.data.TagName|string, silex.model.data.CssRule|silex.model.data.TemplateName|silex.model.data.StyleName>}
 */
silex.model.data.PseudoClassData;


/**
 * @typedef {!string}
 * @example desktop
 * @example mobile
 */
silex.model.data.Visibility;


/**
 * @typedef {!string}
 * @example "normal"
 * @example ":hover"
 */
silex.model.data.PseudoClass;


/**
 * @typedef {!string}
 * @example "P"
 * @example "H1"
 */
silex.model.data.TagName;


/**
 * @typedef {!string}
 * @example "min-height"
 */
silex.model.data.CssPropertyName;


/**
 * @typedef {!string}
 * @example "2px"
 */
silex.model.data.CssPropertyValue;


/**
 * @typedef {!string}
 * @example "text"
 */
silex.model.data.TemplateName;
