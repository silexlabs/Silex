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

export type StyleName = string;

export interface CssRule {
  [key: string]: CssPropertyValue;
}

export interface ComponentData {
  name: string;
  displayName?: string;
  templateName: TemplateName;
}

export interface StyleData {
  className: StyleName;
  displayName: string;
  templateName: TemplateName;
  styles: {[key: string]: VisibilityData};
}

export interface ProdotypeData {
  component: {[key: string]: ComponentData};
  style: {[key: string]: StyleData};
}

export interface SilexData {
  [key: string]: CssRule;
}

// export interface JsonData {
//   desktop: SilexData;
//   mobile: SilexData;
//   prodotypeData: ProdotypeData;
// }

// FIXME: still used for text styles, remove this as it is useless with the new model
export enum ProdotypeTypes {
  COMPONENT = 'component',
  STYLE = 'style',
}
export interface VisibilityData {
  [key: string]: PseudoClassData;
}
export interface PseudoClassData {
  [key: string]: CssRule|TemplateName|StyleName;
}
export type Visibility = string;

export type PseudoClass = string;

export type TagName = string;

export type CssPropertyName = string;

export type CssPropertyValue = string;

export type TemplateName = string;
