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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */

import { Constants } from '../../Constants';
import { ComponentData, PseudoClass, StyleName, Visibility } from '../model/Data';
import { DomDirection, SilexElement } from '../model/Element';
import { ClipboardItem, FileInfo, LinkData, Model, View } from '../types';
import { InvalidationManager } from '../utils/InvalidationManager';
import { SilexNotification } from '../utils/Notification';
import { Style } from '../utils/Style';
import { FileExplorer } from '../view/dialog/FileExplorer';
import { ControllerBase } from './ControllerBase';
import { pageStore } from '../model-new/page-model';

/**
 * @param view  view class which holds the other views
 */
export class EditMenuController extends ControllerBase {
  /**
   * invalidation mechanism
   */
  undoredoInvalidationManager: InvalidationManager;

  constructor(model: Model, view: View) {
    super(model, view);
    this.undoredoInvalidationManager = new InvalidationManager(1000);
  }

  /**
   * undo the last action
   */
  undo() {
    if (ControllerBase.undoHistory.length > 0) {
      this.model.body.emptySelection();
      this.undoredoInvalidationManager.callWhenReady(() => {
        if (ControllerBase.getStatePending === 0 &&
            ControllerBase.undoHistory.length > 0) {
          const state = this.getState();
          ControllerBase.redoHistory.push(state);
          const prevState = ControllerBase.undoHistory.pop();
          this.restoreState(prevState);
          this.view.menu.redraw();
        } else {
          requestAnimationFrame(() => this.undo());
        }
      });
    }
  }

  /**
   * redo the last action
   */
  redo() {
    if (ControllerBase.redoHistory.length > 0) {
      this.model.body.emptySelection();
      this.undoredoInvalidationManager.callWhenReady(() => {
        if (ControllerBase.redoHistory.length > 0) {
          const state = this.getState();
          ControllerBase.undoHistory.push(state);
          const prevState = ControllerBase.redoHistory.pop();
          this.restoreState(prevState);
          this.view.menu.redraw();
        }
      });
    }
  }

  /**
   * copy the selection for later paste
   */
  copySelection() {
    ControllerBase.clipboard = this.cloneItems(this.model.body.getSelection());
    this.view.contextMenu.redraw();
  }

  /**
   * clone the selection and make an array of ClipboardItem
   */
  cloneItems(elements: HTMLElement[]): ClipboardItem[] {
    this.tracker.trackAction('controller-events', 'info', 'copy', 0);
    const body = this.model.body.getBodyElement();

    // select the sections instead of their container content
    const clonesData =
        // clone the elements
        elements
            .map((element) => this.model.element.noSectionContent(element))
            .filter((element) => {
              // not the body
              return body !== element;
                  // // not an element which has a selected parent
                  // // FIXME: closest is not yet defined on Element in google
                  // // closure, remove the array access ['closest'] when it is
                  // && element.parentElement['closest']('.' + Constants.SELECTED_CLASS_NAME) == null;
            })
            .map((element) => {
              return {
                el: element.cloneNode(true) as HTMLElement,
                parent: element.parentElement,
              };
            });
    if (clonesData.length > 0) {
      // reset clipboard
      const clipboard: ClipboardItem[] = [];

      // add each selected element to the clipboard
      clonesData.forEach((data) => {
        // copy the element and its children
        clipboard.push(this.recursiveCopy(data.el, data.parent));
      });
      return clipboard;
    }
    return [];
  }

  /**
   * make a recursive copy of an element styles/mobileStyle/componentData
   * the element and its children are already clones of the selection
   * this is needed to "freez" elements properties
   * return {silex.types.ClipboardItem}
   */
  recursiveCopy(element: HTMLElement, parent: HTMLElement): ClipboardItem {
    // duplicate the node
    const res: ClipboardItem = {
      parent,
      element,
      style: this.model.property.getStyle(element, false),
      mobileStyle: this.model.property.getStyle(element, true),
      componentData: this.model.property.getElementComponentData(element),
      children: [],
    };

    // case of a container, handle its children
    if (this.model.element.getType(res.element) === Constants.TYPE_CONTAINER) {
      const len = res.element.childNodes.length;
      for (let idx = 0; idx < len; idx++) {
        const el = (res.element.childNodes[idx] as HTMLElement);
        if (el.nodeType === 1 && this.model.element.getType(el) != null ) {
          res.children.push(this.recursiveCopy(el, el.parentElement));
        }
      }
    }
    return res;
  }

  /**
   * paste the previously copied element
   */
  pasteClipBoard() {
    const elements = this.pasteItems(ControllerBase.clipboard);
    // copy again so that we can paste several times (elements will be duplicated again)
    ControllerBase.clipboard = this.cloneItems(elements);
  }

  /**
   * paste the previously copied element
   */
  pasteItems(clipboard, toDefaultPostion = true): HTMLElement[] {
    this.tracker.trackAction('controller-events', 'info', 'paste', 0);

    // default is selected element
    if (clipboard && clipboard.length > 0) {
      // undo checkpoint
      this.undoCheckPoint();

      // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
      let offset = 0;

      // add to the container
      const selection = clipboard.map((clipboardItem) => {
        const element = this.recursivePaste(clipboardItem) as HTMLElement;
        // reset editable option
        this.doAddElement(element);

        // add to stage and set the "silex-just-added" css class
        if (toDefaultPostion) {
          this.model.element.addElementDefaultPosition(element, offset);
        } else {
          this.model.element.addElement(clipboardItem.parent, element, offset + 20);
        }
        offset += 20;

        // this is what will be added to selection
        return element;
      });

      // send the scroll to the target
      this.view.stageWrapper.center(selection);

      // select the new elements
      this.model.body.setSelection(selection);

      // refresh elements positions
      this.view.stageWrapper.redraw();

      return selection;
    }
  }

  /**
   * add the stored properties of the element and its children to the dom
   * also reset the ID of the element and its children
   * the elements have already been added to stage
   */
  recursivePaste(clipboardItem: ClipboardItem): HTMLElement {
    const element = clipboardItem.element;

    // reset the ID
    this.model.property.initSilexId(element);

    // add its children
    clipboardItem.children.forEach((childItem) => {
      const childElement = this.recursivePaste(childItem);
    });

    // init component props
    if (clipboardItem.componentData) {
      this.model.property.setElementComponentData(element, clipboardItem.componentData);

      // re-render components (makes inner ID change)
      this.model.component.render(element);
    }

    // keep the original style
    this.model.property.setStyle(element, clipboardItem.style, false);
    this.model.property.setStyle(element, clipboardItem.mobileStyle, true);

    // add this element
    this.model.element.addElement(clipboardItem.parent, element);
    return element;
  }

  /**
   * duplicate selection
   */
  duplicate() {
    const copied = this.cloneItems(this.model.body.getSelection());
    this.pasteItems(copied, false);
  }

  /**
   * remove selected elements from the stage
   */
  removeSelectedElements() {
    const elements = this.model.body.getSelection();

    if (!!elements.find((el) => el === this.model.body.getBodyElement())) {
      SilexNotification.alert('Delete elements',
        'Error: I can not delete the body as it is the root container of all your website. <strong>Please select an element to delete it</strong>.',
        () => {},
      );
    } else {
      // confirm and delete
      SilexNotification.confirm('Delete elements', 'I am about to <strong>delete the selected element(s)</strong>, are you sure?',
        (accept) => {
          if (accept) {
            // undo checkpoint
            this.undoCheckPoint();

            // do remove selected elements
            elements.forEach((element) => {
              this.model.element.removeElement(element);
            });
          }
        }, 'delete', 'cancel',
      );
    }
  }

  isEditable(el: HTMLElement) {
    return this.model.component.isComponent(el) ||
      Constants.EDITABLE_ELEMENT_TYPES.indexOf(this.model.element.getType(el)) > -1;
  }

  /**
   * edit an {silex.types.Element} element
   * take its type into account and open the corresponding editor
   */
  editElement(opt_element?: HTMLElement) {
    // undo checkpoint
    this.undoCheckPoint();

    // default is selected element
    const element = opt_element || this.model.body.getSelection().filter((el) => this.isEditable(el))[0];
    this.model.body.setSelection([element]);

    // open the params tab for the components
    // or the editor for the elements
    if (this.model.component.isComponent(element)) {
      this.view.propertyTool.openParamsTab();
    } else {
      switch (this.model.element.getType(element)) {
        case Constants.TYPE_TEXT:
          // open the text editor
          this.view.textFormatBar.startEditing(this.view.fileExplorer);
          // this.view.propertyTool.openStyleTab();
          break;
        case Constants.TYPE_HTML:
          this.view.htmlEditor.open();
          this.view.htmlEditor.setSelection([element]);
          break;
        case Constants.TYPE_IMAGE:
          this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
              .then((blob) => {
                if (blob) {
                  // load the image
                  this.model.element.setImageUrl(element, blob.absPath);
                }
              })
              .catch((error) => {
                SilexNotification.notifyError(
                    'Error: I did not manage to load the image. \n' +
                    (error.message || ''));
              });
          break;
      }
    }
  }

  /**
   * @param element, the component to edit
   */
  editComponent(element: HTMLElement) {
    if (this.model.component.isComponent(element)) {
      const componentData = this.model.property.getElementComponentData(element);
      if (element && this.model.component.prodotypeComponent && componentData) {
        this.model.component.prodotypeComponent.edit(
            componentData,
            this.model.property.getDataSources(),
            componentData.templateName, {
              onChange: (newData, html) => {
                // undo checkpoint
                this.undoCheckPoint();

                // remove the editable elements temporarily
                const tempElements = this.model.component.saveEditableChildren(element);

                // store the component's data for later edition
                this.model.property.setElementComponentData(element, newData);

                // update the element with the new template
                this.model.element.setInnerHtml(element, html);

                // execute the scripts
                this.model.component.executeScripts(element);

                // put back the editable elements
                element.appendChild(tempElements);
              },
              onBrowse: (e, url, cbk) => this.onBrowse(e, url, cbk),
              onEditLink: (e, linkData, cbk) =>
                  this.onEditLink(e, linkData, cbk),
            });
      }
      this.model.component.componentEditorElement.classList.remove('hide-panel');
    } else {
      this.model.component.componentEditorElement.classList.add('hide-panel');
      this.model.component.resetSelection(Constants.COMPONENT_TYPE);
    }
  }

  onEditLink(e: Event, linkData: LinkData, cbk: (p1: LinkData) => any) {
    e.preventDefault();
    this.linkDialog.open(linkData, (_linkData) => {
      cbk(_linkData);
    });
  }

  onBrowse(e: Event, url: string, cbk: (p1: FileInfo[]) => any) {
    e.preventDefault();

    // browse with CE
    const promise = this.view.fileExplorer.openFile();

    // add tracking and undo/redo checkpoint
    this.track(promise, 'prodotype.browse');
    this.undoredo(promise);

    // handle the result
    promise
    .then((fileInfo: FileInfo) => {
      if (fileInfo) {
        cbk([fileInfo]);
      }
    })
    .catch((error) => {
      SilexNotification.notifyError('Error: I could not select the file. <br /><br />' + (error.message || ''));
    });
  }

  /**
   * @param className, the css class to edit the style for
   * @param pseudoClass, e.g. normal, :hover, ::first-letter
   * @param visibility, e.g. mobile only, desktop and mobile...
   */
  editStyle(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility) {
    const styleData = this.model.property.getStyleData(className) || {styles: {}};
    const visibilityData = styleData.styles[visibility] || {};
    const pseudoClassData = visibilityData[pseudoClass] || {
      templateName: 'text',
      className,
      pseudoClass,
    };
    this.model.component.prodotypeStyle.edit(
      pseudoClassData,
      [{displayName: '', name: '', templateName: ''}]
        .concat(this.model.property.getFonts()
        .map((font) => {
          return {
            displayName: font.family,
            name: font.family,
            templateName: '',
          };
        }),
      ),
      'text', {
        onChange: (newData, html) => this.model.component.componentStyleChanged(className, pseudoClass, visibility, newData),
        onBrowse: (e, url, cbk) => this.onBrowse(e, url, cbk),
      },
    );
  }

  /**
   * get the index of the element in the DOM
   */
  indexOfElement(element: HTMLElement): number {
    const len = element.parentElement.childNodes.length;
    for (let idx = 0; idx < len; idx++) {
      if (element.parentElement.childNodes[idx] === element) {
        return idx;
      }
    }
    return -1;
  }

  /**
   * Move the selected elements in the DOM
   * This will move its over or under other elements if the z-index CSS
   * properties are not set
   */
  move(direction: DomDirection) {
    // undo checkpoint
    this.undoCheckPoint();

    // get the selected elements
    const elements = this.model.body.getSelection();

    // sort the array
    elements.sort((a, b) => {
      return this.indexOfElement(a) - this.indexOfElement(b);
    });

    // move all the elements in the selection
    elements.forEach((element) => {
      const stylesObj =
          this.model.file.getContentWindow().getComputedStyle(element);
      const reverse = stylesObj.position !== 'absolute';
      if (reverse) {
        switch (direction) {
          case DomDirection.UP:
            direction = DomDirection.DOWN;
            break;
          case DomDirection.DOWN:
            direction = DomDirection.UP;
            break;
          case DomDirection.TOP:
            direction = DomDirection.BOTTOM;
            break;
          case DomDirection.BOTTOM:
            direction = DomDirection.TOP;
            break;
        }
      }
      this.model.element.move(element, direction);
    });
  }

  /**
   * Move the selected elements in the DOM
   * This will move its over or under other elements if the z-index CSS
   * properties are not set
   */
  moveUp() {
    this.move(DomDirection.UP);
  }

  /**
   * Move the selected elements in the DOM
   * This will move its over or under other elements if the z-index CSS
   * properties are not set
   */
  moveDown() {
    this.move(DomDirection.DOWN);
  }

  /**
   * Move the selected elements in the DOM
   * This will move its over or under other elements if the z-index CSS
   * properties are not set
   */
  moveToTop() {
    this.move(DomDirection.TOP);
  }

  /**
   * Move the selected elements in the DOM
   * This will move its over or under other elements if the z-index CSS
   * properties are not set
   */
  moveToBottom() {
    this.move(DomDirection.BOTTOM);
  }
}
