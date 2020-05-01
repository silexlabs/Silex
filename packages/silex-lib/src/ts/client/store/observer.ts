import { onAddElements, onDeleteElements, onUpdateElements } from '../element-store/observer'
import { subscribeElements } from '../element-store/index'
import { ElementState } from '../element-store/types'
import { onAddPages, onDeletePages, onUpdatePages } from '../page-store/observer'
import { subscribePages } from '../page-store/index'
import { PageState } from '../page-store/types'
import { onChangeSite } from '../site-store/observer'
import { subscribeSite } from '../site-store/index'
import { onChangeUi } from '../ui-store/observer'
import { subscribeUi } from '../ui-store/index'
import { onCrudChange } from './crud-store'
import { getSiteWindow } from '../components/SiteFrame'

// a 'preventDefault'-like mechanism to avoid changing the dom when populating the model
let stoped = true
export function startObservers() {
  stoped = false
}

export function stopObservers() {
  stoped = true
}

function notWhenStopped<A, B>(cbk: (...args: A[]) => B): ((...args: A[]) => B) {
  return (...args) => {
    if (!stoped) {
      return cbk(...args)
    }
  }
}

export function initObservers() {
  // subscribe the observer to the model
  subscribeElements(onCrudChange<ElementState>({
    onAdd: notWhenStopped(onAddElements(getSiteWindow())),
    onDelete: notWhenStopped(onDeleteElements(getSiteWindow())),
    onUpdate: notWhenStopped(onUpdateElements(getSiteWindow())),
  }))

  subscribePages(onCrudChange<PageState>({
    onAdd: notWhenStopped(onAddPages),
    onDelete: notWhenStopped(onDeletePages),
    onUpdate: notWhenStopped(onUpdatePages),
  }))

  subscribeSite(notWhenStopped(onChangeSite))

  subscribeUi(notWhenStopped(onChangeUi))

  startObservers()
}

