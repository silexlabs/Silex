import { Component } from 'grapesjs'
import { Expression, TypeId } from '../types'

export type StateId = string
export interface State {
  typeId: TypeId
  expression: Expression
}

export function getStates(component: Component): StateId[] {
  return Object.keys(component.get('states') ?? {})
}
export function getState(component: Component, id: StateId): State {
  const states = component.get('states') ?? {}
  return states[id]
}
export function setState(component: Component, id: StateId, state: State): void {
  component.set('states', {
    ...component.get('states') ?? {},
    [id]: state,
  })
}
