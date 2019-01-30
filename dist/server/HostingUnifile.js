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

module.exports = function(unifile) {
  this.unifile = unifile;
};

module.exports.prototype.getOptions = function(session) {
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
};

module.exports.prototype.finalizePublication = function(from, to, session, onStatus) {
  return Promise.resolve();
}

module.exports.prototype.getDefaultPageFileName = function() {
  return 'index.html';
};
