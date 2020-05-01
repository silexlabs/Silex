import { StyleName, StyleData, StyleDataObject, PseudoClass, PseudoClassData, Visibility } from './types'
import { getSite, updateSite } from './index'
import { getPseudoClassData } from './utils'
import { store } from '../store/index'
/**
 * save an empty style or reset a style
 */
export function initStyle(displayName: string, className: StyleName, opt_data?: StyleData, site = getSite(), dispatch = store.dispatch) {
  // check that style does not exist
  if (site.styles[className]) {
    console.error('This style already exists');
    throw new Error('This style already exists');
  } else {
    // render all pseudo classes in all visibility object
    getPseudoClassData(opt_data || ({
      className: '',
      displayName: '',
      templateName: '',
      styles: {desktop: {normal: {}}},
    } as StyleData))
    .forEach((pseudoClassData) => {
      componentStyleChanged(className, pseudoClassData.pseudoClass, pseudoClassData.visibility, pseudoClassData.data, displayName, site, dispatch);
    });
  }
}

/**
 * update the style in the store (style of the style editor)
 * FIXME: this should be at the site level
 */
export function componentStyleChanged(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility, opt_data?: PseudoClassData, opt_displayName?: string, site = getSite(), dispatch = store.dispatch) {
  // expose the class name and pseudo class to the prodotype template
  const newData = opt_data || {};
  newData.className = className;
  newData.pseudoClass = pseudoClass;

  // store the component's data for later edition
  const styleData = (site.styles[className] || {
    className,
    templateName: 'text',
    displayName: opt_displayName,
    styles: {},
  } as StyleData);
  if (!styleData.styles[visibility]) {
    styleData.styles[visibility] = {};
  }
  styleData.styles[visibility][pseudoClass] = newData;

  const style: StyleDataObject = {
    ...site.styles,
  }
  style[className] = styleData
  updateSite({
    ...site,
    styles: style,
  }, dispatch)

  // console.error('not implemented')
  // // FIXME: pour this to the new model?
  // // model.property.setStyleData(className, styleData);

  // // update the head style with the new template
  // const head = model.head.getHeadElement();
  // let elStyle = head.querySelector(`[data-style-id="${className}"]`);
  // if (!elStyle) {
  //   const doc = getSiteDocument();
  //   elStyle = doc.createElement('style');
  //   elStyle.className = Constants.STYLE_CLASS_NAME;
  //   elStyle.setAttribute('type', 'text/css');
  //   elStyle.setAttribute('data-style-id', className);
  //   head.appendChild(elStyle);
  // }

  // // render all pseudo classes in all visibility object
  // const pseudoClassData = getPseudoClassData(styleData);
  // if (pseudoClassData.length > 0) {
  //   Promise.all(pseudoClassData.map((obj) => {
  //         return prodotypeStyle.decorate('text', obj.data, getSite().dataSources)
  //             .then((html) => addMediaQueryIfMobileOnly(html, obj.visibility));
  //       }) as Promise<string>[])
  //       .then((htmlStrings) => {
  //         elStyle.innerHTML = htmlStrings.join('');
  //       });
  // }
}

export function removeStyle(className: string, site = getSite(), dispatch = store.dispatch) {
  // clone the site and style objects
  const newSite = {
    ...site,
    styles: {
      ...site.styles,
    }
  }
  // delete the style
  delete newSite.styles[className]
  // update the store
  updateSite(newSite, dispatch)
}
