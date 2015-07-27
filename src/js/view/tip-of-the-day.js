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


goog.provide('silex.view.TipOfTheDay');
goog.require('goog.net.XhrIo');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.TipOfTheDay = function(element, model, controller) {
  /**
   * @type {Element}
   */
  this.element = element;

  // hide
  this.element.classList.add('hidden-dialog');
  // wait for a while
  setTimeout(() => {
    // start loading
    this.element.classList.add('loading');
    // capping to prevent harrassing the user
    let visits = 0;
    if(localStorage) {
      // init local storage
      let visitsStr = localStorage.getItem('visits');
      if(visitsStr) {
        visits = parseInt(visitsStr);
      }
      localStorage.setItem('visits', visits + 1);
      // the more visits the less chance we have to show the tip
      let rand = Math.random() * visits;
      if(rand > 3) {
        return;
      }
    }
    // load data
    goog.net.XhrIo.send('https://api.github.com/repos/silexlabs/Silex/issues?labels=tip-of-the-day', (e) => {
      // get the json response
      let xhr = e.target;
      let items = xhr.getResponseJson();
      // loop on the items backward
      let idx = items.length - (visits % items.length) -1;
      let item = items[idx];
      // display the content
      let el = document.createElement('div');
      el.innerHTML = '<a target="_blank" href="' + item['html_url'] + '"><h1>' + item['title'] + '</h1><p>' + this.strip(item['body']) + '</p></a><a class="close" href="#">Close</a>';
      this.element.appendChild(el);
      this.element.classList.remove('loading');
      this.element.classList.remove('hidden-dialog');
    });
  }, 4000);
  // attach click event
  goog.events.listen(this.element, goog.events.EventType.CLICK, (e) => {
    // hide
    this.element.classList.add('hidden-dialog');
  }, false, this);
};


/**
 * remove the html from a string
 */
silex.view.TipOfTheDay.prototype.strip = function(html)
{
  var node = document.createElement("DIV");
  node.innerHTML = html;
  return node.textContent || node.innerText || "";
};
