import { Constants } from '../../Constants'

/**
 * for properties or style which are to be applied to elements
 * but in the case of a section not to the internal container, only the whole
 * section this method will return the element or the section when the element
 * is a section container
 */
export function noSectionContent(element) {
  return isSectionContent(element) ? element.parentElement as HTMLElement : element
}

/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
export function getType(element: HTMLElement): string {
  return element.getAttribute(Constants.TYPE_ATTR);
}

/**
 * @param element   created by silex
 * @return true if `element` is a an element's content (the element in an
 *     image, html box, section...)
 */
export function isElementContent(element: HTMLElement): boolean {
  return element.classList.contains(Constants.ELEMENT_CONTENT_CLASS_NAME);
}

/**
 * @param element   created by silex
 * @return true if `element` is a section
 */
export function isSection(element: HTMLElement): boolean {
  // FIXME: this is a workaround, it happens in mobile editor, when
  // dragg/dropping (element in document)
  if (!element || !element.classList) {
    return false;
  }
  return element.classList.contains(Constants.TYPE_SECTION);
}

/**
 * @param element   created by silex
 * @return true if `element` is the content container of a section
 */
export function isSectionContent(element: HTMLElement): boolean {
  // FIXME: this is a workaround, it happens in mobile editor, when
  // dragg/dropping (element is document)
  if (!element || !element.classList) {
    return false;
  }
  return element.classList.contains(Constants.TYPE_CONTAINER_CONTENT);
}

/**
 * get/set the "hide on mobile" property
 * @return true if the element is hidden on mobile
 */
export function getHideOnMobile(element: HTMLElement): boolean {
  // FIXME: this is a workaround, it happens in mobile editor, when
  // dragg/dropping (element is document)
  if (!element || !element.classList) {
    return false;
  }
  return noSectionContent(element).classList.contains(Constants.HIDE_ON_MOBILE);
}

/**
 * get/set the "hide on mobile" property
 * @param hide, true if the element has to be hidden on mobile
 */
export function setHideOnMobile(element: HTMLElement, hide: boolean) {
  if (hide) {
    noSectionContent(element).classList.add(Constants.HIDE_ON_MOBILE);
  } else {
    noSectionContent(element).classList.remove(Constants.HIDE_ON_MOBILE);
  }
}

/**
 * get/set the "hide on desktop" property
 * @return true if the element is hidden on desktop
 */
export function getHideOnDesktop(element: HTMLElement): boolean {
  // FIXME: this is a workaround, it happens in mobile editor, when
  // dragg/dropping (element is document)
  if (!element || !element.classList) {
    return false;
  }

  return noSectionContent(element).classList.contains(Constants.HIDE_ON_DESKTOP);
}

/**
 * get/set the "hide on desktop" property
 * @param hide, true if the element has to be hidden on desktop
 */
export function setHideOnDesktop(element: HTMLElement, hide: boolean) {
  if (hide) {
    noSectionContent(element).classList.add(Constants.HIDE_ON_DESKTOP);
  } else {
    noSectionContent(element).classList.remove(Constants.HIDE_ON_DESKTOP);
  }
}
