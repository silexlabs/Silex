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

export enum ElementAction {
  INITIALIZE = 'ELEMENT_INITIALISE',
  CREATE = 'ELEMENT_CREATE',
  DELETE = 'ELEMENT_DELETE',
  UPDATE = 'ELEMENT_UPDATE',
  // MOVE = 'ELEMENT_MOVE',
}

export enum PageAction {
  INITIALIZE = 'PAGE_INITIALIZE',
  CREATE = 'PAGE_CREATE',
  DELETE = 'PAGE_DELETE',
  UPDATE = 'PAGE_UPDATE',
  MOVE = 'PAGE_MOVE',
}

export enum SiteAction {
  INITIALIZE = 'SITE_INITIALIZE',
  UPDATE = 'SITE_UPDATE',
}

export enum UiAction {
  INITIALIZE = 'UI_INITIALIZE',
  UPDATE = 'UI_UPDATE',
}
