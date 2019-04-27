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
 * @fileoverview
 * TipOfTheDay to display a message at startup
 * Load the data from the "tip-of-the-day" issues on github
 *
 */

import {Tracker} from '../service/tracker';

/**
 * @param element   container to render the UI
 */
export class TipOfTheDay {
  /**
   * name of the local storage property
   */
  static NUM_VISITS_LOCAL_STORAGE_NAME = 'silex-caping';

  constructor(public element: HTMLElement) {
    this.init();
  }

  /**
   * Start the process of showing the tip of the day
   */
  init() {
    let itemTrackAction = '';

    // start loading
    this.element.classList.add('tip-of-the-day');
    this.element.classList.add('loading');

    // keep track of the visits
    let visits = 0;
    let visitsStr =
        window.localStorage.getItem(TipOfTheDay.NUM_VISITS_LOCAL_STORAGE_NAME);
    if (visitsStr) {
      visits = parseInt(visitsStr, 10);
    }
    window.localStorage.setItem(
        TipOfTheDay.NUM_VISITS_LOCAL_STORAGE_NAME, (visits + 1).toString());

    // load data
    let oReq = new XMLHttpRequest();
    oReq.open(
        'GET',
        'https://api.github.com/repos/silexlabs/Silex/issues?labels=tip-of-the-day');
    oReq.send();
    oReq.addEventListener('error', (e) => {
      (this.element.querySelector('.container') || this.element).innerHTML =
          'It looks like you are offline. I could not load data from github issues';
      this.element.classList.remove('loading');
    });
    oReq.addEventListener('load', (e) => {
      // get the json response
      const items = JSON.parse(oReq.responseText);

      // loop on the items backward
      let idx = items.length - visits % items.length - 1;
      let item = items[idx];
      if (item) {
        // store for actions tracking (QA)
        itemTrackAction = item['title'];
        Tracker.getInstance().trackAction(
            'tip-of-the-day', 'show', itemTrackAction, 0);

        // extract the first link from the issue
        let tmp = document.createElement('div');
        tmp.innerHTML = item['body'];
        let firstLink = tmp.querySelector('a');

        // let firstImage = tmp.querySelector('img');
        // display the content
        let el = document.createElement('a');
        el.target = '_blank';
        el.title = item['title'];
        el.innerHTML = '<h3>' + item['title'] + '</h3><p>' +
            this.strip(item['body']) + '</p>';
        if (firstLink != null) {
          el.href = firstLink.href;
        }
        (this.element.querySelector('.container') || this.element).appendChild(el);
      }
      this.element.classList.remove('loading');
    });

    // attach click event
    this.element.addEventListener('click', e => {
      if ((e.target as HTMLElement).classList.contains('close')) {
        Tracker.getInstance().trackAction(
            'tip-of-the-day', 'close', itemTrackAction, 0);
      } else {
        Tracker.getInstance().trackAction(
            'tip-of-the-day', 'open', itemTrackAction, 1);
      }
    }, false);
  }

  /**
   * remove the html from a string
   */
  strip(html) {
    let node = document.createElement('DIV');
    node.innerHTML = html;
    return node.textContent || node.innerText || '';
  }
}
