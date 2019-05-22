// import { Stage } from 'drag-drop-stage-component'; // this is not recognized by my IDE
import { Stage } from '../../../node_modules/drag-drop-stage-component/src/ts/index';
import { ScrollData, SelectableState } from '../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { Constants } from '../../Constants';
import { Controller, Model } from '../types';
import { SilexNotification } from '../utils/notification';

export class StageWrapper {
  private stage: Stage;
  private dragging = false;
  /**
   *
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {}

  redraw() {
    if (!this.stage) { return; }
    this.stage.redraw();
  }
  reset() {
    if (!this.stage) { return; }
    this.stage.reset(this.model.page.getElementsForPage());
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
      isSelectable: ((el) => this.model.page.isVisible(el) && !el.classList.contains(Constants.PREVENT_SELECTABLE_CLASS_NAME)),
      isDraggable: ((el) => !el.classList.contains(Constants.PREVENT_DRAGGABLE_CLASS_NAME)),
      isDropZone: ((el) => !el.classList.contains(Constants.PREVENT_DROPPABLE_CLASS_NAME) && el.classList.contains(Constants.TYPE_CONTAINER)),
      isResizeable: ((el) => {
        // section content is not resizeable on mobile
        const isSectionContentOnMobile = this.controller.stageController.getMobileMode() && this.model.element.isSectionContent(el);
        // css classes which prevent resize
        const hasPreventCssClass = el.classList.contains(Constants.PREVENT_RESIZABLE_CLASS_NAME);
        if (isSectionContentOnMobile || hasPreventCssClass) {
          return false;
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
        return !el.classList.contains(Constants.TYPE_SECTION)
          || dropZone.tagName.toLowerCase() === 'body';
      }),
      onEdit: () => {
        if (!SilexNotification.isActive) {
          this.controller.editMenuController.editElement();
        }
      },
      onChange: (change) => this.applyStyle(change),
      onDrop: (change) => this.stopDrag(change),
      onResizeEnd: (change) => this.stopDrag(change, true),
      // onDrag: (change) => this.updateView(),
      // onResize: (change) => this.updateView(),
      onSelect: (change) => this.updateView(),
      onStartDrag: (change) => this.startDrag(),
      onStartResize: (change) => this.startDrag(),
    });
  }
  startDrag() {
    this.hideScrolls(true);
    this.dragging = true;
    this.prepareUndo();
  }
  stopDrag(change, redraw = false) {
    this.hideScrolls(false);
    this.dragging = false;
    this.applyStyle(change);
    this.updateView();
    this.redraw();
  }
  prepareUndo() {
    this.controller.stageController.undoCheckPoint();
  }
  updateView() {
    this.model.body.setSelection(this.stage.getSelection().map((s) => s.el));
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
        if (!this.model.element.isSection(s.el)) {
          // sections have no top, left, width
          if (!this.model.element.isSectionContent(s.el)) {
            // section contents have no top, left
            styleObject.top = s.metrics.computedStyleRect.top + 'px';
            styleObject.left = s.metrics.computedStyleRect.left + 'px';
          }
          // apply width
          styleObject.width = s.metrics.computedStyleRect.width + 'px';
        }
        // apply styles
        this.model.property.setStyle(s.el, styleObject);
      });
    }
  }
}
