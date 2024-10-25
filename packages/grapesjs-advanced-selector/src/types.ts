import { Selector, State } from 'grapesjs'
import { ASClassesOptions } from './components/as-classes'

export type AdvancedSelectorOptions = {
  classSelector: ASClassesOptions
}

/**
 * Type of the object passed to the selector:custom event listener
 * Defined in grapesjs source code, see class SelectorManager
 */
export type CustomSelectorEventProps = {
  states: State[]
  selected: Selector[]
  container: HTMLElement | undefined
}