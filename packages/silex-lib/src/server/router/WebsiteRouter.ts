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
const express = require('express');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const CloudExplorer = require('cloud-explorer');

import { Constants } from '../../Constants';
import BackwardCompat from '../utils/BackwardCompat';
import DomTools from '../utils/DomTools';

import * as nodeModules from 'node_modules-path';

export default function({ port, rootUrl }, unifile) {

  const backwardCompat = new BackwardCompat(rootUrl);

  function isInTemplateFolder(path) {
    if(path.startsWith(nodeModules('silex-templates') + '/silex-templates') ||
      path.startsWith(nodeModules('silex-blank-templates') + '/silex-blank-templates')) {
        return true;
    }
    return false;
  }
  /**
   * list all the templates of the given folder
   */
  function getTemplatesList(req, res, next) {
    const templateFolder = Path.join(nodeModules(req.params.folder), req.params.folder);
    if(!isInTemplateFolder(templateFolder)){
        console.error('Error while trying to get the json representation of the folder ', templateFolder);
        res.send({success: false, error: 'Error while trying to get the json representation of the folder ' + req.params.folder + ' - folder does not exist'});
        return;
    }
    fs.readdir(templateFolder, function(err, result) {
      if(err) {
        console.error('Error while trying to get the json representation of the folder ', templateFolder, err);
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
    const url = new URL(`${ rootUrl }/ce/${ connector }/get/${ Path.dirname(path) }/`);
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
    const localPath = Path.resolve(nodeModules('silex-templates'), path);
    const url = new URL(`${ rootUrl }/libs/templates/${ Path.dirname(path) }/`);
    if(isInTemplateFolder(localPath)){
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
  function sendWebsiteData(res, buffer, url): Promise<void> {
    // remove user head tag to avoid bad markup messing with the website
    const { html, userHead } = DomTools.extractUserHeadTag(buffer.toString('utf-8'));
    // from now on use a parsed DOM
    const dom = new JSDOM(html, { url: url.href, });
    return backwardCompat.update(dom.window.document)
    .then(wanrningMsg => {
      prepareWebsite(dom, url);
      // done, back to a string
      const str = dom.serialize();
      dom.window.close();
      res.send({
        message: wanrningMsg,
        html: str,
        userHead,
      });
    })
    .catch(err => {
      console.error('Could not send website data: ', err)
      res.status(400).send({
        message: err.message,
      });
    })
  }
  /**
   * save a website to the cloud storage of the user
   */
  function writeWebsite(req, res, next) {
    const connector = req.params[0];
    const path = req.params[1];
    const { userHead, html } = JSON.parse(req.body);
    const url = new URL(`${ rootUrl }/ce/${ connector }/get/${ Path.dirname(path) }/`);
    const dom = new JSDOM(html, { url: url.href, });
    unprepareWebsite(dom, url);
    const str = dom.serialize();
    const fullHtml = DomTools.insertUserHeadTag(str, userHead);
    dom.window.close();

    unifile.writeFile(req.session.unifile, connector, req.params[1], fullHtml)
      .then(result => {
        res.send(result);
      })
      .catch((err) => {
        console.error('unifile error catched:', err);
        CloudExplorer.handleError(res, err);
      });
  }
  /**
   * prepare website for edit mode
   * make all URLs absolute (so that images are still found when I "save as" my website to another folder)
   */
  function prepareWebsite(dom, baseUrl) {
    // URLs
    DomTools.transformPaths(dom, (path, el) => {
      const url = new URL(path, baseUrl);
      return url.href;
    });
    // update context classes
    dom.window.document.body.classList.remove(Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME);
    dom.window.document.body.classList.add(Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME);
    deactivateScripts(dom);
    // add /css/editable.css
    var tag = dom.window.document.createElement('link');
    tag.rel = 'stylesheet';
    tag.href = rootUrl + '/css/editable.css';
    tag.classList.add(Constants.SILEX_TEMP_TAGS_CSS_CLASS);
    dom.window.document.head.appendChild(tag);
  }
  /**
   * prepare website for being saved
   * * make all URLs relative to current path
   * * remove useless markup and css classes
   */
  function unprepareWebsite(dom, baseUrl) {
    // markup
    dom.window.document.body.classList.add(Constants.WEBSITE_CONTEXT_RUNTIME_CLASS_NAME);
    dom.window.document.body.classList.remove(Constants.WEBSITE_CONTEXT_EDITOR_CLASS_NAME);
    reactivateScripts(dom);
    restoreIFrames(dom);
    cleanupNoscripts(dom);
    // URLs
    DomTools.transformPaths(dom, (path, el) => {
      const url = new URL(path, baseUrl);
      if(url.href.startsWith(rootUrl)) {
        // make it relative
        return Path.relative(baseUrl.pathname, url.pathname);
      }
      return path;
    });
    // remove temp tags
    const toBeRemoved = dom.window.document.querySelectorAll(`.${Constants.SILEX_TEMP_TAGS_CSS_CLASS}, #${Constants.SILEX_CURRENT_PAGE_ID}, .${ Constants.RISZE_HANDLE_CSS_CLASS }`);
    for(let idx=0; idx<toBeRemoved.length; idx++) {
      const el = toBeRemoved[idx];
      el.remove();
    }
    // remove useless css classes
    Constants.SILEX_TEMP_CLASS_NAMES.forEach(className => {
      Array.from(dom.window.document.getElementsByClassName(className))
      .forEach((el: HTMLElement) => el.classList.remove(className));
    });
    // cleanup inline styles
    dom.window.document.body.style.minWidth = ''; // not needed?
    dom.window.document.body.style.minHeight = ''; // not needed?
    dom.window.document.body.style.overflow = ''; // set by stage
  }

  function deactivateScripts(dom) {
    const scripts = dom.window.document.getElementsByTagName('script');
    for(let idx=0; idx<scripts.length; idx++) {
      const el = scripts[idx];
      // do not execute scripts, unless they are silex's static scripts
      // and leave it alone if it has a type different from 'text/javascript'
      if(!el.hasAttribute('data-silex-static') && (!el.hasAttribute('type') || el.getAttribute('type') === 'text/javascript')) {
        el.setAttribute('type', 'text/notjavascript');
      }
    }
  }

  function restoreIFrames(dom) {
    Array.from(dom.window.document.querySelectorAll('[data-silex-iframe-src]'))
    .forEach((el: HTMLElement) => {
      el.setAttribute('src', el.getAttribute('data-silex-iframe-src'));
      el.removeAttribute('data-silex-iframe-src');
    });
  }

  function cleanupNoscripts(dom) {
    Array.from(dom.window.document.querySelectorAll('noscript'))
    .forEach((el: HTMLElement) => {
      el.innerHTML = decodeHTMLEntities(el.innerHTML);
    });
  }
  function decodeHTMLEntities(text) {
    const entities = [['amp', '&'], ['apos', '\''], ['#x27', '\''], ['#x2F', '/'], ['#39', '\''], ['#47', '/'], ['lt', '<'], ['gt', '>'], ['nbsp', ' '], ['quot', '"']];
    entities.forEach(entity => text = text.replace(new RegExp('&'+entity[0]+';', 'g'), entity[1]));
    return text;
  }
  function reactivateScripts(dom) {
    Array.from(dom.window.document.querySelectorAll('script[type="text/notjavascript"]'))
    .forEach((el: HTMLElement) => el.setAttribute('type', 'text/javascript'));
  }

  const router = express.Router();

  // website specials
  router.get(/\/website\/ce\/(.*)\/get\/(.*)/, readWebsite);
  router.get(/\/website\/libs\/templates\/(.*)/, readTemplate);
  router.put(/\/website\/ce\/(.*)\/put\/(.*)/, writeWebsite);

  // **
  // list templates
  router.use('/get/:folder', getTemplatesList);

  return router;
};
