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

import { ElementData } from '../element/types';
import { PageData } from '../page/types';
import { SiteData } from '../site/types';

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

export interface DataModel {
  site: SiteData,
  elements: ElementData[],
  pages: PageData[],
}

