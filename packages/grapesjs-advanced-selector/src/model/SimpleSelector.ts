
/**
 * @fileoverview The model types and functions for the simple selector
 * A Simple selector is made of a list of simple selectors, e.g `div`, `.class`, `#id`, `[attr=^value]`
 */

/**
 * The type of the simple selector
 */
export enum SimpleSelectorType {
  TAG = 'tag',
  CUSTOM_TAG = 'custom-tag',
  CLASS = 'class',
  ID = 'id',
  ATTRIBUTE = 'attribute',
  UNIVERSAL = 'universal',
}

/**
 * The type for tag selectors
 */
export type TAG = 'a' | 'abbr' | 'address' | 'area' | 'article' | 'aside' | 'audio' | 'b' | 'base' | 'bdi' | 'bdo' | 'blockquote' | 'body' | 'br' | 'button' | 'canvas' | 'caption' | 'cite' | 'code' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'embed' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'head' | 'header' | 'hgroup' | 'hr' | 'html' | 'i' | 'iframe' | 'img' | 'input' | 'ins' | 'kbd' | 'label' | 'legend' | 'li' | 'link' | 'main' | 'map' | 'mark' | 'meta' | 'meter' | 'nav' | 'noscript' | 'object' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'param' | 'picture' | 'pre' | 'progress' | 'q' | 'rb' | 'rp' | 'rt' | 'rtc' | 'ruby' | 's' | 'samp' | 'script' | 'section' | 'select' | 'slot' | 'small' | 'source' | 'span' | 'strong' | 'style' | 'sub' | 'summary' | 'sup' | 'table' | 'tbody' | 'td' | 'template' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'title' | 'tr' | 'track' | 'u' | 'ul' | 'var' | 'video' | 'wbr'

/**
 * The list of supported tags, attributes and attribute operators
 */
export const TAGS: TAG[] = [ 'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr' ]
export const ATTRIBUTES = ['id', 'class', 'style', 'name', 'type', 'value', 'placeholder', 'href', 'src', 'alt', 'title', 'width', 'height', 'disabled', 'checked', 'selected', 'hidden', 'readonly', 'multiple', 'required', 'min', 'max', 'step', 'pattern', 'autocomplete', 'autofocus', 'spellcheck', 'contenteditable', 'dir', 'lang', 'tabindex', 'accesskey', 'role']
export const ATTRIBUTE_OPERATORS = ['=', '~=', '|=', '^=', '$=', '*=']
export const SELECTOR_PREFIXES = ['.', '#', '[', '*']
export const SELECTOR_OPERATORS = [' ', '>', '+', '~']

/**
 * A simple selector interface
 * This is a virtual interface to be overridden by the specific simple selector types
 */
export interface SimpleSelector {
  type: SimpleSelectorType
  active: boolean
}

export interface SimpleSelectorWithCreateText extends SimpleSelector {
  createText?: string
}

export interface TagSelector extends SimpleSelector {
  type: SimpleSelectorType.TAG
  value: TAG
}

export interface IdSelector extends SimpleSelector {
  type: SimpleSelectorType.ID
  value: string
}

export interface ClassSelector extends SimpleSelector {
  type: SimpleSelectorType.CLASS
  value: string
}

export interface AttributeSelector extends SimpleSelector {
  type: SimpleSelectorType.ATTRIBUTE
  value: string
  operator?: '=' | '~=' | '|=' | '^=' | '$=' | '*='
  attributeValue?: string
}

export interface UniversalSelector extends SimpleSelector {
  type: SimpleSelectorType.UNIVERSAL
}

export interface CustomTagSelector extends SimpleSelector {
  type: SimpleSelectorType.CUSTOM_TAG
  value: string
}
