/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { Store } from 'redux'
import { StateWithHistory } from 'redux-undo'

import { ElementState, ElementData } from '../element-store/types'
import { PageState, PageData } from '../page-store/types'
import { SiteState } from '../site-store/types'
import { UiState } from '../ui-store/types'

/**
 * type of the store for the whole Silex app
 */
export type SilexStore = Store<StateWithHistory<State>>

/**
 * type of the state object hold by the SilexStore
 */
export interface State {
  pages: PageState[],
  elements: ElementState[],
  site: SiteState,
  ui: UiState,
}

/**
 * the data which are relevant to be saved/loaded for a given site
 */
export interface PersistantData {
  site: SiteState,
  elements: ElementData[],
  pages: PageData[],
}
