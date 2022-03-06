/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { ComponentsDefinition } from '../externs'
import { ElementState } from '../element-store/types'

export enum LOADING {
  NONE,
  WEBSITE,
  SILEX,
}

export interface UiState {
  mobileEditor: boolean,
  loading: LOADING,
  dirty: boolean,
  currentPageId: string,
  clipboard: null|[ElementState[], ElementState[]] // array of 2 elements: [allElements, rootElements]
  dialogs: Dialog[],
  components: ComponentsDefinition,
}

/**
 * This is a mechanism for all tabbed UI
 * For example the properties pane has tabs (style, components...)
 * Each tab is an element in getUi().dialogs list which has type === 'properties'
 * @see components/Tabbed.ts
 */
export interface Dialog {
  id: string, // e.g. 'styles
  type: string, // e.g. 'properties'
  visible: boolean,
  data?: any, // e.g. { displayName: 'test', className: 'fa-list', tag: 'li'}
}
