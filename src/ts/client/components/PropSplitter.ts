/**
 * @fileoverview
 * splitter which is between stage and property pannel
 *
 */

import { Splitter } from './Splitter'
import { getUiElements } from '../ui-store/UiElements'
import { resizeWindow } from './StageWrapper'

let propSplitter

/**
 * @returns the Splitter component which is between stage and property pannel
 */
export function getPropertySplitter() {
  // create the splitter
  if (!propSplitter) propSplitter = new Splitter(getUiElements().verticalSplitter, () => {
    resizeWindow()
  })

  return propSplitter
}
