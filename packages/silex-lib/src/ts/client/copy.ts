import {
  ElementData,
  ElementId,
  ElementState,
  ElementType
} from './element-store/types'
import {
  createElements,
  fromElementData,
  toElementData,
  getElements,
  updateElements
} from './element-store/index'
import { flat } from './utils/array'
import {
  getBody,
  getElementById,
  getFirstPagedParent,
  getParent,
  getSelectedElements,
  noSectionContent
} from './element-store/filters'
import {
  getCreationDropZone,
  getDropStyle,
  getNewId
} from './element-store/utils'
import { getDomElement } from './element-store/dom'
import { getSiteDocument, getSiteIFrame } from './components/SiteFrame'
import { getUi, updateUi } from './ui-store/index'
import { store } from './store/index'

/**
 * copy the selection for later paste
 */
export function copySelection() {
  const selection = getSelectedElements().map((el) => noSectionContent(el))
  const clipboard = cloneElements(selection)
  updateUi({
    ...getUi(),
    clipboard,
  })
}

/**
 * duplicate selection
 * FIXME: use copyElements ??
 */
export function duplicateSelection() {
  const selection = getSelectedElements().map((el) => noSectionContent(el))
  if (selection.length) {
    const allElements: ElementData[] = []
    const rootElements: ElementData[] = []
    selection
      .forEach((el) => {
        const all = cloneElement(el)
        allElements.push(...all)
        rootElements.push(...all.filter((e) => e.selected))
      })

    // keep the same parent
    const parent = getParent(selection[0])

    // paste
    pasteElements({ parent, rootElements, allElements })
  }
}


/**
 * duplicate elements for later paste or for duplicate
 * returns a flat array of elements with new IDs and updated children list
 * only root elements are selected
 * @returns [allElements, rootElements]
 */
export function cloneElements(selection: ElementState[], elements = getElements()): [ElementState[], ElementState[]] {
  const body = getBody(elements)
  const all = flat(selection
    // do not allow the body to be cloned
    .filter((el) => el !== body)
    // take the section instead of section container
    .map((el) => noSectionContent(el, elements))
    // do not clone elements twice:
    // remove elements which have a parent who is already being cloned
    // remove elements which are in the list multiple times due to noSectionContent
    .filter((el) => !selection.includes(getParent(el, elements)) && 1 === selection.filter((e) => e === el).length)
    .map((el) => cloneElement(el, null, elements)))

  return [all, all.filter((el) => el.selected)]
}

export interface ElementStateaWithParentId extends ElementState {
  parentId: ElementId,
}

/**
 * clone elements
 * simply returns the result of cloneElement_ after cleaning up temporary values
 * this method is exported only for unit tests, only cloneElements is supposed to be used
 */
export function cloneElement(element: ElementState, parentId: ElementId = null, elements = getElements()): ElementData[] {
  return cloneElement_(element, parentId, elements)
    .map(el => {
      // remote parentId temporary value
      // parentId is not in ElementData
      // It is used to filter by parent ID and get direct descendents
      const elWithId = el as ElementStateaWithParentId
      delete elWithId.parentId
      return elWithId
    })
}

/**
 * clone elements
 * reset the ID of the element and its children
 * the elements need to be in the store already (and dom)
 */
function cloneElement_(element: ElementState, parentId: ElementId, elements: ElementState[]): ElementData[] {
  if(element) {
    const newId = getNewId()
    const children = flat(element.children
      .map((id) => cloneElement_(getElementById(id, elements), newId, elements)))
    // keep only the direct descendents
    const descendents = children
        .filter((el) => (el as ElementStateaWithParentId).parentId === newId)

    return [{
      ...toElementData([element])[0],
      id: newId,
      parentId,
      selected: parentId === null,
      children: descendents
        .map((el) => el.id),
    }].concat(children)

  } else {
    // happens if getElementById returns undefined for whatever reason
    throw new Error('Element could not be cloned because it could not be found')
  }
}

export function hasElementsToPaste() {
  return !!getUi().clipboard
}

/**
 * paste the previously copied element
 */
export function pasteClipBoard() {
  const [allElements, rootElements] = getUi().clipboard

  // get the drop zone in the center
  const parent = getCreationDropZone(false, getSiteIFrame())

  // only visible on the current page unless one of its parents is in a page already
  const { currentPageId } = getUi()
  const pageNames = !parent || !!getFirstPagedParent(parent) ? [] : [currentPageId]

  pasteElements({
    parent,
    rootElements,
    allElements,
    pageNames,
  })

  // copy again so that we can paste several times (elements will be duplicated again)
  const clipboard = cloneElements(rootElements)
  updateUi({
    ...getUi(),
    clipboard,
  })
}

/**
 * add duplicated elements to the site
 */
export function pasteElements({parent, rootElements, allElements, pageNames = null}: {
  parent: ElementState,
  rootElements: ElementData[],
  allElements: ElementData[],
  pageNames?: string[],
}, elements = getElements(), dispatch = store.dispatch) {
  if (allElements.length > 0) {
    // reset selection
    const resetSelection = elements
      .filter((el) => el.selected)
      .map((el) => ({
        ...el,
        selected: false,
    }))

    // get useful metrics
    const stageEl = getSiteIFrame()
    const stageSize = stageEl.getBoundingClientRect()
    const parentEl = getDomElement(getSiteDocument(), parent)
    const parentSize = parentEl.getBoundingClientRect()

    // do not paste in place so that the user sees the pasted elements
    let offset = 0

    // add to the container
    createElements(fromElementData(allElements.map((element) => {
      const isRoot = rootElements.includes(element)
      // get the final style for the element to be centered in the viewport
      const {left, top} = getDropStyle({
        stageSize,
        parentSize,
        elementSize: {
          width: parseInt(element.style.desktop.width),
          height: parseInt(element.style.desktop.height),
        },
        offset,
      })
      if (isRoot) {
        offset += 20
      }
      return {
        ...element,
        pageNames: pageNames || element.pageNames,
        // position the element
        style: {
          ...element.style,
          desktop: isRoot && element.style.desktop.position !== 'static' ? {
            ...element.style.desktop,
            top: top + 'px',
            left: left + 'px',
          } : element.style.desktop,
        },
        // here selected is true since the cloned element was selected
        // reset the selected flag because observers need to get it when we select it again
        // selected: true,
      }
    })), dispatch)

    // update the parent (will add the element to the stage)
    const body = getBody(elements)
    const newChildren = rootElements
      .filter((el) => el.type !== ElementType.SECTION) // sections are added to the body
      .map((el) => el.id)
    const bodyChildren = rootElements
      .filter((el) => el.type === ElementType.SECTION)
      .map((el) => el.id)

    updateElements((newChildren.length ? [{
        ...parent,
        children: parent.children.concat(newChildren),
      }] : [])
      .concat(bodyChildren.length ? {
        ...body,
        children: body.children.concat(bodyChildren),
      } : [])
      // reset selection
      .concat(resetSelection.length ? resetSelection : []),
      // // make pasted elements selected
      // .concat(rootElements
      //   .map((el) => getElement(el.id))
      //   .map((el) => ({
      //     from: el,
      //     to: {
      //       ...el,
      //       selected: true,
      //     },
      //   })))
      dispatch)

    console.info('could be dragged')
    // getStage().startDrag()
  }
}
