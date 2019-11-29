interface State {
  idx: number,
}

function updateIdx<S extends State>(state: S[], item: S) {
  return state
    .sort((i1: S, i2: S) => i1.idx === i2.idx ? i1 === item ? -1 : 1 : i1.idx - i2.idx)
    .map((i, idx) => i.idx === idx ? i : Object.assign({}, i, { idx }))
}


export function withCrud<S extends State>(actionEnum: any, next: (state: S[], action: any) => any, label: string) {
  return function(state: S[], action: any) {
    // console.log('CRUD reducer', label, state, action)
    switch (action.type) {
      case actionEnum.INITIALIZE: return updateIdx<S>(action.items.slice(), null)

      case actionEnum.CREATE: return updateIdx<S>(state.concat([action.item]), action.item)
      case actionEnum.DELETE: return updateIdx<S>(state.filter((item) => item !== action.item), action.item)
      case actionEnum.UPDATE: return updateIdx<S>(state.map((item) => item === action.oldItem ? action.newItem : item), action.newItem)
      default: return next(state, action)
    }
  }
}

