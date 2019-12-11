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
 * @fileoverview In Silex, each UI of the view package,
 *      has a controller in the UI controller package which listens to its
 * events, and call the main {silex.controller.Controller} controller's methods
 *      These UI controllers override the
 *      {silex.controller.ControllerBase} UiControllerBase class
 *
 */

import { Constants } from '../../constants';
import { CssRule, ElementData, ElementType, FileInfo, PageData } from '../../types';
import { createElements, deleteElements, getData, getElements, getPages, getUi, openPage, updateElements, getSelectedElements } from '../api';
import { Config } from '../ClientConfig';
import { Model, UndoItem, View } from '../ClientTypes';
import { FileExplorer } from '../components/dialog/FileExplorer';
import { LinkDialog } from '../components/dialog/LinkDialog';
import { getSiteDocument } from '../components/UiElements';
import { getDomElement } from '../dom/element-dom';
import { Tracker } from '../service/Tracker';
import { getEmptyElementData, getNewId } from '../utils/ElementUtils';
import { InvalidationManager } from '../utils/InvalidationManager';
import { SilexNotification } from '../utils/Notification';
import { Style } from '../utils/Style';
import { Url } from '../utils/Url';

/**
 * base class for all UI controllers of the controller package
 */
export class ControllerBase {
  /**
   * index of the undoHistory when last saved
   * this is useful in order to know if the website is "dirty", i.e. if it was
   * modified since last save it has a default value of -1
   * @see isDirty
   * @static because it is shared by all controllers
   */
  protected static lastSaveUndoIdx: number = -1;

  /**
   * array of the states of the website
   * @static because it is shared by all controllers
   */
  protected static undoHistory: UndoItem[] = [];

  /**
   * array of the states of the website
   * @static because it is shared by all controllers
   */
  protected static redoHistory: UndoItem[] = [];

  /**
   * @static because it is shared by all controllers
   */
  protected static clipboard: ElementData[] = null;

  /**
   * flag to indicate that a getState ation is pending
   * will be 0 unless an undo check point is being created
   */
  protected static getStatePending: number = 0;

  /**
   * {silex.service.Tracker} tracker used to pull statistics on the user actions
   * @see     silex.service.Tracker
   */
  protected tracker: Tracker;

  /**
   * link editor
   */
  protected linkDialog: LinkDialog;

  /**
   * invalidation mechanism
   */
  private undoCheckpointInvalidationManager: InvalidationManager;

  /**
   * base class for all UI controllers of the controller package
   * @param view  view class which holds the other views
   */
  constructor(public model: Model, public view: View) {
    // init undo/redo
    this.undoReset();
    this.tracker = Tracker.getInstance();

    // catchall error tracker
    window.onerror = ((msg: string, url: string, line: number, colno, error) => this.tracker.trackOnError(msg, url, line));
    this.undoCheckpointInvalidationManager = new InvalidationManager(1000);

    // init link editor
    this.linkDialog = new LinkDialog(this.model);
  }

  /**
   * track actions
   */
  track(promise: Promise<FileInfo>, trackActionName: string) {
    this.tracker.trackAction('controller-events', 'request', trackActionName, 0);
    promise
    .then((fileInfo) => {
      this.tracker.trackAction('controller-events', 'success', trackActionName, 1);
      return fileInfo;
    })
    .catch((error) => {
      this.tracker.trackAction('controller-events', 'error', trackActionName, -1);
      throw error;
    });
  }

  /**
   * use lastSaveUndoIdx to determine if the website is dirty
   * @return true if the website has unsaved changes
   */
  isDirty(): boolean {
    return ControllerBase.lastSaveUndoIdx !== ControllerBase.undoHistory.length - 1;
  }

  /**
   * @return true if there are actions to redo
   */
  hasRedo(): boolean {
    return ControllerBase.redoHistory.length > 0;
  }

  /**
   * @return true if there are actions to undo
   */
  hasUndo(): boolean {
    return ControllerBase.undoHistory.length > 0;
  }

  /**
   * enable undo/redo
   */
  undoredo(promise: Promise<FileInfo>) {
    promise.then((fileInfo) => {
      if (fileInfo) {
        this.undoCheckPoint();
      }
      return fileInfo;
    });
  }

  /**
   * store the model state in order to undo/redo
   */
  undoCheckPoint() {
    this.undoCheckpointInvalidationManager.callWhenReady(() => {
      ControllerBase.redoHistory = [];
      ControllerBase.getStatePending++;
      this.getStateAsync((state) => {
        ControllerBase.getStatePending--;

        // if the previous state was different
        if (ControllerBase.undoHistory.length === 0 ||
          ControllerBase.undoHistory[ControllerBase.undoHistory.length - 1].html !== state.html ||
          ControllerBase.undoHistory[ControllerBase.undoHistory.length - 1].page !== state.page) {
          ControllerBase.undoHistory.push(state);
          this.view.menu.redraw();
        } else {
          console.warn('Did not store undo state, because nothing has changed');
        }
      });
    });
  }

  /**
   * build a state object for undo/redo
   * async operation to improve performance
   */
  getStateAsync(opt_cbk: (p1: UndoItem) => any) {
    const scrollData = this.view.stageWrapper.getScroll();

    this.model.file.getHtmlAsync((html) => {
      opt_cbk({
        data: {
          ...getData(),
        },
        html,
        page: getPages().find((p) => p.isOpen),
        scrollX: scrollData.x,
        scrollY: scrollData.y,
      });
    });
  }

  /**
   * build a state object for undo/redo
   */
  getState(): UndoItem {
    const scrollData = this.view.stageWrapper.getScroll();

    return {
      data: {
        ...getData(),
      },
      html: this.model.file.getHtml(),
      page: getPages().find((p) => p.isOpen),
      scrollX: scrollData.x,
      scrollY: scrollData.y,
    };
  }

  /**
   * build a state object for undo/redo
   */
  restoreState(state: UndoItem) {
    this.model.file.setHtml(state.html, () => {
      this.model.file.setData(state.data)
      this.view.stageWrapper.setScroll({
        x: state.scrollX,
        y: state.scrollY,
      });
    }, false);
  }

  /**
   * reset the undo/redo history
   */
  undoReset() {
    ControllerBase.undoHistory = [];
    ControllerBase.redoHistory = [];
    ControllerBase.lastSaveUndoIdx = -1;
  }

  /**
   * open file explorer, choose an image and set it as the background image of
   * the current selection
   */
  async browseBgImage() {
    this.tracker.trackAction('controller-events', 'request', 'selectBgImage', 0);

    try {
      // open the file browser
      const fileInfo = await this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS);
      if (fileInfo) {
        // update the model
        const element = getElements().find((el) => el.selected);

        // undo checkpoint
        this.undoCheckPoint();

        // load the image
        updateElements([{
          from: element,
          to: {
            ...element,
            style: Style.addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, { 'background-image': Url.addUrlKeyword(fileInfo.absPath) }),
          },
        }]);

        // tracking
        this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
      }
    } catch (error) {
      SilexNotification.notifyError(`Error: I could not load the image. \n${error.message || ''}`);
      this.tracker.trackAction('controller-events', 'error', 'selectBgImage', -1);
    }
  }

  /**
   * open file explorer, choose an image and add it to the stage
   */
  browseAndAddImage(parent: ElementData) {
    this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
    this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
    .then((fileInfo) => {
      if (fileInfo) {
        // undo checkpoint
        this.undoCheckPoint();

        // create the element
        const [imgData, parentData] = this.addElement(ElementType.IMAGE, parent);
        const img = getDomElement(getSiteDocument(), imgData);

        console.error('not implemented: missing updateElements here?')

        // load the image
        this.model.element.setImageUrl(
          img, fileInfo.absPath,
          (element, imgElement) => {
            this.tracker.trackAction(
                'controller-events', 'success', 'insert.image', 1);
          },
          (element, message) => {
            SilexNotification.notifyError(
                'Error: I did not manage to load the image. \n' +
                message);
            // FIXME: find another way to remove this element?
            deleteElements([getElements().find((el) => element === getDomElement(getSiteDocument(), el))]);
            this.tracker.trackAction(
                'controller-events', 'error', 'insert.image', -1);
          },
        );
      }
    })
    .catch((error) => {
      SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
      this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
    });
    this.view.workspace.redraw(this.view);
  }

  /**
   * set a given style to the current selection
   * @param opt_isUndoable default is true
   * FIXME: useless method
   */
  styleChanged(name: string, value?: string, elements: ElementData[] = getSelectedElements(), opt_isUndoable?: boolean) {
    if (opt_isUndoable !== false) {
      // undo checkpoint
      this.undoCheckPoint();
    }

    // build the style change object
    const newStyle = {};
    newStyle[name] = value,

    this.multipleStylesChanged(newStyle);
  }

  /**
   * set a set of styles to the current selection
   */
  multipleStylesChanged(style: CssRule, elements = getSelectedElements()) {
    // undo checkpoint
    this.undoCheckPoint();

    // apply the change to all elements
    updateElements(elements.map((el) => ({
      from: el,
      to: {
        ...el,
        style: Style.addToMobileOrDesktopStyle(getUi().mobileEditor, el.style, style),
      },
    })));
  }

  /**
   * set a given property to the current selection
   */
  propertyChanged(name: string, value?: string, elements = getSelectedElements(), opt_applyToContent?: boolean) {
    // undo checkpoint
    this.undoCheckPoint();

    const data = {};
    data[name] = value;

  }

  /**
   * set css class names
   */
  setClassName(name: string) {
    // undo checkpoint
    this.undoCheckPoint();

    // apply the change to all elements
    updateElements(getElements()
      .filter((el) => el.selected)
      .map((el) => ({
        from: el,
        to: {
          ...el,
          classList: name.split(' '),
        },
      })))
  }

  /**
   * promp user for page properties
   * @param pageData data of the page edited, defaults to a new page
   */
  editPageSettings(pageData: PageData = null): Promise<{id: string, displayName: string}> {
    return new Promise((resolve, reject) => {
      const form = document.createElement('div');
      form.innerHTML = `
        Page Name
        <input
          id="page-property-name"
          class="block-dialog"
          placeholder="Your page name here"
          value="${ pageData ? pageData.displayName : '' }"
          ${ !pageData || pageData.canRename ? '' : 'disabled' }
          />
      `;
      const nameInput = form.querySelector('#page-property-name') as HTMLInputElement;
      SilexNotification.confirm(
        pageData ? 'Page Properties' : 'New page',
        '',
        (accept) => {
          const newName = nameInput.value;
          if (accept && newName && newName.length > 0) {
            // cleanup the page name
            // add a prefix to prevent names which start with an dash or number (see css specifications)
            const cleanName = 'page-' + newName.replace(/\W+/g, '-').toLowerCase();

            // check if a page with this name exists
            const existing = getPages().find((p) => p.id === newName);
            if (!!existing) {
              // open the new page
              this.openPage(existing);
              reject('Page already exists');
            } else {
              resolve({id: cleanName, displayName: newName});
            }
          } else {
            reject('Canceled');
          }
        },
      );
      SilexNotification.setContent(form);
    });
  }

  /**
   * open a page
   */
  openPage(page: PageData) {
    // undo checkpoint
    this.undoCheckPoint();

    // do the action
    openPage(page);
  }

  /**
   * create an element and add it to the stage
   * @param type the desired type for the new element
   * @param componentName the desired component type if it is a component
   * @return the new element
   */
  addElement(type: ElementType, parent: ElementData, componentName?: string): ElementData[] {
    this.tracker.trackAction('controller-events', 'request', 'insert.' + type, 0);

    // undo checkpoint
    this.undoCheckPoint();

    const [newElementData, newParentData] = this.createEmptyElement({
      type,
      parent,
      componentName,
      isSectionContent: false,
    })

    if (type === ElementType.SECTION) {
      const [contentElement, newElementDataWithContent] = this.createEmptyElement({
        type: ElementType.CONTAINER,
        parent: newElementData,
        componentName: null,
        isSectionContent: true,
      })
      const contentElementWithCssClasses = {
        ...contentElement,
        classList: contentElement.classList.concat([
          Constants.ELEMENT_CONTENT_CLASS_NAME,
          Constants.WEBSITE_WIDTH_CLASS_NAME,
          Constants.PREVENT_DRAGGABLE_CLASS_NAME,
        ]),
      }
      createElements([newElementDataWithContent, contentElementWithCssClasses]);
    } else {
      createElements([newElementData]);
    }
    if (type === ElementType.TEXT) {
      newElementData.innerHtml = 'New text box';
    }
    if (type === ElementType.HTML) {
      newElementData.innerHtml = '<p>New <strong>HTML</strong> box</p>';
    }

    // tracking
    this.tracker.trackAction('controller-events', 'success', 'insert.' + type, 1);
    return [newElementData, newParentData];
  }

  createEmptyElement({type, parent, isSectionContent, componentName}: {type: ElementType, parent: ElementData, isSectionContent: boolean, componentName?: string}): ElementData[] {
      // create the element and add it to the stage
    const element: ElementData = getEmptyElementData({id: getNewId(getElements()), type, isSectionContent, isBody: false});

    // apply component styles etc
    if (!!componentName) {
      console.error('not implemented: components')
      // FIXME: handle components data in the new model
      // this.model.component.initComponent(element, componentName);
    }
    return [{
        ...element,
        selected: true,
      }, {
        ...parent,
        children: parent.children.concat(element.id),
      },
    ]
  }

  /**
   * called after an element has been created
   * add the element to the current page (only if it has not a container which
   * is in a page) redraw the tools and set the element as editable
   * @param element the element to add
   */
  // doAddElement(element: ElementData): ElementData {
  //   // only visible on the current page
  //   const finalElement = {
  //     ...element,
  //     pageNames: [getPages().find((p) => p.isOpen).id],
  //   }

  //   // reset selection
  //   updateElements(getElements()
  //     .filter((el) => el.selected)
  //     .map((el) => ({
  //       from: el,
  //       to: {
  //         ...el,
  //         selected: false,
  //       },
  //     })))

  //   // unless one of its parents is in a page already
  //   if (this.getFirstPagedParent(finalElement)) {
  //     finalElement.pageNames = [];
  //   }

  //   return finalElement;
  // }

  // /**
  //  * NOW IN UTILS
  //  * check if the element's parents belong to a page, and if one of them do,
  //  * remove the element from the other pages
  //  *
  //  * if the element is in a container which is visible only on some pages,
  //  * then the element should be visible everywhere, i.e. in the same pages as
  //  * its parent
  //  */
  // getFirstPagedParent(element: ElementData): ElementData {
  //   if (!!element.parent) {
  //     const parent = getElements().find((el) => el.id === element.parent);
  //     if (parent.pageNames.length) {
  //       return parent;
  //     }
  //     return this.getFirstPagedParent(parent);
  //   }
  //   // body
  //   return null;
  // }

  // /**
  //  * ask the user for a new file title
  //  */
  // setTitle(title: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   this.model.head.setTitle(title);
  // }

  // /**
  //  * ask the user for a new file lang
  //  */
  // setLang(lang: string) {
  //   // undo checkpoint
  //   this.undoCheckPoint();
  //   this.model.head.setLang(lang);
  // }

  // /**
  //  * toggle advanced / apollo mode
  //  */
  // toggleAdvanced() {
  //   if (!document.body.classList.contains('advanced-mode-on')) {
  //     document.body.classList.add('advanced-mode-on');
  //     document.body.classList.remove('advanced-mode-off');
  //   } else {
  //     document.body.classList.remove('advanced-mode-on');
  //     document.body.classList.add('advanced-mode-off');
  //   }
  // }

  /**
   * save or save-as
   */
  save(opt_fileInfo?: FileInfo, opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
    this.tracker.trackAction('controller-events', 'request', 'file.save', 0);
    if (opt_fileInfo && !this.model.file.isTemplate) {
      this.doSave((opt_fileInfo as FileInfo), opt_cbk, opt_errorCbk);
    } else if (Config.singleSiteMode) {
      // do nothing in single site mode
    } else {
      // choose a new name
      this.view.fileExplorer
          .saveAs('editable.html', FileExplorer.HTML_EXTENSIONS)
          .then((fileInfo) => {
            if (fileInfo != null ) {
              this.doSave((fileInfo as FileInfo), opt_cbk, opt_errorCbk);
            } else {
              // user aborted save as
            }
          })
          .catch((error) => {
            this.tracker.trackAction('controller-events', 'error', 'file.save', -1);
            if (opt_errorCbk) {
              opt_errorCbk(error);
            }
          });
    }
  }

  /**
   * save or save-as
   */
  doSave(fileInfo: FileInfo, opt_cbk?: (() => any), opt_errorCbk?: ((p1: any) => any)) {
    // urls will be relative to the html file url
    this.model.file.fileInfo = fileInfo;

    // relative urls only in the files
    let rawHtml = this.model.file.getHtml();

    // look for bug of firefox inserting quotes in url("")
    // FIXME: remove this!!
    if (rawHtml.indexOf('url(\'&quot;') > -1) {
      console.warn('I have found HTML entities in some urls, there us probably an error in the save process.');

      // log this (QA)
      this.tracker.trackAction('controller-events', 'warning', 'file.save.corrupted', -1);

      // try to cleanup the mess
      rawHtml = rawHtml.replace(/url\('&quot;()(.+?)\1&quot;'\)/gi, (match, group1, group2) => {
        return 'url(\'' + group2 + '\')';
      });
    }

    // save to file
    this.model.file.saveAs(fileInfo, rawHtml, getData(), () => {
      this.tracker.trackAction('controller-events', 'success', 'file.save', 1);
      ControllerBase.lastSaveUndoIdx = ControllerBase.undoHistory.length - 1;
      this.fileOperationSuccess('File is saved.', false);
      this.view.workspace.setPreviewWindowLocation();
      if (opt_cbk) {
        opt_cbk();
      }
    },
    (error, msg) => {
      SilexNotification.alert('Save website', 'Error: I did not manage to save the file. \n' + (msg || error.message || ''),
      () => {
        if (opt_errorCbk) {
          opt_errorCbk(error);
        }
      });
      this.tracker.trackAction('controller-events', 'error', 'file.save', -1);
    });
  }

  /**
   * success of an operation involving changing the file model
   */
  fileOperationSuccess(opt_message?: string, opt_updateTools?: boolean) {
    // notify user
    if (opt_message) {
      SilexNotification.notifySuccess(opt_message);
    }
  }
}
