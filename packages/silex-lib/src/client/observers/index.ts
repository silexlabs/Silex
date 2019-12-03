import { ElementData, PageData } from '../../types';
import { subscribeElements, subscribePages, subscribeSite, subscribeUi } from '../api';
import { onAddElement, onDeleteElement, onUpdateElement } from './element-observer';
import { onAddPage, onDeletePage, onUpdatePage } from './page-observer';
import { onChangeSite } from './site-observer';
import { onChangeUi } from './ui-observer';

// kind of a "preventDefault" mechanism to avoid changing the dom when populating the model
let stoped = true
export function startObservers() {
  console.log('startObserver')
  stoped = false
}
export function stopObservers() {
  console.log('stoptObserver')
  stoped = true
}

// subscribe the observer to the model
subscribeElements(onCrudChange<ElementData>({
  onAdd: onAddElement,
  onDelete: onDeleteElement,
  onUpdate: onUpdateElement,
}))
subscribePages(onCrudChange<PageData>({
  onAdd: onAddPage,
  onDelete: onDeletePage,
  onUpdate: onUpdatePage,
}))

subscribeSite(onChangeSite)
subscribeUi(onChangeUi)

// determine what has been changed/updated/deleted
function onCrudChange<T>({ onAdd, onDelete, onUpdate }: { onAdd: (item: T) => void, onDelete: (item: T) => void, onUpdate: (oldItem: T, newItem: T) => any }) {
  return (prevState, currentState) => {
    if (!stoped && currentState !== prevState) {
      // added pages
      currentState
        .filter((item) => !prevState.find((p) => p.name === item.name))
        .forEach((item) => onAdd(item))

      // removed
      prevState
        .filter((item) => !currentState.find((p) => p.name === item.name))
        .forEach((item) => onDelete(item))

      // updated
      currentState
        .filter((item) => {
          const prev = prevState.find((p) => p.name === item.name)
          return !!prev && prev !== item
        })
        .forEach((item) => onUpdate(prevState.find((p) => p.name === item.name)
          , item))
    }
  }
}
