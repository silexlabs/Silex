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

import { ProdotypeDependency } from './element-store/types'

/**
 * @fileoverview define externs for libs used in Silex
 */

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
  faIconClass?: string
  initialCss?: any[]
  initialCssContentContainer?: any[]
  initialCssClass?: any[]
  baseElement?: string
  name?: string
  category?: string
  isPrivate?: boolean
  text: any // FIXME: why? this is only used in StyleEditorPane
}

/**
 * Prodotype
 * @see https://github.com/lexoyo/Prodotype
 * @constructor
 */
export interface Prodotype {
  componentsDef: ProdotypeCompDef

  decorate(templateName: string, data: any, dataSources?: object): Promise<string>
  ready(cbk: (any) => void)
  edit(
    data?: any,
    dataSources?: object,
    templateName?: string,
    events?: any)
  reset()
  createName(type, list): string
  // "getDependencies" returns an object like this: {
  //   test-comp:
  //     [{
  //         "script": [{
  //             "src": "https://code.jquery.com/jquery-2.1.4.min.js"
  //         }],
  //         "link": [{
  //             "rel": "stylesheet",
  //             "href": "https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css"
  //         }]
  //     }]
  //   }
  //  }
  getDependencies(components: {name:string, displayName?:string, templateName:string}[]): {[key: string]: ProdotypeDependency[]}
  getMissingDependencies(
    container: HTMLElement,
    componentNames: {templateName: string}[],
  ): HTMLElement[]
  getUnusedDependencies(dependencyElements: HTMLElement[], componentNames: {templateName: string}[])
}

/**
 * jquery externs
 */
export interface JQuery {
  editable(options)
  pageable(option, value)
}

/**
 * cloud explorer externs
 */
export interface CloudExplorer {
  getServices(): Promise<any>
  openFile(extensions): Promise<any>
  openFiles(extensions): Promise<any>
  openFolder(): Promise<any>
  write(data, blob): Promise<any>
  read(blob): Promise<any>
  saveAs(defaultFileName, extensions): Promise<any>
}

/**
 * unifile externs
 */
export interface UnifileResponse {
   success: boolean
   message?: string
   tempLink?: string
   code?: string
 }

/**
 * wysihtml library
 */
// tslint:disable:no-string-literal
export let wysihtml: any = window['wysihtml']

// export declare var wysihtml:WysiHtml;
// export declare class wysihtml {
//   public static Editor: any;
// }
export interface WysiHtmlEditor {
  composer: WysiHtmlComposer
  focus(changePosition)
  on(eventName, cbk)
  off(eventName)
  destroy()
}
interface WysiHtmlComposer {
  commands: WysiHtmlCommand
  selection: any
}
interface WysiHtmlCommand {
  exec(cmd: string, options?: any)
}

export type wysihtmlParserRules = any
