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
  /**
   * selected template
   * @type {?string}
   */
  this.selected = null;
  /**
   * template list loaded
   * @type {string}
   */
  this.state = '';
};

// inherit from silex.view.dialog.SettingsDialog
goog.inherits(silex.view.dialog.NewWebsiteDialog, silex.view.dialog.SettingsDialog);


/**
 * constant for all pane css classes
 */
silex.view.dialog.NewWebsiteDialog.PANE_CSS_CLASSES = [
  'blank-page-pane',
  'general-pane',
];


/**
 * prevent settings init stuff
 */
silex.view.dialog.NewWebsiteDialog.prototype.init = function() {
  this.paneCssClasses = silex.view.dialog.NewWebsiteDialog.PANE_CSS_CLASSES;
};

/**
 * init the menu and UIs
 */
silex.view.dialog.NewWebsiteDialog.prototype.buildUi = function() {
  const createList = (ul, repo, success, error) => {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', e => error(e));
    oReq.addEventListener('load', e => {
      const data = JSON.parse(oReq.responseText);
      console.log('xx', data);
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
          a.href = `//${repo}.silex.me/${item.name}/index.html`;
          a.setAttribute('data-editable', `//${repo}.silex.me/${item.name}/editable.html`);
          li.appendChild(a);

          const img = document.createElement('img');
          img.src = `//${repo}.silex.me/${item.name}/screenshot-678x336.png`;
          img.title = name;
          li.appendChild(img);

          return li;
        })
        .forEach(li => ul.appendChild(li));

        success();
    });
    oReq.open('GET', `https://api.github.com/repos/silexlabs/${repo}/contents`);
    oReq.send();
    // click event
    ul.onclick = e => {
      const a = e.target;
      this.selected = a.getAttribute('data-editable');
      this.closeEditor();
      e.preventDefault();
      return false;
    };
  }
  const loadNext = toLoad => {
    if(toLoad.length > 0) {
      const item = toLoad.pop();
      createList(this.element.querySelector(item.selector),
        item.repo,
        () => loadNext(toLoad),
        e => {
          this.state = 'error';
          if(this.errorCbk) this.errorCbk(e);
          this.readyCbk = null;
          this.errorCbk = null;
        });
    }
    else {
      this.state = 'ready';
      if(this.readyCbk) this.readyCbk();
      this.readyCbk = null;
      this.errorCbk = null;
    }
  };
  const toLoad = [
    {
      selector: '.general-pane ul',
      repo: 'silex-templates',
    },
    {
      selector: '.blank-page-pane ul',
      repo: 'silex-blank-templates',
    },
  ];
  loadNext(toLoad);
};


/**
 * open settings dialog
 * @param {?function()=} opt_cbk   callback to be called when the user closes the dialog
 * @param {?string=} opt_paneCssClass   css class of the pane to open
 */
silex.view.dialog.NewWebsiteDialog.prototype.openDialog = function(opt_cbk, opt_paneCssClass, opt_options) {
  if(opt_options) {
    // is ready callback
    if(this.state === 'ready') {
      if(opt_options.ready) opt_options.ready();
    }
    // error callback
    else if(this.state === 'error') {
      if(opt_options.error) opt_options.error();
    }
    // store them for later
    else {
      this.readyCbk = opt_options.ready;
      this.errorCbk = opt_options.error;
    }
  }
  // call super
  goog.base(this, 'openDialog', opt_cbk, opt_paneCssClass);
};
