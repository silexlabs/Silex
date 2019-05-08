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
 * @fileoverview define externs for libs used in Silex
 */

import { ComponentData } from './model/Data';

/**
 * @typedef {{
 *          faIconClass:?string,
 *          initialCss:?Array,
 *          initialCssContentContainer:?Array,
 *          initialCssClass:?Array,
 *          baseElement:?string,
 *          name:?string,
 *          category:?string,
 *          isPrivate:?boolean
 *          }}
 */
export interface ProdotypeCompDef {
  faIconClass?: string,
  initialCss?: Array<any>,
  initialCssContentContainer?: Array<any>,
  initialCssClass?: Array<any>,
  baseElement?: string,
  name?: string,
  category?: string,
  isPrivate?: boolean
};


/**
 * Prodotype
 * @see https://github.com/lexoyo/Prodotype
 * @constructor
 */
export interface Prodotype {
  componentsDef: ProdotypeCompDef;
  constructor(container, rootPath);
  decorate(templateName: string, data: any);
  ready(cbk: (any) => void);
  edit(
    data?:any,
    list?: Array<ComponentData>,
    templateName?: string,
    events?: any);
  reset();
  createName(type, list):string;
  getMissingDependencies(
    container: HTMLElement,
    componentNames:Array<{templateName:string}>
  ): Array<Element>;
  getUnusedDependencies(dependencyElements:Array<Element>, componentNames: Array<{templateName:string}>);
}


/**
 * @type {Array.<Array.<string|number>>}
 */
export var _paq = [];


/**
 * piwik analytics
 * @constructor
 */
export interface Piwik {
  // static getAsyncTracker(): Piwik;
  constructor();
  trackEvent(c: string, d: string, e?: string, f?: number);
}

/**
 * jquery externs
 */
export interface JQuery {
  editable(options);
  pageable(option, value);
};


/**
 * cloud explorer externs
 */
export interface CloudExplorer {
  getServices(): Promise<any>;
  openFile(extensions): Promise<any>;
  openFiles(extensions): Promise<any>;
  openFolder(): Promise<any>;
  write(data, blob): Promise<any>;
  read(blob): Promise<any>;
  saveAs(defaultFileName, extensions): Promise<any>;
};


/**
 * unifile externs
 */
export interface UnifileResponse {
   success: boolean,
   message?: string,
   tempLink?: string,
   code?: string,
 };


/**
 * wysihtml library
 */
export var wysihtml:any = window['wysihtml'];

// export declare var wysihtml:WysiHtml;
// export declare class wysihtml {
//   public static Editor: any;
// }
export interface WysiHtmlEditor {
  constructor(el: HTMLElement, options);
  focus(changePosition);
  on(eventName, cbk);
  composer: WysiHtmlComposer;
  destroy();
}
interface WysiHtmlComposer {
  commands: WysiHtmlCommand;
}
interface WysiHtmlCommand {
  exec(cmd: string, options?: any);
};

export type wysihtmlParserRules = Object;

