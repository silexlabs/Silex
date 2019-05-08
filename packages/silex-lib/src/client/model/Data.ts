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
 *   Types for Silex data objects stored in a JSON object in the HTML page of
 * the websites
 */
export type SilexId = string;

export type StyleName = string;

export type CssRule = {
  [key: string]: CssPropertyValue
};

export type ComponentData = {
  name: string,
  displayName?: string,
  templateName: TemplateName
};

export type StyleData = {
  className: StyleName,
  displayName: string,
  templateName: TemplateName,
  styles: {[key: string]: VisibilityData}
};

export type ProdotypeData = {
  component: {[key: string]: ComponentData},
  style: {[key: string]: StyleData}
};

export type SilexData = {
  [key: string]: CssRule
};

export type JsonData = {
  desktop: SilexData,
  mobile: SilexData,
  prodotypeData: ProdotypeData
};

export enum ProdotypeTypes {
  COMPONENT = 'component',
  STYLE = 'style'
}
export type VisibilityData = {
  [key: string]: PseudoClassData
};
export type PseudoClassData = {
  [key: string]: CssRule|TemplateName|StyleName
};
export type Visibility = string;

export type PseudoClass = string;

export type TagName = string;

export type CssPropertyName = string;

export type CssPropertyValue = string;

export type TemplateName = string;
