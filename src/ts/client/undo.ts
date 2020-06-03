import { ActionCreators, StateWithHistory } from 'redux-undo'

import { State } from './store/types'
import { store } from './store/index'

function getResetUndo(state: StateWithHistory<State>): StateWithHistory<State> {
  // store.dispatch(ActionCreators.clearHistory())
  return {
    ...state,
    past: [],
    future: [],
  }
}

export function resetUndo() {
  store.dispatch(ActionCreators.clearHistory())
}

export function undo() {
  store.dispatch(ActionCreators.undo())
}

export function redo() {
  store.dispatch(ActionCreators.redo())
}

export function hasUndo() {
  return store.getState().past.length > 0
}

export function hasRedo() {
  return store.getState().future.length > 0
}

export function withUndoDispatcher(reducer, options: {resetActions: string[]}) {
  const { resetActions } = options
  return (state: State, action: any) => {
    const result = reducer(state, action)
    if (resetActions.includes(action.type)) {
      return getResetUndo(result)
    }
    return result
  }
}

