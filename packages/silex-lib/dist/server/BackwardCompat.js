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

const Path = require('path');
const constants = require('./Constants.json');

/**
 * the version of the website is stored in the generator tag as "Silex v-X-Y-Z"
 * we get it from package.json
 * used for backward compat and for the static files URLs taken from //{{host}}/static/{{Y-Z}}
 */
const FRONT_END_VERSION = (require(Path.resolve(__dirname, '../../package.json'))['version:frontend']).split('.').map(s => parseInt(s));
const LATEST_VERSION = (require(Path.resolve(__dirname, '../../package.json'))['version:backwardcompat']).split('.').map(s => parseInt(s));
console.log('Silex starts with backward compat version', LATEST_VERSION, 'and front end version', FRONT_END_VERSION);

/**
 * @fileoverview Handle backward compatibility when a user opens a site for edition
 *
 */
module.exports = class BackwardCompat {
  constructor(rootUrl) {
    this.rootUrl = rootUrl;
  }
  /**
   * handle backward compatibility issues
   * Backwardcompatibility process takes place after opening a file
   * @param {Document} doc
   * @return {Promise} a Promise, resolve can be called with a warning message
   */
  update(doc) {
    // fix an issue when the style tag has no type, then json is "broken"
    var styleTag = doc.querySelector('.' + constants.JSON_STYLE_TAG_CLASS_NAME);
    if(styleTag) styleTag.type = 'text/json'; // old versions of silex have no json at all so do nothing in that case
    // if no generator tag, create one
    var metaNode = doc.querySelector('meta[name="generator"]');
    if (!metaNode) {
      metaNode = doc.createElement('meta');
      metaNode.setAttribute('name', 'generator');
      doc.head.appendChild(metaNode);
    }
    // retrieve the website version from generator tag
    var version = (metaNode.getAttribute('content') || '')
      .replace('Silex v', '')
      .split('.')
      .map(str => parseInt(str, 10) || 0);

    var hasToUpdate = this.hasToUpdate(version, LATEST_VERSION);
    console.log('BC', version, LATEST_VERSION, hasToUpdate);

    // warn the user
    if (this.amIObsolete(version, LATEST_VERSION)) {
      return Promise.resolve('This website has been saved with a newer version of Silex. Continue at your own risks.');
    }
    else if (this.hasToUpdate(version, [2, 2, 7])) {
      return Promise.reject({
        message: 'This website has been saved with an older version of Silex, which is not supported anymore as of March 2018. In order to convert it to a newer version, please go to <a href="https://old.silex.me">old.silex.me</a> to open and then save your website. <a href="https://github.com/silexlabs/Silex/wiki/Website-saved-with-older-version-of-Silex">More about this here</a>',
      });
    }
    else if (hasToUpdate) {
      // convert to the latest version
      return this.to2_2_8(version, doc).then(() => {
        // update the static scripts to match the current server and latest version
        this.updateStatic(doc);
        // store the latest version
        metaNode.setAttribute('content', 'Silex v' + LATEST_VERSION.join('.'));
        // continue
        // needs to reload if silex scripts and stylesheets have been updated
        return 'This website has been updated with the latest version of Silex.<br><br>Before you save it, please check that everything is fine. Saving it with another name could be a good idea too (menu file > save as).';
      })
    }
    else {
      // update the static scripts to match the current server URL
      this.updateStatic(doc);
      return Promise.resolve();
    }
  }


  /**
   * update the static scripts to match the current server and latest version
   */
  updateStatic(doc) {
    // update //{{host}}/2.x/... to latest version
    var elements = doc.querySelectorAll('[data-silex-static]');
    for(let idx=0; idx<elements.length; idx++) {
      const element = elements[idx];
      const propName = element.src ? 'src' : 'href';
      const newUrl = this.getStaticResourceUrl(element[propName]);
      const oldUrl = element.getAttribute(propName);
      if(oldUrl != newUrl) {
        console.info('BC rewrite URL', element, oldUrl, newUrl)
        element.setAttribute(propName, newUrl);
      }
    }
  }


  /**
   * get the complete URL for the static file,
   * * on the current Silex server
   * * with the latest Silex version
   *
   * this will result in a URL on the current server, in the `/static/` folder
   *
   * @example `//localhost:6805/static/2.1/example/example.js` returns `//editor.silex.me/static/2.7/example/unslider.js`
   * @example `/static/2.1/example/example.js` returns `//editor.silex.me/static/2.7/example/example.js`
   *
   * with the current version
   * @param {string} url
   * @return {string}
   */
  getStaticResourceUrl(url) {
    const pathRelativeToStaticMatch = url.match(/static\/[0-9]*\.[0-9]*\/(.*)/);
    if(pathRelativeToStaticMatch == null) {
      console.warn('Error: could not extract the path and file name of static asset', url);
      return url;
    }
    const pathRelativeToStatic = pathRelativeToStaticMatch[1];
    return `${ this.rootUrl }/static/${ FRONT_END_VERSION[0] }.${ FRONT_END_VERSION[1] }/${ pathRelativeToStatic }`;
  }


  /**
   * check if the website has been edited with a newer version of Silex
   * @param {Array.<number>} initialVersion the website version
   * @param {Array.<number>} targetVersion  a given Silex version
   * @return {boolean}
   */
  amIObsolete(initialVersion, targetVersion) {
    return !!initialVersion[2] && initialVersion[0] > targetVersion[0] ||
      initialVersion[1] > targetVersion[1] ||
      initialVersion[2] > targetVersion[2];
  }


  /**
   * check if the website has to be updated for the given version of Silex
   * @param {Array.<number>} initialVersion the website version
   * @param {Array.<number>} targetVersion  a given Silex version
   * @return {boolean}
   */
  hasToUpdate(initialVersion, targetVersion) {
    return initialVersion[0] < targetVersion[0] ||
      initialVersion[1] < targetVersion[1] ||
      initialVersion[2] < targetVersion[2];
  }


  /**
   * @param {Array.<number>} version
   * @param {Document} doc
   * @return {Promise} a Promise
   */
  to2_2_8(version, doc) {
    // TODO when there will be BC again
    return new Promise((resolve, reject) => {
      if (this.hasToUpdate(version, [2, 2, 8])) {
        console.log('updating', version, [2, 2, 8]);
        // cleanup the hamburger menu icon
        const menuButton = doc.querySelector('.menu-button')
        if(menuButton) {
          menuButton.classList.remove('paged-element', 'paged-element-hidden', 'page-page-1', 'prevent-resizable');
          menuButton.classList.add('hide-on-desktop');
        }
        // give the hamburger menu a size (TODO: add to the json model too)
        doc.querySelector('.silex-inline-styles').innerHTML += '.silex-id-hamburger-menu {width: 50px;min-height: 40px;}'
        // pages need to have href set
        Array.from(doc.querySelectorAll('.page-element'))
        .forEach(el => {
          el.setAttribute('href', '#!' + el.getAttribute('id'));
          console.log('set href of hamburger menu page', el.href);
        });
      }
      resolve();
    });
  }
}
