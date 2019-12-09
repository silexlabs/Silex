// import { Stage } from 'drag-drop-stage-component'; // this is not recognized by my IDE
import { Stage } from '../../../node_modules/drag-drop-stage-component/src/ts/index';
import { ScrollData, SelectableState } from '../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { Constants } from '../../constants';
import { ElementData, ElementType } from '../../types';
import { getElements, getPages, getUi, subscribeElements, subscribePages, updateElements } from '../api';
import { Controller, Model } from '../ClientTypes';
import { getDomElement } from '../dom/element-dom';
import { Body } from '../model/Body';
import { SilexNotification } from '../utils/Notification';
import { Style } from '../utils/Style';
import { getSiteDocument } from './UiElements';

// WIP: will be the way to interact with the model
let stage: Stage
export const getStage = () => stage;

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
    subscribePages((prevState, nextState) => {
      this.reset();
    });
    subscribeElements((prevState, nextState) => {
      const newElements = nextState.filter((el) => !prevState.find((e) => e.id === el.id));
      if (newElements.length) {
        // send the scroll to the target
        this.center(newElements.map((el) => getDomElement(getSiteDocument(), el)));
      }
    });
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
  getState(el: HTMLElement): SelectableState {
    if (!this.stage) { return null; }
    return this.stage.getState(el);
  }
  setState(el: HTMLElement, state: SelectableState) {
    if (!this.stage) { return; }
    this.stage.setState(el, state);
  }
  getSelection(): SelectableState[] {
    if (!this.stage) { return []; }
    return this.stage.getSelection();
  }
  setSelection(elements: HTMLElement[]) {
    if (!this.stage) { return; }
    this.stage.setSelection(elements);
  }
  getSelectionBox() {
    if (!this.stage) { return; }
    return this.stage.getSelectionBox();
  }
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
    stage = this.stage = new Stage(iframe, [], {
      isSelectable: ((el) => !el.classList.contains(Constants.PREVENT_SELECTABLE_CLASS_NAME)),
      isDraggable: ((el) => !el.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME)),
      isDropZone: ((el) => !el.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME) && el.classList.contains(ElementType.CONTAINER)),
      isResizeable: ((el) => {
        // section is not resizeable on mobile
        const isSectionOnMobile = getUi().mobileEditor && this.model.element.isSection(el);
        // css classes which prevent resize
        const hasPreventCssClass = el.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME);
        if (isSectionOnMobile || hasPreventCssClass) {
          return false;
        }
        // section content resizable height only
        const isSectionContentOnMobile = getUi().mobileEditor && this.model.element.isSectionContent(el);
        if (isSectionContentOnMobile) {
          return {
            top: !el.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
            left: false,
            bottom: !el.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
            right: false,
          };
        }
        // case of all or part of the sides are resizeable
        return {
          top: !el.classList.contains(Constants.PREVENT_RESIZABLE_TOP_CLASS_NAME),
          left: !el.classList.contains(Constants.PREVENT_RESIZABLE_LEFT_CLASS_NAME),
          bottom: !el.classList.contains(Constants.PREVENT_RESIZABLE_BOTTOM_CLASS_NAME),
          right: !el.classList.contains(Constants.PREVENT_RESIZABLE_RIGHT_CLASS_NAME),
        };
      }),
      useMinHeight: ((el) => !el.classList.contains(Constants.SILEX_USE_HEIGHT_NOT_MINHEIGHT)),
      canDrop: ((el: HTMLElement, dropZone: HTMLElement) => {
        // sections can only be dropped in the body
        return !el.classList.contains(ElementType.SECTION)
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
    this.reset();
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
    this.model.body.getBodyElement().classList.add(Constants.RESIZING_CLASS_NAME);
    this.startDragOrResize();
  }
  private startDrag() {
    this.model.body.getBodyElement().classList.add(Constants.DRAGGING_CLASS_NAME);
    this.startDragOrResize();
  }
  private stopDragOrResize(changed: SelectableState[], redraw) {
    this.hideScrolls(false);
    this.dragging = false;
    this.applyStyle(changed);
    this.redraw();
  }
  private stopResize(changed: SelectableState[], redraw = false) {
    this.model.body.getBodyElement().classList.remove(Constants.RESIZING_CLASS_NAME);
    this.stopDragOrResize(changed, redraw);
  }
  private stopDrag(changed: SelectableState[], redraw = false) {
    this.model.body.getBodyElement().classList.remove(Constants.DRAGGING_CLASS_NAME);
    this.stopDragOrResize(changed, redraw);
    updateElements([
      // update element's parents
      ...changed
        .filter((selectable) => selectable.selected)
        // FIXME: find a more optimal way to get the data from DOM element
        .map((selectable) => getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el))
        .map((element) => {
          const domEl = getDomElement(getSiteDocument(), element)
          const parent = getElements().find((el) => getDomElement(getSiteDocument(), el) === domEl.parentElement)
          return {
            from: element,
            to: {
              ...element,
              parent: parent ? parent.id : null,
            },
          };
        }),
      // update element's parent's children
      ...changed
        .filter((selectable) => selectable.selected)
        // FIXME: find a more optimal way to get the data from DOM element
        .map((selectable) => ({
          parent: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el.parentElement),
          element: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el),
        }))
        .filter(({element, parent}) => !parent.children.find((el) => el === element.id))
        .map(({element, parent}) => {
          return {
            from: parent,
            to: {
              ...parent,
              children: parent.children.concat([element.id]),
            },
          };
        }),
      ])
  }
  private onSelectionChanged(changed: SelectableState[]) {
    updateElements(changed
      .map((selectable) => {
        // FIXME: find a more optimal way to get the data from DOM element
        return {
          element: getElements().find((el) => getDomElement(getSiteDocument(), el) === selectable.el),
          selectable,
        };
      })
      .filter(({element, selectable}) => element.selected !== selectable.selected)
      .map(({element, selectable}) => {
        console.log('onSelectionChanged', element, selectable)
        return {
          from: element,
          to: {
            ...element,
            selected: selectable.selected,
          },
        };
      }))
  }
  private prepareUndo() {
    this.controller.stageController.undoCheckPoint();
  }
  private applyStyle(change) {
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
            style: {
              ...element.style,
              ...Style.addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, {
                height: s.metrics.computedStyleRect.height + 'px',
                top: s.metrics.computedStyleRect.top + 'px',
                left: s.metrics.computedStyleRect.left + 'px',
                width: s.metrics.computedStyleRect.width + 'px',
              }),
            },
          },
        };
      }))
    }
  }
  private reset() {
    if (!this.stage) { return; }
    const currentPage = getPages().find((p) => p.isOpen);
    console.log('reset stage', currentPage)
    this.stage.reset(getElements()
      .filter(
        (el: ElementData) => (el.pageNames.length === 0 || !!el.pageNames.find((name) => name === currentPage.id))
        && ((el.visibility.desktop && !getUi().mobileEditor) || (el.visibility.mobile && getUi().mobileEditor)))
      .map((el) => getDomElement(getSiteDocument(), el)));
  }
  // FIXME: find another way to expose isMobileEditor to views
  private resizeWindow() {
    if (!this.stage) { return; }
    this.stage.resizeWindow();
  }
  private addElement(element: HTMLElement) {
    if (!this.stage) { return; }
    this.stage.addElement(element);
  }
  private removeElement(element: HTMLElement) {
    if (!this.stage) { return; }
    this.stage.removeElement(element);
  }
  private center(elements: HTMLElement[]) {
    if (!this.stage) { return; }
    this.stage.center(elements);
  }
  private getDropZone(posX: number, posY: number, element: HTMLElement): HTMLElement {
    if (!this.stage) { return this.model.body.getBodyElement(); }
    return this.stage.getDropZone(posX, posY, element);
  }
}
