import { Config } from '../ServerConfig';

export default class HostingUnifile {
  constructor(protected unifile, protected config: Config) {}
  getOptions(session) {
    return {
      name: 'unifile',
      displayName: 'Choose a folder',
      isLoggedIn: true,
      authorizeUrl: null,
      dashboardUrl: null,
      pleaseCreateAVhost: null,
      vhostsUrl: null,
      buyDomainUrl: null,
      skipVhostSelection: true,
      skipFolderSelection: false,
      afterPublishMessage: null,
    }
  }

  finalizePublication(context, onStatus) {
    return Promise.resolve()
  }

  getDefaultPageFileName(context) {
    return 'index.html'
  }

  // this is commented out because with FS we need to explicitely link to index.html, not to the ./ folder
  // getPermalink(pageName) {
  //   return pageName === 'index.html' ? './' : pageName;
  // }
}
