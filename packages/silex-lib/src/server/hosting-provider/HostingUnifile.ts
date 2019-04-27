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

export default class HostingUnifile {
  constructor(private unifile) {};
  getOptions(session) {
    return {
      name: 'unifile',
      displayName: 'Choose a folder',
      isLoggedIn: true,
      authorizeUrl: '',
      dashboardUrl: '',
      pleaseCreateAVhost: '',
      vhostsUrl: '',
      buyDomainUrl: '',
      skipVhostSelection: true,
      skipFolderSelection: false,
      afterPublishMessage: '',
    };
  }

  finalizePublication(from, to, session, onStatus) {
    return Promise.resolve();
  }

  getDefaultPageFileName() {
    return 'index.html';
  }
}
