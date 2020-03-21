import { Model } from './ClientTypes'

// FIXME: port all models to the new model structure
export let model: Model
export function setModel(m: Model) {
  model = m
}
