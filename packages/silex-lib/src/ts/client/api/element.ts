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

import { ElementState, ElementType, LinkData, DomDirection } from '../element-store/types'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { FileInfo } from '../third-party/types'
import { INITIAL_ELEMENT_SIZE, getCreationDropZone } from '../element-store/utils';
import { SilexNotification } from '../utils/Notification'
import { StyleName, PseudoClass, Visibility, StyleData, VisibilityData, PseudoClassData } from '../site-store/types'
import {
  addElement,
  moveElements,
  removeElementsWithoutConfirm,
  selectBody
} from '../element-store/dispatchers';
import { componentStyleChanged } from '../site-store/dispatchers'
import { deleteElements, getElements, updateElements } from '../element-store/index';
import {
  getBody,
  getSelectedElements,
  getSelectedElementsNoSectionContent
} from '../element-store/filters';
import { getDomElement, setImageUrl } from '../element-store/dom'
import { getSite } from '../site-store/index'
import { getSiteDocument, getSiteIFrame } from '../components/SiteFrame';
import { getStage } from '../components/StageWrapper';
import {
  isComponent,
  openComponentEditor,
  openStyleEditor,
  resetComponentEditor
} from '../element-store/component';
import { openHtmlEditor } from '../components/dialog/HtmlEditor'
import { openLinkDialog } from '../components/dialog/LinkDialog'
import { openParamsTab } from '../components/PropertyTool'
import { openTextFormatBar } from '../components/TextFormatBar'

/**
 * add an element, center it in the container which is in the middle of the screen
 */
export function addElementCentered(type: ElementType, componentName: string) {
  if (type === ElementType.SECTION) {
    const [el, updatedParentData] = addElement({
      type,
      parent: getBody(),
      componentName,
      style: {
        mobile: {},
        desktop: {},
      },
    });

    return [el, updatedParentData]
  } else {
    const parent = getCreationDropZone(false, getSiteIFrame());
    const parentState = getStage().getState(getDomElement(getSiteDocument(), parent))
    const parentRect = parentState.metrics.computedStyleRect

    const [el, updatedParentData] = addElement({
      type,
      parent,
      componentName,
      style: {
        mobile: {},
        desktop: {
          top: Math.round((parentRect.height / 2) - (INITIAL_ELEMENT_SIZE / 2)) + 'px',
          left: Math.round((parentRect.width / 2) - (INITIAL_ELEMENT_SIZE / 2)) + 'px',
        },
      },
    });

    return [el, updatedParentData]
  }
}

/**
 * open file explorer, choose an image and add it to the stage
 */
export function browseAndAddImage(componentName: string) {
  // this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
  FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
  .then((fileInfo) => {
    if (fileInfo) {

      // create the element
      const [imgData] = addElementCentered(ElementType.IMAGE, componentName);
      const img = getDomElement(getSiteDocument(), imgData);

      // load the image
      setImageUrl(img, fileInfo.absPath,
        (naturalWidth: number, naturalHeight: number) => {
          // this.tracker.trackAction('controller-events', 'success', 'insert.image', 1);
          updateElements([{
            ...imgData,
            style: {
              ...imgData.style,
              desktop: {
                ...imgData.style.desktop,
                width: naturalWidth + 'px',
                height: naturalHeight + 'px',
              },
            },
          }])
        },
        (element: HTMLElement, message: string) => {
          SilexNotification.notifyError('Error: I did not manage to load the image. \n' + message);
          deleteElements([imgData]);
          // this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
        },
      );
    }
  })
  .catch((error) => {
    SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
    // this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
  });
}

/**
 * remove selected elements from the stage
 */
export function removeElements(elements = getSelectedElements()) {
  const body = getBody()
  const toDelete = elements.filter((el) => el !== body)
  if (toDelete.length <= 0) {
    SilexNotification.alert('Delete elements',
      'Error: Please select an element to delete.',
      () => {},
    );
  } else {
    // confirm and delete
    SilexNotification.confirm('Delete elements', `I am about to <strong>delete ${toDelete.length} element(s)</strong>, are you sure?`,
      (accept) => {
        if (accept) {
          removeElementsWithoutConfirm(toDelete)
          selectBody()
        }
      }, 'delete', 'cancel',
    );
  }
}

/**
 * edit the first element in the selection
 * take its type into account and open the corresponding editor
 */
export function editElement() {
  const element: ElementState = getElements().find((el) => el.selected && el.enableEdit)

  if (element) {
    if (isComponent(element)) {
      openParamsTab();
    } else {
      // open the params tab for the components
      // or the editor for the elements
      switch (element.type) {
        case ElementType.TEXT:
          // open the text editor
          openTextFormatBar();
        break;
        case ElementType.HTML:
          openHtmlEditor();
        // view.htmlEditor.setSelection([element]);
        break;
        case ElementType.IMAGE:
          FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
        .then((blob) => {
          if (blob) {
            // load the image
            setImageUrl(
              getDomElement(getSiteDocument(), element),
              blob.absPath,
              (naturalWidth: number, naturalHeight: number) => {
                updateElements([{
                  ...element,
                  style: {
                    ...element.style,
                    desktop: {
                      ...element.style.desktop,
                      width: naturalWidth + 'px',
                      height: naturalHeight + 'px',
                    },
                  },
                }])
              },
              (el, message) => {
                console.error('could not load the image', message)
                SilexNotification.notifyError('Error: I did not manage to load the image. \n' + message);
              },
            );
          }
        })
        .catch((error) => {
          SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
        });
        break;
      }
    }
  }
}

/**
 * @param element, the component to edit
 */
export function editComponent(element: ElementState) {
  if (element && element.data.component) {
    const componentData = element.data.component;
    openComponentEditor({
      data: componentData,
      dataSources: getSite().dataSources,
      templateName: componentData.templateName,
      events: {
        onChange: (newData, html) => {
          // undo checkpoint
          // undoCheckPoint();

          const domEl = getDomElement(getSiteDocument(), element);

          // store the component's data for later edition
          updateElements([{
            ...element,
            data: {
              ...element.data,
              component: {
                ...element.data.component,
                ...newData,
              },
            },
            innerHtml: html,
          }]);

        },
        onBrowse: (e, url, cbk) => onBrowse(e, url, cbk),
        onEditLink: (e, linkData, cbk) =>
        onEditLink(e, linkData, cbk),
      }
    });
  } else {
    resetComponentEditor();
  }
}

function onEditLink(e: Event, linkData: LinkData, cbk: (p1: LinkData) => any) {
  e.preventDefault();
  openLinkDialog({
    data: linkData,
    cbk,
  });
}

function onBrowse(e: Event, url: string, cbk: (p1: FileInfo[]) => any) {
  e.preventDefault();

  // browse with CE
  const promise = FileExplorer.getInstance().openFile();

  // add tracking and undo/redo checkpoint
  // track(promise, 'prodotype.browse');
  // undoredo(promise);

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
export function editStyle(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility) {
  const styleData: StyleData = getSite().styles[className] || ({styles: {}} as StyleData);
  const visibilityData: VisibilityData = styleData.styles[visibility] || {};
  const pseudoClassData: PseudoClassData = visibilityData[pseudoClass] || {
    templateName: 'text',
    className,
    pseudoClass,
  };
  openStyleEditor({
    data: pseudoClassData,
    dataSources: [{displayName: '', name: '', templateName: ''}]
      .concat(getSite().fonts
        .map((font) => {
          return {
            displayName: font.family,
            name: font.family,
            templateName: '',
          };
        }),
    ),
    templateName: 'text',
    events: {
      onChange: (newData, html) => componentStyleChanged(className, pseudoClass, visibility, newData),
      onBrowse: (e, url, cbk) => onBrowse(e, url, cbk),
    },
  });
}

/**
 * get the index of the element in the DOM
 */
export function indexOfElement(element: HTMLElement): number {
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
export function move(direction: DomDirection) {
  // undo checkpoint
  // undoCheckPoint();

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
export function moveUp() {
  move(DomDirection.UP);
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveDown() {
  move(DomDirection.DOWN);
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveToTop() {
  move(DomDirection.TOP);
}

/**
 * Move the selected elements in the DOM
 * This will move its over or under other elements if the z-index CSS
 * properties are not set
 */
export function moveToBottom() {
  move(DomDirection.BOTTOM);
}
