import { PseudoClass } from "./PseudoClass"
import { SimpleSelector } from "./SimpleSelector"

export type CompoundSelector = {
  selectors: SimpleSelector[]
  pseudoClass?: PseudoClass
}