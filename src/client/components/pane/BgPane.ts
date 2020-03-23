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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the background params
 *
 */
import { ElementData } from '../../element/types';
import { getUi } from '../../ui/store';
import { Controller, Modelxxx } from '../../ClientTypes';
import { ColorPicker } from '../ColorPicker';
import { PaneBase } from './PaneBase';
import { FileExplorer } from '../dialog/FileExplorer'
import { getElements, updateElements } from '../../element/store'
import { Style } from '../../utils/Style'
import { Url } from '../../utils/Url'
import { SilexNotification } from '../../utils/Notification'

/**
 * on of Silex Editors class
 * const user edit style of components
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class BgPane extends PaneBase {
  colorPicker: ColorPicker;

  // bg image buttons
  bgSelectBgImage: HTMLElement;
  bgClearBgImage: HTMLElement;

  // bg image properties
  attachmentComboBox: HTMLSelectElement;
  vPositionComboBox: HTMLSelectElement;
  hPositionComboBox: HTMLSelectElement;
  repeatComboBox: HTMLSelectElement;
  sizeComboBox: HTMLSelectElement;

  constructor(element: HTMLElement, model: Modelxxx, controller: Controller) {
    super(element, model, controller);

    // init the component
    this.buildUi();
  }

  /**
   * build the UI
   */
  buildUi() {
    // BG color
    this.buildBgColor();

    // init bg image
    this.buildBgImage();
  }

  /**
   * build the UI
   */
  buildBgColor() {
    this.colorPicker = new ColorPicker(this.element.querySelector('.color-edit-container'), () => this.onColorChanged());
  }

  /**
   * build the UI
   */
  buildBgImage() {
    this.bgSelectBgImage = this.element.querySelector('.bg-image-button');
    this.bgClearBgImage = this.element.querySelector('.clear-bg-image-button');

    // event user wants to update the bg image
    this.bgSelectBgImage.addEventListener('click', () => this.onSelectImageButton(), false);

    // event user wants to remove the bg image
    this.bgClearBgImage.addEventListener('click', () => this.onClearImageButton(), false);

    // bg image properties
    this.attachmentComboBox = this.initComboBox('.bg-attachment-combo-box', (event: Event) => {
      this.styleChanged('background-attachment', (event.target as HTMLInputElement).value);
    });

    this.vPositionComboBox = this.initComboBox('.bg-position-v-combo-box', (event: Event) => {
      const hPosition = this.hPositionComboBox.value;
      const vPosition = this.vPositionComboBox.value;
      this.styleChanged('background-position', vPosition + ' ' + hPosition);
    });

    this.hPositionComboBox = this.initComboBox('.bg-position-h-combo-box', (event: Event) => {
      const hPosition = this.hPositionComboBox.value;
      const vPosition = this.vPositionComboBox.value;
      this.styleChanged('background-position', vPosition + ' ' + hPosition);
    });

    this.repeatComboBox = this.initComboBox('.bg-repeat-combo-box', (event: Event) => {
      this.styleChanged('background-repeat', (event.target as HTMLInputElement).value);
    });

    this.sizeComboBox = this.initComboBox('.bg-size-combo-box', (event: Event) => {
      this.styleChanged('background-size', (event.target as HTMLInputElement).value);
    });
  }

  /**
   * redraw the properties
   * @param states the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(selectElements: ElementData[]) {
    super.redraw(selectElements);

    const mobileOrDesktop = getUi().mobileEditor ? 'mobile' : 'desktop';

    // BG color
    if (selectElements.length > 0) {
      this.colorPicker.setDisabled(false);

      const color = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-color'] || '');

      // indeterminate state
      this.colorPicker.setIndeterminate(color === null);

      // display color
      if (color != null ) {
        this.colorPicker.setColor(color);
      }
    } else {
      this.colorPicker.setDisabled(true);
    }

    // BG image
    const enableBgComponents = (enable) => {
      if (enable) {
        this.bgClearBgImage.classList.remove('disabled');
      } else {
        this.bgClearBgImage.classList.add('disabled');
      }
      this.attachmentComboBox.disabled = !enable;
      this.vPositionComboBox.disabled = !enable;
      this.hPositionComboBox.disabled = !enable;
      this.repeatComboBox.disabled = !enable;
      this.sizeComboBox.disabled = !enable;
    };

    // bg image
    const bgImage = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-image']);

    if (bgImage != null  && bgImage !== 'none' && bgImage !== '') {
      enableBgComponents(true);
    } else {
      enableBgComponents(false);
    }

    // bg image attachment
    const bgImageAttachment = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-attachment']);
    if (bgImageAttachment) {
      this.attachmentComboBox.value = bgImageAttachment;
    } else {
      this.attachmentComboBox.selectedIndex = 0;
    }

    // bg image position
    const bgImagePosition: string = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-position']);
    if (bgImagePosition && bgImagePosition !== '') {
      const hPosition = bgImagePosition.includes('left') ? 'left' : bgImagePosition.includes('right') ? 'right' : bgImagePosition.includes('center') ? 'center' : '';
      const vPosition = bgImagePosition.includes('top') ? 'top' : bgImagePosition.includes('bottom') ? 'bottom' : bgImagePosition.includes('center') ? 'center' : '';

      // update the drop down lists to display the bg image position
      this.vPositionComboBox.value = vPosition;
      this.hPositionComboBox.value = hPosition;
    } else {
      this.vPositionComboBox.selectedIndex = 0;
      this.hPositionComboBox.selectedIndex = 0;
    }

    // bg image repeat
    const bgImageRepeat = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-repeat']);

    if (bgImageRepeat) {
      this.repeatComboBox.value = bgImageRepeat;
    } else {
      this.repeatComboBox.selectedIndex = 0;
    }

    // bg image size
    const bgImageSize = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-size']);

    if (bgImageSize) {
      this.sizeComboBox.value = bgImageSize;
    } else {
      this.sizeComboBox.selectedIndex = 0;
    }
  }

  /**
   * User has selected a color
   */
  onColorChanged() {
    // notify the toolbox
    this.styleChanged('background-color', this.colorPicker.getColor());
  }

  /**
   * User has clicked the select image button
   */
  async onSelectImageButton() {
    try {
      // open the file browser
      const fileInfo = await FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS);
      if (fileInfo) {
        // update the model
        const element = getElements().find((el) => el.selected);

        // undo checkpoint
        //   //  this.undoCheckPoint();

        // load the image
        updateElements([{
          from: element,
          to: {
            ...element,
            style: Style.addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, { 'background-image': Url.addUrlKeyword(fileInfo.absPath) }),
          },
        }]);

        // tracking
        // this.tracker.trackAction('controller-events', 'success', 'selectBgImage', 1);
      }
    } catch (error) {
      SilexNotification.notifyError(`Error: I could not load the image. \n${error.message || ''}`);
      // this.tracker.trackAction('controller-events', 'error', 'selectBgImage', -1);
    }
  }

  /**
   * User has clicked the clear image button
   */
  onClearImageButton() {
    this.styleChanged('background-image', '');

    // UI needs to be updated (which is prevented in this.styleChanged by the
    // flag iAmSettingTheValue
  }
}
