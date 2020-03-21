import { store, subscribeTo, subscribeToCrud, SilexStore } from './store';

// export const connect = (fun) => (...args) => fun(store, ...args)
export function connect<Args=null, Ret=void>(fun: (SilexStore, T) => Ret): (args?: Args) => Ret {
  return (args?: Args) => fun(store, args)
}
