import { PersistantData } from './types'
import { initializeElements } from '../element/store'
import { initializePages } from '../page/store';
import { initializeSite } from '../site/store'
import { openPage } from '../ui/dispatchers';
import { stopObservers, startObservers } from './observer'

/**
 * update Site state in store along with elements and pages
 * This could be in store.ts but it imports all other stores which mess up the UT (site/observer.test.ts)
 */
export function initializeData(data: PersistantData) {
  const { site, pages, elements }  = data;

  stopObservers();

  initializeSite(site);

  initializePages(pages);
  openPage(pages[0]);

  initializeElements(elements);

  startObservers();
}
