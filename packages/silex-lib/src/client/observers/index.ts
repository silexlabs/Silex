import { ElementData, PageData } from '../../types';
import { subscribeElements, subscribePages, subscribeSite, subscribeUi } from '../api';
import { getSiteWindow } from '../components/UiElements';
import { onCrudChange } from '../flux/crud-store';
import { onAddElements, onDeleteElements, onUpdateElements } from './element-observer';
import { onAddPages, onDeletePages, onUpdatePages } from './page-observer';
import { onChangeSite } from './site-observer';
import { onChangeUi } from './ui-observer';

// kind of a "preventDefault" mechanism to avoid changing the dom when populating the model
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
