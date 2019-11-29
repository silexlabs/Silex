// import { Stage } from 'drag-drop-stage-component'; // this is not recognized by my IDE
import { Stage } from '../../../node_modules/drag-drop-stage-component/src/ts/index';
import { ScrollData, SelectableState } from '../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { SilexType, Constants } from '../../Constants';
import { getPages, subscribePages } from '../api';
import { Body } from '../model/Body';
import { Controller, Model } from '../types';
import { SilexNotification } from '../utils/Notification';

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
    subscribePages((prevState, nextState) => this.reset())
  }

  redraw() {
    if (!this.stage) { return; }
    this.stage.redraw();
  }
  reset() {
    console.log('reset stage', this.stage, this.model.element.getElementsForPage)
    if (!this.stage) { return; }
    this.stage.reset(this.model.element.getElementsForPage());
  }
  resizeWindow() {
    if (!this.stage) { return; }
    this.stage.resizeWindow();
  }
  addElement(element: HTMLElement) {
    if (!this.stage) { return; }
    this.stage.addElement(element);
  }
  removeElement(element: HTMLElement) {
    if (!this.stage) { return; }
    this.stage.removeElement(element);
  }
  center(elements: HTMLElement[]) {
    if (!this.stage) { return; }
    this.stage.center(elements);
  }
  getDropZone(posX: number, posY: number, element: HTMLElement): HTMLElement {
    if (!this.stage) { return this.model.body.getBodyElement(); }
    return this.stage.getDropZone(posX, posY, element);
  }
  getScroll(): ScrollData {
    if (!this.stage) { return {x: 0, y: 0}; }
    return this.stage.getScroll();
  }
  setScroll(scroll: ScrollData) {
    if (!this.stage) { return; }
    this.stage.setScroll(scroll);
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
    this.stage = new Stage(iframe, [], {
      isSelectable: ((el) => this.model.element.isVisible(el) && !el.classList.contains(Constants.PREVENT_SELECTABLE_CLASS_NAME)),
      isDraggable: ((el) => !el.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME)),
      isDropZone: ((el) => !el.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME) && el.classList.contains(SilexType.CONTAINER)),
      isResizeable: ((el) => {
        // section is not resizeable on mobile
        const isSectionOnMobile = this.controller.stageController.getMobileMode() && this.model.element.isSection(el);
        // css classes which prevent resize
        const hasPreventCssClass = el.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME);
        if (isSectionOnMobile || hasPreventCssClass) {
          return false;
        }
        // section content resizable height only
        const isSectionContentOnMobile = this.controller.stageController.getMobileMode() && this.model.element.isSectionContent(el);
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
        return !el.classList.contains(SilexType.SECTION)
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
    // give time to iframes to initialize
    setTimeout(() => {
      // TODO: this should go in a "selection" model
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
  startDragOrResize() {
    this.hideScrolls(true);
    this.dragging = true;
    this.prepareUndo();
  }
  startResize() {
    this.model.body.getBodyElement().classList.add(Constants.RESIZING_CLASS_NAME);
    this.startDragOrResize();
  }
  startDrag() {
    this.model.body.getBodyElement().classList.add(Constants.DRAGGING_CLASS_NAME);
    this.startDragOrResize();
  }
  stopDragOrResize(change, redraw) {
    this.hideScrolls(false);
    this.dragging = false;
    this.applyStyle(change);
    this.redraw();
    this.updateView();
  }
  stopResize(change, redraw = false) {
    this.model.body.getBodyElement().classList.remove(Constants.RESIZING_CLASS_NAME);
    this.stopDragOrResize(change, redraw);
  }
  stopDrag(change, redraw = false) {
    this.model.body.getBodyElement().classList.remove(Constants.DRAGGING_CLASS_NAME);
    this.stopDragOrResize(change, redraw);
  }
  prepareUndo() {
    this.controller.stageController.undoCheckPoint();
  }
  updateView() {
    this.model.body.refreshViews();
  }
  onSelectionChanged(_) {
    this.model.body.refreshViews();
  }
  applyStyle(change) {
    // do not mess up the css translation applyed by stage during drag
    if (!this.dragging) {
      change.forEach((s) => {
        // removed the inline styles
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

        // get element style
        const styleObject = this.model.property.getStyle(s.el) || {};

        // compute style
        styleObject[s.useMinHeight ? 'min-height' : 'height'] = s.metrics.computedStyleRect.height + 'px';
        styleObject.top = s.metrics.computedStyleRect.top + 'px';
        styleObject.left = s.metrics.computedStyleRect.left + 'px';
        styleObject.width = s.metrics.computedStyleRect.width + 'px';

        // apply styles
        this.model.property.setStyle(s.el, styleObject);
      });
      this.updateView();
    }
  }
}
