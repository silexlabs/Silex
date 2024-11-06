import { Selector, State } from 'grapesjs'
import { SelectorsListOptions } from './components/selectors-list'

export type AdvancedSelectorOptions = {
  classSelector: SelectorsListOptions
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