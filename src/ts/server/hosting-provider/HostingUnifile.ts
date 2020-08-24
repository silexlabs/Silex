import { Config } from '../ServerConfig'
import { HostingProvider, PublishContext } from '../types'

export default class HostingUnifile implements HostingProvider {
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

  // prevent replace index.html with ./
  getPageLink(pageUrl: string, context: PublishContext) {
    return pageUrl
  }

  getDefaultPageFileName(context) {
    return 'index.html'
  }
}
