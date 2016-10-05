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
 * @fileoverview The "new website" dialog which displays templates
 * FIXME: do not inherit from settings but create a SideBarDialogBase base class
 *
 */


goog.provide('silex.view.dialog.NewWebsiteDialog');
goog.require('silex.view.dialog.SettingsDialog');



/**
 * load the templates for the user to choose
 * @extends {silex.view.dialog.SettingsDialog}
 * @constructor
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.NewWebsiteDialog = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // set the visibility css class
  this.visibilityClass = 'newwebsite-editor';
  // init the navigation
  this.element.classList.add('general-pane-visible');
};

// inherit from silex.view.dialog.SettingsDialog
goog.inherits(silex.view.dialog.NewWebsiteDialog, silex.view.dialog.SettingsDialog);


/**
 * prevent settings init stuff
 */
silex.view.dialog.NewWebsiteDialog.prototype.init = function() {
};

/**
 * init the menu and UIs
 */
silex.view.dialog.NewWebsiteDialog.prototype.buildUi = function() {
  // call super
  // goog.base(this, 'buildUi');
  const templatesList = this.element.querySelector('.templates');
  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', e => {
    const data = JSON.parse(oReq.responseText);
    data
      .filter(item => item.type === 'dir')
      .map(item => {
        const li = document.createElement('li');
        const name = item.name.replace('-', ' ', 'g');

        const h2 = document.createElement('h2');
        h2.innerHTML = name;
        li.appendChild(h2);

        const a = document.createElement('a');
        a.innerHTML = 'View this template online';
        a.href = `//silex-templates.silex.me/${item.name}/index.html`;
        li.appendChild(a);

        const img = document.createElement('img');
        img.src = `//silex-templates.silex.me/${item.name}/screenshot-678x336.png`;
        img.title = name;
        li.appendChild(img);

        return li;
      })
      .forEach(li => templatesList.appendChild(li));
  });
  oReq.open('GET', 'https://api.github.com/repos/silexlabs/silex-templates/contents');
  oReq.send();
};
