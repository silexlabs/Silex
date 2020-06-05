import { combineReducers, createStore } from 'redux'
import undoable, { includeAction } from 'redux-undo'

import { ElementAction, PageAction, SiteAction } from './actions'
import { ElementState } from '../element-store/types'
import { PageState } from '../page-store/types'
import { SilexStore, State } from './types'
import { elementReducer, pageReducer, siteReducer, uiReducer } from './reducers'
import { withCrudReducer, CrudState } from '../store/crud-store'
import { withDirtyDispatcher } from '../dirty'
import { withUndoDispatcher } from '../undo'

const RESET_ACTIONS = [
  ElementAction.INITIALIZE,
  PageAction.INITIALIZE,
  SiteAction.INITIALIZE,
]

const CHANGE_ACTIONS = [
  ...Object.values(ElementAction).filter((a) => a !== ElementAction.INITIALIZE),
  ...Object.values(PageAction).filter((a) => a !== PageAction.INITIALIZE),
  ...Object.values(SiteAction).filter((a) => a !== SiteAction.INITIALIZE),
]

// create the main store
const reducers = combineReducers({
  pages: withCrudReducer<PageState>({
    actionEnum: PageAction,
    reducer: pageReducer,
    label: 'Pages',
  }),
  elements: withCrudReducer<ElementState>({
    actionEnum: ElementAction,
    reducer: elementReducer,
    label: 'Elements',
  }),
  site: siteReducer,
  ui: uiReducer,
})
let lastActionTime = 0
export const store: SilexStore = createStore(
  withDirtyDispatcher(
    withUndoDispatcher(
      undoable(
        reducers, {
          filter: includeAction(CHANGE_ACTIONS),
          groupBy: () => {
            const time = Math.floor(Date.now() / 1000)
            const elapsed = time - lastActionTime
            lastActionTime = time
            return elapsed
          },
        }
      ), {
        resetActions: RESET_ACTIONS,
      }
    ), {
      changeActions: CHANGE_ACTIONS,
      resetActions: RESET_ACTIONS,
    }
  )
)

// update previous and current states before other listeners fire
let curState: State = store.getState().present
let prevState: State = null
store.subscribe(() => {
  prevState = curState
  curState = store.getState().present
})

/**
 * special subscribe for CRUD states, i.e. elements and pages
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
export function subscribeToCrud<T extends CrudState>(name: string, cbk: (prevState: T[], nextState: T[]) => void, subscribe = store.subscribe): () => void {
  return subscribe(() => {
    const state = store.getState()
    if (!prevState || state.present[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state.present[name])
    }
  })
}

/**
 * special subscribe for states, i.e. site and ui
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
export function subscribeTo<T>(name: string, cbk: (prevState: T, nextState: T) => void, subscribe = store.subscribe): () => void {
  return subscribe(() => {
    const state = store.getState()
    if (!prevState || state.present[name] !== prevState[name]) {
      cbk(prevState ? prevState[name] : null, state.present[name])
    }
  })
}

/**
 * get the whole state object
 * used to save the state for example
 */
export const getState = (): State => store.getState().present

