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
 *
 */


goog.provide('silex.view.dialog.NewWebsiteDialog');
goog.require('silex.view.ModalDialog');
goog.require('silex.view.TipOfTheDay');


/**
 * load the templates for the user to choose
 * @constructor
 * @param {!Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                               the controller instances
 */
silex.view.dialog.NewWebsiteDialog = function(element, model, controller) {

  // store the params
  this.element = element;
  this.model = model;
  this.controller = controller;

  // make this a dialog
  this.modalDialog = new silex.view.ModalDialog({
    element: element,
    onOpen: args => this.redraw(),
    onClose: () => console.log('onClose'),
  });

  /**
   * flag set to 'success' when the template list is loaded
   * and set to 'error' when the loading failed
   * @type {string}
   */
  this.state = '';
};


/**
 * render the data loaded from github into a <ul>
 * @param  {Element} ul
 * @param  {string} repo
 * @param  {*} data
 */
silex.view.dialog.NewWebsiteDialog.prototype.renderTemplateList = function(ul, repo, data) {
  // handle previously rendered elements
  const elements = ul.querySelectorAll('li.rendered-item');
  for(let idx=0; idx<elements.length; idx++) {
    const el = elements[idx];
    el.parentNode.removeChild(el);
  }
  if(Array.isArray(data)) {
    // render the data
    data
      // remove files
      .filter(item => item.type === 'directory')
      // make a list of <li> tags
      .map(item => {
        const li = document.createElement('li');
        const name = item.name;
        li.classList.add('rendered-item');

        // thumbnail
        const thumbnail = document.createElement('div');
        const templateFolder = `/libs/templates/${repo}/${item.name}`;
        thumbnail.classList.add('thumbnail');
        thumbnail.style.backgroundImage = `url(${templateFolder}/screenshot.png)`;
        thumbnail.setAttribute('data-editable', `${templateFolder}/editable.html`);
        thumbnail.setAttribute('data-is-template', 'true');
        li.appendChild(thumbnail);

        // UI container
        const ui = document.createElement('div');
        ui.classList.add('ui');
        li.appendChild(ui);

        // title
        const h3 = document.createElement('h3');
        h3.innerHTML = name;
        h3.setAttribute('data-editable', `${templateFolder}/editable.html`);
        h3.setAttribute('data-is-template', 'true');
        ui.appendChild(h3);

        // preview
        const previewEl = document.createElement('a');
        previewEl.classList.add('fa', 'fa-external-link');
        previewEl.innerHTML = 'Preview';
        previewEl.setAttribute('data-action', 'preview');
        previewEl.target = '_blank';
        previewEl.href = `${templateFolder}/index.html`;
        ui.appendChild(previewEl);

        // info
        const infoEl = document.createElement('a');
        infoEl.classList.add('fa', 'fa-info');
        infoEl.innerHTML = 'Info';
        infoEl.target = '_blank';
        infoEl.href = `https://github.com/silexlabs/${repo}/blob/gh-pages/${item.name}/README.md`;
        infoEl.setAttribute('data-action', 'info');
        ui.appendChild(infoEl);

        // edit
        const editEl = document.createElement('a');
        editEl.classList.add('fa', 'fa-pencil');
        editEl.innerHTML = 'Select';
        editEl.setAttribute('data-editable', `libs/templates/${repo}/${item.name}/editable.html`);
        editEl.setAttribute('data-is-template', 'true');
        ui.appendChild(editEl);

        return li;
      })
      // add the <li> tags to the <ul> tag
      .forEach(li => ul.appendChild(li));
  } // else { console.log('It looks like you are offline. I could not load data from github issues'); }
};


/**
 * init the menu and UIs
 */
silex.view.dialog.NewWebsiteDialog.prototype.buildUi = function() {
  const createList = (ul, repo, success, error) => {
    const repoUrl = `/get/${repo}`;
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('error', e => {
      ul.innerHTML = 'It looks like you are offline. I could not load data from github issues';
      success();
    });
    oReq.addEventListener('load', e => {
      const list = JSON.parse(oReq.responseText);
      this.renderTemplateList(ul, repo, list.children);
      success();
    });
    oReq.open('GET', repoUrl);
    oReq.send();
  }
  // click event
  const body = this.element.querySelector('.body');
  body.onclick = e => {
    // listen for a click in the list of recent files
    const a = e.target;
    if(a.getAttribute('data-editable')) {
      this.selected = {
        url: a.getAttribute('data-editable'),
        isTemplate: a.getAttribute('data-is-template') === 'true',
      }
      // close the dialog, which will trigger a call the dialog onClose callback
      // and then this.selected will be used to open the selected file
      this.modalDialog.close();
      e.preventDefault();
      return false;
    }
  };
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
  // clear button
  const clearBtn = this.element.querySelector('.clear-btn');
  clearBtn.onclick = e => {
    this.model.file.clearLatestFiles();
    this.redraw();
  };
  // browse / import button
  const moreBtn = this.element.querySelector('.more-btn');
  moreBtn.onclick = e => {
    this.modalDialog.close();
    this.controller.fileMenuController.openFile(null, e => this.modalDialog.open(), () => this.modalDialog.open());
  };
  // tip of the day
  const tipOfTheDayElement = /** @type {!Element} */ (this.element.querySelector('.tip-of-the-day'));
  /** @type {silex.view.TipOfTheDay} */
  var tipOfTheDay = new silex.view.TipOfTheDay(tipOfTheDayElement, this.model, this.controller);
};


/**
 * redraw UI each time the dialog opens
 */
silex.view.dialog.NewWebsiteDialog.prototype.redraw = function() {
  // recent files
  const recentFiles = this.model.file.getLatestFiles();

  // buttons visibility
  const pane = this.element.querySelector('.open-pane');
  if(recentFiles.length) pane.classList.remove('emty-list');
  else pane.classList.add('emty-list');

  // fill the list
  const ul = pane.querySelector('ul.list');
  ul.innerHTML = '';
  recentFiles
    .map(item => {
      // there my be errors due to wrong data in the local storage
      try {
        const li = document.createElement('li');
        li.setAttribute('data-editable', item['path']);
        li.classList.add('list-item');

        const icon = document.createElement('span');
        icon.setAttribute('data-editable', item['path']);
        icon.classList.add('fa', item['cloudIcon']);
        li.appendChild(icon);

        const name = document.createElement('span');
        name.setAttribute('data-editable', item['path']);
        name.innerHTML = item['folder'];
        li.appendChild(name);

        return li;
      }
      catch(e) {
        console.error('Catched error: ', e);
      }
      return null;
    })
    .filter(item => !!item)
    // add the <li> tags to the <ul> tag
    .forEach(li => ul.appendChild(li));
};


/**
 * open the dialog
 * @param {{close:!function(?string, ?boolean), ready:?function(), error:?function(?Object=)}} options   options object
 */
silex.view.dialog.NewWebsiteDialog.prototype.openDialog = function(options) {
  // is ready callback
  if(this.state === 'ready') {
    // notify the owner
    if(options.ready) options.ready();
  }
  // error callback
  else if(this.state === 'error') {
    if(options.error) options.error();
  }
  // store them for later
  else {
    this.readyCbk = options.ready;
    this.errorCbk = options.error;
  }
  this.selected = null;
  this.modalDialog.onClose = () => {
    // let the file picker init
    // this is a workaround to prevent cloud explorer to throw an error on write
    // FIXME: remove this with the new cloud explorer version
    const filePicker = silex.service.CloudStorage.getInstance().filePicker;
    filePicker['ctrl']['show']();
    filePicker['ctrl']['hide']();
    // notify the owner, with the url to load or nothing (will load blank template)
    if(this.selected) {
      options.close(this.selected.url, this.selected.isTemplate);
    }
    else {
      options.close(null, null);
    }
  }
  this.modalDialog.open();
};
