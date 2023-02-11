"use strict";
/**
 * @fileoverview Constants and types shared between front and back
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
class Constants {
}
exports.Constants = Constants;
/**
 * value which starts a "deep link", i.e. the page name in the URL, in preview mode only
 */
Constants.PAGE_NAME_PREFIX = '#!';
/**
 * prepended to page ids in order to minimize risks of collision, i.e. `page-page-1" for page "Page 1"
 */
Constants.PAGE_ID_PREFIX = 'page-';
/**
 * constant for the ID of the HTML node used
 * to store Silex data as a JSON object
 * this is used as the front end API, see front-end.js
 */
Constants.JSON_STYLE_TAG_CLASS_NAME = 'silex-json-styles';
/**
 * constant for the class name set on the body depending on the context in which is the website
 */
Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime';
/**
 * constant for the class name set on the body depending on the context in which is the website
 */
Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor';
/**
 * constant for the class name set on the body depending on the context in which is the website
 */
Constants.WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME = 'silex-published';
/**
 * constant for the class name of elements visible only on some pages
 */
Constants.PAGED_CLASS_NAME = 'paged-element';
/**
 * constant for the class name set on the body when the pageable plugin is
 * initialized
 */
Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME = 'pageable-plugin-created';
/**
 * constant for the class name of elements visible only on some pages
 */
Constants.PAGED_HIDDEN_CLASS_NAME = 'paged-element-hidden';
/**
 * constant for the class name of element containing the pages
 */
Constants.PAGES_CONTAINER_CLASS_NAME = 'silex-pages';
/**
 * attributes of the page (on one of the invisible links which define pages)
 */
Constants.PAGE_PREVENT_DELETE = 'data-prevent-delete';
/**
 * attributes of the page (on one of the invisible links which define pages)
 */
Constants.PAGE_PREVENT_MOVE = 'data-prevent-delete';
/**
 * attributes of the page (on one of the invisible links which define pages)
 */
Constants.PAGE_PREVENT_RENAME = 'data-prevent-rename';
/**
 * attributes of the page (on one of the invisible links which define pages)
 */
Constants.PAGE_PREVENT_PROPERTIES = 'data-prevent-properties';
/**
 * constant for the class name of elements when it is in a visible page
 * this css class is set in pageable.js
 */
Constants.PAGED_VISIBLE_CLASS_NAME = 'paged-element-visible';
/**
 * constant for the class name of links when it links to a visible page
 * this css class is set in pageable.js
 */
Constants.PAGE_LINK_ACTIVE_CLASS_NAME = 'page-link-active';
/**
 * constant for silex element type
 */
Constants.TYPE_PAGE = 'page-element';
/**
 * constant for silex element type
 */
Constants.TYPE_ATTR = 'data-silex-type';
/**
 * constant for the attribute name holding the IDs given to Silex editable
 * elements
 */
Constants.ELEMENT_ID_ATTR_NAME = 'data-silex-id';
/**
 * constant for the attribute name holding the IDs given to Silex editable
 * elements
 */
Constants.STATIC_ASSET_ATTR = 'data-silex-static';
Constants.ATTR_REMOVE_PUBLISH = 'data-silex-remove-publish';
/**
 * constant for the class name of the element content
 */
Constants.ELEMENT_CONTENT_CLASS_NAME = 'silex-element-content';
/**
 * constant for the class name of the default site width, rule is set when
 * setting is changed used to set a default width to section content container
 */
Constants.WEBSITE_WIDTH_CLASS_NAME = 'website-width';
/**
 * constant for the attribute name of the links
 */
Constants.LINK_ATTR = 'href';
/**
 * Not sure why this is added, must be ignored
 */
Constants.STAGE_COMPONENT_SELECTED_CLASS_NAME = 'selected';
/**
 * Not sure why this is added, must be ignored
 */
Constants.STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME = 'not-selected';
/**
 * constant for the class name of selected components
 */
Constants.SELECTED_CLASS_NAME = 'silex-selected';
/**
 * css class on the body while draggin/resizeing
 */
Constants.RESIZING_CLASS_NAME = 'silex-resizing';
/**
 * css class on the body while draggin/resizeing
 */
Constants.DRAGGING_CLASS_NAME = 'silex-dragging';
/**
 * class for elements which are hidden in mobile version
 */
Constants.HIDE_ON_MOBILE = 'hide-on-mobile';
/**
 * class for elements which are hidden in desktop version
 */
Constants.HIDE_ON_DESKTOP = 'hide-on-desktop';
/**
 * class name used by the editable jquery plugin
 */
Constants.EDITABLE_CLASS_NAME = 'editable-style';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_RESIZABLE_CLASS_NAME = 'prevent-resizable';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME = 'prevent-resizable-top';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME = 'prevent-resizable-left';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME = 'prevent-resizable-bottom';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME = 'prevent-resizable-right';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_SELECTABLE_CLASS_NAME = 'prevent-selectable';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_DRAGGABLE_CLASS_NAME = 'prevent-draggable';
/**
 * class name which can be used to change params of the stage
 */
Constants.PREVENT_DROPPABLE_CLASS_NAME = 'prevent-droppable';
/**
 * class name which can be used to force Silex to use height instead of
 * minHeight to set the height of an element this is useful if the element has
 * content with height set to 100%
 */
Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT = 'silex-use-height-not-minheight';
/**
 * id of the style element which holds silex editable css styles
 */
Constants.SILEX_STYLE_ELEMENT_CSS_CLASS = 'silex-style';
/**
 * id of the style element which holds silex editable css styles
 */
Constants.SILEX_SCRIPT_ELEMENT_CSS_CLASS = 'silex-script';
/**
 * attribute on prodotype dependencies
 * these script and style tags are not prevented when preparing the site for edition, unlike normal scripts
 */
Constants.PRODOTYPE_DEPENDENCY_ATTR = 'data-dependency';
/**
 * css class which marks the tags added to load a custom font
 */
Constants.CUSTOM_FONTS_CSS_CLASS = 'silex-custom-font';
/**
 * css class set to enable mobile version
 */
Constants.ENABLE_MOBILE_CSS_CLASS = 'enable-mobile';
/**
 * CSS class applied to the **editor** body (not the site)
 */
Constants.MOBILE_MODE_CSS_CLASS = 'mobile-mode';
/**
 * constant for loader on elements
 * applied to Silex image element
 */
Constants.LOADING_ELEMENT_CSS_CLASS = 'loading-image';
/**
 * constant for loader on elements
 * applied to site iframe
 */
Constants.LOADING_SITE_CSS_CLASS = 'loading-website';
/**
 * constant for loader on elements
 * applied to body
 */
Constants.LOADING_SILEX_CSS_CLASS = 'loading-pending';
/**
 * constant for the value of media query for mobile version
 * @static
 */
Constants.MOBILE_BREAKPOINT = 480;
Constants.MOBILE_MEDIA_QUERY = `only screen and (max-width: ${Constants.MOBILE_BREAKPOINT}px)`;
// head tag constants
Constants.SILEX_CURRENT_PAGE_ID = 'current-page-style';
Constants.SILEX_TEMP_TAGS_CSS_CLASS = 'silex-temp-tag';
Constants.RISZE_HANDLE_CSS_CLASS = 'ui-resizable-handle';
Constants.INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles';
Constants.HEAD_TAG_START = '<!-- Silex HEAD tag do not remove -->';
Constants.HEAD_TAG_STOP = '<!-- End of Silex HEAD tag do not remove -->';
// prodotype components constants
Constants.COMPONENT_CLASS_NAME = 'silex-component';
Constants.STYLE_CLASS_NAME = 'silex-prodotype-style';
Constants.BODY_STYLE_NAME = 'All style';
Constants.BODY_STYLE_CSS_CLASS = 'all-style';
Constants.EMPTY_STYLE_CLASS_NAME = 'empty-style-class-name';
Constants.EMPTY_STYLE_DISPLAY_NAME = '';
Constants.COMPONENT_TYPE = 'component';
Constants.STYLE_TYPE = 'style';
// available visibility for the styles
Constants.STYLE_VISIBILITY = ['desktop', 'mobile'];
/**
 * Class names which are of internal use in Silex
 * Remove them from breadcrumb component and "css classes" text field of the style-pane
 * FIXME: this should not exist, we should use properties on the element data object, and add css classes to the DOM element without adding it to the element data's classList
 */
Constants.SILEX_CLASS_NAMES = [
    Constants.WEBSITE_WIDTH_CLASS_NAME,
];
/**
 * Classes to remove when saving
 * This seems to be useless
 */
Constants.SILEX_TEMP_CLASS_NAMES = [
    Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    Constants.PAGED_HIDDEN_CLASS_NAME,
    Constants.PAGED_VISIBLE_CLASS_NAME,
];
/**
 * Classes to remove when publishing
 * This seems to be useless
 */
Constants.SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH = [
//   Constants.PREVENT_DROPPABLE_CLASS_NAME,
//   Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT,
//   Constants.PREVENT_RESIZABLE_CLASS_NAME,
//   Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
//   Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
//   Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
//   Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
//   Constants.PREVENT_SELECTABLE_CLASS_NAME,
//   Constants.PREVENT_DRAGGABLE_CLASS_NAME,
//   Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
//   Constants.STAGE_COMPONENT_SELECTED_CLASS_NAME,
//   Constants.STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME,
//   Constants.SELECTED_CLASS_NAME,
//   Constants.RESIZING_CLASS_NAME,
//   Constants.DRAGGING_CLASS_NAME,
];
/**
 * Elements to remove from the DOM after publishing
 */
Constants.ELEMENTS_TO_REMOVE_AT_PUBLISH = [
    '.prodotype-preview',
    '[' + Constants.ATTR_REMOVE_PUBLISH + ']'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RzL2NvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFJSCxNQUFhLFNBQVM7O0FBQXRCLDhCQW1WQztBQWxWQzs7R0FFRztBQUNJLDBCQUFnQixHQUFHLElBQUksQ0FBQTtBQUU5Qjs7R0FFRztBQUNJLHdCQUFjLEdBQUcsT0FBTyxDQUFBO0FBRS9COzs7O0dBSUc7QUFDSSxtQ0FBeUIsR0FBRyxtQkFBbUIsQ0FBQTtBQUV0RDs7R0FFRztBQUNJLDRDQUFrQyxHQUFHLGVBQWUsQ0FBQTtBQUUzRDs7R0FFRztBQUNJLDJDQUFpQyxHQUFHLGNBQWMsQ0FBQTtBQUV6RDs7R0FFRztBQUNJLDhDQUFvQyxHQUFHLGlCQUFpQixDQUFBO0FBRS9EOztHQUVHO0FBQ0ksMEJBQWdCLEdBQVcsZUFBZSxDQUFBO0FBRWpEOzs7R0FHRztBQUNJLDBDQUFnQyxHQUFXLHlCQUF5QixDQUFBO0FBRTNFOztHQUVHO0FBQ0ksaUNBQXVCLEdBQVcsc0JBQXNCLENBQUE7QUFFL0Q7O0dBRUc7QUFDSSxvQ0FBMEIsR0FBVyxhQUFhLENBQUE7QUFFekQ7O0dBRUc7QUFDSSw2QkFBbUIsR0FBRyxxQkFBcUIsQ0FBQTtBQUVsRDs7R0FFRztBQUNJLDJCQUFpQixHQUFHLHFCQUFxQixDQUFBO0FBRWhEOztHQUVHO0FBQ0ksNkJBQW1CLEdBQUcscUJBQXFCLENBQUE7QUFFakQ7O0dBRUc7QUFDRyxpQ0FBdUIsR0FBRyx5QkFBeUIsQ0FBQTtBQUUxRDs7O0dBR0c7QUFDSSxrQ0FBd0IsR0FBVyx1QkFBdUIsQ0FBQTtBQUVqRTs7O0dBR0c7QUFDSSxxQ0FBMkIsR0FBVyxrQkFBa0IsQ0FBQTtBQUUvRDs7R0FFRztBQUNJLG1CQUFTLEdBQVcsY0FBYyxDQUFBO0FBRXpDOztHQUVHO0FBQ0ksbUJBQVMsR0FBVyxpQkFBaUIsQ0FBQTtBQUU1Qzs7O0dBR0c7QUFD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