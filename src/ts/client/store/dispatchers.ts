import { ElementState } from '../element-store/types'
import { PageState } from '../page-store/types'
import { SiteState } from '../site-store/types'
import { initializeElements } from '../element-store/index'
import { initializePages } from '../page-store/index'
import { initializeSite } from '../site-store/index'
import { store } from './index'

/**
 * update Site state in store along with elements and pages
 * This could be in store.ts but it imports all other stores which mess up the UT (site/observer.test.ts)
 * TODO: 1- remove all references to the store or dispatch => every function should take ElementState[] and return the changes to be made as an ElementState[]
 * TODO: 2- move this file to a cross platform package (e.g. in src/ts/helpers/)
 */
export function initializeData({ site, pages, elements }: {site: SiteState, pages: PageState[], elements: ElementState[]}, dispatch = store.dispatch) {

  initializeSite(site, dispatch)

  initializePages(pages, dispatch)

  initializeElements(elements, dispatch)
}
