/**
 * @fileoverview define externs for libs used in Silex
 */

import { CssRule } from './site-store/types'
import { ProdotypeDependency } from './element-store/types'

export interface ComponentProps {
  name: string,
  type: any,
  expandable?: boolean,
  default?: any,
  description?: string,
}

export interface ComponentDefinition {
  faIconClass?: string
  initialCss?: CssRule,
  initialCssContentContainer?: any[]
  initialCssClass?: string|string[]
  baseElement?: string
  name?: string
  category?: string
  isPrivate?: boolean
  props: ComponentProps[],
  // text: any // FIXME: why? this is only used in StyleEditorPane
  useMinHeight?: boolean,
}

export interface ComponentsDefinition {
  [templateName: string]: ComponentDefinition
}

/**
 * Prodotype
 * @see https://github.com/lexoyo/Prodotype
 * @constructor
 */
export interface Prodotype {
  componentsDef: ComponentsDefinition,

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
  //         "script": [{
  //             "src": "https://code.jquery.com/jquery-2.1.4.min.js"
  //         }],
  //         "link": [{
  //             "rel": "stylesheet",
  //             "href": "https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css"
  //         }]
  //  }
  getDependencies(components: {name:string, displayName?:string, templateName:string}[]): ProdotypeDependency
  getMissingDependencies(
    container: HTMLElement,
    componentNames: {templateName: string}[],
  ): HTMLElement[]
  getUnusedDependencies(dependencyElements: HTMLElement[], componentNames: {templateName: string}[]): ProdotypeDependency
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
