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

import { Constants } from '../../constants'
import { moveElements } from '../element/dispatchers'
import { getDomElement, setImageUrl } from '../element/dom'
import { getBody, getChildrenRecursive, getSelectedElements, getSelectedElementsNoSectionContent } from '../element/filters'
import { deleteElements, getElements, updateElements } from '../element/store'
import { ElementData, ElementType, PseudoClassData, StyleData, VisibilityData, StyleName, PseudoClass, Visibility } from '../element/types'
import { getSite } from '../site/store'
import { FileInfo } from '../third-party/types'
import { SilexNotification } from '../utils/Notification'
import { DomDirection, LinkData } from '../ClientTypes'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { getSiteDocument } from '../ui/UiElements'
import { resetComponentEditor, openStyleEditor } from '../element/component'
import { openComponentEditor } from '../element/component'
import { openHtmlEditor } from '../components/dialog/HtmlEditor'
import { openParamsTab } from '../components/PropertyTool'
import { openTextFormatBar } from '../components/TextFormatBar'
import { openLinkDialog } from '../components/dialog/LinkDialog'
import { componentStyleChanged } from '../element/component'
/**
 * remove selected elements from the stage
 */
export function removeSelectedElements() {
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
          // undoCheckPoint();

          // do remove selected elements
          deleteElements(elements.concat(elements
            .reduce((prev, el) => prev.concat(getChildrenRecursive(el)), [])));
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
  const element: ElementData = getElements().find((el) => el.selected && el.enableEdit)

  if (element) {
    // open the params tab for the components
    // or the editor for the elements
    switch (element.type) {
      case ElementType.COMPONENT:
        openParamsTab();
        break;
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
              setImageUrl(getDomElement(getSiteDocument(), element), blob.absPath, (naturalWidth: number, naturalHeight: number) => {
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
export function editComponent(element: ElementData) {
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
  const styleData: StyleData = getSite().style[className] || ({styles: {}} as StyleData);
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
