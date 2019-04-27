interface Dialog {
  set(optoins: any);
  close();
  setContent(el: HTMLElement|DocumentFragment);
}
interface Alertify {
  alert(title:string, message: string, cbk: () => void): Dialog;
  prompt(title:string, message: string, value: string, ok: (evt: Event, value: string) => void, cancel: () => void): Dialog;
  confirm(title:string, message: string, ok: () => void, cancel: () => void): Dialog;
  notify(message: string, type: string, wait: number, cbk: () => void);
}
declare var alertify: Alertify;



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
 * @fileoverview Helper class for common tasks
 *
 */
export class SilexNotification {
  /**
   * constant for the duration of the notifications, in ms
   */
  static NOTIFICATION_DURATION_MS: number = 5;

  /**
   * constant for the url of the icon
   */
  static ERROR_ICON: string = 'assets/notifications/error.png';

  /**
   * constant for the url of the icon
   */
  static SUCCESS_ICON: string = 'assets/notifications/success.png';

  /**
   * constant for the url of the icon
   */
  static INFO_ICON: string = 'assets/notifications/info.png';

  /**
   * flag to indicate wether a modal dialog is opened
   */
  static isActive: boolean = false;

  /**
   * flag to indicate wether a modal dialog is opened
   */
  static currentDialog: Dialog;

  /**
   * flag to indicate wether the window/tab has focus
   */
  static hasFocus: boolean = true;

  /**
   * flag to indicate wether we are listening for focus event already
   */
  static isListeningForFocus: boolean = false;

  constructor() {
    throw 'this is a static class and it canot be instanciated';
  }

  /**
   * use native alerts vs alertify
   */
  static useNative(): boolean {
    return SilexNotification.hasFocus === false &&
        ('Notification' in window && Notification.permission === 'granted');
  }

  /**
   * activate native alerts if available
   */
  static activateNative() {
    if ('Notification' in window && Notification.permission !== 'denied') {
      if (!SilexNotification.useNative()) {
        document.addEventListener('mousemove', function activateNativeListener(e) {
          Notification.requestPermission();
          document.removeEventListener('mousemove', activateNativeListener);
        });
      }
    }
  }

  /**
   * display a native notification, or ask for permission
   */
  static nativeNotification(message: string, iconUrl: string) {
    if (!SilexNotification.isListeningForFocus) {
      SilexNotification.isListeningForFocus = true;
      window.onfocus = (e) => SilexNotification.hasFocus = true;
      window.onblur = (e) => SilexNotification.hasFocus = false;
    }
    if (SilexNotification.useNative()) {
      let notification = new Notification(
          'Silex speaking...',
          {'icon': iconUrl, 'body': message, 'lang': 'en-US'});
      setTimeout(function() {
        notification.close();
      }, SilexNotification.NOTIFICATION_DURATION_MS);
    } else {
    }
  }


  /**
   * close (cancel) the current notification
   */
  static close() {
    if(SilexNotification.currentDialog) SilexNotification.currentDialog.close();
    SilexNotification.currentDialog = null;
  }

  static setup(dialog: Dialog) {
    SilexNotification.close();
    SilexNotification.isActive = true;
    SilexNotification.currentDialog = dialog;
    document.querySelector('.alertify').setAttribute('spellcheck', 'false');
    return dialog.set({
      movable: false,
      transition: 'fade',
    } as any);
  }

  /**
   * display a message
   */
  static alert(title: string, message: string, cbk: () => any, label: string = 'ok') {
    SilexNotification.setup(alertify.alert(title, message, () => {
      SilexNotification.isActive = false;
      SilexNotification.currentDialog = null;
      cbk();
    }).set({
      label,
    } as any));
  }

  /**
   * ask for a text
   */
  static prompt(title: string, message: string, text: string, cbk: (p1: boolean, p2: string) => any, ok: string = 'ok', cancel: string = 'cancel') {
    SilexNotification.setup(alertify.prompt(title, message, text, (evt, value) => {
      SilexNotification.isActive = false;
      SilexNotification.currentDialog = null;
      cbk(true, value);
    }, () => {
      SilexNotification.isActive = false;
      SilexNotification.currentDialog = null;
      cbk(false, null);
    }).set({
      label: {
        ok,
        cancel,
      },
    } as any));
  }

  /**
   * ask for confirmation
   */
  static confirm(title: string, message: string, cbk: (p1: boolean) => any, ok: string = 'ok', cancel: string = 'cancel') {
    SilexNotification.setup(alertify.confirm(title, message, () => {
      SilexNotification.isActive = false;
      SilexNotification.currentDialog = null;
      cbk(true);
    }, () => {
      SilexNotification.isActive = false;
      SilexNotification.currentDialog = null;
      cbk(false);
    }).set({
      label: {
        ok,
        cancel,
      },
    } as any));
  }

  /**
   * notify the user with success formatting
   */
  static notifySuccess(message: string) {
    console.log(message);
    SilexNotification.nativeNotification(message, SilexNotification.SUCCESS_ICON);
    alertify.notify(message, 'success', SilexNotification.NOTIFICATION_DURATION_MS, () => {});
  }

  /**
   * notify the user with success formatting
   */
  static notifyError(message: string) {
    console.error(message);
    SilexNotification.nativeNotification(message, SilexNotification.ERROR_ICON);
    alertify.notify(message, 'error', SilexNotification.NOTIFICATION_DURATION_MS, () => {});
  }

  /**
   * notify the user with success formatting
   */
  static notifyInfo(message: string) {
    SilexNotification.nativeNotification(message, SilexNotification.INFO_ICON);
    alertify.notify(message, 'notify', SilexNotification.NOTIFICATION_DURATION_MS, () => {});
  }

  /**
   * change the text of the current notification
   */
  static setContent(el: HTMLElement|DocumentFragment) {
    if(SilexNotification.currentDialog) {
      SilexNotification.currentDialog.setContent(el);
    }
  }

  /**
   * change the text of the current notification
   */
  static setText(text: string) {
    if(SilexNotification.currentDialog) {
      const el = document.createElement('div');
      el.insertAdjacentHTML('afterbegin', `<p>${text}</p>`);
      SilexNotification.currentDialog.setContent(el);
    }
  }

  /**
   * @return element which holds the buttons of the current notification
   */
  static addButton(el: HTMLElement) {
    const container = document.querySelector('.ajs-buttons');
    container.insertBefore(el, container.childNodes[0]);
  }

  /**
   * add an HTML panel with info of type "while you wait, here is an info"
   */
  static setInfoPanel(element: HTMLElement) {
    let container = document.querySelector('.ajs-content');
    let infoPanel = container.querySelector('.silex-info-panel') as HTMLElement;
    if (infoPanel === null) {
      infoPanel = document.createElement('DIV');
      infoPanel.classList.add('info-panel');

      // limit height so that small screens still see the close button
      let stage = document.querySelector('#silex-stage-iframe');
      infoPanel.style.maxHeight = Math.round(stage.clientHeight * 2 / 3) + 'px';
      container.insertBefore(
          infoPanel, container.childNodes[container.childNodes.length - 1]);
    }
    infoPanel.innerHTML = '';
    infoPanel.appendChild(element);
  }
}

// else {
// Notifications are not supported or denied
// }

// Desktop notifications disabled because it disturbs more than it serves
// FIXME: remove all calls to nativeNotification since it is not useful anymore
// Notification.activateNative();

// :facepalm:
