// FIXME: this hole file is a mess

import { ScrollData, SelectableState } from 'drag-drop-stage-component/src/ts/Types'
import { Stage } from 'drag-drop-stage-component/src/ts/index'

import { Constants } from '../../constants'
import { ElementState, ElementId, ElementType } from '../element-store/types'
import { Notification } from './Notification'
import { SiteState } from '../site-store/types'
import { UiState } from '../ui-store/types'
import { editElement } from './ContextMenu'
import { fixStyleForElement } from '../utils/styles'
import {
  getBody,
  getChildren,
  getChildrenRecursive,
  getElementByDomElement,
  getElementById,
  getParent,
  getSelectedElements
} from '../element-store/filters'
import { getDomElement, getId } from '../element-store/dom'
import { getElements, subscribeElements, updateElements } from '../element-store/index'
import { getSite, subscribeSite, updateSite } from '../site-store/index'
import { getSiteDocument } from '../components/SiteFrame'
import { getUi, subscribeUi } from '../ui-store/index'
import { insertAt } from '../utils/array'
import { onCrudChange, StateChange } from '../store/crud-store'
import { resetFocus } from './ModalDialog'
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
/**
 * unset all the inline properties that can be set by the stage component
 * on a draggable element after drop
 */
function resetEl(el: HTMLElement) {
  el.style.top = ''
  el.style.left = ''
  el.style.right = ''
  el.style.bottom = ''
  el.style.width = ''
  el.style.height = ''
  el.style.margin = ''
  el.style.padding = ''
  el.style.border = ''
  el.style.minHeight = ''
  el.style.position = ''
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
// setEditMode is used to hide the UI while editing text on stage
export function setEditMode(mode: boolean) {
  if (!stage) { return }
  if (stage.visible === mode) {
    stage.visible = !mode
  }
}
export function resizeWindow() {
  if (!stage) { return }
  // useless because it is done by DOM observers stage.updateMetrics()
  stage.resizeWindow()
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
    // update selection, because it is not added in onUpdateElement (it should be but it seems like the dom element does not exist?)
    stage.setSelection(getSelectedElements().map((el) => getDomElement(doc, el)))
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
  // this should be here but makes adding elements bugguy: if (stoped) { console.warn('onUpdateElement stoped is true => do nothing'); return }
  const doc = getSiteDocument()
  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)
    const state = getStage().getStateById(to.id)
    if(!domEl) {
      console.error('Why?', from, to)
      return
    }
    // const isStatic = getSiteWindow().getComputedStyle(domEl).position === 'static'
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
    // element visibility destkop and mobile
    if (to.visibility.desktop !== from.visibility.desktop) {
      if (to.visibility.desktop) {
        if (!getUi().mobileEditor) {
          getStage().addElement(domEl)
        }
      } else {
        if (!getUi().mobileEditor) {
          // there is a bug in stage => reset instead of
          getStage().removeElement(state.id)
          // needReset = true
        }
      }
    }
    if (to.tagName !== from.tagName) {
      // the state.el needs to be updated
      stage.removeElement(state.id)
      stage.addElement(domEl)
      // somehow we loose the selection here
      stage.setSelection(getSelectedElements().map((el) => getDomElement(doc, el)))
    }
    if (to.visibility.mobile !== from.visibility.mobile) {
      if (to.visibility.mobile) {
        if (getUi().mobileEditor) {
          getStage().addElement(domEl)
        }
      }
    }
    if (to.style !== from.style) {
      // why a timout here? looks like without it there is a problem when creating elements / pasting etc ?
      // setTimeout(() => scrollToContainSelection(), 500)
    }
  })

  // update the position and size of the UI
  const changedDomElements = change
    .filter(({from, to}) => from.style !== to.style || from.classList !== to.classList /* add pageNames? children?*/)
    .map(({to}) => getDomElement(getSiteDocument(), to))
    // add the children may need UI update too
    .concat(change
      // .filter(({from, to}) => from.children != to.children)
      .flatMap(({to}) => getChildrenRecursive(to))
      .map((el) => getDomElement(getSiteDocument(), el)))


  stage.updateMetrics(changedDomElements)
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
    subscribeUi((prevState: UiState, nextState: UiState) => {
      if (!stage) { return }
      if (!prevState || prevState.mobileEditor !== nextState.mobileEditor) {
        // reset the stage after switch to/from mobile editor
        setTimeout(() => resetStage(), 0)
      }
      if (!prevState || prevState.mobileEditor !== nextState.mobileEditor) {
        resizeWindow()
      }
      if (prevState && prevState.currentPageId !== nextState.currentPageId) {
        // reset the stage after page open
        setTimeout(() => resetStage(), 0)
      }
    })
    subscribeSite((prevState: SiteState, nextState: SiteState) => {
      if (!stage) { return }
      if (prevState.headStyle !== nextState.headStyle) {
        // update UI when the user uses CSS editor
        stage.updateMetrics()
      }
    })
    subscribeElements(onCrudChange<ElementState>({
      onAdd: preventStageObservers(onAddElement),
      onDelete: preventStageObservers(onDeleteElements),
      onUpdate: preventStageObservers(onUpdateElement),
    }))
  }

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
        if (!Notification.isActive) {
          editElement()
        }
      },
      onChange: (change) => this.applyStyle(change),
      onDrop: (change) => this.stopDrag(change),
      onResizeEnd: (change) => this.stopResize(change),
      // onDrag: (change) => this.updateView(),
      // onResize: (change) => this.applyStyle(change),
      onSelect: (change) => this.onSelectionChanged(change),
      onStartDrag: (change) => this.startDrag(),
      onStartResize: (change) => this.startResize(),
    })
    // init => the dom needs time to load
    setTimeout(() => resetStage(), 1000)
    // give time to iframes to initialize
    // FIXME: use onload
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
  private stopDragOrResize(changed: SelectableState[]) {
    this.dragging = false
    this.applyStyle(changed)
  }
  private stopResize(changed: SelectableState[]) {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.remove(Constants.RESIZING_CLASS_NAME)
    this.stopDragOrResize(changed)
  }
  private stopDrag(changed: SelectableState[]) {
    // FIXME: add a class to the body is slow
    getSiteDocument().body.classList.remove(Constants.DRAGGING_CLASS_NAME)
    this.stopDragOrResize(changed)
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
    .filter(({element, selectable}) => element && element.selected !== selectable.selected)
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
  private applyStyle(change: SelectableState[]) {
    if (stoped) {
      // console.trace('prevent update elements with stoped in stage')
      return
    }
    // do not mess up the css translation applyed by stage during drag
    if (!this.dragging) {
      // removed the inline styles
      change.forEach((s) => {
        // reset all properties set by the stage component on the element
        resetEl(s.el)
        // reset all children properties
        // FIXME: this is a workaround, the stage component should not set the properties on these children
        Array.from(s.el.querySelectorAll('.' + Constants.EDITABLE_CLASS_NAME))
        .forEach((el: HTMLElement) => resetEl(el))
      })
      // apply the style
      updateElements(change.map((s) => {
        // FIXME: find a more optimal way to get the data from DOM element
        const element = getElements().find((el) => getDomElement(getSiteDocument(), el) === s.el)
        if (!getUi().mobileEditor) {
          // website width is also section containers width
          //  && s.metrics.computedStyleRect.width + 'px' !== element.style.desktop.width
          const width = s.metrics.computedStyleRect.width
          if (element.isSectionContent && getSite().width !== width) {
            // set website width
            updateSite({
              ...getSite(),
              width,
            })
          }
          // this does not work because sections can not be smaller than their content:
          // // sectçion height needs to be applied to section content
          // if (element.type === ElementType.SECTION) {
          //   const sectionContent = getChildren(element).find((child) => child.isSectionContent)
          //   updateElements([{
          //     ...sectionContent,
          //     style: {
          //       ...sectionContent.style,
          //       desktop: {
          //         ...sectionContent.style.desktop,
          //         height: s.metrics.computedStyleRect.height + 'px',
          //       },
          //     },
          //   }])
          // }
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
}
