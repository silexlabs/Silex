// import { Stage } from 'drag-drop-stage-component'; // this is not recognized by my IDE
import { Stage } from '../../../node_modules/drag-drop-stage-component/src/ts/index';
import { ScrollData, SelectableState } from '../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { Constants } from '../../constants';
import { ElementData, ElementType, UiData } from '../../types';
import { getBody, getElement, getElements, getPages, getParent, getSelectedElements, getUi, selectBody, subscribeElements, subscribePages, subscribeUi, updateElements } from '../api';
import { Controller, Model } from '../ClientTypes';
import { getDomElement, getDomElementById, getId } from '../dom/element-dom';
import { onCrudChange, StateChange } from '../flux/crud-store';
import { Body } from '../model/Body';
import { SilexNotification } from '../utils/Notification';
import { Style } from '../utils/Style';
import { getSiteDocument, getSiteWindow } from './UiElements';

// WIP: will be the way to interact with the model
let stage: Stage
export const getStage = () => stage;
let stoped = false;
export const stopStageObserver = () => stoped = true
export const startStageObserver = () => stoped = false

// expose reset as a workaround some stage bugs (see element-observer)
export function resetStage() {
  if (!stage) { return; } // happens when File::setData is called before the html is set
  const doc = getSiteDocument();
  const currentPage = getPages().find((p) => p.opened);
  stopStageObserver() // FIXME: should not be necessary, stage bug?
  stage.reset(getElements()
    .filter(
      (el: ElementData) => (el.pageNames.length === 0 || !!el.pageNames.find((name) => name === currentPage.id))
      && ((el.visibility.desktop && !getUi().mobileEditor) || (el.visibility.mobile && getUi().mobileEditor)))
    .map((el) => getDomElement(doc, el))
    .filter((el) => !!el)) // FIXME: what should we do while the child is not yet added
  stage.setSelection(getSelectedElements().map((el) => getDomElement(doc, el)))
  startStageObserver()
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
function onAddElement(elements: ElementData[]) {
  if (!stage) { console.warn('onAddElement NO STAGE'); return };
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
    // send the scroll to the target
    stage.center(elements.map((el) => getDomElement(doc, el)))
  }
}
// on deleted elements
function onDeleteElements(elements: ElementData[]) {
  if (!stage) { console.warn('onDeleteElement NO STAGE'); return };
  elements.forEach((el) => {
    stage.removeElement(el.id)
  })
}
// on update elements
function onUpdateElement(change: StateChange<ElementData>[]) {
  if (!stage) { console.warn('onUpdateElement NO STAGE'); return };
  const doc = getSiteDocument()
  let needReset = false
  const needResetSome = []
  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)
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
        needReset = true;
      } else {
        needResetSome.push(...[domEl]
          .concat(to.children.map((id) => getDomElementById(doc, id)))
          .map((el) => getStage().getState(el)))
      }
    }
  })
  // re-compute the other elements metrics
  if (needReset) {
    resetStage();
  } else {
    getStage().redrawSome(needResetSome)
  }
}

export class StageWrapper {
  private stage: Stage;
  private dragging = false;
  private toBeUnsubscribed = [];
  /**
   *
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {
    subscribePages(() => {
      // reset the stage after page open
      setTimeout(() => resetStage(), 0)
    });
    subscribeUi((prevState: UiData, nextState: UiData) => {
      if (!prevState || prevState.mobileEditor !== nextState.mobileEditor) {
        // reset the stage after switch to/from mobile editor
        setTimeout(() => resetStage(), 0)
      }
    });
    subscribeElements(onCrudChange<ElementData>({
      onAdd: preventStageObservers(onAddElement),
      onDelete: preventStageObservers(onDeleteElements),
      onUpdate: preventStageObservers(onUpdateElement),
    }))
  }
  getEnableSticky(): boolean {
    if (!this.stage) { return false; }
    return this.stage.enableSticky;
  }
  setEnableSticky(enable: boolean) {
    if (!this.stage) { return; }
    this.stage.enableSticky = enable;
  }
  toggleSticky() {
    if (!this.stage) { return; }
    this.stage.enableSticky = !this.stage.enableSticky;
  }
  // getState(el: HTMLElement): SelectableState {
  //   if (!this.stage) { return null; }
  //   return this.stage.getState(el);
  // }
  // setState(el: HTMLElement, state: SelectableState) {
  //   if (!this.stage) { return; }
  //   this.stage.setState(el, state);
  // }
  // getSelection(): SelectableState[] {
  //   if (!this.stage) { return []; }
  //   return this.stage.getSelection();
  // }
  // setSelection(elements: HTMLElement[]) {
  //   if (!this.stage) { return; }
  //   this.stage.setSelection(elements);
  // }
  // getSelectionBox() {
  //   if (!this.stage) { return; }
  //   return this.stage.getSelectionBox();
  // }
  getEditMode(): boolean {
    if (!this.stage) { return false; }
    return this.stage.catchingEvents;
  }
  setEditMode(mode: boolean) {
    if (!this.stage) { return; }
    if (this.stage.visible === mode) {
      this.stage.visible = !mode;
    }
  }

  cleanup() {
    // cleanup
    if (!!this.stage) {
      this.stage.cleanup();
      this.stage = null;
      stage = null;
    }
    this.toBeUnsubscribed.forEach((u) => u());
    this.toBeUnsubscribed = [];
  }

  /**
   * safe subscribe to mouse event
   * handle the multiple iframes and the current window
   * @return function to call to unsubscribe
   */
  subscribeMouseEvent(type: string, cbk: (e) => void): () => void {
    if (!this.stage) { return; }
    return this.stage.subscribeMouseEvent(type, cbk);
  }

  hideScrolls(hide: boolean) {
    if (!this.stage) { return; }
    this.stage.hideScrolls(hide);
  }

  init(iframe: HTMLIFrameElement) {
    this.cleanup();
    // FIXME: do not use css classes but ElementData
    stage = this.stage = new Stage(iframe, [], {
      getId: (el: HTMLElement) => getId(el),
      isSelectable: (el: HTMLElement) => {
        return true // el.tagName.toLowerCase() !== 'body'
      },
      isDraggable: (el: HTMLElement) => {
        const element = getElement(getId(el))
        return element.enableDrag
      },
      isDropZone: (el: HTMLElement) => {
        const element = getElement(getId(el))
        return element.enableDrop
      },
      isResizeable: ((el: HTMLElement) => {
        const element = getElement(getId(el))
        // section is not resizeable on mobile
        const isSectionOnMobile = getUi().mobileEditor && element.type === ElementType.SECTION;
        if (isSectionOnMobile) {
          return false;
        }
        // section content resizable height only
        const isSectionContentOnMobile = getUi().mobileEditor && element.isSectionContent;
        if (isSectionContentOnMobile) {
          return {
            top: element.enableResize.top,
            left: false,
            bottom: element.enableResize.bottom,
            right: false,
          };
        }
        // case of all or part of the sides are resizeable
        return element.enableResize;
      }),
      useMinHeight: (el: HTMLElement) => {
        const element = getElement(getId(el))
        return element.useMinHeight
      },
      canDrop: ((el: HTMLElement, dropZone: HTMLElement) => {
        const element = getElement(getId(el))
        // sections can only be dropped in the body
        return element.type !== ElementType.SECTION
          || dropZone.tagName.toLowerCase() === 'body';
      }),
      onEdit: () => {
        if (!SilexNotification.isActive) {
          this.controller.editMenuController.editElement();
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
    });
    resetStage();
    // give time to iframes to initialize
    setTimeout(() => {
      this.toBeUnsubscribed.push(
        this.subscribeMouseEvent('mousedown', (e: MouseEvent) => {
          // reset focus when the stage is clicked
          if (window !== (e.target as HTMLElement).ownerDocument.defaultView) {
            Body.resetFocus();
          }
        }),
      );
    }, 0);
  }
  getScroll(): ScrollData {
    if (!this.stage) { return {x: 0, y: 0}; }
    return this.stage.getScroll();
  }
  setScroll(scroll: ScrollData) {
    if (!this.stage) { return; }
    this.stage.setScroll(scroll);
  }
  redraw() {
    if (!this.stage) { return; }
    this.stage.redraw();
  }
  private startDragOrResize() {
    this.hideScrolls(true);
    this.dragging = true;
    this.prepareUndo();
  }
  private startResize() {
    getSiteDocument().body.classList.add(Constants.RESIZING_CLASS_NAME);
    this.startDragOrResize();
  }
  private startDrag() {
    getSiteDocument().body.classList.add(Constants.DRAGGING_CLASS_NAME);
    this.startDragOrResize();
  }
  private stopDragOrResize(changed: SelectableState[], redraw) {
    this.hideScrolls(false);
    this.dragging = false;
    this.applyStyle(changed);
    this.redraw();
  }
  private stopResize(changed: SelectableState[], redraw = false) {
    getSiteDocument().body.classList.remove(Constants.RESIZING_CLASS_NAME);
    this.stopDragOrResize(changed, redraw);
  }
  private stopDrag(changed: SelectableState[], redraw = false) {
    getSiteDocument().body.classList.remove(Constants.DRAGGING_CLASS_NAME);
    this.stopDragOrResize(changed, redraw);
    // Handle parent change
    // build an array with all the changes (may contain several times the same parent)
    const changes: {element: ElementData, newParent: ElementData, oldParent: ElementData}[] = changed
      .map((selectable) => ({
        // FIXME: find a more optimal way to get the data from DOM element
        element: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el),
        newParent: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el.parentElement),
      }))
      .map(({element, newParent}) => ({
        element, newParent,
        oldParent: getElements().find((el) => el.children.includes(element.id)),
      }))
      .filter(({element, newParent, oldParent}) => newParent !== oldParent)
    // build an array with 1 element by chanded parent
    const changedParents = changes
      .reduce((aggr, {element, newParent, oldParent}) => {
        const existingNewParentObj = aggr.find(({from, to}) => from.id === newParent.id);
        if (existingNewParentObj) existingNewParentObj.to.children.push(element.id);
        else aggr.push({
          from: newParent,
          to: {
            ...newParent,
            children: newParent.children.concat(element.id),
          },
        });
        if (!!oldParent) {
          const existingOldParentObj = aggr.find(({from, to}) => from.id === oldParent.id);
          if (existingOldParentObj) existingOldParentObj.to.children =  existingOldParentObj.to.children.filter((id) => id !== element.id);
          else aggr.push({
            from: oldParent,
            to: {
              ...oldParent,
              children: oldParent.children.filter((id) => id !== element.id),
            },
          })
        } else {
          console.warn('Element was not in a parent!', element)
        }
        return aggr;
      }, [] as StateChange<ElementData>[])
    // apply the changes
    updateElements(changedParents)
  }
  private onSelectionChanged(changed: SelectableState[]) {
    if (stoped) {
      // console.trace('prevent update elements with stoped in stage', changed);
      return;
    }
    const updateActions = changed
    .map((selectable) => {
      // FIXME: find a more optimal way to get the data from DOM element
      return {
        element: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el),
        selectable,
      };
    })
    .filter(({element, selectable}) => element.selected !== selectable.selected)
    .map(({element, selectable}) => {
      return {
        from: element,
        to: {
          ...element,
          selected: selectable.selected,
        },
      };
    })
    const body = getBody()
    console.trace('update selection from stage', changed);
    // always deselect the body in Silex
    updateElements(body.selected ? updateActions.concat([{
      from: body,
      to: {
        ...body,
        selected: false,
      },
    }]) : updateActions)
    // select the body if nothing else is selected
    if (getSelectedElements().length === 0) {
      selectBody()
    }
}
  private prepareUndo() {
    this.controller.stageController.undoCheckPoint();
  }
  private applyStyle(change) {
    if (stoped) {
      console.trace('prevent update elements with stoped in stage');
      return;
    }
    // do not mess up the css translation applyed by stage during drag
    if (!this.dragging) {
      // removed the inline styles
      change.forEach((s) => {
        // these are all the properties that can be set by the stage component
        s.el.style.top = '';
        s.el.style.left = '';
        s.el.style.right = '';
        s.el.style.bottom = '';
        s.el.style.width = '';
        s.el.style.height = '';
        s.el.style.margin = '';
        s.el.style.padding = '';
        s.el.style.border = '';
        s.el.style.minHeight = '';
        s.el.style.position = '';
      });
      // apply the style
      updateElements(change.map((s) => {
        // FIXME: find a more optimal way to get the data from DOM element
        const element = getElements().find((el) => getDomElement(getSiteDocument(), el) === s.el);
        return {
          from: element,
          to: {
            ...element,
            style: Style.addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, {
              height: s.metrics.computedStyleRect.height + 'px',
              top: s.metrics.computedStyleRect.top + 'px',
              left: s.metrics.computedStyleRect.left + 'px',
              width: s.metrics.computedStyleRect.width + 'px',
            }),
          },
        };
      }))
    }
  }
  // FIXME: find another way to expose isMobileEditor to views
//   private resizeWindow() {
//     if (!this.stage) { return; }
//     this.stage.resizeWindow();
//   }
//   private addElement(element: HTMLElement) {
//     if (!this.stage) { return; }
//     this.stage.addElement(element);
//   }
//   private removeElement(element: HTMLElement) {
//     if (!this.stage) { return; }
//     this.stage.removeElement(element);
//   }
  // private center(elements: HTMLElement[]) {
  //   if (!this.stage) { return; }
  //   this.stage.center(elements);
  // }
//   private getDropZone(posX: number, posY: number, element: HTMLElement): HTMLElement {
//     if (!this.stage) { return getSiteDocument().body; }
//     return this.stage.getDropZone(posX, posY, element);
//   }
}
