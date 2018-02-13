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
 * @fileoverview Service used to interact with the unifile server.
 *     This class is a singleton.
 *
 */


goog.provide('silex.service.CloudStorage');


/**
 * the Silex CloudStorage service
 * load and save data to and from the cloud storage services
 * this is a singleton
 * @constructor
 */
silex.service.CloudStorage = function() {
};
goog.addSingletonGetter(silex.service.CloudStorage);


/**
 * reference to the filepicker instance
 * @type {CloudExplorer}
 */
silex.service.CloudStorage.prototype.ce = null;


/**
 * @param {function()} cbk
 */
silex.service.CloudStorage.prototype.ready = function(cbk) {
  // cloud explorer instance
  const ceIframe = document.querySelector('#silex-file-explorer');
  if(ceIframe.contentWindow.ce) {
    this.ce = /** @type {CloudExplorer} */ (ceIframe.contentWindow['ce']);
    cbk();
  }
  else {
    if(this.cbks == null) {
      this.cbks = [];
      ceIframe.addEventListener('load', e => {
        this.ce = /** @type {CloudExplorer} */ (ceIframe.contentWindow['ce']);
        this.cbks.forEach(cbk => cbk());
        this.cbks = [];
      });
    }
    this.cbks.push(cbk);
  }
};


/**
 * save a file
 * @param  {FileInfo} fileInfo
 * @param  {string} rawData
 * @param  {function()} cbk
 * @param  {?function(Object)=} opt_errCbk
 */
silex.service.CloudStorage.prototype.write = function(fileInfo, rawData, cbk, opt_errCbk) {
  // // save the data
  // this.ce.write(new Blob([rawData], {type: 'text/plain'}), fileInfo)
  // .then(() => {
  //   cbk();
  // })
  // .catch(e => {
  //   console.error('Error: could not write file', fileInfo, e);
  //   if (opt_errCbk) opt_errCbk(/** @type {Object} */ (e));
  // });
	const oReq = new XMLHttpRequest();
	oReq.onload = function(event) {
		if(oReq.status === 200) {
			cbk();
		}
	};
	oReq.onerror = function(e) {
		console.error('error for the request', e);
		if(opt_errCbk) opt_errCbk(e);
	};
	const url = `/website/${ fileInfo.service }/put/${ fileInfo.path }`;
	oReq.open('PUT', url);
	oReq.send(rawData);
};


/**
 * load text blob from unifile
 * @param  {FileInfo} fileInfo
 * @param  {function(string)} cbk
 * @param  {?function(Object, string)=} opt_errCbk
 */
silex.service.CloudStorage.prototype.read = function(fileInfo, cbk, opt_errCbk) {

  this.loadLocal(fileInfo.absPath, cbk, opt_errCbk);
  // // load the data
  // this.ce.read(fileInfo)
  // .then(blob => {
  //   // convert blob to text
  //   var reader = new FileReader();
  //   reader.addEventListener('error', function(e) {
  //      console.error('could not read the blob received from cloud explorer', e);
  //      if(opt_errCbk) opt_errCbk(e);
  //   });
  //   reader.addEventListener('loadend', function() {
  //      cbk(/** @type {string} */ (reader.result));
  //   });
  //   reader.readAsText(blob);
  // })
  // .catch(e => {
  //   console.error('Error: could not read file', fileInfo, e);
  //   if (opt_errCbk) opt_errCbk(/** @type {Object} */ (e));
  // });
};


/**
 * load data
 * @param  {string} absPath
 * @param  {function(string)} cbk
 * @param  {?function(Object, string)=} opt_errCbk
 */
silex.service.CloudStorage.prototype.loadLocal = function(absPath, cbk, opt_errCbk) {
  const url = '/website' + absPath;
  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', e => {
    // success of the request
    if(oReq.status === 200) {
      const data = JSON.parse(oReq.responseText);
      // warn the user
      if (data['message']) {
        silex.utils.Notification.alert(data['message'], function() {});
      }
      cbk(data['html']);
    }
    else {
      const err = new Event('error');
      let msg = '';
      const response = JSON.parse(oReq.responseText);
      if(response['message']) msg = response['message'];
      else switch(oReq.status) {
        case 404: msg = 'File not found.';
        break;
        case 401: msg = 'You are not connected to the cloud service you are trying to use.';
        break;
        default: msg = 'Unknown error with HTTP status ' + oReq.status;
      }
      err.currentTarget = err.target = oReq;
      opt_errCbk(err, msg);
    }
  });
  oReq.addEventListener('error', e => {
    console.error('could not load website', absPath, 'from', url, e);
    if (opt_errCbk) {
      opt_errCbk(e, 'Network error, please check your internet connection or try again later.');
    }
  });
  oReq.open('GET', url);
  oReq.send();
};


/**
 * @param  {function(Array.<*>)} cbk
 * @param  {?function(*, string)=} opt_errCbk
 */
silex.service.CloudStorage.prototype.getServices = function(cbk, opt_errCbk) {
  this.ce.getServices()
  .then(services => {
    cbk(services);
  })
  .catch(e => {
    console.error('Error: could not get the list of services', e);
    if (opt_errCbk) opt_errCbk(e, 'Error: could not get the list of services');
    else cbk([]);
  });
};
