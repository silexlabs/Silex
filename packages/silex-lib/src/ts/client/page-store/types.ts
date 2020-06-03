/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

import { CrudState } from '../store/crud-store'
import { Link } from '../element-store/types'

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
