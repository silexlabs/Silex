import { onAddElements, onDeleteElements, onUpdateElements } from '../element/observer'
import { subscribeElements } from '../element/store'
import { ElementData } from '../element/types'
import { onAddPages, onDeletePages, onUpdatePages } from '../page/observer'
import { subscribePages } from '../page/store'
import { PageData } from '../page/types'
import { onChangeSite } from '../site/observer'
import { subscribeSite } from '../site/store'
import { onChangeUi } from '../ui/observer'
import { subscribeUi } from '../ui/store'
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

// subscribe the observer to the model
subscribeElements(onCrudChange<ElementData>({
  onAdd: notWhenStopped(onAddElements(getSiteWindow())),
  onDelete: notWhenStopped(onDeleteElements(getSiteWindow())),
  onUpdate: notWhenStopped(onUpdateElements(getSiteWindow())),
}))

subscribePages(onCrudChange<PageData>({
  onAdd: notWhenStopped(onAddPages),
  onDelete: notWhenStopped(onDeletePages),
  onUpdate: notWhenStopped(onUpdatePages),
}))

subscribeSite(notWhenStopped(onChangeSite))

subscribeUi(notWhenStopped(onChangeUi))
