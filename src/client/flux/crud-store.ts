interface StateBase {
  id: string;
}
export function withCrud<State extends StateBase>(options: { actionEnum: any, reducer: (state: State[], action: any) => any, label: string, allowSetId: boolean }) {
  const { actionEnum, reducer, label, allowSetId } = options
  return (state: State[], action: any) => {
    // console.trace('CRUD reducer', label, {state, action})
    switch (action.type) {
      case actionEnum.INITIALIZE: return action.items.slice()

      case actionEnum.CREATE: return state.concat(action.items)
      case actionEnum.DELETE: return state.filter((item) => !action.items.find((i) => i === item))
      case actionEnum.UPDATE:
        if (!allowSetId) {
          action.changes.forEach((change) => {
            if (change.from.id !== change.to.id) {
              throw new Error('Change an item ID is forbiden');
            }
          })
        }
        return state.map((item) => {
          const found = action.changes.find((i) => i.from === item)
          return found ? found.to : item
        })
      case actionEnum.MOVE:
        // remove the item
        const idx = state.findIndex((item) => item === action.item)
        const withoutItem = [...state.slice(0, idx), ...state.slice(idx + 1)]
        // put it back
        return [...withoutItem.slice(0, action.idx), action.item, ...withoutItem.slice(action.idx)]
      default: return reducer(state, action)
    }
  }
}
