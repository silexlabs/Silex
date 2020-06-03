import { StateWithHistory } from 'redux-undo'

import { PersistantData, State } from './store/types'
import { getState } from './store/index'
import { getUi, updateUi } from './ui-store/index'

export function withDirtyDispatcher(reducer, options: {changeActions: string[], resetActions: string[]}) {
  const { changeActions, resetActions } = options
  return (state: State, action: any) => {
    const result = reducer(state, action)
    if (resetActions.includes(action.type)) {
      resetDirty_(result.present)
      return updateDirty(result)
    }
    if (changeActions.includes(action.type) && result !== state) {
      return updateDirty(result)
    }
    return result
  }
}

function updateDirty(state: StateWithHistory<State>): StateWithHistory<State> {
  const dirty = isDirty(state.present)
  if (dirty === state.present.ui.dirty) {
    return state
  }
  return {
    ...state,
    present: {
      ...state.present,
      ui: {
        ...state.present.ui,
        dirty,
      },
    },
  }
}


// last saved state
let nonDirtyStates: PersistantData = {
  elements: null,
  pages: null,
  site: null,
}

function resetDirty_(state: State = getState()) {
  // store references to some parts of the state
  const { elements, pages, site } = state
  nonDirtyStates = { elements, pages, site }
}

export function resetDirty(state: State = getState()) {
  resetDirty_(state)
  updateUi({
    ...getUi(),
    dirty: false,
  })
}

export function isDirty(state: State = getState()) {
  return state.elements !== nonDirtyStates.elements
    || state.pages !== nonDirtyStates.pages
    || state.site !== nonDirtyStates.site
}

