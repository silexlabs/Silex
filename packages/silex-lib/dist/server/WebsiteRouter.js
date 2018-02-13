//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

const Path = require('path');
const uuid = require('uuid');
const express = require('express');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const bodyParser = require('body-parser');
const { URL } = require('url');
const CloudExplorer = require('cloud-explorer');

const BackwardCompat = require('./BackwardCompat.js');

const clientRoot = Path.resolve(__dirname, '..');
const constants = require('./Constants.json');

module.exports = function(port, rootUrl, unifile) {

  const backwardCompat = new BackwardCompat(rootUrl);

  /**
   * list all the templates of the given folder
   */
  function getTemplatesList(req, res, next) {
    switch(req.params.folder) {
      case 'silex-templates':
      case 'silex-blank-templates':
        break;
      default:
        res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist'});
        return;
    }
    var templateFolder = Path.join(__dirname, '../../dist/client/libs/templates/', req.params.folder);
    fs.readdir(templateFolder, function(err, result) {
      if(err) {
        console.error('Error while trying to get the json representation of the folder ' + req.params.folder, err);
        res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - ' + err});
      } else {
        var templateList = result.filter(function(entry) {
          return fs.statSync(Path.join(templateFolder, entry)).isDirectory();
        });

        res.send(templateList);
      }
    });
  }
  /**
   * load a website from the cloud storage of the user
   */
  function readWebsite(req, res, next) {
    const connector = req.params[0];
    const path = req.params[1];
    const url = new URL(`${ rootUrl }/${ connector }/get/${ Path.dirname(path) }/`);
    unifile.readFile(req.session.unifile, connector, path)
      .then(buffer => {
        return sendWebsiteData(res, buffer, url);
      })
      .catch((err) => {
        console.error('unifile error catched:', err);
        CloudExplorer.handleError(res, err);
      });
  }
  /**
   * load a website from a template folder on local disk
   */
  function readTemplate(req, res, next) {
    const path = req.params[0];
    const localPath = Path.resolve(__dirname, '../client' + path);
    const url = new URL(`${ rootUrl }${ Path.dirname(path) }/`);
    if(localPath.startsWith(clientRoot)) {
      fs.readFile(localPath, (err, buffer) => {
        if(err) {
          CloudExplorer.handleError(res, err);
        }
        else {
          sendWebsiteData(res, buffer, url);
        }
      });
    }
    else {
      CloudExplorer.handleError(res, {message: 'Not authorized.', code: 'EACCES'});
    }
  }
  function sendWebsiteData(res, buffer, url) {
    const dom = new JSDOM(buffer.toString('utf-8'), { url: url.href, });
    return backwardCompat.update(dom.window.document)
    .then(wanrningMsg => {
      prepareWebsite(dom, url);
      // done, back to a string
      const str = dom.serialize();
      dom.window.close();
      res.send({
        message: wanrningMsg,
        html: str,
      });
    })
  }
  /**
   * save a website to the cloud storage of the user
   */
  function writeWebsite(req, res, next) {
    const connector = req.params[0];
    const path = req.params[1];
    const url = new URL(`${ rootUrl }/${ connector }/get/${ Path.dirname(path) }/`);

    const dom = new JSDOM(req.body, { url: url.href, });
    unprepareWebsite(dom, url);
    const str = dom.serialize();
    dom.window.close();

    unifile.writeFile(req.session.unifile, connector, req.params[1], str)
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        console.error('unifile error catched:', err);
        CloudExplorer.handleError(res, err);
      });
  }
  function transformPaths(dom, fn) {
    // images, videos, stylesheets, iframes...
    ['src', 'href'].forEach(attr => {
      const elements = dom.window.document.querySelectorAll(`[${attr}]`);
      for(let idx=0; idx<elements.length; idx++) {
        const el = elements[idx];
        if(el.tagName.toLowerCase() === 'a' || el.getAttribute('data-silex-href')) {
          // do nothing with <a> links
          continue;
        }
        if(el.hasAttribute('data-silex-static')) {
          continue;
        }
        const val = el.getAttribute(attr);
        const newVal = fn(val, el);
        if(newVal) el.setAttribute(attr, newVal);
      }
    });
    // CSS rules
    // FIXME: it would be safer (?) to use CSSStyleSheet::ownerNode instead of browsing the DOM
    // see the bug in jsdom: https://github.com/jsdom/jsdom/issues/992
    const tags = dom.window.document.head.querySelectorAll('style');
    const stylesheets = dom.window.document.styleSheets;
    for(let stylesheetIdx=0; stylesheetIdx<stylesheets.length; stylesheetIdx++) {
      const stylesheet = stylesheets[stylesheetIdx];
      console.log(stylesheet.ownerNode)
      const tag = tags[stylesheetIdx];
      let cssText = '';
      for(let ruleIdx=0; ruleIdx<stylesheet.cssRules.length; ruleIdx++) {
        const rule = stylesheet.cssRules[ruleIdx];
        if(rule.style) for(let valIdx=0; valIdx<rule.style.length; valIdx++) {
          const valName = rule.style[valIdx];
          const value = rule.style[valName];
          if(value.indexOf('url(') === 0) {
            const valueArr = value.split('\'');
            const url = valueArr[1];
            const newUrl = fn(url, stylesheet);
            if(newUrl) {
              changed = true;
              valueArr[1] = newUrl;
            }
            rule.style[valName] = valueArr.join('\'');
          }
        }
        cssText += rule.cssText;
      }
      tag.innerHTML = cssText;
    }
  }
  /**
   * prepare website for edit mode
   * * make all URLs absolute (so that images are still found when I "save as" my website to another folder)
   * * adds markup and css classes needed by Silex front end
   */
  function prepareWebsite(dom, baseUrl) {
    // URLs
    transformPaths(dom, (path, el) => {
      const url = new URL(path, baseUrl);
      return url.href;
    });
    // markup
    dom.window.document.body.classList.remove('silex-runtime');
    // add /css/editable.css
    var tag = dom.window.document.createElement('link');
    tag.rel = 'stylesheet';
    tag.href = rootUrl + '/css/editable.css';
    tag.classList.add(constants.SILEX_TEMP_TAGS_CSS_CLASS);
    dom.window.document.head.appendChild(tag);
    // add UI markup
    const editableElements = dom.window.document.getElementsByClassName(constants.EDITABLE_CLASS_NAME);
    for(let idx=0; idx<editableElements.length; idx++) {
      const el = editableElements[idx];
      constants.RESIZE_HANDLE_CSS_CLASSES.forEach(className => {
        const handle = dom.window.document.createElement('div');
        handle.classList.add(className);
        handle.classList.add(constants.RISZE_HANDLE_CSS_CLASS);
        el.appendChild(handle);
      });
    }
  }
  /**
   * prepare website for being saved
   * * make all URLs relative to current path
   * * remove useless markup and css classes
   */
  function unprepareWebsite(dom, baseUrl) {
    // URLs
    transformPaths(dom, (path, el) => {
      const url = new URL(path, baseUrl);
      if(url.href.startsWith(rootUrl)) {
        // make it relative
        return Path.relative(baseUrl.pathname, url.pathname);
      }
      return path;
    });
    // markup
    dom.window.document.body.classList.add('silex-runtime');
    // remove temp tags 
    const toBeRemoved = dom.window.document.querySelectorAll(`.${constants.SILEX_TEMP_TAGS_CSS_CLASS}, #${constants.SILEX_CURRENT_PAGE_ID}, .${ constants.RISZE_HANDLE_CSS_CLASS }`);
    for(let idx=0; idx<toBeRemoved.length; idx++) {
      const el = toBeRemoved[idx];
      el.remove();
    }
    // remove useless css classes
    constants.SILEX_TEMP_CLASS_NAMES.forEach(className => {
      const elements = dom.window.document.getElementsByClassName(className);
      for(let idx=0; idx<elements.length; idx++) {
        const el = elements[idx];
        el.classList.remove(className);
      }
    });
    // cleanup inline styles
    dom.window.document.body.minWidth = '';
    dom.window.document.body.minHeight = '';
  }

  const router = express.Router();
  
  // website specials
  router.get(/\/website\/(.*)\/get\/(.*)/, readWebsite);
  router.get(/\/website(.*)/, readTemplate);
  router.put(/\/website\/(.*)\/put\/(.*)/, bodyParser.text({}), writeWebsite);

  // **
  // list templates
  router.use('/get/:folder', getTemplatesList);

  return router;
};
