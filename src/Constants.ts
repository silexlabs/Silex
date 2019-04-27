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
 * @fileoverview Constants shared between front and back
 *
 */

export class Constants {
  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_RUNTIME_CLASS_NAME = 'silex-runtime';

  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_EDITOR_CLASS_NAME = 'silex-editor';

  /**
   * constant for the class name set on the body depending on the context in which is the website
   */
  static WEBSITE_CONTEXT_PUBLISHED_CLASS_NAME = 'silex-published';

  /**
   * constant for the class name of elements visible only on some pages
   */
  static PAGED_CLASS_NAME: string = 'paged-element';

  /**
   * constant for the class name set on the body when the pageable plugin is
   * initialized
   */
  static PAGEABLE_PLUGIN_READY_CLASS_NAME: string = 'pageable-plugin-created';

  /**
   * constant for the class name of elements visible only on some pages
   */
  static PAGED_HIDDEN_CLASS_NAME: string = 'paged-element-hidden';

  /**
   * constant for the class name of element containing the pages
   */
  static PAGES_CONTAINER_CLASS_NAME: string = 'silex-pages';

  /**
   * constant for the class name of elements when it is in a visible page
   * this css class is set in pageable.js
   */
  static PAGED_VISIBLE_CLASS_NAME: string = 'paged-element-visible';

  /**
   * constant for the class name of links when it links to a visible page
   * this css class is set in pageable.js
   */
  static PAGE_LINK_ACTIVE_CLASS_NAME: string = 'page-link-active';

  /**
   * constant for loader on elements
   */
  static LOADING_ELEMENT_CSS_CLASS: string = 'loading-image';

  /**
   * constant for silex element type
   */
  static TYPE_PAGE: string = 'page-element';

  /**
   * constant for silex element type
   */
  static TYPE_CONTAINER: string = 'container-element';

  /**
   * constant for silex element type
   */
  static TYPE_SECTION: string = 'section-element';

  /**
   * constant for the content element of a section, which is also a container
   */
  static TYPE_CONTAINER_CONTENT: string = 'silex-container-content';

  /**
   * constant for silex element type
   */
  static TYPE_IMAGE: string = 'image-element';

  /**
   * constant for silex element type
   */
  static TYPE_TEXT: string = 'text-element';

  /**
   * constant for silex element type
   */
  static TYPE_HTML: string = 'html-element';

  /**
   * constant for silex element type
   */
  static TYPE_ATTR: string = 'data-silex-type';

  /**
   * constant for the attribute name holding the IDs given to Silex editable
   * elements
   */
  static ELEMENT_ID_ATTR_NAME = 'data-silex-id';

  /**
   * constant for the attribute name holding the IDs given to Silex editable
   * elements
   */
  static STATIC_ASSET_ATTR = 'data-silex-static';

  /**
   * constant for the class name of the element content
   */
  static ELEMENT_CONTENT_CLASS_NAME: string = 'silex-element-content';

  /**
   * constant for the class name of the default site width, rule is set when
   * setting is changed used to set a default width to section content container
   */
  static WEBSITE_WIDTH_CLASS_NAME: string = 'website-width';

  /**
   * constant for the attribute name of the links
   */
  static LINK_ATTR: string = 'data-silex-href';

  /**
   * constant for the class name of selected components
   */
  static SELECTED_CLASS_NAME: string = 'silex-selected';

  /**
   * class for elements which are hidden in mobile version
   */
  static HIDE_ON_MOBILE: string = 'hide-on-mobile';

  /**
   * class for elements which are hidden in desktop version
   */
  static HIDE_ON_DESKTOP: string = 'hide-on-desktop';

  /**
   * class name used by the editable jquery plugin
   */
  static EDITABLE_CLASS_NAME: string = 'editable-style';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_CLASS_NAME: string = 'prevent-resizable';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_TOP_CLASS_NAME: string = 'prevent-resizable-top';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_LEFT_CLASS_NAME: string = 'prevent-resizable-left';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_BOTTOM_CLASS_NAME: string = 'prevent-resizable-bottom';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_RESIZABLE_RIGHT_CLASS_NAME: string = 'prevent-resizable-right';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_SELECTABLE_CLASS_NAME: string = 'prevent-selectable';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_DRAGGABLE_CLASS_NAME: string = 'prevent-draggable';

  /**
   * class name which can be used to change params of the stage
   */
  static PREVENT_DROPPABLE_CLASS_NAME: string = 'prevent-droppable';

  /**
   * class name which can be used to force Silex to use height instead of
   * minHeight to set the height of an element this is useful if the element has
   * content with height set to 100%
   */
  static SILEX_USE_HEIGHT_NOT_MINHEIGHT: string = 'silex-use-height-not-minheight';

  /**
   * id of the style element which holds silex editable css styles
   */
  static SILEX_STYLE_ELEMENT_CSS_CLASS = 'silex-style';

  /**
   * id of the style element which holds silex editable css styles
   */
  static SILEX_SCRIPT_ELEMENT_CSS_CLASS = 'silex-script';

  /**
   * css class which marks the tags added to load a custom font
   */
  static CUSTOM_FONTS_CSS_CLASS = 'silex-custom-font';

  /**
   * css class set to enable mobile version
   */
  static ENABLE_MOBILE_CSS_CLASS = 'enable-mobile';

  // head tag constants
  static SILEX_CURRENT_PAGE_ID = 'current-page-style';
  static SILEX_TEMP_TAGS_CSS_CLASS = 'silex-temp-tag';
  static RISZE_HANDLE_CSS_CLASS = 'ui-resizable-handle';
  static JSON_STYLE_TAG_CLASS_NAME = 'silex-json-styles';
  static INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles';
  static HEAD_TAG_START = '<!-- Silex HEAD tag do not remove -->';
  static HEAD_TAG_STOP = '<!-- End of Silex HEAD tag do not remove -->';

  // prodotype components constants
  static COMPONENT_CLASS_NAME = 'silex-component';
  static STYLE_CLASS_NAME = 'silex-prodotype-style';
  static BODY_STYLE_NAME = 'All style';
  static BODY_STYLE_CSS_CLASS = 'all-style';
  static EMPTY_STYLE_CLASS_NAME = 'empty-style-class-name';
  static EMPTY_STYLE_DISPLAY_NAME = '';
  static COMPONENT_TYPE = 'component';
  static STYLE_TYPE = 'style';
  // available visibility for the styles
  static STYLE_VISIBILITY = ['desktop', 'mobile'];

  /**
   * Class names which are of internal use in Silex
   * Remove them from breadcrumb component and "css classes" text field of the style-pane
   */
  static SILEX_CLASS_NAMES: string[] = [
    Constants.PREVENT_DROPPABLE_CLASS_NAME,
    Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT,
    Constants.PREVENT_RESIZABLE_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
    Constants.PREVENT_SELECTABLE_CLASS_NAME,
    Constants.PREVENT_DRAGGABLE_CLASS_NAME,
    Constants.EDITABLE_CLASS_NAME,
    Constants.ENABLE_MOBILE_CSS_CLASS,
    Constants.PAGED_CLASS_NAME,
    Constants.PAGED_HIDDEN_CLASS_NAME,
    Constants.PAGED_VISIBLE_CLASS_NAME,
    Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    Constants.PAGE_LINK_ACTIVE_CLASS_NAME,
    Constants.SELECTED_CLASS_NAME,
    Constants.ELEMENT_CONTENT_CLASS_NAME,
    // useful to hide it when the content container of a section is selected
    Constants.TYPE_CONTAINER_CONTENT,
    // useful to hide it when the content container of a section is selected
    Constants.WEBSITE_WIDTH_CLASS_NAME,
    Constants.TYPE_CONTAINER,
    Constants.TYPE_SECTION,
    Constants.TYPE_IMAGE,
    Constants.TYPE_TEXT,
    Constants.TYPE_HTML,
    Constants.HIDE_ON_MOBILE,
    Constants.COMPONENT_CLASS_NAME,
  ];
  /**
   * Classes to remove when saving
   */
  static SILEX_TEMP_CLASS_NAMES = [
    Constants.PAGE_LINK_ACTIVE_CLASS_NAME,
    Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    Constants.PAGED_HIDDEN_CLASS_NAME,
    Constants.PAGED_VISIBLE_CLASS_NAME,
    Constants.SELECTED_CLASS_NAME,
  ];
  /**
   * Classes to remove when publishing
   * FIXME: ?this array should not contain the elements already in SILEX_TEMP_CLASS_NAMES as they are removed at save?
   */
  static SILEX_CLASS_NAMES_TO_REMOVE_AT_PUBLISH = [
    Constants.PREVENT_DROPPABLE_CLASS_NAME,
    Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT,
    Constants.PREVENT_RESIZABLE_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME,
    Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME,
    Constants.PREVENT_SELECTABLE_CLASS_NAME,
    Constants.PREVENT_DRAGGABLE_CLASS_NAME,
    Constants.PAGED_CLASS_NAME,
    Constants.PAGED_HIDDEN_CLASS_NAME,
    Constants.PAGED_VISIBLE_CLASS_NAME,
    Constants.PAGEABLE_PLUGIN_READY_CLASS_NAME,
    Constants.PAGE_LINK_ACTIVE_CLASS_NAME,
    Constants.SELECTED_CLASS_NAME,
  ];
}
