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

import { CrudState } from '../store/crud-store'
import { Link } from '../element-store/types';

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

// Type with all the properties but the symbol used to compare them in the store
// Use fromPageData to make it an PageState
export interface PageData {
  id: string,
  displayName: string,
  link: Link,
  canDelete: boolean,
  canProperties: boolean,
  canMove: boolean,
  canRename: boolean,
}

// Type as stored in the store
export interface PageState extends CrudState {
  id: string,
  displayName: string,
  link: Link,
  canDelete: boolean,
  canProperties: boolean,
  canMove: boolean,
  canRename: boolean,
}
