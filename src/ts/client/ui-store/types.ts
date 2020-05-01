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

import { ElementState } from '../element-store/types';

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

export enum LOADING {
  NONE,
  WEBSITE,
  SILEX,
}

export interface UiState {
  mobileEditor: boolean,
  loading: LOADING,
  currentPageId: string,
  clipboard: null|[ElementState[], ElementState[]] // array of 2 elements: [allElements, rootElements]
}
