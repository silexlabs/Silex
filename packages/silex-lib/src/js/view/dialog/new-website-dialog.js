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
 * @fileoverview Silex Dashboard / "new website" dialog which displays templates
 *
 */


goog.provide('silex.view.dialog.NewWebsiteDialog');
goog.require('silex.view.ModalDialog');
goog.require('silex.view.TipOfTheDay');


/**
 * Silex Dashboard dialog
 * @class {silex.view.dialog.NewWebsiteDialog}
 */
class NewWebsiteDialog {
  /**
   * @param {!Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                               the controller instances
   */
  constructor(element, model, controller) {
    // define properties
    /**
     * @type {function()|null}
     */
    this.readyCbk = null;
    /**
     * @type {function(?Object=)|null}
     */
    this.errorCbk = null;
    /**
     * @type {{url:?string, fileInfo:?FileInfo}|null}
     */
    this.selected = null;
    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;

    // make this a dialog
    this.modalDialog = new ModalDialog({
      element: element,
      onOpen: args => this.redraw(),
      onClose: () => {},
    });

    /**
     * flag set to 'success' when the template list is loaded
     * and set to 'error' when the loading failed
     * @type {string}
     */
    this.state = '';
  }


  /**
   * render the data loaded from github into a <ul>
   * @param  {Element} ul
   * @param  {string} repo
   * @param  {*} data
   */
  renderTemplateList(ul, repo, data) {
    // handle previously rendered elements
    const elements = ul.querySelectorAll('li.rendered-item');
    for(let idx=0; idx<elements.length; idx++) {
      const el = elements[idx];
      el.parentNode.removeChild(el);
    }
    if(Array.isArray(data)) {
      // render the data
      data
        // make a list of <li> tags
        .map(item => {
          const li = document.createElement('li');
          li.classList.add('rendered-item');

          // thumbnail
          const thumbnail = document.createElement('div');
          const templateFolder = `/libs/templates/${repo}/${item}`;
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
          h3.innerHTML = item;
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
          infoEl.href = `https://github.com/silexlabs/${repo}/blob/gh-pages/${item}/README.md`;
          infoEl.setAttribute('data-action', 'info');
          ui.appendChild(infoEl);

          // edit
          const editEl = document.createElement('a');
          editEl.classList.add('fa', 'fa-pencil');
          editEl.innerHTML = 'Select';
          editEl.setAttribute('data-editable', `/libs/templates/${repo}/${item}/editable.html`);
          editEl.setAttribute('data-is-template', 'true');
          ui.appendChild(editEl);

          return li;
        })
        // add the <li> tags to the <ul> tag
        .forEach(li => ul.appendChild(li));
    } // else { console.log('It looks like you are offline. I could not load data from github issues'); }
  }


  /**
   * init the menu and UIs
   */
  buildUi() {
    const createList = (ul, repo, success, error) => {
      const repoUrl = `/get/${repo}`;
      const oReq = new XMLHttpRequest();
      oReq.addEventListener('error', e => {
        ul.innerHTML = 'It looks like you are offline. I could not load data from github issues';
        success();
      });
      oReq.addEventListener('load', e => {
        const list = JSON.parse(oReq.responseText);
        this.renderTemplateList(ul, repo, list);
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
      const templateUrl = a.getAttribute('data-editable');
      const recentFileInfo = a.getAttribute('data-file-info');
      if(!!templateUrl || !!recentFileInfo) {
        this.selected = {
          fileInfo: /** @type {FileInfo} */ (JSON.parse(recentFileInfo)),
          url: templateUrl,
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
      // note that if there is an error in CE, we keep it open so that the user can do something,
      // e.g. navigate awway from a non existing folder
      this.controller.fileMenuController.openFile(null, null, () => this.modalDialog.open());
    };
    // tip of the day
    const tipOfTheDayElement = /** @type {!Element} */ (this.element.querySelector('.tip-of-the-day'));
    /** @type {silex.view.TipOfTheDay} */
    var tipOfTheDay = new silex.view.TipOfTheDay(tipOfTheDayElement);
  }


  /**
   * redraw UI each time the dialog opens
   */
  redraw() {
    // recent files
    const recentFiles = this.model.file.getLatestFiles();

    // buttons visibility
    const pane = this.element.querySelector('.open-pane');
    if(recentFiles.length > 0) pane.classList.remove('emty-list');
    else pane.classList.add('emty-list');

    // fill the list
    const ul = pane.querySelector('ul.list');
    ul.innerHTML = '';
    recentFiles
      .map(blob => {
        // there may be errors due to wrong data in the local storage
        try {
          const li = document.createElement('li');
          li.setAttribute('data-file-info', JSON.stringify(blob));
          li.classList.add('list-item');

          const icon = document.createElement('span');
          icon.setAttribute('data-file-info', JSON.stringify(blob));
          // cloudIcon= fa-github | fa-dropbox | fa-server | fa-cloud | fa-cloud-download
          const cloudIcon = (() => {
            let name;
            switch(blob.service) {
              case 'github':
                return 'fa-github';
              case 'dropbox':
                return 'fa-dropbox';
              case 'webdav':
                return 'fa-cloud-download';
              case 'ftp':
              case 'sftp':
                return 'fa-server';
              case 'fs':
                return 'fa-hdd';
              default:
                return 'fa-cloud';
            }
          })();
          icon.classList.add('fa', cloudIcon);
          li.appendChild(icon);

          const name = document.createElement('span');
          name.setAttribute('data-file-info', JSON.stringify(blob));
          name.innerHTML = '/' + blob.folder + '<strong>/' + blob.name + '</strong>';
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
  }


  /**
   * open the dialog
   * @param {{openFileInfo:!function(?FileInfo), openTemplate:!function(?string), ready:?function(), error:?function(?Object=)}} options   options object
   */
  openDialog(options) {
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
      // notify the owner, with the url to load or nothing (will load blank template)
      if(this.selected) {
        if(this.selected.fileInfo)
          options.openFileInfo(this.selected.fileInfo);
        else options.openTemplate(this.selected.url);
      }
      else {
        options.openTemplate(null);
      }
    }
    this.modalDialog.open();
  }
}

