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
import { ElementData, ElementId, ElementType, FileInfo, PseudoClass, PseudoClassData, StyleData, StyleName, Visibility, VisibilityData } from '../../types';
import { createElements, deleteElements, getBody, getElement, getElements, getPages, getParent, getSite, getUi, moveElements, noSectionContent, updateElements, getSelectedElements, getSelectedElementsNoSectionContent, getChildren, getChildrenRecursive } from '../api';
import { LinkData, Model, View } from '../ClientTypes';
import { FileExplorer } from '../components/dialog/FileExplorer';
import { getStage, stopStageObserver, startStageObserver } from '../components/StageWrapper';
import { getSiteDocument } from '../components/UiElements';
import { getDomElement } from '../dom/element-dom';
import { DomDirection } from '../model/Element';
import { getFirstPagedParent, getNewId } from '../utils/ElementUtils';
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
    const body = getBody()
    getElements()
      .filter((el) => el.selected && el !== body)
      .map((el) => noSectionContent(el))
      .forEach((el) => ControllerBase.clipboard.push(...this.getClone(el)));
  }

  /**
   * duplicate selection
   */
  duplicateSelection() {
    const selection = getElements()
      .filter((el) => el.selected)
      .map((el) => noSectionContent(el))
    if (selection.length) {
      const allElements = [];
      const rootElements = [];
      selection
        .forEach((el) => {
          const all = this.getClone(el);
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

  /**
   * clone elements
   * reset the ID of the element and its children
   * the elements have already been added to stage
   */
  getClone(element: ElementData, parentId: ElementId = null): ElementData[] {
    const newId = getNewId(getElements());
    const res: ElementData[] = [{
      ...JSON.parse(JSON.stringify(element)),
      id: newId,
      parent: parentId,
      selected: parentId === null,
    }]
    res[0].children
      .forEach((id) => res.push(...this.getClone(getElement(id), newId)))

    return res;
  }

  hasElementsToPaste() {
    return !!ControllerBase.clipboard && ControllerBase.clipboard.length > 0;
  }

  /**
   * paste the previously copied element
   */
  pasteClipBoard() {
    const rootElements = ControllerBase.clipboard.filter((el) => el.selected);

    // get the drop zone in the center
    const parent = this.model.element.getCreationDropZone();

    this.pasteElements({
      parent,
      rootElements,
      allElements: ControllerBase.clipboard,
    });

    // copy again so that we can paste several times (elements will be duplicated again)
    const clone = [];
    ControllerBase.clipboard
      .forEach((el) => clone.push(...this.getClone(el)));
    ControllerBase.clipboard = clone;
  }

  pasteElements({parent, rootElements, allElements}: {parent: ElementData, rootElements: ElementData[], allElements: ElementData[]}) {
    console.log('pasteElements', {parent, rootElements, allElements})
    this.tracker.trackAction('controller-events', 'info', 'paste', 0);

    if (allElements.length > 0) {
      // undo checkpoint
      this.undoCheckPoint();

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
        const pageNames = !parent || !!getFirstPagedParent(getElements(), parent) ? [] : [getPages().find((p) => p.opened).id]
        const isRoot = rootElements.includes(element);
        if (isRoot) {
          offset += 20;
        }
        return {
          ...element,
          pageNames,
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
    }
  }

  /**
   * remove selected elements from the stage
   */
  removeSelectedElements() {
    const elements = getSelectedElements();

    const body = getBody()
    if (!!elements.find((el) => el === body)) {
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
            deleteElements(elements.concat(elements
              .reduce((prev, el) => prev.concat(getChildrenRecursive(el)), [])));
          }
        }, 'delete', 'cancel',
      );
    }
  }

  isEditable(el: ElementData) {
    return Constants.EDITABLE_ELEMENT_TYPES.indexOf(el.type) > -1;
  }

  /**
   * edit the first element in the selection
   * take its type into account and open the corresponding editor
   */
  editElement() {
    const element: ElementData = getElements().find((el) => el.selected && this.isEditable(el))
    console.log('edit element', element)

    if (element) {
      // open the params tab for the components
      // or the editor for the elements
      switch (element.type) {
        case ElementType.COMPONENT:
          this.view.propertyTool.openParamsTab();
          break;
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
                this.model.element.setImageUrl(getDomElement(getSiteDocument(), element), blob.absPath, (naturalWidth: number, naturalHeight: number) => {
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

            // store the component's data for later edition
            updateElements([{
              from: element,
              to: {
                ...element,
                data: {
                  ...element.data,
                  component: {
                    ...element.data.component,
                    ...newData,
                  },
                },
                innerHtml: html,
              },
            }]);

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
    const styleData: StyleData = getSite().style[className] || ({styles: {}} as StyleData);
    const visibilityData: VisibilityData = styleData.styles[visibility] || {};
    const pseudoClassData: PseudoClassData = visibilityData[pseudoClass] || {
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

    // move all the elements in the selection
    moveElements(getSelectedElementsNoSectionContent(), direction)

    // // get the selected elements
    // const elements = getSelectedElements();

    // // move all the elements in the selection
    // moveElements(getUi().mobileEditor ? elements : elements
    //   .filter((element) => element.style.desktop.position === 'static'),
    //   direction)
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
