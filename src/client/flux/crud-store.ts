/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview Util methods for CRUD states/stores (Create Update Delete). Cross platform, it needs to run client and server side
 *
 */


export const crudIdKey = Symbol('crudId key')
export interface CrudState {
  [crudIdKey]: symbol;
}
function testCrud(items: CrudState[]) {
  const withoutKey = items.filter((item) => !item[crudIdKey])
  if (withoutKey.length) throw new Error('The items need to have a key. The items you provide to update or deleted need to be retrieved from the store')
}
export function withCrudReducer<State>(options: { actionEnum: any, reducer: (state: State[], action: any) => any, label: string }) {
  const { actionEnum, reducer } = options
  return (state_: State[] = [], action: any) => {
    const state = state_ as any as CrudState[]
    switch (action.type) {
      case actionEnum.INITIALIZE: return action.items.map((item) => (item[crudIdKey] ? item : {
        ...item,
        [crudIdKey]: Symbol(),
      }))
      case actionEnum.CREATE: return action.items.length ? reducer(state.concat(action.items.map((item) => (item[crudIdKey] ? item : {
        ...item,
        [crudIdKey]: Symbol(),
      }))) as any as State[], action) : state
      case actionEnum.DELETE:
        testCrud(action.items)
        return action.items.length ? reducer(state.filter((item) => !action.items.find((i) => i[crudIdKey] === item[crudIdKey])) as any as State[], action) : state
      case actionEnum.UPDATE:
        if (action.changes.length === 0) return state
        testCrud(action.changes.reduce((result, item) => result.concat([item.from, item.to]), []))
        return reducer(state.map((item) => {
          const found = action.changes.find((i) => i.from[crudIdKey] === item[crudIdKey])
          return found ? found.to : item
        }) as any as State[], action)
      default:
        return reducer(state_, action)
    }
  }
}

// determine what has been changed/updated/deleted
export interface StateChange<T> {
  from: T,
  to: T,
}
export function onCrudChange<T>({ onAdd, onDelete, onUpdate }: { onAdd: (item: T[]) => void, onDelete: (item: T[]) => void, onUpdate: (change: StateChange<T>[]) => void }) {
  return (prevState: T[], currentState: T[]) => {
    // added items
    const added = currentState.filter((item) => !prevState || !prevState.find((p) => p[crudIdKey] === item[crudIdKey]))
    if (added.length) onAdd(added)

    if (prevState) {
      // removed
      const deleted = prevState.filter((item) => !currentState.find((p) => p[crudIdKey] === item[crudIdKey]))
      if (deleted.length) onDelete(deleted)

      // updated
      const updated = currentState
        .map((to) => {
          const from = prevState.find((p) => p[crudIdKey] === to[crudIdKey])
          return {
            from,
            to,
          }
        })
        .filter(({from, to}) => !!from && from !== to)
      if (updated.length) onUpdate(updated)
    }
  }
}

