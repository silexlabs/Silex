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


goog.provide('silex.utils.Notification');



/**
 * @constructor
 */
silex.utils.Notification = function() {
  throw ('this is a static class and it canot be instanciated');
};


/**
 * constant for the duration of the notifications, in ms
 * @const
 * @type {number}
 */
silex.utils.Notification.NOTIFICATION_DURATION_MS = 4000;


/**
 * constant for the url of the icon
 * @const
 * @type {string}
 */
silex.utils.Notification.ERROR_ICON = 'assets/notifications/error.png';


/**
 * constant for the url of the icon
 * @const
 * @type {string}
 */
silex.utils.Notification.SUCCESS_ICON = 'assets/notifications/success.png';


/**
 * constant for the url of the icon
 * @const
 * @type {string}
 */
silex.utils.Notification.INFO_ICON = 'assets/notifications/info.png';


/**
 * flag to indicate wether a modal dialog is opened
 * @type {boolean}
 */
silex.utils.Notification.isActive = false;


/**
 * flag to indicate wether the window/tab has focus
 * @type {boolean}
 */
silex.utils.Notification.hasFocus = true;


/**
 * flag to indicate wether we are listening for focus event already
 * @type {boolean}
 */
silex.utils.Notification.isListeningForFocus = false;


/**
 * use native alerts vs alertify
 * @return {boolean}
 */
silex.utils.Notification.useNative = function() {
  return silex.utils.Notification.hasFocus === false &&
      ('Notification' in window && Notification.permission === 'granted');
};


/**
 * activate native alerts if available
 */
silex.utils.Notification.activateNative = function() {
  if ('Notification' in window && Notification.permission !== 'denied') {
    if (!silex.utils.Notification.useNative()) {
      goog.events.listenOnce(document, goog.events.EventType.MOUSEMOVE, function(e) {
        Notification.requestPermission();
      });
    }
  }
  // else {
    // Notifications are not supported or denied
  // }
};


/**
 * display a native notification, or ask for permission
 * @param {string} message
 * @param {string} iconUrl
 */
silex.utils.Notification.nativeNotification = function(message, iconUrl) {
  if (!silex.utils.Notification.isListeningForFocus) {
    silex.utils.Notification.isListeningForFocus = true;
    window.onfocus = (e) => silex.utils.Notification.hasFocus = true;
    window.onblur = (e) => silex.utils.Notification.hasFocus = false;
  }
  if (silex.utils.Notification.useNative()) {
    var notification = new Notification('Silex speaking...', {
      'icon': iconUrl,
      'body': message,
      'lang': 'en-US'
    });
    setTimeout(function() {
      notification.close();
    }, silex.utils.Notification.NOTIFICATION_DURATION_MS);
  }
  else {
    // FIXME: remove all calls to nativeNotification since it is not useful anymore
    console.info('Desktop notifications disabled because it disturbs more than it serves');
    // silex.utils.Notification.activateNative();
  }
};


/**
 * core method for alert, prompt and confirm
 * @param {function(string, function(...), ?string=, ?string=, ?string=)} dialogMethod
 * @param {string} message
 * @param {function(?boolean, ?string)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 * @param {?string=} opt_default
 */
silex.utils.Notification.dialog = function(dialogMethod, message, cbk, opt_okLabel, opt_cancelLabel, opt_default) {
  alertify.set({
    'labels': {
      'ok': opt_okLabel || 'ok',
      'cancel': opt_cancelLabel || 'cancel'
    }
  });
  // set the flag while the modal dialog is opened
  silex.utils.Notification.isActive = true;
  dialogMethod(message, function() {
    // reset the flag
    silex.utils.Notification.isActive = false;
    // call the callback
    cbk.apply(this, arguments);
  }, opt_default);
};


/**
 * display a message
 * @param {string} message
 * @param {function()} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 */
silex.utils.Notification.alert = function(message, cbk, opt_okLabel, opt_cancelLabel) {
  silex.utils.Notification.dialog(alertify.alert, message, cbk, opt_okLabel, opt_cancelLabel);
};


/**
 * ask for a text
 * @param {string} message
 * @param {string} text
 * @param {function(?boolean, ?string)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 */
silex.utils.Notification.prompt = function(message, text, cbk, opt_okLabel, opt_cancelLabel) {
  silex.utils.Notification.dialog(alertify.prompt, message, cbk, opt_okLabel, opt_cancelLabel, text);
};


/**
 * ask for confirmation
 * @param {string} message
 * @param {function(?boolean)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 */
silex.utils.Notification.confirm = function(message, cbk, opt_okLabel, opt_cancelLabel) {
  silex.utils.Notification.dialog(alertify.confirm, message, cbk, opt_okLabel, opt_cancelLabel);
};


/**
 * notify the user with success formatting
 * @param {string} message
 */
silex.utils.Notification.notifySuccess = function(message) {
  console.log(message);
  alertify.set({
    'delay': silex.utils.Notification.NOTIFICATION_DURATION_MS
  });
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.SUCCESS_ICON);
  alertify.success(message);
};


/**
 * notify the user with success formatting
 * @param {string} message
 */
silex.utils.Notification.notifyError = function(message) {
  console.error(message);
  alertify.set({
    'delay': silex.utils.Notification.NOTIFICATION_DURATION_MS
  });
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.ERROR_ICON);
  alertify.error(message);
};


/**
 * notify the user with success formatting
 * @param {string} message
 */
silex.utils.Notification.notifyInfo = function(message) {
  console.info(message);
  alertify.set({
    'delay': silex.utils.Notification.NOTIFICATION_DURATION_MS
  });
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.INFO_ICON);
  alertify.log(message);
};


/**
 * change the text of the current notification
 * @param {string} message
 */
silex.utils.Notification.setText = function(message) {
  document.querySelector('.alertify-message').innerHTML = message;
};


/**
 * add an HTML panel with info of type "while you wait, here is an info"
 * @param {string} message
 */
silex.utils.Notification.setInfoPanel = function(message) {
  var container = document.querySelector('.alertify-inner');
  var infoPanel = container.querySelector('.silex-info-panel');
  if (infoPanel === null) {
    infoPanel = document.createElement('DIV');
    infoPanel.classList.add('info-panel');
    // limit height so that small screens still see the close button
    var stage = document.querySelector('#silex-stage-iframe');
    infoPanel.style.maxHeight = Math.round(stage.offsetHeight * 2/3) + 'px';
    container.insertBefore(infoPanel, container.childNodes[container.childNodes.length - 1]);
  }
  infoPanel.innerHTML = message;
};
