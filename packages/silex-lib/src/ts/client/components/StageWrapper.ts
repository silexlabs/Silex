// FIXME: thie hole file is a mess

// import { Stage } from 'drag-drop-stage-component' // this is not recognized by my IDE
import { Stage } from '../../../../node_modules/drag-drop-stage-component/src/ts/index'
import { ScrollData, SelectableState } from '../../../../node_modules/drag-drop-stage-component/src/ts/Types'

import { Constants } from '../../constants'
import { ElementState, ElementId, ElementType } from '../element-store/types'
import { LOADING, UiState } from '../ui-store/types'
import { SilexNotification } from '../utils/Notification'
import { editElement } from '../api/element'
import { fixStyleForElement } from '../utils/styles'
import {
  getBody,
  getElementByDomElement,
  getElementById,
  getParent,
  getSelectedElements
} from '../element-store/filters'
import { getDomElement, getDomElementById, getId } from '../element-store/dom'
import { getElements, subscribeElements, updateElements } from '../element-store/index'
import { getSite, updateSite } from '../site-store/index'
import { getSiteDocument, getSiteWindow } from '../components/SiteFrame'
import { getUi, subscribeUi } from '../ui-store/index'
import { insertAt } from '../utils/array'
import { onCrudChange, StateChange } from '../store/crud-store'
import { resetFocus } from './Workspace'
import { selectBody } from '../element-store/dispatchers'

// FIXME: do not expose the stage component here?
let stage: Stage
export const getStage: (() => Stage) = () => stage
let stoped = false
export const stopStageObserver = () => stoped = true
export const startStageObserver = () => stoped = false

// expose reset as a workaround some stage bugs (see element-observer)
export function resetStage() {
  if (!stage) { return } // happens when File::setData is called before the html is set
  const doc = getSiteDocument()
  const { currentPageId } = getUi()
  stopStageObserver() // FIXME: should not be necessary, stage bug?
  stage.reset(getElements()
    .filter(
      (el: ElementState) => (el.pageNames.length === 0 || !!el.pageNames.find((name) => name === currentPageId))
      && ((el.visibility.desktop && !getUi().mobileEditor) || (el.visibility.mobile && getUi().mobileEditor)))
    .map((el) => getDomElement(doc, el))
    .filter((el) => !!el)) // FIXME: what should we do while the child is not yet added
  stage.setSelection(getSelectedElements().map((el) => getDomElement(doc, el)))
  startStageObserver()
}
function scrollToContainSelection() {
  stage.show(getSelectedElements()
    .map((el) => getDomElement(getSiteDocument(), el)))
}

export function getEnableSticky(): boolean {
  if (!stage) { return false }
  return stage.enableSticky
}
export function setEnableSticky(enable: boolean) {
  if (!stage) { return }
  stage.enableSticky = enable
}
export function toggleSticky() {
  if (!stage) { return }
  stage.enableSticky = !stage.enableSticky
}
export function getEditMode(): boolean {
  if (!stage) { return false }
  return stage.catchingEvents
}
export function setEditMode(mode: boolean) {
  if (!stage) { return }
  if (stage.visible === mode) {
    stage.visible = !mode
  }
}
export function resizeWindow() {
  if (!stage) { return }
  stage.resizeWindow()
}
export function hideUi(hide: boolean) {
  if (!stage) { return }
  stage.hideUi(hide)
}

/**
 * safe subscribe to mouse event
 * handle the multiple iframes and the current window
 * @return function to call to unsubscribe
 */
export function subscribeMouseEvent(type: string, cbk: (e) => void): () => void {
  if (!stage) { return }
  return stage.subscribeMouseEvent(type, cbk)
}


// //////////////////////////////
// elements observer
function preventStageObservers<A, B>(cbk: (...args: A[]) => B): (...args: A[]) => B {
  return (...args) => {
    // prevent updates from stage since we will update the selection
    stopStageObserver()
    // do the actual call
    const res = cbk(...args)
    // restart stage observers
    startStageObserver()
    // return the same as the cbk
    return res
  }
}
// on add elements
function onAddElement(elements: ElementState[]) {
  if (!stage) { console.warn('onAddElement NO STAGE'); return }
  const doc = getSiteDocument()
  elements.forEach((el) => {
    const parent = getParent(el) // parent may be null if the parent's children array has not yet be changed, then the element will be moved when it is set
    const parentEl = parent ? getDomElement(doc, parent) : doc.body
    if (parent && !parentEl) {
      // no parent element yet but will come soon
      console.warn('no parent element yet but will come soon')
    } else {
      // add to stage (needs to be done before onUpdate for selection)
      stage.addElement(getDomElement(doc, el), true)
    }
  })
  if (elements.length) {
    // a timeout is needed because otherwise it sends the scroll at the bottom (the element seems to be put after the last section)
    setTimeout(() => {
      // send the scroll to the target
      stage.center(elements.map((el) => getDomElement(doc, el)))
    }, 500)
  }
}
// on deleted elements
function onDeleteElements(elements: ElementState[]) {
  if (!stage) { console.warn('onDeleteElement NO STAGE'); return }
  elements.forEach((el) => {
    stage.removeElement(el.id)
  })
}
// on update elements
function onUpdateElement(change: StateChange<ElementState>[]) {
  if (!stage) { console.warn('onUpdateElement NO STAGE'); return }
  const doc = getSiteDocument()
  let needReset = false
  const needResetSome = []
  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)
    if(!domEl) {
      console.error('Why?', from, to)
      return
    }
    const isStatic = getSiteWindow().getComputedStyle(domEl).position === 'static'
    // selection
    if (to.selected !== from.selected) {
      const selection = stage.getSelection()
      const found = selection.find((s) => s.el === domEl)
      if (to.selected) {
        if (!found) {
          const newSelection = selection.map((s) => s.el).concat([domEl])
          getStage().setSelection(newSelection)
        }
      } else {
        if (found) {
          getStage().setSelection(selection.filter((s) => s !== found).map((s) => s.el))
        }
      }
    }
    if (to.pageNames !== from.pageNames) {
      // FIXME: reset only if visibility changed
      needReset = true
    }
    if (to.children !== from.children) {
      // needs reset because children visibility may have changed (also when creating a section, when the parent is attached it has a container in it)
      needReset = true
      // why a timout here? looks like without it there is a problem when creating elements / pasting etc ?
      setTimeout(() => scrollToContainSelection(), 500)
    }
    if (to.classList !== from.classList) {
      needReset = true
    }
    // element visibility destkop and mobile
    if (to.visibility.desktop !== from.visibility.desktop) {
      if (to.visibility.desktop) {
        if (!getUi().mobileEditor) {
          getStage().addElement(domEl)
        }
      } else {
        if (!getUi().mobileEditor) {
          // there is a bug in stage => reset instead of  getStage().removeElement(domEl)
          needReset = true
        }
      }
    }
    if (to.visibility.mobile !== from.visibility.mobile) {
      if (to.visibility.mobile) {
        if (getUi().mobileEditor) {
          getStage().addElement(domEl)
        }
      } else {
        if (getUi().mobileEditor) {
          // there is a bug in stage => reset instead of  getStage().removeElement(domEl)
          needReset = true
        }
      }
    }
    if (to.innerHtml !== from.innerHtml) {
      getStage().redrawSome([domEl]
        .map((el) => getStage().getState(el)))
    }
    if (to.style !== from.style) {
      // update stage for element and children
      if (isStatic || needReset) {
        // FIXME: redraw only if position/layout/size changed
        needReset = true
      } else {
        needResetSome.push(...[domEl]
          .concat(to.children.map((id) => getDomElementById(doc, id)))
          .map((el) => getStage().getState(el)))
      }
      // why a timout here? looks like without it there is a problem when creating elements / pasting etc ?
      setTimeout(() => scrollToContainSelection(), 500)
    }
  })
  // re-compute the other elements metrics
  if (needReset) {
    setTimeout(() => resetStage(), 0)
  } else {
    getStage().redrawSome(needResetSome)
  }
}

// TODO: get rid of the class, only methods
let stageWrapper: StageWrapper
export function initStageWrapper(element: HTMLIFrameElement) {
  if(!stageWrapper) stageWrapper = new StageWrapper()
  stageWrapper.init(element)
}
export function stageCleanup() {
  if(stageWrapper) stageWrapper.cleanup()
}

class StageWrapper {
  private stage: Stage
  private dragging = false
  private toBeUnsubscribed = []

  constructor() {
    // subscribePages(() => {
    //   // reset the stage after page creation
    //   setTimeout(() => resetStage(), 0)
    // })
    subscribeUi((prevState: UiState, nextState: UiState) => {
      if (!prevState || prevState.mobileEditor !== nextState.mobileEditor) {
        // reset the stage after switch to/from mobile editor
        setTimeout(() => resetStage(), 0)
      }
      if (!prevState || prevState.loading !== nextState.loading) {
        if (nextState.loading === LOADING.NONE) {
          hideUi(false)
          setEditMode(true)
        } else {
          hideUi(true)
          setEditMode(false)
        }
      }
      if (!prevState || prevState.mobileEditor !== nextState.mobileEditor) {
        resizeWindow()
      }
      if (prevState && prevState.currentPageId !== nextState.currentPageId) {
        // reset the stage after page open
        setTimeout(() => resetStage(), 0)
      }
    })
    subscribeElements(onCrudChange<ElementState>({
      onAdd: preventStageObservers(onAddElement),
      onDelete: preventStageObservers(onDeleteElements),
      onUpdate: preventStageObservers(onUpdateElement),
    }))
  }

  // getState(el: HTMLElement): SelectableState {
  //   if (!this.stage) { return null }
  //   return this.stage.getState(el)
  // }
  // setState(el: HTMLElement, state: SelectableState) {
  //   if (!this.stage) { return }
  //   this.stage.setState(el, state)
  // }
  // getSelection(): SelectableState[] {
  //   if (!this.stage) { return [] }
  //   return this.stage.getSelection()
  // }
  // setSelection(elements: HTMLElement[]) {
  //   if (!this.stage) { return }
  //   this.stage.setSelection(elements)
  // }
  // getSelectionBox() {
  //   if (!this.stage) { return }
  //   return this.stage.getSelectionBox()
  // }

  cleanup() {
    // cleanup
    if (!!this.stage) {
      this.stage.cleanup()
      this.stage = null
      stage = null
    }
    this.toBeUnsubscribed.forEach((u) => u())
    this.toBeUnsubscribed = []
  }

  init(iframe: HTMLIFrameElement) {
    this.cleanup()
    // FIXME: do not use css classes but ElementData
    stage = this.stage = new Stage(iframe, [], {
      getId: (el: HTMLElement) => getId(el),
      isSelectable: (el: HTMLElement) => {
        return true // el.tagName.toLowerCase() !== 'body'
      },
      isDraggable: (el: HTMLElement) => {
        const element = getElementById(getId(el))
        return element.enableDrag
      },
      isDropZone: (el: HTMLElement) => {
        const element = getElementById(getId(el))
        return element.enableDrop
      },
      isResizeable: ((el: HTMLElement) => {
        const element = getElementById(getId(el))
        // section is not resizeable on mobile
        const isSectionOnMobile = getUi().mobileEditor && element.type === ElementType.SECTION
        if (isSectionOnMobile) {
          return false
        }
        // section content resizable height only
        const isSectionContentOnMobile = getUi().mobileEditor && element.isSectionContent
        if (isSectionContentOnMobile) {
          return {
            top: element.enableResize.top,
            left: false,
            bottom: element.enableResize.bottom,
            right: false,
          }
        }
        // case of all or part of the sides are resizeable
        return element.enableResize
      }),
      useMinHeight: (el: HTMLElement) => {
        const element = getElementById(getId(el))
        return element.useMinHeight
      },
      canDrop: ((el: HTMLElement, dropZone: HTMLElement) => {
        const element = getElementById(getId(el))
        // sections can only be dropped in the body
        return element.type !== ElementType.SECTION
          || dropZone.tagName.toLowerCase() === 'body'
      }),
      onEdit: () => {
        if (!SilexNotification.isActive) {
          editElement()
        }
      },
      onChange: (change) => this.applyStyle(change),
      onDrop: (change) => this.stopDrag(change),
      onResizeEnd: (change) => this.stopResize(change, true),
      // onDrag: (change) => this.updateView(),
      // onResize: (change) => this.updateView(),
      onSelect: (change) => this.onSelectionChanged(change),
      onStartDrag: (change) => this.startDrag(),
      onStartResize: (change) => this.startResize(),
    })
    // init => the dom needs time to load
    setTimeout(() => resetStage(), 1000)
    // give time to iframes to initialize
    setTimeout(() => {
      this.toBeUnsubscribed.push(
        subscribeMouseEvent('mousedown', (e: MouseEvent) => {
          // reset focus when the stage is clicked
          if (window !== (e.target as HTMLElement).ownerDocument.defaultView) {
            resetFocus()
          }
        }),
      )
    }, 0)
  }
  getScroll(): ScrollData {
    if (!this.stage) { return {x: 0, y: 0} }
    return this.stage.getScroll()
  }
  // setScroll(scroll: ScrollData) {
  //   if (!this.stage) { return }
  //   this.stage.setScroll(scroll)
  // }
  redraw() {
    if (!this.stage) { return }
    this.stage.redraw()
  }
  private startDragOrResize() {
    this.dragging = true
    // this.prepareUndo()
  }
  private startResize() {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.add(Constants.RESIZING_CLASS_NAME)
    this.startDragOrResize()
  }
  private startDrag() {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.add(Constants.DRAGGING_CLASS_NAME)
    this.startDragOrResize()
  }
  private stopDragOrResize(changed: SelectableState[], redraw) {
    this.dragging = false
    this.applyStyle(changed)
    this.redraw()
  }
  private stopResize(changed: SelectableState[], redraw = false) {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.remove(Constants.RESIZING_CLASS_NAME)
    this.stopDragOrResize(changed, redraw)
  }
  private stopDrag(changed: SelectableState[], redraw = false) {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.remove(Constants.DRAGGING_CLASS_NAME)
    this.stopDragOrResize(changed, redraw)
    // Handle parent change
    // build an array with all the changes (may contain several times the same parent)
    const changes: {element: ElementState, newParent: ElementState, oldParent: ElementState, idx: number}[] = changed
      .map((selectable) => ({
        // FIXME: find a more optimal way to get the data from DOM element
        element: getElementByDomElement(getSiteDocument(), selectable.el),
        newParent: getElementByDomElement(getSiteDocument(), selectable.el.parentElement),
        idx: Array.from(selectable.el.parentElement.children).indexOf(selectable.el),
      }))
      .map(({element, newParent, idx}) => ({
        element, newParent, idx,
        oldParent: getParent(element),
      }))
      .filter(({element, newParent, oldParent, idx}) => newParent !== oldParent || oldParent.children.indexOf(element.id) !== idx)
    // build an array with 1 element by chanded parent
    const changedParents = changes
      .reduce((aggr, {element, newParent, oldParent, idx}) => {
        const existingNewParentObj = aggr.find((item) => item.id === newParent.id)
        if (existingNewParentObj) existingNewParentObj.children = insertAt<ElementId>(
          existingNewParentObj.children.filter((id) => id !== element.id), // in case it is the same parent
          idx, element.id)
        else aggr.push({
          ...newParent,
          children: insertAt(
            newParent.children.filter((id) => id !== element.id), // in case it is the same parent
            idx, element.id),
        })
        if (!!oldParent && oldParent.id !== newParent.id) {
          // parent changed
          const existingOldParentObj = getElementById(oldParent.id, aggr)
          if (existingOldParentObj) existingOldParentObj.children = existingOldParentObj.children.filter((id) => id !== element.id)
          else aggr.push({
            ...oldParent,
            children: oldParent.children.filter((id) => id !== element.id),
          })
        }
        return aggr
      }, [] as ElementState[])
    // apply the changes
    updateElements(changedParents)
  }
  private onSelectionChanged(changed: SelectableState[]) {
    if (stoped) {
      // console.trace('prevent update elements with stoped in stage', changed)
      return
    }
    const updateActions = changed
    .map((selectable) => {
      // FIXME: find a more optimal way to get the data from DOM element
      return {
        element: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el),
        selectable,
      }
    })
    .filter(({element, selectable}) => element.selected !== selectable.selected)
    .map(({element, selectable}) => {
      return {
        ...element,
        selected: selectable.selected,
      }
    })
    const body = getBody()
    // always deselect the body in Silex
    updateElements(body.selected ? updateActions.concat([{
      ...body,
      selected: false,
    }]) : updateActions)
    // select the body if nothing else is selected
    if (getSelectedElements().length === 0) {
      selectBody()
    }
  }
  // private prepareUndo() {
  //   this.controller.stageController.undoCheckPoint()
  // }
  private applyStyle(change) {
    if (stoped) {
      console.trace('prevent update elements with stoped in stage')
      return
    }
    // do not mess up the css translation applyed by stage during drag
    if (!this.dragging) {
      // removed the inline styles
      change.forEach((s) => {
        // these are all the properties that can be set by the stage component
        s.el.style.top = ''
        s.el.style.left = ''
        s.el.style.right = ''
        s.el.style.bottom = ''
        s.el.style.width = ''
        s.el.style.height = ''
        s.el.style.margin = ''
        s.el.style.padding = ''
        s.el.style.border = ''
        s.el.style.minHeight = ''
        s.el.style.position = ''
      })
      // apply the style
      updateElements(change.map((s) => {
        // FIXME: find a more optimal way to get the data from DOM element
        const element = getElements().find((el) => getDomElement(getSiteDocument(), el) === s.el)
        // website width is also section containers width
        //  && s.metrics.computedStyleRect.width + 'px' !== element.style.desktop.width
        if (!getUi().mobileEditor && element.isSectionContent) {
            // set website width
            const width = s.metrics.computedStyleRect.width
            updateSite({
              ...getSite(),
              width,
            })
        }
        return {
          ...element,
          style: {
            ...element.style,
            [getUi().mobileEditor ? 'mobile' : 'desktop']: fixStyleForElement(element, element.isSectionContent, {
                ...(getUi().mobileEditor ? element.style.mobile : element.style.desktop),
                height: s.metrics.computedStyleRect.height + 'px',
                top: s.metrics.computedStyleRect.top + 'px',
                left: s.metrics.computedStyleRect.left + 'px',
                width: s.metrics.computedStyleRect.width + 'px',
              })
          },
        }
      }))
    }
  }
//   private addElement(element: HTMLElement) {
//     if (!this.stage) { return }
//     this.stage.addElement(element)
//   }
//   private removeElement(element: HTMLElement) {
//     if (!this.stage) { return }
//     this.stage.removeElement(element)
//   }
  // private center(elements: HTMLElement[]) {
  //   if (!this.stage) { return }
  //   this.stage.center(elements)
  // }
//   private getDropZone(posX: number, posY: number, element: HTMLElement): HTMLElement {
//     if (!this.stage) { return getSiteDocument().body }
//     return this.stage.getDropZone(posX, posY, element)
//   }
}
