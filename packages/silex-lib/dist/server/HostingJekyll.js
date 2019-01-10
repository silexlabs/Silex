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

const HostingBase = require('./HostingUnifile');

module.exports = class extends HostingBase {
  constructor(unifile) {
    super(unifile);
  }
  getOptions(session) {
    const options = super.getOptions(session);
    return Object.assign({}, options, {
      name: 'jekyll',
      displayName: 'Jekyll layout',
      pleaseCreateAVhost: 'create a Jekyll template.',

    });
  }
  getHtmlFolder(defaultFolder) {
    return '_layouts';
  }
  getDefaultPageFileName() {
    return null;
  };
}
