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

import { ElementData } from '../element/types';
import { PageData } from '../page/types';
import { SiteData } from '../site/types';
import { UiData } from '../ui/types'
import { Store } from 'redux'

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

/**
 * type of the store for the whole Silex app
 */
export type SilexStore = Store<State>

/**
 * type of the state object hold by the SilexStore
 */
export interface State {
  pages: PageData[],
  elements: ElementData[],
  site: SiteData,
  ui: UiData,
}

/**
 * the data which are relevant to be saved/loaded for a given site
 */
export interface PersistantData {
  site: SiteData,
  elements: ElementData[],
  pages: PageData[],
}

