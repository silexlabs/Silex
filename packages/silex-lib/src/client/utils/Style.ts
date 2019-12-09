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

type Rgb = number[];

export class Style {
  static addToMobileOrDesktopStyle(mobileEditor: boolean, originalStyle: any, style: any): {desktop: any, mobile: any} {
    return {
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
  static styleToObject(styleObj: CSSStyleDeclaration): object {
    const res = {};
    for (const styleName of styleObj) {
      res[styleName] = styleObj[styleName];
    }
    return res;
  }

  /**
   * convert style object to string
   */
  static styleToString(style: string|object|CSSStyleDeclaration, opt_tab?: string): string {
    if (typeof style === 'string') {
      return style;
    }
    if (!opt_tab) {
      opt_tab = '';
    }
    let styleStr = '';
    for (const idx in style) {
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
    console.warn('why convert', hexColor, 'to RGB?');
    const rgb = parseInt(hexColor.substr(1), 16);
    const r = rgb >> 16;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
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
    const hexArr = Style.hexToArray(hex);
    const r = hexArr[0];
    const g = hexArr[1];
    const b = hexArr[2];
    const a = hexArr[3];
    const result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
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
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    const result = [r, g, b, a];
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
    const rgbaArr = Style.rgbaToArray(rgba);
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
    const result = '#' + (r + g + b + a);
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
    const rgbaArr = rgba.substring(1, rgba.length - 1).split(',');

    // add alpha if needed
    if (rgbaArr.length < 4) {
      rgbaArr.push('1');
    }
    const r = parseInt(rgbaArr[0], 10);
    const g = parseInt(rgbaArr[1], 10);
    const b = parseInt(rgbaArr[2], 10);
    const a = parseFloat(rgbaArr[3]) * 255;
    const result = [r, g, b, a];
    return result;
  }
}
