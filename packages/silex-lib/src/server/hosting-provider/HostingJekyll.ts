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

import { Action } from '../publication/DomPublisher';
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
  }
  getRootUrl(rootUrl) {
    return '{{ site.url }}{{ site.baseurl }}/';
  }
  beforeWrite(actions: Action[]) {
    const action = actions.find((a) => a.name === 'writefile' && a.path.endsWith('/styles.css'));
    if (action) {
      action.content = '---\n---' + (action.content as Buffer).toString('utf-8');
    } else {
      throw new Error('Could not make the file style.css a Jekyll file with front matter');
    }
    return actions;
  }
  getPermalink(pageName) {
    return pageName === 'index.html' ? '/' : pageName;
  }
}
