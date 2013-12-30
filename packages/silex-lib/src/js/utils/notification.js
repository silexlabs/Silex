//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.Notification');

/**
 * @constructor
 * @struct
 */
silex.utils.Notification = function() {
  throw('this is a static class and it canot be instanciated');
}

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
 * use native alerts vs alertify
 */
silex.utils.Notification.useNative = function () {
  // 0 is PERMISSION_ALLOWED
  return (window.webkitNotifications && window.webkitNotifications.checkPermission() === 0);
};


/**
 * activate native alerts if available
 */
silex.utils.Notification.activateNative = function(){
  if (window.webkitNotifications) {
    console.log("Native notifications are supported!");
    if (silex.utils.Notification.useNative()) {
      console.log("Native notifications are active!");
    } else {
      window.webkitNotifications.requestPermission();
    }
  }
  else {
    console.log("Notifications are not supported for this Browser/OS version yet.");
  }
};


/**
 * display a native notification, or ask for permission
 */
silex.utils.Notification.nativeNotification = function(message, iconUrl){
  if (silex.utils.Notification.useNative()){
    var notification = window.webkitNotifications.createNotification(
      iconUrl, 'Silex speaking...', message);
    notification.show();
  }
  else{
    silex.utils.Notification.activateNative();
  }
}


/**
 * display a message
 */
silex.utils.Notification.alert = alertify.alert;


/**
 * display a message
 */
silex.utils.Notification.prompt = alertify.prompt;


/**
 * display a message
 */
silex.utils.Notification.confirm = alertify.confirm;

/**
 * notify the user with success formatting
 */
silex.utils.Notification.notifySuccess = function(message) {
  console.info(message);
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.SUCCESS_ICON);
  alertify.success(message);
};


/**
 * notify the user with success formatting
 */
silex.utils.Notification.notifyError = function(message) {
  console.error(message);
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.ERROR_ICON);
  alertify.error(message);
};


/**
 * notify the user with success formatting
 */
silex.utils.Notification.notifyInfo = function(message) {
  console.info(message);
  silex.utils.Notification.nativeNotification(message, silex.utils.Notification.INFO_ICON);
  alertify.log(message);
};


