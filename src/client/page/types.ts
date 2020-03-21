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

import { CrudState } from '../flux/crud-store'
import { Link } from '../element/types';

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

export interface PageData extends CrudState {
  id: string,
  displayName: string,
  link: Link,
  opened: boolean,
  canDelete: boolean,
  canProperties: boolean,
  canMove: boolean,
  canRename: boolean,
}
