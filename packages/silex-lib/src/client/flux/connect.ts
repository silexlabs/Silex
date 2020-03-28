import { store } from './store'
import { SilexStore } from './types'

// export const connect = (fun) => (...args) => fun(store, ...args)
export function connect<Args=null, Ret=void>(fun: (store: SilexStore, args: Args) => Ret): (args?: Args) => Ret {
  return (args?: Args) => fun(store, args)
}
