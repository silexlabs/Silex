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
 * @fileoverview Service used to interact with analytics server.
 *     It is used in Silex to track the user actions (QOS layer).
 *     This class is a singleton.
 *
 */

import {_paq} from '../externs';

/**
 * the Silex Tracker class logs user actions
 * this is for us to detect problems and improve user experience
 * @class {silex.service.Tracker}
 */
export class Tracker {
  /**
   * constant
   */
  static SILEX_ACTIONS_CATEGORY: string = 'silex-event';

  static instance: Tracker;

  static getInstance(): Tracker {
    Tracker.instance = Tracker.instance || new Tracker();
    return Tracker.instance;
  }

  /**
   * track an action in G.A.
   *
   */
  trackAction(
      category: string, action: string, opt_label?: string,
      opt_value?: number) {
    // console.info('trackAction (anonymized)', arguments);
    _paq.push(['trackEvent', category, action, opt_label, opt_value]);
  }

  trackOnError(msg: string, url: string, line: number, colno?: number, error?: Error) {
    this.trackAction('controller-events', 'uncaught.error ', msg, -1);
  }
}
