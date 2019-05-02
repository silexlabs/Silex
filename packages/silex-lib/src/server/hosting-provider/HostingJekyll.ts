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

import HostingUnifile from './HostingUnifile';

export default class HostingJekyll extends HostingUnifile {
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
