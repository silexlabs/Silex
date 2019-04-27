/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview Helper class for common tasks
 *
 */

type Rgb = Array<number>;

export class Style {

  // static toSelectorCase(str: string): string {
  //   const res = str.replace(/([A-Z])/g, '-$1').toLowerCase();
  //   if(res !== str) console.error('these 2 strings should be the same', str, res);
  //   // else console.warn('todo: do not use this useless function')
  //   return res;
  // }

  /**
   * convert style object to object
   * with only the keys which are set
   */
  static styleToObject(styleObj: CSSStyleDeclaration): Object {
    let res = {};
    for (let idx = 0; idx < styleObj.length; idx++) {
      let styleName = styleObj[idx];
      res[styleName] = styleObj[styleName];
    }
    return res;
  }

  /**
   * convert style object to string
   */
  static styleToString(
      style: string|Object|CSSStyleDeclaration, opt_tab?: string): string {
    if (typeof style === 'string') {
      return style;
    }
    if (!opt_tab) {
      opt_tab = '';
    }
    let styleStr = '';
    for (let idx in style) {
      // filter the numerical indexes of a CSSStyleDeclaration object
      // filter initial values and shorthand properties
      if (style[idx] && typeof style[idx] === 'string' && style[idx] !== '' &&
          idx.match(/[^0-9]/)) {
        styleStr +=
            opt_tab + idx + ': ' + style[idx] + '; ';
      }
    }
    return styleStr;
  }

  static hexToRgb(hexColor: string): any {
    console.warn('why convert', hexColor, 'to RGB?')
    var rgb = parseInt(hexColor.substr(1), 16);
    var r = rgb >> 16;
    var g = (rgb >> 8) & 255;
    var b = rgb & 255;
    return [r, g, b];
  }

  /**
   * convert hex color to rgba values
   * example: #000000FF will return rgba(0, 0, 0, 1)
   */
  static hexToRgba(hex: string): string {
    if (hex.indexOf('#') !== 0) {
      return hex;
    }
    if (hex.length !== 9) {
      console.error('Error in length ' + hex + ' - ' + hex.length);
      return hex;
    }
    let hexArr = Style.hexToArray(hex);
    let r = hexArr[0];
    let g = hexArr[1];
    let b = hexArr[2];
    let a = hexArr[3];
    let result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    return result;
  }

  /**
   * convert rgba to array of values
   * example:    #000000FF will return [0, 0, 0, 1]
   */
  static hexToArray(hex: string): number[] {
    if (hex.indexOf('#') !== 0) {
      return null;
    }
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let a = parseInt(hex.substring(6, 8), 16) / 255;
    let result = [r, g, b, a];
    return result;
  }

  /**
   * convert rgb to hex
   * example:    rgb(0, 0, 0) will return #000000
   */
  static rgbToHex(rgb: string): string {
    const hexWithA = Style.rgbaToHex(rgb);
    return hexWithA.substr(0, 7);
  }

  /**
   * convert rgba to hex
   * example:    rgba(0, 0, 0, 1) will return #000000FF
   */
  static rgbaToHex(rgba: string): string {
    // has to be rgb or rgba
    if (rgba.indexOf('rgb') !== 0) {
      return rgba;
    }

    // get the array version
    let rgbaArr = Style.rgbaToArray(rgba);
    let r = rgbaArr[0].toString(16);
    if (r.length < 2) {
      r = '0' + r;
    }
    let g = rgbaArr[1].toString(16);
    if (g.length < 2) {
      g = '0' + g;
    }
    let b = rgbaArr[2].toString(16);
    if (b.length < 2) {
      b = '0' + b;
    }
    let a = rgbaArr[3].toString(16);
    if (a.length < 2) {
      a = '0' + a;
    }
    let result = '#' + (r + g + b + a);
    return result;
  }

  /**
   * convert rgba to array of values
   * example:    rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
   */
  static rgbaToArray(rgba: string): number[] {
    // not rgb nor rgba
    if (rgba.indexOf('rgb') !== 0) {
      return null;
    }
    if (rgba.indexOf('rgba') !== 0) {
      // rgb
      rgba = rgba.replace('rgb', '');
    } else {
      // rgba
      rgba = rgba.replace('rgba', '');
    }
    rgba = rgba.replace(' ', '');
    let rgbaArr = rgba.substring(1, rgba.length - 1).split(',');

    // add alpha if needed
    if (rgbaArr.length < 4) {
      rgbaArr.push('1');
    }
    let r = parseInt(rgbaArr[0], 10);
    let g = parseInt(rgbaArr[1], 10);
    let b = parseInt(rgbaArr[2], 10);
    let a = parseFloat(rgbaArr[3]) * 255;
    let result = [r, g, b, a];
    return result;
  }
}
