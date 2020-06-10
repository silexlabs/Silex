/**
 * @fileoverview Util methods for CRUD states/stores (Create Update Delete). Cross platform, it needs to run client and server side
 *
 */


export const crudIdKey = Symbol('crudId key')
export interface CrudState {
  [crudIdKey]: symbol
}
export interface CrudAction<T> {
  type: string,
  items: T[],
}

function testCrud(items: CrudState[]) {
  const withoutKey = items.filter((item) => !item[crudIdKey])
  if (withoutKey.length) throw new Error('The items need to have a key. The items you provide to update or deleted need to be retrieved from the store')
}

export function withCrudReducer<State extends CrudState>(options: { actionEnum: any, reducer: (state: State[], action: CrudAction<State>) => any, label: string }) {
  const { actionEnum, reducer } = options
  return (state: State[] = [], action: any) => {
    if (action.type in Object.keys(actionEnum))
      testCrud(action.items)
    switch (action.type) {
      case actionEnum.INITIALIZE: return action.items
      case actionEnum.CREATE: return action.items.length ? reducer(state.concat(action.items) as any as State[], action) : state
      case actionEnum.DELETE: return action.items.length ? reducer(state.filter((item) => !action.items.find((i) => i[crudIdKey] === item[crudIdKey])) as any as State[], action) : state
      case actionEnum.UPDATE:
        if (action.items.length === 0) return state
        return reducer(state.map((item) => {
          const found = action.items.find((i) => i[crudIdKey] === item[crudIdKey])
          return found || item // TODO: ?? operator should work
        }) as any as State[], action)
      default:
        return reducer(state, action)
    }
  }
}

// adds a crudIdKey symbole to all elements of an array
export function fromData<Data, Crud extends CrudState>(items: Data[]): Crud[] {
  return items.map((item) => ({
    ...item,
    [crudIdKey]: Symbol(),
  })) as any as Crud[]
}

// removes a crudIdKey symbole to all elements of an array
export function toData<Crud extends CrudState, Data>(items: Crud[]): Data[] {
  return items.map((item) => {
    const {[crudIdKey]: crudId, ...data} = item
    return data
  }) as any as Data[]
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

