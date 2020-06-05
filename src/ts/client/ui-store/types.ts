/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { ElementState } from '../element-store/types'

export enum LOADING {
  NONE,
  WEBSITE,
  SILEX,
}

// default toolbox names, which are also the css class on the container
// @see PropertyTool
export const Toolboxes = {
  PROPERTIES: 'design',
  STYLES: 'style',
  PARAMS: 'params',
}

export interface UiState {
  mobileEditor: boolean,
  loading: LOADING,
  dirty: boolean,
  currentPageId: string,
  clipboard: null|[ElementState[], ElementState[]] // array of 2 elements: [allElements, rootElements]
  currentToolbox: string,
}

