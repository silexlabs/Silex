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

/**
 * @fileoverview This file contains the definitions of the Model, View and
 * Controller structures
 * FIXME: remove old MVC types, split to packages: element, page, site, ui
 *
 */
import { DataModel } from './flux/types';
import { PageData } from './page/types';

// FIXME: this file should not exist

/**
 * direction in the dom
 */
export class DomDirection {
  static UP = 'UP';
  static DOWN = 'DOWN';
  static TOP = 'TOP';
  static BOTTOM = 'BOTTOM';
}

export interface LinkData {
  href?: string;
  target?: string;
  title?: string;
  rel?: string;
  type?: string;
  download?: string;
}
export enum StickyPoint {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
}
// MID_V: 'midV',
// MID_H: 'midH',
export interface StickyLine {
  id: string;
  vertical: boolean;
  position: number;
  stickyPoint: StickyPoint;
  metaData: any;
}
export interface UndoItem {
  data: DataModel;
  page: PageData;
  html: string;
  scrollX: number;
  scrollY: number;
}
