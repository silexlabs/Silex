import { initializeElements, fromElementData } from '../element-store/index'
import { initializePages, fromPageData } from '../page-store/index';
import { initializeSite } from '../site-store/index'
import { store } from './index'
import { SiteState } from '../site-store/types'
import { PageState } from '../page-store/types'
import { ElementState } from '../element-store/types'

/**
 * update Site state in store along with elements and pages
 * This could be in store.ts but it imports all other stores which mess up the UT (site/observer.test.ts)
 */
export function initializeData({ site, pages, elements }: {site: SiteState, pages: PageState[], elements: ElementState[]}, dispatch = store.dispatch) {

  initializeSite(site, dispatch);

  initializePages(pages, dispatch);

  initializeElements(elements, dispatch);

}
