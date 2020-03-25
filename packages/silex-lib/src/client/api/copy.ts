import { ElementData, ElementType } from '../element/types'
import { cloneElements, cloneElement, getCreationDropZone } from '../element/utils'
import { getElements, createElements, updateElements } from '../element/store'
import { noSectionContent, getParent, getFirstPagedParent } from '../element/filters'
import { getDomElement } from '../element/dom'
import { getStage } from '../components/StageWrapper'
import { getPages } from '../page/store'
import { getSiteDocument, getUiElements } from '../ui/UiElements'

/**
 * @static because it is shared by all controllers
 * array of 2 elements: [allElements, rootElements]
 */
let clipboard: ElementData[][] = null;

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
    const allElements = [];
    const rootElements = [];
    selection
      .forEach((el) => {
        const all = cloneElement(el);
        allElements.push(...all);
        rootElements.push(...all.filter((e) => e.selected));
      });

    // keep the same parent
    const body = getElements().find(((el) => getDomElement(getSiteDocument(), el) === getSiteDocument().body)); // FIXME: find a better way to find the body
    const parent = getParent(selection[0]) || body;

    // paste
    this.pasteElements({parent, rootElements, allElements });
  }
}

export function hasElementsToPaste() {
  return !!clipboard && clipboard.length > 0;
}

/**
 * paste the previously copied element
 */
export function pasteClipBoard() {
  const [allElements, rootElements] = clipboard

  // get the drop zone in the center
  const parent = getCreationDropZone(false, getUiElements().stage);

  this.pasteElements({
    parent,
    rootElements,
    allElements,
  });

  // copy again so that we can paste several times (elements will be duplicated again)
  clipboard = cloneElements(rootElements)
}

export function pasteElements({parent, rootElements, allElements}: {parent: ElementData, rootElements: ElementData[], allElements: ElementData[]}) {
  this.tracker.trackAction('controller-events', 'info', 'paste', 0);

  if (allElements.length > 0) {
    // undo checkpoint
    // this.undoCheckPoint();

    // reset selection
    const resetSelection = getElements()
      .filter((el) => el.selected)
      .map((el) => ({
        from: el,
        to: {
          ...el,
          selected: false,
        },
      }));

    const parentState = getStage().getState(getDomElement(getSiteDocument(), parent));
    const parentRect = parentState.metrics.computedStyleRect;

    // do not paste in place so that the user sees the pasted elements
    let offset = 0;

    // add to the container
    createElements(allElements.map((element: ElementData) => {
      // only visible on the current page unless one of its parents is in a page already
      const pageNames = !parent || !!getFirstPagedParent(parent) ? [] : [getPages().find((p) => p.opened).id]
      const isRoot = rootElements.includes(element);
      if (isRoot) {
        offset += 20;
      }
      console.log('paste', {element, isRoot})
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
    }));

    console.warn('not implemented add sections to the body')

    // update the parent (will add the element to the stage)
    updateElements([{
      from: parent,
      to: {
        ...parent,
        children: parent.children.concat(rootElements
          .filter((el) => el.type !== ElementType.SECTION) // sections are added to the body
          .map((el) => el.id)),
      },
    }]
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
