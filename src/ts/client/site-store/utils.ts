/**
 * @fileoverview Utilities to manupulate site data
 *
 */

import { StyleData, Visibility, PseudoClass, PseudoClassData } from './types'
import { Constants } from '../../constants'

/**
 * build an array of all the data we provide to Prodotype for the "text"
 * template
 */
export function getPseudoClassData(styleData: StyleData): {visibility: Visibility, pseudoClass: PseudoClass, data: PseudoClassData}[] {
  // return all pseudo classes in all visibility object
  // flatten
  // build an object for each pseudoClass
  // build an object for each existing visibility
  return Constants.STYLE_VISIBILITY
  .map((visibility) => {
    return {
      visibility,
      data: styleData.styles[visibility],
    }
  })
  .filter((obj) => !!obj.data)
  .map((vData) => {
    const arrayOfPCData = []
    for (const pcName in vData.data) {
      arrayOfPCData.push({
        visibility: vData.visibility,
        pseudoClass: pcName,
        /* unused, the data is in data */
        data: vData.data[pcName],
      })
    }
    return arrayOfPCData
  })
  .reduce((acc, val) => acc.concat(val), [])
}

