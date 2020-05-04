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

 import { PageState } from '../page-store/types';
import { getUi, updateUi } from './index';
import { store } from '../store/index'

/**
 * @fileoverview helpers to dispatch common actions on the store
 * TODO: 1- remove all references to the store or dispatch => every function should take ElementState[] and return the changes to be made as an ElementState[]
 * TODO: 2- move this file to a cross platform package (e.g. in src/ts/helpers/)
 */

export const openPage = (item: PageState, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  currentPageId: item.id,
}, dispatch)
