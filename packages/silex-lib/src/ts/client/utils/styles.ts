/**
 * @fileoverview Helper class for common tasks
 */

import { CssRule } from '../site-store/types'
import { ElementType, ElementState } from '../element-store/types'

/**
 * handle the specificities of each element type, e.g. section have no width
 * TODO: also use element's position (static or not)
 */
export function fixStyleForElement(element: ElementState, isSectionContent: boolean, style: CssRule) {
  const result = {
    ...style,
  }
  if (style.position === 'static') {
    delete result.left
    delete result.top
  }
  if (element.type === ElementType.SECTION || isSectionContent) {
    delete result.width // always 100% for sections and "site width" for section content
    delete result.left // section content are relative because of auto z-index
    delete result.top // section content are relative because of auto z-index
  }
  if (element.type === ElementType.SECTION) delete result.height
  return result
}

// TODO: use a dynamic key instead of this method: [mobileEditor ? 'mobile' : 'desktop']
export function addToMobileOrDesktopStyle(mobileEditor: boolean, originalStyle: { mobile: CssRule, desktop: CssRule }, style: CssRule): {desktop: CssRule, mobile: CssRule} {
  return {
    ...originalStyle,
    mobile: mobileEditor ? {
      ...originalStyle.mobile,
      ...style,
    } : originalStyle.mobile,
    desktop: mobileEditor ? originalStyle.desktop : {
      ...originalStyle.desktop,
      ...style,
    },
  }
}
/**
 * convert style object to object
 * with only the keys which are set
 */
export function styleToObject(styleObj: CSSStyleDeclaration): object {
  const res = {}
  for (const styleName of styleObj) {
    res[styleName] = styleObj[styleName]
  }
  return res
}

/**
 * convert style object to string
 * this does handle height / min-height
 */
export function styleToString(style: {[key: string]: string}, useMinHeight: boolean, opt_tab = ''): string {
  return Object.keys(style)
    // remove undefined keys
    // this removes properties with empty string value, on purpose
    .filter((key) => !!style[key])
    .map((key) => ({
      key,
      val: style[key],
    }))
    .reduce((result: string, {key, val}) => {
      if (useMinHeight && key === 'height') {
        result += opt_tab + 'min-height: ' + val + '; '
      } else {
        result += `${opt_tab}${key}: ${val}; `
      }
      return result
    }, '')
}

export function hexToRgb(hexColor: string): any {
  console.warn('why convert', hexColor, 'to RGB?')
  const rgb = parseInt(hexColor.substr(1), 16)
  const r = rgb >> 16
  const g = (rgb >> 8) & 255
  const b = rgb & 255
  return [r, g, b]
}

/**
 * convert hex color to rgba values
 * example: #000000FF will return rgba(0, 0, 0, 1)
 */
export function hexToRgba(hex: string): string {
  if (hex.indexOf('#') !== 0) {
    return hex
  }
  if (hex.length !== 9) {
    console.error('Error in length ' + hex + ' - ' + hex.length)
    return hex
  }
  const hexArr = hexToArray(hex)
  const r = hexArr[0]
  const g = hexArr[1]
  const b = hexArr[2]
  const a = hexArr[3]
  const result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
  return result
}

/**
 * convert rgba to array of values
 * example:    #000000FF will return [0, 0, 0, 1]
 */
export function hexToArray(hex: string): number[] {
  if (hex.indexOf('#') !== 0) {
    return null
  }
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const a = parseInt(hex.substring(6, 8), 16) / 255
  const result = [r, g, b, a]
  return result
}

/**
 * convert rgb to hex
 * example:    rgb(0, 0, 0) will return #000000
 */
export function rgbToHex(rgb: string): string {
  const hexWithA = rgbaToHex(rgb)
  return hexWithA.substr(0, 7)
}

/**
 * convert rgba to hex
 * example:    rgba(0, 0, 0, 1) will return #000000FF
 */
export function rgbaToHex(rgba: string): string {
  // has to be rgb or rgba
  if (rgba.indexOf('rgb') !== 0) {
    return rgba
  }

  // get the array version
  const rgbaArr = rgbaToArray(rgba)
  let r = rgbaArr[0].toString(16)
  if (r.length < 2) {
    r = '0' + r
  }
  let g = rgbaArr[1].toString(16)
  if (g.length < 2) {
    g = '0' + g
  }
  let b = rgbaArr[2].toString(16)
  if (b.length < 2) {
    b = '0' + b
  }
  let a = rgbaArr[3].toString(16)
  if (a.length < 2) {
    a = '0' + a
  }
  const result = '#' + (r + g + b + a)
  return result
}

/**
 * convert rgba to array of values
 * example:    rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
 */
export function rgbaToArray(rgba: string): number[] {
  // not rgb nor rgba
  if (rgba.indexOf('rgb') !== 0) {
    return null
  }
  if (rgba.indexOf('rgba') !== 0) {
    // rgb
    rgba = rgba.replace('rgb', '')
  } else {
    // rgba
    rgba = rgba.replace('rgba', '')
  }
  rgba = rgba.replace(' ', '')
  const rgbaArr = rgba.substring(1, rgba.length - 1).split(',')

  // add alpha if needed
  if (rgbaArr.length < 4) {
    rgbaArr.push('1')
  }
  const r = parseInt(rgbaArr[0], 10)
  const g = parseInt(rgbaArr[1], 10)
  const b = parseInt(rgbaArr[2], 10)
  const a = parseFloat(rgbaArr[3]) * 255
  const result = [r, g, b, a]
  return result
}
