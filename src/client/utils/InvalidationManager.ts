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
 * @fileoverview This class implements an invalidation mechanism.
 * This is useful when a method is called more often than needed
 * and you want to reduce the number of calls by skipping useless ones.
 */

/**
 * @class InvalidationManager
 * @example this will log 0 and then one second after 999
 *          ```var im = new InvalidationManager(1000);
 *             for(var idx=0; idx<1000; idx++)
 *               im.callWhenReady(function() { console.log(idx); });
 *          ```
 */
export class InvalidationManager {
  /**
   * the minimum time between two calls
   */
  isDirty: boolean = false;

  /**
   * store the last callback called while the delay since first call is not over
   */
  cbk: (() => any) = null;

  /**
   * @param delay the minimum time between two calls, in seconds
   */
  constructor(public delay: number) {}

  /**
   * @param cbk callback which will be called if it is chosen
   */
  callWhenReady(cbk: () => any) {
    // if a call was made a short time ago
    if (this.isDirty) {
      // store the last call only (rewrite this.cbk each time)
      // and save it for later
      this.cbk = cbk;
    } else {
      // otherwise call the calback right now
      // and check the flag saying that a call was made a short time ago
      this.isDirty = true;
      cbk();
      this.startDirty();
    }
  }

  startDirty() {
    setTimeout(() => {
      // other calls have been made in the mean time, call the last one only
      if (this.cbk === null) {
        // reset the flag
        this.isDirty = false;
      } else {
        this.cbk();
        this.cbk = null;
        this.startDirty();
      }
    }, this.delay);
  }
}
