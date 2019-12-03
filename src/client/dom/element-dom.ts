import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType, Link, LinkType, PageData } from '../../types';
import { getSiteDocument } from '../components/UiElements';
import { model } from './wip-refacto-model';

export function getDomElement(element: ElementData): HTMLElement {
  return getSiteDocument().querySelector(`[${Constants.ELEMENT_ID_ATTR_NAME}="${element.id}"]`);
}

// FIXME: for retro compat in element-dom
export function getElementData(element: HTMLElement): ElementData {
  const parent = model.element.noSectionContent(element.parentElement)
  const linkValue = element.getAttribute(Constants.LINK_ATTR)
  const linkType = linkValue ? linkValue.startsWith('#!page-') ? LinkType.PAGE : LinkType.URL : null
  return {
    id: getElementId(element),
    pageNames: [],
    classList: element.className.split(' '),
    type: getType(element),
    parent: parent ? getType(parent) : null,
    children: Array.from(element.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`))
      .map((el: HTMLElement) => getElementId(el)),
    link: linkType && linkValue ? {
      type: linkType,
      value: linkValue,
    } : null,
    enableDrag: !element.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME),
    enableDrop: !element.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME),
    enableResize: {
      top: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !element.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
      bottom: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !!element.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
      left: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !!element.classList.contains(Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
      right: !element.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME) && !!element.classList.contains(Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
    },
    selected: false,
    useMinHeight: !element.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT),
    visibility: {
      desktop: !element.classList.contains(Constants.HIDE_ON_DESKTOP),
      mobile: !element.classList.contains(Constants.HIDE_ON_MOBILE),
    },
    style: model.element.getAllStyles(element),
    data: {
      component: model.property.getComponentData(getElementId(element)),
    },
  }
}

/**
 * get all elements visible when the given page is opened
 */
export function getElementsFromDom(): ElementData[] {
  const doc = getSiteDocument()
  return (Array.from(doc.querySelectorAll(`.${Constants.EDITABLE_CLASS_NAME}`)) as HTMLElement[])
    .map((element) => getElementData(element))
}

/**
 * get/set Silex ID
 * @return uniqueId
 */
function getElementId(element: HTMLElement): ElementId {
  return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME);
}

/**
 * get/set type of the element
 * @param element   created by silex, either a text box, image, ...
 * @return           the type of element
 * example: for a container this will return "container"
 */
export function getType(element: HTMLElement): ElementType {
  switch (element.getAttribute(Constants.TYPE_ATTR)) {
    case ElementType.CONTAINER.toString(): return ElementType.CONTAINER
    case ElementType.SECTION.toString(): return ElementType.SECTION
    case ElementType.CONTAINER_CONTENT.toString(): return ElementType.CONTAINER_CONTENT
    case ElementType.IMAGE.toString(): return ElementType.IMAGE
    case ElementType.TEXT.toString(): return ElementType.TEXT
    case ElementType.HTML.toString(): return ElementType.HTML
  }
  throw new Error('unknown type ' + element.getAttribute(Constants.TYPE_ATTR))
}

export function moveToContainer(element: HTMLElement, parent: HTMLElement) {
  parent.appendChild(element)
}

export function reorderElements(elements: HTMLElement[]) {
  // check that they all belong to a container
  const parent = elements.reduce((prev, el) => el === prev ? prev : null)
  if (parent) {
    elements.forEach((el) => parent.appendChild(el))
  } else {
    throw new Error('Can not reoder elements because they are not from the same container')
  }
}
export function setLink(element: HTMLElement, link: Link) {
  model.element.setLink(element, !!link ? link.value : null)
}
///////////////////////////////////////////////
// WIP: need to update to the simpler abstract model decoupled from the dom

export const createElement = (type: ElementType): HTMLElement => model.element.createElement(type.toString())
export const noSectionContent = (element: HTMLElement) => model.element.noSectionContent(element)
export const removeElement = (rootElement: HTMLElement) => model.element.removeElement(rootElement)
export const removeFromAllPages = (element: HTMLElement) => model.element.removeFromAllPages(element)
export const addToPage = (element: HTMLElement, page: PageData) => model.element.addToPage(element, page)
export const setClassName = (element: HTMLElement, opt_className?: string) => model.element.setClassName(element, opt_className)
