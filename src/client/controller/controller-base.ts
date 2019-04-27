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

import { Constants } from '../../Constants';
import {Tracker} from '../service/tracker';
import {UndoItem} from '../types';
import {ClipboardItem} from '../types';
import {Model} from '../types';
import {View} from '../types';

import {FileInfo} from '../types';
import {InvalidationManager} from '../utils/invalidation-manager';
import {SilexNotification} from '../utils/notification';
import {FileExplorer} from '../view/dialog/file-explorer';
import { getUiElements } from '../view/UiElements';
import { LinkDialog } from '../view/dialog/LinkDialog';

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
  protected static clipboard: ClipboardItem[] = null;

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
   * invalidation mechanism
   */
  private undoCheckpointInvalidationManager: InvalidationManager;

  /**
   * link editor
   */
  protected linkDialog: LinkDialog;

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
    return ControllerBase.lastSaveUndoIdx !==
        ControllerBase.undoHistory.length - 1;
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
            ControllerBase.undoHistory[ControllerBase.undoHistory.length - 1]
                    .html !== state.html ||
            ControllerBase.undoHistory[ControllerBase.undoHistory.length - 1]
                    .page !== state.page) {
          ControllerBase.undoHistory.push(state);
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
        html: html,
        page: this.model.page.getCurrentPage(),
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
      html: this.model.file.getHtml(),
      page: this.model.page.getCurrentPage(),
      scrollX: scrollData.x,
      scrollY: scrollData.y,
    };
  }

  /**
   * build a state object for undo/redo
   */
  restoreState(state: UndoItem) {
    this.model.file.setHtml(state.html, () => {
      this.model.page.setCurrentPage(state.page);
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
      const fileInfo = await this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
      if (fileInfo) {
        // update the model
        let element = this.model.body.getSelection()[0];

        // undo checkpoint
        this.undoCheckPoint();

        // load the image
        this.model.element.setBgImage(element, fileInfo.absPath);

        // tracking
        this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
      }
    }
    catch(error) {
      SilexNotification.notifyError(`Error: I could not load the image. \n${error['message'] || ''}`);
      this.tracker.trackAction('controller-events', 'error', 'selectBgImage', -1);
    }
  }

  /**
   * open file explorer, choose an image and add it to the stage
   */
  browseAndAddImage() {
    this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
    this.view.fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
    .then((fileInfo) => {
      if (fileInfo) {
        // undo checkpoint
        this.undoCheckPoint();

        // create the element
        let img = this.addElement(Constants.TYPE_IMAGE);

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
            this.model.element.removeElement(element);
            this.tracker.trackAction(
                'controller-events', 'error', 'insert.image', -1);
          }
        );
      }
    })
    .catch((error) => {
      SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error['message'] || ''));
      this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
    });
    this.view.workspace.redraw(this.view);
  }

  /**
   * set a given style to the current selection
   * @param opt_isUndoable default is true
   */
  styleChanged(name: string, value?: string, opt_elements?: HTMLElement[], opt_isUndoable?: boolean) {
    if (!opt_elements) {
      opt_elements = this.model.body.getSelection();
    }
    if (opt_isUndoable !== false) {
      // undo checkpoint
      this.undoCheckPoint();
    }

    // apply the change to all elements
    opt_elements.forEach((element) => {
      // update the model
      if(['top', 'left', 'width', 'height', 'min-height'].indexOf(name) >= 0) {
        const state = this.view.stageWrapper.getState(element);
        this.view.stageWrapper.setState(element, {
          ...state,
          metrics: {
            ...state.metrics,
            computedStyleRect: {
              ...state.metrics.computedStyleRect,
              top: name === 'top' ? parseInt(value) : state.metrics.computedStyleRect.top,
              left: name === 'left' ? parseInt(value) : state.metrics.computedStyleRect.left,
              width: name === 'width' ? parseInt(value) : state.metrics.computedStyleRect.width,
              height: name === 'height' || name === 'min-height' ? parseInt(value) : state.metrics.computedStyleRect.height,
            }
          },
        });
      }
      // update the values in the model too
      this.model.element.setStyle(element, name, value);
    });

    // refresh the view
    this.refreshView();
  }

  /**
   * set a set of styles to the current selection
   */
  multipleStylesChanged(style: Object, opt_elements?: HTMLElement[]) {
    if (!opt_elements) {
      opt_elements = this.model.body.getSelection();
    }

    // undo checkpoint
    this.undoCheckPoint();

    // apply the change to all elements
    opt_elements.forEach((element) => {
      // update the model
      this.model.property.setStyle(element, style);
    });

    // refresh the view
    this.refreshView();
  }

  /**
   * set a given property to the current selection
   */
  propertyChanged(name: string, value?: string, opt_elements?: HTMLElement[], opt_applyToContent?: boolean) {
    if (!opt_elements) {
      opt_elements = this.model.body.getSelection();
    }

    // undo checkpoint
    this.undoCheckPoint();

    // apply the change to all elements
    opt_elements.forEach((element) => {
      // update the model
      this.model.element.setProperty(element, name, value, opt_applyToContent);
    });

    // refresh the view
    this.refreshView();
  }

  /**
   * set css class names
   */
  setClassName(name: string) {
    // undo checkpoint
    this.undoCheckPoint();

    // apply the change to all elements
    let elements = this.model.body.getSelection();
    elements.forEach((element) => {
      // update the model
      this.model.element.setClassName(element, name);

      // refresh the views
      this.view.breadCrumbs.redraw();
    });

    // refresh the view
    this.refreshView();
  }

  /**
   * promp user for page name
   * used in insert page, rename page...
   */
  getUserInputPageName(defaultName: string, cbk: (p1?: string, p2?: string) => void) {
    SilexNotification.prompt(
      'Page name',
      'Enter a name for your page!', defaultName, (accept, name) => {
        if (accept && name && name.length > 0) {
          // keep the full name
          let displayName = name;

          // cleanup the page name
          name = name.replace(/\W+/g, '-').toLowerCase();

          // do not allow to start with an dash or number (see css
          // specifications)
          name = 'page-' + name;

          // check if a page with this name exists
          let pages = this.model.page.getPages();
          let exists = false;
          pages.forEach((pageName) => {
            if (pageName === name) {
              exists = true;
            }
          });
          if (exists) {
            // just open the new page
            this.openPage(name);
          } else {
            cbk(name, displayName);
          }
        }
        cbk();
      }
    );
  }

  /**
   * open a page
   */
  openPage(pageName: string) {
    // undo checkpoint
    this.undoCheckPoint();

    // do the action
    this.model.page.setCurrentPage(pageName);
  }

  /**
   * create an element and add it to the stage
   * @param type the desired type for the new element
   * @param opt_componentName the desired component type if it is a component
   * @return the new element
   */
  addElement(type: string, opt_componentName?: string): HTMLElement {
    this.tracker.trackAction('controller-events', 'request', 'insert.' + type, 0);

    // undo checkpoint
    this.undoCheckPoint();

    // create the element and add it to the stage
    let element = this.model.element.createElement(type) as HTMLElement;

    // apply component styles etc
    if (!!opt_componentName) {
      this.model.component.initComponent(element, opt_componentName);
    }

    // apply default size
    this.model.element.initElement(element);

    // make element editable and visible on current page
    this.doAddElement(element);

    // tracking
    this.tracker.trackAction('controller-events', 'success', 'insert.' + type, 1);
    return element;
  }

  /**
   * called after an element has been created
   * add the element to the current page (only if it has not a container which
   * is in a page) redraw the tools and set the element as editable
   * @param element the element to add
   */
  doAddElement(element: HTMLElement) {
    // only visible on the current page
    let currentPageName = this.model.page.getCurrentPage();
    this.model.page.removeFromAllPages(element);
    this.model.page.addToPage(element, currentPageName);

    // unless one of its parents is in a page already
    this.checkElementVisibility(element);

    // select the component
    this.model.body.setSelection([element]);
  }

  /**
   * check if the element's parents belong to a page, and if one of them do,
   * remove the element from the other pages
   *
   * if the element is in a container which is visible only on some pages,
   * then the element should be visible everywhere, i.e. in the same pages as
   * its parent
   */
  checkElementVisibility(element: HTMLElement) {
    let parentPage = this.model.page.getParentPage(element);
    if (parentPage !== null) {
      // get all the pages
      let pages = this.model.page.getPagesForElement(element);

      // remove the components from the page
      pages.forEach(
          (pageName) => this.model.page.removeFromPage(element, pageName));
    }
  }

  /**
   * ask the user for a new file title
   */
  setTitle(title: string) {
    // undo checkpoint
    this.undoCheckPoint();
    this.model.head.setTitle(title);
  }

  /**
   * ask the user for a new file lang
   */
  setLang(lang: string) {
    // undo checkpoint
    this.undoCheckPoint();
    this.model.head.setLang(lang);
  }

  /**
   * toggle advanced / apollo mode
   */
  toggleAdvanced() {
    if (!document.body.classList.contains('advanced-mode-on')) {
      document.body.classList.add('advanced-mode-on');
      document.body.classList.remove('advanced-mode-off');
    } else {
      document.body.classList.remove('advanced-mode-on');
      document.body.classList.add('advanced-mode-off');
    }
  }

  /**
   * refresh tools after mobile/desktop editor switch
   */
  refreshView() {
    let pages = this.model.page.getPages();
    let currentPage = this.model.page.getCurrentPage();
    this.view.propertyTool.redraw(this.view.stageWrapper.getSelection(), pages, currentPage);
    this.view.textFormatBar.redraw(this.model.body.getSelection(), pages, currentPage);
    this.view.stageWrapper.redraw();
  }

  /**
   * get mobile mode
   * @return true if mobile mode is active
   */
  getMobileMode(): boolean {
    return this.view.workspace.getMobileEditor();
  }

  /**
   * set mobile mode
   */
  setMobileMode(isMobile: boolean) {
    this.view.workspace.setMobileEditor(isMobile);
    this.refreshView();
  }

  /**
   * toggle mobile mode
   */
  toggleMobileMode() {
    this.view.workspace.setMobileEditor(!this.view.workspace.getMobileEditor());
    this.refreshView();
  }

  /**
   * save or save-as
   */
  save(
      opt_fileInfo?: FileInfo, opt_cbk?: (() => any),
      opt_errorCbk?: ((p1: any) => any)) {
    this.tracker.trackAction('controller-events', 'request', 'file.save', 0);
    if (opt_fileInfo && !this.model.file.isTemplate) {
      this.doSave((opt_fileInfo as FileInfo), opt_cbk, opt_errorCbk);
    } else {
      // choose a new name
      this.view.fileExplorer
          .saveAs('editable.html', FileExplorer.HTML_EXTENSIONS)
          .then((fileInfo) => {
            if (fileInfo != null) {
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
  doSave(fileInfo: FileInfo, opt_cbk?: (() => any), opt_errorCbk?: ((p1: Object) => any)) {
    // urls will be relative to the html file url
    this.model.file.fileInfo = fileInfo;

    // relative urls only in the files
    let rawHtml = this.model.file.getHtml();

    // look for bug of firefox inserting quotes in url("")
    if (rawHtml.indexOf('url(\'&quot;') > -1) {
      console.warn(
          'I have found HTML entities in some urls, there us probably an error in the save process.');

      // log this (QA)
      this.tracker.trackAction('controller-events', 'warning', 'file.save.corrupted', -1);

      // try to cleanup the mess
      rawHtml = rawHtml.replace(
          /url\('&quot;()(.+?)\1&quot;'\)/gi, (match, group1, group2) => {
            return 'url(\'' + group2 + '\')';
          });
    }

    // save to file
    this.model.file.saveAs(fileInfo, rawHtml, () => {
      this.tracker.trackAction('controller-events', 'success', 'file.save', 1);
      ControllerBase.lastSaveUndoIdx =
          ControllerBase.undoHistory.length - 1;
      this.fileOperationSuccess('File is saved.', false);
      this.view.workspace.setPreviewWindowLocation();
      if (opt_cbk) {
        opt_cbk();
      }
    },
    (error, msg) => {
      SilexNotification.alert('Save website', 'Error: I did not manage to save the file. \n' + (msg || error['message'] || ''),
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
    // update tools
    if (opt_updateTools) {
      // update dialogs
      this.view.jsEditor.close();
      this.view.cssEditor.close();
      this.view.htmlEditor.close();
      this.view.settingsDialog.redraw();
      this.view.contextMenu.redraw();
      this.view.breadCrumbs.redraw();
    }
    if (opt_message) {
      // notify user
      SilexNotification.notifySuccess(opt_message);
    }
  }
}
