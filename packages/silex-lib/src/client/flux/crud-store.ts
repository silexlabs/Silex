interface StateBase {
  id: string;
}
export function withCrud<State extends StateBase>(options: { actionEnum: any, reducer: (state: State[], action: any) => any, label: string, allowSetId: boolean }) {
  const { actionEnum, reducer, label, allowSetId } = options
  return (state: State[], action: any) => {
    // console.trace('CRUD reducer', label, {state, action})
    switch (action.type) {
      case actionEnum.INITIALIZE: return action.items.slice()
      case actionEnum.CREATE: return reducer(state.concat(action.items), action)
      case actionEnum.DELETE: return reducer(state.filter((item) => !action.items.find((i) => i === item)), action)
      case actionEnum.UPDATE:
        if (!allowSetId) {
          action.changes.forEach((change) => {
            if (change.from.id !== change.to.id) {
              throw new Error('Change an item ID is forbiden');
            }
          })
        }
        return reducer(state.map((item) => {
          const found = action.changes.find((i) => i.from === item)
          return found ? found.to : item
        }), action)
      default:
        return reducer(state, action)
    }
  }
}

// determine what has been changed/updated/deleted
export interface StateChange<T> {
  from: T,
  to: T,
}
export function onCrudChange<T extends {id: string}>({ onAdd, onDelete, onUpdate }: { onAdd: (item: T[]) => void, onDelete: (item: T[]) => void, onUpdate: (change: Array<StateChange<T>>) => void }) {
  return (prevState: T[], currentState: T[]) => {
    console.log('onCrudChange', currentState
    .map((to) => {
      const from = prevState.find((p) => p.id === to.id)
      return {
        from,
        to,
      }
    })
    .filter(({from, to}) => !!from && from !== to),
    )
    // added items
    onAdd(currentState
      .filter((item) => !prevState || !prevState.find((p) => p.id === item.id)))

    if (prevState) {
      // removed
      onDelete(prevState
        .filter((item) => !currentState.find((p) => p.id === item.id)))

      // updated
      onUpdate(currentState
        .map((to) => {
          const from = prevState.find((p) => p.id === to.id)
          return {
            from,
            to,
          }
        })
        .filter(({from, to}) => !!from && from !== to))
    }
  }
}
