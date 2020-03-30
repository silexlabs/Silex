import { ElementData, ElementId, ElementType } from '../element/types';
import {
  getBody,
  getElementById,
  getFirstPagedParent,
  getParent,
  noSectionContent
} from '../element/filters';
import { getCreationDropZone, getNewId } from '../element/utils';
import { getDomElement } from '../element/dom'
import { getElements, createElements, updateElements } from '../element/store'
import { getPages } from '../page/store'
import { getSiteDocument, getSiteIFrame } from '../components/SiteFrame'
import { getStage } from '../components/StageWrapper'

/**
 * @static because it is shared by all controllers
 * array of 2 elements: [allElements, rootElements]
 */
let clipboard: [ElementData[], ElementData[]] = null

/**
 * copy the selection for later paste
 */
export function copySelection() {
  clipboard = cloneElements(
    getElements()
    .filter((el) => el.selected)
  )
}

/**
 * duplicate selection
 * FIXME: use copyElements ??
 */
export function duplicateSelection() {
  const selection = getElements()
    .filter((el) => el.selected)
    .map((el) => noSectionContent(el))
  if (selection.length) {
    const allElements = []
    const rootElements = []
    selection
      .forEach((el) => {
        const all = cloneElement(el)
        allElements.push(...all)
        rootElements.push(...all.filter((e) => e.selected))
      })

    // keep the same parent
    const body = getBody()
    const parent = getParent(selection[0]) || body

    // paste
    pasteElements({parent, rootElements, allElements })
  }
}


// FIXME: flat seems to be missing on array in UT
// exported only for unit tests
export const flat = (arr) => arr.reduce((acc, val) => acc.concat(val), []);

/**
 * duplicate elements for later paste or for duplicate
 * returns a is a flat array of elements with new IDs and updated children list
 * only root elements are selected
 * @returns [allElements, rootElements]
 */
export function cloneElements(selection: ElementData[]): [ElementData[], ElementData[]] {
  const body = getBody()
  const all = flat(selection
    // do not allow the body to be cloned
    .filter((el) => el !== body)
    // take the section instead of section container
    .map((el) => noSectionContent(el))
    // do not clone elements twice:
    // remove elements which have a parent who is already being cloned
    // remove elements which are in the list multiple times due to noSectionContent
    .filter((el) => !selection.includes(getParent(el)) && 1 === selection.filter((e) => e === el).length)
    .map((el) => cloneElement(el)))

  return [all, all.filter((el) => el.selected)]
}

/**
 * clone elements
 * reset the ID of the element and its children
 * the elements need to be in the store already (and dom)
 */
export function cloneElement(element: ElementData, parentId: ElementId = null): ElementData[] {
  if(element) {
  const newId = getNewId()
  const res: ElementData[] = [{
    ...JSON.parse(JSON.stringify(element)),
    id: newId,
    parent: parentId,
    selected: parentId === null,
  }]
  res[0].children
    .forEach((id) => res.push(...cloneElement(getElementById(id), newId)))

  return res
  } else {
    // happens if getElementById returns undefined for whatever reason
    throw new Error('Element could not be cloned because it could not be found')
  }
}

export function hasElementsToPaste() {
  return !!clipboard && clipboard.length > 0
}

/**
 * paste the previously copied element
 */
export function pasteClipBoard() {
  const [allElements, rootElements] = clipboard

  // get the drop zone in the center
  const parent = getCreationDropZone(false, getSiteIFrame())

  pasteElements({
    parent,
    rootElements,
    allElements,
  })

  // copy again so that we can paste several times (elements will be duplicated again)
  clipboard = cloneElements(rootElements)
}

export function pasteElements({parent, rootElements, allElements}: {parent: ElementData, rootElements: ElementData[], allElements: ElementData[]}) {
  // this.tracker.trackAction('controller-events', 'info', 'paste', 0)

  if (allElements.length > 0) {
    // undo checkpoint
    // this.undoCheckPoint()

    // reset selection
    const resetSelection = getElements()
      .filter((el) => el.selected)
      .map((el) => ({
        from: el,
        to: {
          ...el,
          selected: false,
        },
      }))

    const parentState = getStage().getState(getDomElement(getSiteDocument(), parent))
    const parentRect = parentState.metrics.computedStyleRect

    // do not paste in place so that the user sees the pasted elements
    let offset = 0

    // add to the container
    createElements(allElements.map((element: ElementData) => {
      // only visible on the current page unless one of its parents is in a page already
      const pageNames = !parent || !!getFirstPagedParent(parent) ? [] : [getPages().find((p) => p.opened).id]
      const isRoot = rootElements.includes(element)
      if (isRoot) {
        offset += 20
      }
      return {
        ...element,
        pageNames,
        // position the element
        style: {
          ...element.style,
          desktop: isRoot && element.style.desktop.position !== 'static' ? {
            ...element.style.desktop,
            top: Math.round(offset + (parentRect.height / 2) - (parseInt(element.style.desktop.height) / 2)) + 'px',
            left: Math.round(offset + (parentRect.width / 2) - (parseInt(element.style.desktop.width) / 2)) + 'px',
          } : element.style.desktop,
        },
        // here selected is true since the cloned element was selected
        // reset the selected flag because observers need to get it when we select it again
        selected: true,
      }
    }))

    console.warn('not implemented add sections to the body')

    // update the parent (will add the element to the stage)
    const body = getBody()
    updateElements([{
      from: parent,
      to: {
        ...parent,
        children: parent.children.concat(rootElements
          .filter((el) => el.type !== ElementType.SECTION) // sections are added to the body
          .map((el) => el.id)),
      },
    }]
    .concat({
      from: body,
      to: {
        ...body,
        children: body.children.concat(rootElements
          .filter((el) => el.type === ElementType.SECTION)
          .map((el) => el.id)
        )}})
    // reset selection
    .concat(resetSelection),
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
    )

    console.info('could be dragged')
    // getStage().startDrag()
  }
}
