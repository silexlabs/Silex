/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview
 *   This class is used to manage how elements are dragged on the stage
 *   There is also a concept of "sticky lines" to which elements stick when resized or moved
 *   The sticky lines can be automatically created on "startDrag" from the components on the stage (to have sticky elements)
 *   or they can be set by the user like rulers - yet to be developed (TODO)
 *   The process of creation of sticky lines on startDrag is asynchronous through the use of generators and continuation
 */

goog.provide('silex.model.DragSystem');

goog.require('goog.style');

function * buildStickyLinesFromElements(win, allWebsiteElements, dragSystem) {
  // console.log('loop START !!!', dragSystem.stickyLines);
  const stickableElements = allWebsiteElements.filter(element => dragSystem.isDraggable(element) &&
    !element.classList.contains(silex.model.Element.SELECTED_CLASS_NAME) &&
    (dragSystem.model.page.isInPage(element) || !element.classList.contains(silex.model.Page.PAGED_CLASS_NAME))
  );
  yield;
  for(let element of stickableElements) {
    const elementId = dragSystem.model.property.getSilexId(element);
    const box = dragSystem.getBoundingBox(win, element);
    const base = {
      metaData: { type: 'element', elementId: elementId, element: element },
    };
    dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
      id: elementId + '_left',
      vertical: true,
      position: box.left,
      stickyPoint: StickyPoint.LEFT,
    }, base)));
    yield;
    dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
      id: elementId + '_right',
      vertical: true,
      position: box.right,
      stickyPoint: StickyPoint.RIGHT,
    }, base)));
    yield;
    dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
      id: elementId + '_top',
      vertical: false,
      position: box.top,
      stickyPoint: StickyPoint.TOP,
    }, base)));
    yield;
    dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
      id: elementId + '_bottom',
      vertical: false,
      position: box.bottom,
      stickyPoint: StickyPoint.BOTTOM,
    }, base)));
    // yield;
    // dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
    //   id: elementId + '_midV',
    //   vertical: false,
    //   position: Math.round((box.bottom - box.top) / 2),
    //   stickyPoint: StickyPoint.MID_V,
    // }, base)));
    // yield;
    // dragSystem.addStickyLine(/** @type {StickyLine} */ (Object.assign({
    //   id: elementId + '_midH',
    //   vertical: true,
    //   position: Math.round((box.right - box.left) / 2),
    //   stickyPoint: StickyPoint.MID_H,
    // }, base)));
  }
  // console.log('loop STOP !!!', dragSystem.stickyLines);
}

/**
 * Handle elements "stickyness" and movements
 *
 * @class {silex.model.DragSystem}
 */
class DragSystem {
  // static constants
  static get STICKY_DISTANCE() { return 5 };
  static get STUCK_CSS_CLASS() {return 'stuck'};
  static get STUCK_LEFT_CSS_CLASS() {return 'stuck-left'};
  static get STUCK_RIGHT_CSS_CLASS() {return 'stuck-right'};
  static get STUCK_TOP_CSS_CLASS() {return 'stuck-top'};
  static get STUCK_BOTTOM_CSS_CLASS() {return 'stuck-bottom'};
  /**
   * @param  {silex.types.Model} model  model class which holds the other models
   * @param  {silex.types.View} view  view class which holds the other views
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;
    /**
     * @type {Map<string,StickyLine>}
     */
    this.stickyLines = new Map();
    /**
     * is auto sticky elements on or off
     * @type {boolean}
     */
    this.autoStickyElements = false;
    /**
     * flag used to stop the async process building auto sticky elements lines
     * @type {boolean}
     */
    this.stopAutoStickyElements = false;
  }

  toggleStickyElements() {
    this.setStickyElements(!this.getStickyElements());
  }
  getStickyElements() {
    return this.autoStickyElements;
  }
  setStickyElements(enable) {
    this.autoStickyElements = enable;
    this.view.contextMenu.redraw();
  }


  /**
   * @param   {Window} win the window object of the iframe in which elements are
   */
  startDrag(win) {
    if(this.autoStickyElements) {
      const allWebsiteElements = Array.from(win.document.querySelectorAll('.' + silex.model.Body.EDITABLE_CLASS_NAME));
      this.stopAutoStickyElements = false;
      this.nextStep(buildStickyLinesFromElements(win, allWebsiteElements, this));
    }
  }


  /**
   * every animation frame, compute part of the sticky lines
   * this is optimization
   */
  nextStep(iterator) {
    if(!this.stopAutoStickyElements) {
      if(!iterator.next().done) {
        requestAnimationFrame(() => this.nextStep(iterator));
      }
    }
  }


  /**
   * @param   {Window} win the window object of the iframe in which elements are
   */
  stopDrag(win) {
    this.stopAutoStickyElements = true;
    this.removeElementsStickyLines();
    this.removeAllStyckyHtmlMarkup(win);
  }


  /**
   * remove sticky lines created with next step() anad buildStickyLinesFromElements()
   */
  removeElementsStickyLines() {
    this.stickyLines.forEach(s => {
      if(s.metaData && s.metaData.type === 'element') {
        this.removeStickyLine(s);
      }
    });
  }


  /**
   * @param   {Window} win the window object of the iframe in which elements are
   */
  removeAllStyckyHtmlMarkup(win) {
    // remove the 'stuck' css class
    Array
    .from(win.document.getElementsByClassName(DragSystem.STUCK_CSS_CLASS))
    .forEach(element => element.classList.remove(DragSystem.STUCK_CSS_CLASS));
    // remove the 'stuck-left', 'stuck-top'... css classes
    [
      DragSystem.STUCK_LEFT_CSS_CLASS,
      DragSystem.STUCK_RIGHT_CSS_CLASS,
      DragSystem.STUCK_TOP_CSS_CLASS,
      DragSystem.STUCK_BOTTOM_CSS_CLASS
    ].forEach(cssClass => {
      Array
      .from(win.document.getElementsByClassName(cssClass))
      .forEach(element => element.classList.remove(cssClass));
    });
  }


  /**
   * @param {string} id
   * @return {StickyLine}
   */
  getStickyLine(id) {
    return this.stickyLines.get(id);
  }


  /**
   * @param {StickyLine} s
   */
  addStickyLine(s) {
    if(this.stickyLines.has(s.id)) throw new Error('Error: the sticky line with id "' + s.id + '" already exists');
    return this.stickyLines.set(s.id, s);
  }


  /**
   * @param {StickyLine} s
   */
  removeStickyLine(s) {
    return this.stickyLines.delete(s.id);
  }


  /**
   * make the followers follow the element's size
   * @param   {Window} win the window object of the iframe in which elements are
   * @param   {Array.<HTMLElement>} followers which will follow the elements
   * @param   {string} resizeDirection the direction n, s, e, o, ne, no, se, so
   * @param   {number} offsetX the delta to be applied
   * @param   {number} offsetY the delta to be applied
   */
  followElementSize(win, followers, resizeDirection, offsetX, offsetY) {
    // check for a sticky line
    const element = followers[0];
    const box = this.getBoundingBox(win, element);
    let stuck = false;
    // cleanup before marking elements again when stuck
    this.removeAllStyckyHtmlMarkup(win);
    // for each sticky line, check if element sticks
    this.stickyLines
    .forEach(s => {
      const allowedDirections = (() => {
        switch(s.stickyPoint) {
          case StickyPoint.LEFT:
          case StickyPoint.RIGHT:
            return ['o', 'e'];
          case StickyPoint.TOP:
          case StickyPoint.BOTTOM:
            return ['n', 's'];
        }
      })()
      const delta = s.position - box[s.stickyPoint];
      if(
        // keep only the lines corresponding to the resize direction, e.g. the left vertical lines when we resize the top left corner
        allowedDirections.includes(resizeDirection) &&
        // and keep only the lines which are near the resized edge
        Math.abs(delta) < DragSystem.STICKY_DISTANCE
      )
      {
        if(!stuck) {
          stuck = true;
          switch(s.stickyPoint) {
            case StickyPoint.LEFT:
            case StickyPoint.RIGHT:
              // case StickyPoint.MID_V:
              offsetX += delta;
              break;
            case StickyPoint.TOP:
            case StickyPoint.BOTTOM:
              // case StickyPoint.MID_H:
              offsetY += delta;
              break;
          }
        }
        // mark all elements (the dragged element and the ones to which it sticks)
        // console.log('stick!!!');
        [element, s.metaData.element].forEach(el => {
          el.classList.add(DragSystem.STUCK_CSS_CLASS);
          el.classList.add(`stuck-${ s.stickyPoint }`);
        });
      }
    });
    // apply offset to other selected element
    followers.forEach((follower) => {
      // do not resize the stage or the un-resizeable elements
      if (follower.tagName.toUpperCase() !== 'BODY' &&
        !follower.classList.contains(silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME)) {
        var pos = goog.style.getPosition(follower);
        var offsetPosX = pos.x;
        var offsetPosY = pos.y;
        var offsetSizeX = offsetX;
        var offsetSizeY = offsetY;
        // depending on the handle which is dragged,
        // only width and/or height should be set
        switch (resizeDirection) {
        case 's':
          offsetSizeX = 0;
          break;
        case 'n':
          offsetPosY += offsetSizeY;
          offsetSizeY = -offsetSizeY;
          offsetSizeX = 0;
          break;
        case 'w':
          offsetPosX += offsetSizeX;
          offsetSizeX = -offsetSizeX;
          offsetSizeY = 0;
          break;
        case 'e':
          offsetSizeY = 0;
          break;
        case 'se':
          break;
        case 'sw':
          offsetPosX += offsetSizeX;
          offsetSizeX = -offsetSizeX;
          break;
        case 'ne':
          offsetPosY += offsetSizeY;
          offsetSizeY = -offsetSizeY;
          break;
        case 'nw':
          offsetPosX += offsetSizeX;
          offsetPosY += offsetSizeY;
          offsetSizeY = -offsetSizeY;
          offsetSizeX = -offsetSizeX;
          break;
        }
        const size = goog.style.getSize(follower);
        const borderBox = goog.style.getBorderBox(follower);
        const style = win.getComputedStyle(follower);
        const paddingBox = {
          left: parseInt(style.paddingLeft, 10),
          right: parseInt(style.paddingRight, 10),
          top: parseInt(style.paddingTop, 10),
          bottom: parseInt(style.paddingBottom, 10),
        };
        // handle section content elements which are forced centered
        // (only when the background is smaller than the body)
        // TODO in a while: remove support of .background since it is now a section
        if((follower.classList.contains(silex.view.Stage.BACKGROUND_CLASS_NAME) ||
          this.model.element.isSectionContent(follower)) &&
          size.width < win.document.documentElement.clientWidth - 100) {
          offsetSizeX *= 2;
        }
        // compute new size
        var newSizeW = size.width + offsetSizeX - borderBox.left - paddingBox.left - borderBox.right - paddingBox.right;
        var newSizeH = size.height + offsetSizeY - borderBox.top - paddingBox.top - borderBox.bottom - paddingBox.bottom;
        // handle min size
        if (newSizeW < silex.model.Element.MIN_WIDTH) {
          if (resizeDirection === 'w' || resizeDirection === 'sw' || resizeDirection === 'nw') {
            offsetPosX -= silex.model.Element.MIN_WIDTH - newSizeW;
          }
          newSizeW = silex.model.Element.MIN_WIDTH;
        }
        if (newSizeH < silex.model.Element.MIN_HEIGHT) {
          if (resizeDirection === 'n' || resizeDirection === 'ne' || resizeDirection === 'nw') {
            offsetPosY -= silex.model.Element.MIN_HEIGHT - newSizeH;
          }
          newSizeH = silex.model.Element.MIN_HEIGHT;
        }
        // set position in case we are resizing up or left
        followers.forEach(element => {
          this.model.element.setStyle(element, 'top', Math.round(offsetPosY) + 'px');
          this.model.element.setStyle(element, 'left', Math.round(offsetPosX) + 'px');
          // apply the new size
          this.model.element.setStyle(element, 'width', Math.round(newSizeW) + 'px');
          this.model.element.setStyle(element, this.model.element.getHeightStyleName(follower), Math.round(newSizeH) + 'px');
        });
      }
    });
  }


  /**
   * make the followers follow the element's position
   * @param   {Window} win the window object of the iframe in which elements are
   * @param   {Array.<HTMLElement>} followers which will follow the elements
   * @param   {number} offsetX the delta to be applied
   * @param   {number} offsetY the delta to be applied
   */
  followElementPosition(win, followers, offsetX, offsetY) {
    // check for a sticky line
    const element = followers[0];
    const box = this.getBoundingBox(win, element);
    let stuckX = false;
    let stuckY = false;
    // cleanup before marking elements again when stuck
    this.removeAllStyckyHtmlMarkup(win);
    // for each sticky line, check if element sticks
    this.stickyLines.forEach(s => {
      if(stuckX && stuckY) return;
      const pos = (() => {
        switch(s.stickyPoint) {
          case StickyPoint.LEFT:
            return box.left;
          case StickyPoint.RIGHT:
            return box.right;
          case StickyPoint.TOP:
            return box.top;
          case StickyPoint.BOTTOM:
            return box.bottom;
          // case StickyPoint.MID_H:
          //   return Math.round((box.right - box.left) / 2);
          // case StickyPoint.MID_V:
          //   return Math.round((box.bottom - box.top) / 2);
        }
      })();
      // check if we should stick
      const delta = s.position - pos;
      if(Math.abs(delta) < DragSystem.STICKY_DISTANCE) {
        switch(s.stickyPoint) {
          case StickyPoint.LEFT:
          case StickyPoint.RIGHT:
          // case StickyPoint.MID_V:
            if(!stuckX) {
              offsetX += delta;
              stuckX = true;
            }
            break;
          case StickyPoint.TOP:
          case StickyPoint.BOTTOM:
          // case StickyPoint.MID_H:
            if(!stuckY) {
              offsetY += delta;
              stuckY = true;
            }
            break;
        }
        // mark all elements (the dragged element and the ones to which it sticks)
        // console.log('stick!!!');
        [element, s.metaData.element].forEach(el => {
          el.classList.add(DragSystem.STUCK_CSS_CLASS);
          el.classList.add(`stuck-${ s.stickyPoint }`);
        });
      }
    });
    // apply offset to other selected element
    followers.forEach((follower) => {
      // do not move an element if one of its parent is already being moved
      // or if it is the stage
      // or if it has been marked as not draggable
      if (this.isDraggable(follower)) {
          // do not do this anymore because the element is moved to the body during drag so its position is wrong:
          // update the toolboxes to display the position during drag
          // let pos = goog.style.getPosition(follower);
          // let finalY = Math.round(pos.y + offsetY);
          // let finalX = Math.round(pos.x + offsetX);
          // this.controller.stageController.styleChanged('top', finalY + 'px', [follower], false);
          // this.controller.stageController.styleChanged('left', finalX + 'px', [follower], false);
          // move the element
          // let pos = goog.style.getPosition(follower);
          let left = parseInt(
            this.model.element.getStyle(follower, 'left')
            , 10);
            let top = parseInt(
              this.model.element.getStyle(follower, 'top')
            , 10);
          this.model.element.setStyle(follower, 'left', Math.round(left + offsetX) + 'px');
          this.model.element.setStyle(follower, 'top', Math.round(top + offsetY) + 'px');
      }
    });
  }

  isDraggable(element) {
    return element.tagName.toUpperCase() !== 'BODY' &&
      !goog.dom.getAncestorByClass(element.parentNode, silex.model.Element.SELECTED_CLASS_NAME) &&
      !element.classList.contains(silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
  }

  /**
   * @param {Element} element
   * @return {{left:number, right:number, top:number, bottom:number}}
   */
  getBoundingBox(win, element) {
    const box = (() => {
      if(this.view.workspace.getMobileEditor()) {
        // mobile => mix the 2 syles to have the final style
        const mob = this.model.property.getStyle(element, true) || {};
        const desk = this.model.property.getStyle(element, false) || {};
        return Object.assign({}, desk, mob);
      }
      else {
        return this.model.property.getStyle(element, false);
      }
    })()
    if(box) {
      const computedHeight = parseInt(win.getComputedStyle(element).height || 0, 10);
      const height = Math.max(computedHeight, parseInt(box['min-height'], 10));
      const elementPos = goog.style.getPageOffset(element);
      return {
        'left': elementPos.x, // parseInt(box.left, 10),
        'right': elementPos.x + parseInt(box.width, 10), // parseInt(box.left, 10) + parseInt(box.width, 10),
        'top': elementPos.y, // parseInt(box.top, 10),
        'bottom': elementPos.y + height, // parseInt(box.top, 10) + (parseInt(box.height || box['min-height'], 10)),
      };
    }
    else {
      console.error('could not get bounding box of', element);
      throw new Error('could not get bounding box of element');
    }
  }
}
