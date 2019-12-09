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

import { Constants } from '../../constants';
import { ElementData, ElementId, ElementType, FileInfo } from '../../types';
import { createElements, deleteElements, getElements, getPages, getSite, getUi, moveElement, updateElements } from '../api';
import { LinkData, Model, View } from '../ClientTypes';
import { FileExplorer } from '../components/dialog/FileExplorer';
import { getSiteDocument } from '../components/UiElements';
import { getDomElement } from '../dom/element-dom';
import { PseudoClass, StyleName, Visibility } from '../model/Data';
import { DomDirection } from '../model/Element';
import { SilexNotification } from '../utils/Notification';
import { ControllerBase } from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class EditMenuController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * undo the last action
   */
  undo() {
    if (ControllerBase.undoHistory.length > 0) {
      if (ControllerBase.getStatePending === 0 && ControllerBase.undoHistory.length > 0) {
        const state = this.getState();
        ControllerBase.redoHistory.push(state);
        const prevState = ControllerBase.undoHistory.pop();
        this.restoreState(prevState);
        this.view.menu.redraw();
      } else {
        requestAnimationFrame(() => this.undo());
      }
    }
  }

  /**
   * redo the last action
   */
  redo() {
    if (ControllerBase.redoHistory.length > 0) {
      const state = this.getState();
      ControllerBase.undoHistory.push(state);
      const prevState = ControllerBase.redoHistory.pop();
      this.restoreState(prevState);
    }
  }

  /**
   * copy the selection for later paste
   */
  copySelection() {
    // this is a flat map
    ControllerBase.clipboard = [];
    getElements().filter((el) => el.selected)
      .forEach((el) => ControllerBase.clipboard.concat(this.getClone(el)));
  }

  /**
   * clone elements
   * reset the ID of the element and its children
   * the elements have already been added to stage
   */
  getClone(element: ElementData, parentId: ElementId = null): ElementData[] {
    const newId = this.model.property.getNewId(getSiteDocument());
    return [{
      ...JSON.parse(JSON.stringify(element)),
      id: newId,
      parent: parentId,
      selected: parentId === null,
    }]
    .concat(element
      .children
      .map((id) => this.getClone(getElements().find((e) => e.id === id), newId)))
  }

  /**
   * paste the previously copied element
   */
  pasteClipBoard(toDefaultPostion: boolean) {
    this.tracker.trackAction('controller-events', 'info', 'paste', 0);

    // default is selected element
    if (ControllerBase.clipboard && ControllerBase.clipboard.length > 0) {
      // undo checkpoint
      this.undoCheckPoint();

      // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
      let offset = 0;

      // add to the container
      createElements(ControllerBase.clipboard.map((element: ElementData) => {
        // only visible on the current page unless one of its parents is in a page already
        const pageNames = !!element.parent && !!this.getFirstPagedParent(getElements().find((el) => el.parent === element.parent)) ? [] : [getPages().find((p) => p.isOpen).id]
        offset += 20;
        return {
          ...element,
          pageNames,
          style: {
            ...element.style,
            desktop: {
              left: element.style.desktop.left + offset,
            },
          },
        }
      }));
    }
    // copy again so that we can paste several times (elements will be duplicated again)
    const clone = [];
    ControllerBase.clipboard
      .forEach((el) => clone.concat(this.getClone(el)));
    ControllerBase.clipboard = clone;
  }

  /**
   * duplicate selection
   */
  duplicate() {
    this.pasteClipBoard(false);
  }

  /**
   * remove selected elements from the stage
   */
  removeSelectedElements() {
    const elements = getElements().filter((el) => el.selected);

    if (!!elements.find((el) => el.parent === null)) {
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
            deleteElements(elements);
          }
        }, 'delete', 'cancel',
      );
    }
  }

  isEditable(el: ElementData) {
    return this.model.component.isComponent(getDomElement(getSiteDocument(), el)) ||
      Constants.EDITABLE_ELEMENT_TYPES.indexOf(el.type) > -1;
  }

  /**
   * edit an {silex.types.Element} element
   * take its type into account and open the corresponding editor
   */
  editElement(element: ElementData = getElements().filter((el) => this.isEditable(el))[0]) {
    // undo checkpoint
    this.undoCheckPoint();

    // open the params tab for the components
    // or the editor for the elements
    const domEl = getDomElement(getSiteDocument(), element);
    if (this.model.component.isComponent(domEl)) {
      this.view.propertyTool.openParamsTab();
    } else {
      switch (element.type) {
        case ElementType.TEXT:
          // open the text editor
          this.view.textFormatBar.startEditing(this.view.fileExplorer);
          // this.view.propertyTool.openStyleTab();
          break;
        case ElementType.HTML:
          this.view.htmlEditor.open();
          // this.view.htmlEditor.setSelection([element]);
          break;
        case ElementType.IMAGE:
          this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
              .then((blob) => {
                if (blob) {
                  // load the image
                  this.model.element.setImageUrl(domEl, blob.absPath, (naturalWidth: number, naturalHeight: number) => {
                    updateElements([{
                      from: element,
                      to: {
                        ...element,
                        style: {
                          ...element.style,
                          desktop: {
                            width: naturalWidth + 'px',
                            height: naturalHeight + 'px',
                          },
                        },
                      },
                    }])
                  });
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
  editComponent(element: ElementData) {
    if (element && element.data.component) {
      const componentData = element.data.component;
      this.model.component.prodotypeComponent.edit(
        componentData,
        getSite().dataSources,
        componentData.templateName, {
          onChange: (newData, html) => {
            // undo checkpoint
            this.undoCheckPoint();

            const domEl = getDomElement(getSiteDocument(), element);

            // remove the editable elements temporarily
            const tempElements = this.model.component.saveEditableChildren(domEl);

            // store the component's data for later edition
            updateElements([{
              from: element,
              to: {
                ...element,
                data: {
                  ...element.data,
                  ...newData,
                },
              },
            }]);

            // update the element with the new template
            this.model.element.setInnerHtml(domEl, html);

            // execute the scripts
            this.model.component.executeScripts(domEl);

            // put back the editable elements
            domEl.appendChild(tempElements);
          },
          onBrowse: (e, url, cbk) => this.onBrowse(e, url, cbk),
          onEditLink: (e, linkData, cbk) =>
          this.onEditLink(e, linkData, cbk),
        });
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
        .concat(getSite().fonts
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
   * Called from the context menu
   */
  move(direction: DomDirection) {
    // undo checkpoint
    this.undoCheckPoint();

    // get the selected elements
    const elements = getElements().filter((el) => el.selected);

    // move all the elements in the selection
    elements
      .filter((element) => getUi().mobileEditor || element.style.desktop.position === 'static')
      .forEach((element, idx) => {
        switch (direction) {
          case DomDirection.UP:
            moveElement(element, idx - 1);
            break;
          case DomDirection.DOWN:
            moveElement(element, idx + 1);
            break;
          case DomDirection.TOP:
            moveElement(element, 0);
            break;
          case DomDirection.BOTTOM:
            moveElement(element, getElements().find((el) => el.id === element.parent).children.length - 1);
            break;
        }
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
