/**
 * @fileoverview Constants and types shared between front and back
 *
 */

import { ElementType } from './client/element-store/types'

export class Constants {
  /**
   * value which starts a "deep link", i.e. the page name in the URL, in preview mode only
   */
  static PAGE_NAME_PREFIX = '#!'

  /**
   * prepended to page ids in order to minimize risks of collision, i.e. `page-page-1" for page "Page 1"
   */
  static PAGE_ID_PREFIX = 'page-'

  /**
   * constant for the ID of the HTML node used
   * to store Silex data as a JSON object
   * this is used as the front end API, see front-end.js
   */
  static JSON_STYLE_TAG_CLASS_NAME = 'silex-json-styles'

  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime'

  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor'

  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME = 'silex-published'

  /**
   * constant for the class name of elements visible only on some pages
   */
  static PAGED_CLASS_NAME: string = 'paged-element'

  /**
   * constant for the class name set on the body when the pageable plugin is
   * initialized
   */
  static PAGEABLE_PLUGIN_READY_CLASS_NAME: string = 'pageable-plugin-created'

  /**
   * constant for the class name of elements visible only on some pages
   */
  static PAGED_HIDDEN_CLASS_NAME: string = 'paged-element-hidden'

  /**
   * constant for the class name of element containing the pages
   */
  static PAGES_CONTAINER_CLASS_NAME: string = 'silex-pages'

  /**
   * attributes of the page (on one of the invisible links which define pages)
   */
  static PAGE_PREVENT_DELETE = 'data-prevent-delete'

  /**
   * attributes of the page (on one of the invisible links which define pages)
   */
  static PAGE_PREVENT_MOVE = 'data-prevent-delete'

  /**
   * attributes of the page (on one of the invisible links which define pages)
   */
  static PAGE_PREVENT_RENAME = 'data-prevent-rename'

   /**
    * attributes of the page (on one of the invisible links which define pages)
    */
  static PAGE_PREVENT_PROPERTIES = 'data-prevent-properties'

  /**
   * constant for the class name of elements when it is in a visible page
   * this css class is set in pageable.js
   */
  static PAGED_VISIBLE_CLASS_NAME: string = 'paged-element-visible'

  /**
   * constant for the class name of links when it links to a visible page
   * this css class is set in pageable.js
   */
  static PAGE_LINK_ACTIVE_CLASS_NAME: string = 'page-link-active'

  /**
   * constant for silex element type
   */
  static TYPE_PAGE: string = 'page-element'

  /**
   * constant for silex element type
   */
  static TYPE_ATTR: string = 'data-silex-type'

  /**
   * constant for the attribute name holding the IDs given to Silex editable
   * elements
   */
  static ELEMENT_ID_ATTR_NAME = 'data-silex-id'

  /**
   * constant for the attribute name holding the IDs given to Silex editable
   * elements
   */
  static STATIC_ASSET_ATTR = 'data-silex-static'

  static ATTR_REMOVE_PUBLISH = 'data-silex-remove-publish'

  /**
   * constant for the class name of the element content
   */
  static ELEMENT_CONTENT_CLASS_NAME: string = 'silex-element-content'

  /**
   * constant for the class name of the default site width, rule is set when
   * setting is changed used to set a default width to section content container
   */
  static WEBSITE_WIDTH_CLASS_NAME: string = 'website-width'

  /**
   * constant for the attribute name of the links
   */
  static LINK_ATTR: string = 'href'

  /**
   * Not sure why this is added, must be ignored
   */
  static STAGE_COMPONENT_SELECTED_CLASS_NAME: string = 'selected'

  /**
   * Not sure why this is added, must be ignored
   */
  static STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME: string = 'not-selected'

  /**
   * constant for the class name of selected components
   */
  static SELECTED_CLASS_NAME: string = 'silex-selected'

  /**
   * css class on the body while draggin/resizeing
   */
  static RESIZING_CLASS_NAME: string = 'silex-resizing'

  /**
   * css class on the body while draggin/resizeing
   */
  static DRAGGING_CLASS_NAME: string = 'silex-dragging'

  /**
   * class for elements which are hidden in mobile version
   */
  static HIDE_ON_MOBILE: string = 'hide-on-mobile'

  /**
   * class for elements which are hidden in desktop version
   */
  static HIDE_ON_DESKTOP: string = 'hide-on-desktop'

  /**
   * class name used by the editable jquery plugin
   */
  static EDITABLE_CLASS_NAME: string = 'editable-style'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_CLASS_NAME: string = 'prevent-resizable'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_TOP_CLASS_NAME: string = 'prevent-resizable-top'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_LEFT_CLASS_NAME: string = 'prevent-resizable-left'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_BOTTOM_CLASS_NAME: string = 'prevent-resizable-bottom'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_RIGHT_CLASS_NAME: string = 'prevent-resizable-right'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_SELECTABLE_CLASS_NAME: string = 'prevent-selectable'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_DRAGGABLE_CLASS_NAME: string = 'prevent-draggable'

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_DROPPABLE_CLASS_NAME: string = 'prevent-droppable'

  /**
   * class name which can be used to force Silex to use height instead of
   * minHeight to set the height of an element this is useful if the element has
   * content with height set to 100%
   */
  static SILEX_USE_HEIGHT_NOT_MINHEIGHT: string = 'silex-use-height-not-minheight'

  /**
   * id of the style element which holds silex editable css styles
   */
  static SILEX_STYLE_ELEMENT_CSS_CLASS = 'silex-style'

  /**
   * id of the style element which holds silex editable css styles
   */
  static SILEX_SCRIPT_ELEMENT_CSS_CLASS = 'silex-script'

  /**
   * attribute on prodotype dependencies
   * these script and style tags are not prevented when preparing the site for edition, unlike normal scripts
   */
  static PRODOTYPE_DEPENDENCY_ATTR = 'data-dependency'

  /**
   * css class which marks the tags added to load a custom font
   */
  static CUSTOM_FONTS_CSS_CLASS = 'silex-custom-font'

  /**
   * css class set to enable mobile version
   */
  static ENABLE_MOBILE_CSS_CLASS = 'enable-mobile'

  /**
   * CSS class applied to the **editor** body (not the site)
   */
  static MOBILE_MODE_CSS_CLASS = 'mobile-mode'

  /**
   * constant for loader on elements
   * applied to Silex image element
   */
  static LOADING_ELEMENT_CSS_CLASS: string = 'loading-image'

  /**
   * constant for loader on elements
   * applied to site iframe
   */
  static LOADING_SITE_CSS_CLASS = 'loading-website'

  /**
   * constant for loader on elements
   * applied to body
   */
  static LOADING_SILEX_CSS_CLASS = 'loading-pending'

  /**
   * constant for the value of media query for mobile version
   * @static
   */
  static MOBILE_BREAKPOINT = 480
  static MOBILE_MEDIA_QUERY = `only screen and (max-width: ${Constants.MOBILE_BREAKPOINT}px)`

  // head tag constants
  static SILEX_CURRENT_PAGE_ID = 'current-page-style'
  static SILEX_TEMP_TAGS_CSS_CLASS = 'silex-temp-tag'
  static RISZE_HANDLE_CSS_CLASS = 'ui-resizable-handle'
  static INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles'
  static HEAD_TAG_START = '<!-- Silex HEAD tag do not remove -->'
  static HEAD_TAG_STOP = '<!-- End of Silex HEAD tag do not remove -->'

  // prodotype components constants
  static COMPONENT_CLASS_NAME = 'silex-component'
  static STYLE_CLASS_NAME = 'silex-prodotype-style'
  static BODY_STYLE_NAME = 'All style'
  static BODY_STYLE_CSS_CLASS = 'all-style'
  static EMPTY_STYLE_CLASS_NAME = 'empty-style-class-name'
  static EMPTY_STYLE_DISPLAY_NAME = ''
  static COMPONENT_TYPE = 'component'
  static STYLE_TYPE = 'style'
  // available visibility for the styles
  static STYLE_VISIBILITY = ['desktop', 'mobile']

  /**
   * Class names which are of internal use in Silex
   * Remove them from breadcrumb component and "css classes" text field of the style-pane
   * FIXME: this should not exist, we should use properties on the element data object, and add css classes to the DOM element without adding it to the element data's classList
   */
  static SILEX_CLASS_NAMES: string[] = [
    Constants.WEBSITE_WIDTH_CLASS_NAME,
  ]
  /**
   * Classes to remove when saving
   * This seems to be useless
   */
  static SILEX_TEMP_CLASS_NAMES = [
    Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    Constants.PAGED_HIDDEN_CLASS_NAME,
    Constants.PAGED_VISIBLE_CLASS_NAME,
  //   Constants.STAGE_COMPONENT_SELECTED_CLASS_NAME,
  //   Constants.STAGE_COMPONENT_NOT_SELECTED_CLASS_NAME,
  //   Constants.SELECTED_CLASS_NAME,
  //   Constants.RESIZING_CLASS_NAME,
  //   Constants.DRAGGING_CLASS_NAME,
  ]
  /**
   * Classes to remove when publishing
   * This seems to be useless
   */
  static SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH = [
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
  ]
  /**
   * Elements to remove from the DOM after publishing
   */
  static ELEMENTS_TO_REMOVE_AT_PUBLISH = [
    '.prodotype-preview',
    '[' + Constants.ATTR_REMOVE_PUBLISH + ']'
  ]
}
