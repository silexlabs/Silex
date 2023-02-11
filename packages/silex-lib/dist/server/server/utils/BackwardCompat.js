"use strict";
/**
 * @fileoverview Handle backward compatibility when a user opens a site for edition
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const fs = require("fs");
const constants_1 = require("../../constants");
const types_1 = require("../../client/element-store/types");
const BackwardCompatV2_5_60_1 = require("./BackwardCompatV2.5.60");
const dom_1 = require("../../client/element-store/dom");
const dom_2 = require("../../client/utils/dom");
const dom_3 = require("../../client/store/dom");
/**
 * util function for the "fixes", @see fixes
 */
function updateLinks(items) {
    return items
        .map((item) => {
        if (!!item.link && !item.link.linkType) {
            // add new props
            const link = {
                ...item.link,
                linkType: item.link.type,
                href: item.link.value,
            };
            // remove old props
            delete link.type;
            delete link.value;
            // return the updated element
            return {
                ...item,
                link,
            };
        }
        else {
            return item;
        }
    });
}
/**
 * class name for containers which are created with sections
 */
const SECTION_CONTAINER = 'silex-container-content';
class BackwardCompat {
    constructor(rootUrl, rootPath = __dirname + '/../../../..') {
        this.rootUrl = rootUrl;
        this.data = null;
        /**
         * the version of the website is stored in the generator tag as "Silex v-X-Y-Z"
         * we get it from package.json
         * used for backward compat and for the static files URLs taken from //{{host}}/static/{{Y-Z}}
         */
        const packageJson = JSON.parse(fs.readFileSync(Path.resolve(rootPath, 'package.json')).toString());
        this.frontEndVersion = packageJson['version:frontend'].split('.').map((s) => parseInt(s));
        this.silexVersion = packageJson['version:backwardcompat'].split('.').map((s) => parseInt(s));
        // const components = require('../../../dist/client/libs/prodotype/components/components.json')
        console.log(`\nStarting. Version is ${this.silexVersion} for the websites and ${this.frontEndVersion} for Silex\n`);
    }
    // remove all tags
    // export for tests
    removeIfExist(doc, selector) {
        Array.from(doc.querySelectorAll(selector))
            .forEach((tag) => tag.remove());
    }
    // remove all useless css class
    // export for tests
    removeUselessCSSClass(doc, className) {
        Array.from(doc.querySelectorAll('.' + className))
            .forEach((el) => el.classList.remove(className));
    }
    getVersion(doc) {
        // if no generator tag, create one
        let metaNode = doc.querySelector('meta[name="generator"]');
        if (!metaNode) {
            metaNode = doc.createElement('meta');
            metaNode.setAttribute('name', 'generator');
            doc.head.appendChild(metaNode);
        }
        // retrieve the website version from generator tag
        return (metaNode.getAttribute('content') || '')
            .replace('Silex v', '')
            .split('.')
            .map((str) => parseInt(str, 10) || 0);
    }
    hasDataFile(doc) {
        return !this.hasToUpdate(this.getVersion(doc), [2, 2, 11]);
    }
    /**
     * handle backward compatibility issues
     * Backwardcompatibility process takes place after opening a file
     * @param {Document} doc
     * @return {Promise} a Promise, resolve can be called with a warning message
     */
    async update(doc, data) {
        // // fix an issue when the style tag has no type, then json is "broken"
        // const styleTag = doc.querySelector('.' + Constants.JSON_STYLE_TAG_CLASS_NAME);
        // if (styleTag) { styleTag.type = 'text/json'; } // old versions of silex have no json at all so do nothing in that case
        // TODO: move this to the data model (e.g. data.site.silexVersion)
        // we need this.data as to2_2_11 will extract it and set it from the dom
        this.data = data;
        const version = this.getVersion(doc);
        const hasToUpdate = this.hasToUpdate(version, this.silexVersion);
        // warn the user
        if (this.amIObsolete(version, this.silexVersion)) {
            return ['This website has been saved with a newer version of Silex. Continue at your own risks.', this.data];
        }
        else if (this.hasToUpdate(version, [2, 2, 7])) {
            return Promise.reject({
                message: 'This website has been saved with an older version of Silex, which is not supported anymore as of March 2018. In order to convert it to a newer version, please go to <a href="https://old.silex.me">old.silex.me</a> to open and then save your website. <a href="https://github.com/silexlabs/Silex/wiki/Website-saved-with-older-version-of-Silex">More about this here</a>',
            });
        }
        else if (hasToUpdate) {
            // convert to the latest version
            const allActions = {
                '2.2.8': await this.to2_2_8(version, doc),
                '2.2.9': await this.to2_2_9(version, doc),
                '2.2.10': await this.to2_2_10(version, doc),
                '2.2.11': await this.to2_2_11(version, doc),
                '2.2.12': await this.to2_2_12(version, doc),
                '2.2.13': await this.to2_2_13(version, doc),
                '2.2.14': await this.to2_2_14(version, doc),
            };
            // update the static scripts to match the current server and latest version
            this.updateStatic(doc);
            // store the latest version
            const metaNode = doc.querySelector('meta[name="generator"]');
            metaNode.setAttribute('content', 'Silex v' + this.silexVersion.join('.'));
            // apply all-time fixes
            this.fixes(doc);
            // build the report for the user
            const report = Object.keys(allActions)
                .filter((_version) => allActions[_version].length > 0)
                .map((_version) => {
                return `<p>Update to version ${_version}:
            <ul>${allActions[_version].map((_action) => `<li class="no-list">${_action}</li>`).join('')}</ul>
        </p>`;
            }).join('');
            // save data to dom for front-end.js and other scripts
            // in case data has been changed
            // FIXME: should not have this.data mutated but returned by update scripts
            dom_3.writeDataToDom(doc, this.data);
            // needs to reload if silex scripts and stylesheets have been updated
            return [`
        <p>This website has been updated to Silex latest version.</p>
        <p>Before you save it, please check that everything is fine. Saving it with another name could be a good idea too (menu file > save as).</p>
        <details>
          <summary>Details</summary>
          <small>
            ${report}
          </small>
        </details>
      `,
                this.data,
            ];
        }
        else {
            // update the static scripts to match the current server URL
            this.updateStatic(doc);
            // apply all-time fixes
            this.fixes(doc);
            // resolve immediately
            return ['', this.data];
        }
    }
    /**
     * Check for common errors in editable html files
     */
    fixes(doc) {
        // const pages: HTMLElement[] = Array.from(doc.querySelectorAll(`.${Constants.PAGES_CONTAINER_CLASS_NAME} a[${Constants.TYPE_ATTR}="page"]`));
        // if (pages.length > 0) {
        //   console.log('Fix error of wrong silex type for', pages.length, 'pages');
        //   pages.forEach((page) => page.setAttribute(Constants.TYPE_ATTR, Constants.TYPE_PAGE));
        // }
        // the following is a fix following the beta version of 07-2020
        // for elements and pages:
        // link.value becomes href
        // link.type becomes linkType
        this.data = {
            site: this.data.site,
            pages: updateLinks(this.data.pages),
            elements: updateLinks(this.data.elements),
        };
        // remove juery-ui at publication, in case the website has been updated before the fix of 2.6.2
        Array.from(doc.querySelectorAll('script[src$="pageable.js"], script[src$="jquery-ui.js"]'))
            .forEach((tag) => tag.setAttribute(constants_1.Constants.ATTR_REMOVE_PUBLISH, ''));
        // this does not work because sections can not be smaller than their content:
        // // resizable sections
        // this.data = {
        //   ...this.data,
        //   elements: this.data.elements
        //     .map((el) => el.type === ElementType.SECTION ? {
        //       ...el,
        //       enableResize: {
        //         bottom: true,
        //         top: true,
        //         left: false,
        //         right: false,
        //       }
        //     } : el),
        // }
        // remove pages which do not exist (was caused by a bug in deletePages, fix 2021-03)
        // also remove css classes which are pages  (was caused by a bug??)
        this.data.elements = this.data.elements.map(el => ({
            ...el,
            pageNames: el.pageNames.filter(name => this.data.pages.some(p => p.id === name)),
            classList: el.classList.filter(name => !this.data.pages.some(p => p.id === name)),
        }));
    }
    /**
     * update the static scripts to match the current server and latest version
     */
    updateStatic(doc) {
        // update //{{host}}/2.x/... to latest version
        Array.from(doc.querySelectorAll('[' + constants_1.Constants.STATIC_ASSET_ATTR + ']'))
            .forEach((element) => {
            const propName = element.hasAttribute('src') ? 'src' : 'href';
            if (element.hasAttribute(propName)) {
                const newUrl = this.getStaticResourceUrl(element[propName]);
                const oldUrl = element.getAttribute(propName);
                if (oldUrl !== newUrl) {
                    element.setAttribute(propName, newUrl);
                }
            }
        });
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
        if (pathRelativeToStaticMatch == null) {
            console.warn('Error: could not extract the path and file name of static asset', url);
            return url;
        }
        const pathRelativeToStatic = pathRelativeToStaticMatch[1];
        return `${this.rootUrl}/static/${this.frontEndVersion[0]}.${this.frontEndVersion[1]}/${pathRelativeToStatic}`;
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
    to2_2_8(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 8])) {
                // cleanup the hamburger menu icon
                const menuButton = doc.querySelector('.menu-button');
                if (menuButton) {
                    menuButton.classList.remove('paged-element', 'paged-element-hidden', 'page-page-1', 'prevent-resizable');
                    menuButton.classList.add('hide-on-desktop');
                }
                // give the hamburger menu a size (TODO: add to the json model too)
                doc.querySelector('.silex-inline-styles').innerHTML += '.silex-id-hamburger-menu {width: 50px;min-height: 40px;}';
                // pages need to have href set
                Array.from(doc.querySelectorAll('.page-element'))
                    .forEach((el) => {
                    el.setAttribute('href', '#!' + el.getAttribute('id'));
                });
                actions.push('I fixed the mobile menu so that it is compatible with the new publication (now multiple pages are generated instead of 1 single page for the whole website).');
            }
            resolve(actions);
        });
    }
    to2_2_9(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 9])) {
                // remove the hamburger menu icon
                const menuButton = doc.querySelector('.menu-button');
                if (menuButton) {
                    menuButton.parentElement.removeChild(menuButton);
                    actions.push('I removed the mobile menu as there is now a component for that. <a target="_blank" href="https://github.com/silexlabs/Silex/wiki/Hamburger-menu">Read more about the Hamburger Menu component here</a>.');
                }
            }
            resolve(actions);
        });
    }
    to2_2_10(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 10])) {
                // the body is a drop zone, not selectable, not draggable, resizeable
                doc.body.classList.add(constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME, constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME, constants_1.Constants.PREVENT_SELECTABLE_CLASS_NAME);
                // each section background and foreground is a drop zone, not selectable, not draggable, resizeable
                const changedSections = Array.from(doc.querySelectorAll(`.${types_1.ElementType.SECTION}`));
                changedSections.forEach((el) => el.classList.add(constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME, constants_1.Constants.PREVENT_RESIZABLE_CLASS_NAME));
                // we add classes to the elements so that we can tell the stage component if an element is draggable, resizeable, selectable...
                const changedSectionsContent = Array.from(doc.querySelectorAll(`.${types_1.ElementType.SECTION}, .${types_1.ElementType.SECTION} .${SECTION_CONTAINER}`));
                changedSectionsContent.forEach((el) => el.classList.add(constants_1.Constants.PREVENT_DRAGGABLE_CLASS_NAME));
                actions.push(`Changed the body and ${changedSections.length} sections with new CSS classes to <a href="https://github.com/silexlabs/stage/" target="_blank">the new stage component.</a>`);
                // types are now with a "-element" suffix
                const changedElements = Array.from(doc.querySelectorAll(`[${constants_1.Constants.TYPE_ATTR}]`));
                changedElements.forEach((el) => el.setAttribute(constants_1.Constants.TYPE_ATTR, el.getAttribute(constants_1.Constants.TYPE_ATTR) + '-element'));
                actions.push(`Updated ${changedElements.length} elements, changed their types to match the new version of Silex.`);
            }
            resolve(actions);
        });
    }
    to2_2_11(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 11])) {
                // the body is supposed to be an element too
                doc.body.classList.add(constants_1.Constants.EDITABLE_CLASS_NAME);
                actions.push('I made the body editable.');
                const oldBodyId = doc.body.getAttribute('data-silex-id');
                if (oldBodyId !== 'body-initial') {
                    actions.push('I udpated the body class name from "' + oldBodyId + '" to "body-initial".');
                    doc.body.setAttribute('data-silex-id', 'body-initial');
                    doc.body.classList.remove(oldBodyId);
                    doc.body.classList.add('body-initial');
                }
                // prepare the dom
                BackwardCompatV2_5_60_1.cleanupBefore(doc);
                // import elements
                const elements = BackwardCompatV2_5_60_1.getElementsFromDomBC(doc);
                BackwardCompatV2_5_60_1.writeStyles(doc, elements);
                // site
                const site = BackwardCompatV2_5_60_1.getSiteFromDom(doc);
                BackwardCompatV2_5_60_1.writeSiteStyles(doc, site);
                // pages
                const pages = BackwardCompatV2_5_60_1.getPagesFromDom(doc);
                if (elements.length && pages.length && site) {
                    this.data = {
                        site,
                        pages,
                        elements,
                    };
                    this.removeIfExist(doc, 'meta[name="website-width"]');
                    this.removeIfExist(doc, 'meta[name="hostingProvider"]');
                    this.removeIfExist(doc, 'meta[name="publicationPath"]');
                    // remove juery-ui at publication
                    Array.from(doc.querySelectorAll('script[src$="pageable.js"], script[src$="jquery-ui.js"]'))
                        .forEach((tag) => tag.setAttribute(constants_1.Constants.ATTR_REMOVE_PUBLISH, ''));
                    ['prevent-draggable', SECTION_CONTAINER].forEach((className) => this.removeUselessCSSClass(doc, className));
                    actions.push('I updated the model to the latest version of Silex.');
                    // pages
                    this.removeIfExist(doc, `.${constants_1.Constants.PAGES_CONTAINER_CLASS_NAME}`);
                    actions.push('I removed the old pages system.');
                }
                else {
                    console.error('Could not import site from v2.2.11', { elements, pages, site });
                }
            }
            resolve(actions);
        });
    }
    to2_2_12(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 12])) {
                // add empty metadata to the website object
                this.data = {
                    ...this.data,
                    site: {
                        ...this.data.site,
                        data: {},
                    }
                };
                actions.push('add empty metadata to the website object');
                // sections are now section tag
                const changedSections = Array.from(doc.querySelectorAll(`.${types_1.ElementType.SECTION}`));
                changedSections.forEach((el) => dom_2.setTagName(el, 'section'));
                this.data = {
                    ...this.data,
                    elements: this.data.elements
                        .map((el) => ({
                        ...el,
                        tagName: dom_1.getDomElement(doc, el) ? dom_1.getDomElement(doc, el).tagName : 'DIV',
                    }))
                };
                actions.push('All sections have a &lt;SECTION&gt; tag name');
            }
            resolve(actions);
        });
    }
    to2_2_13(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 13])) {
                Array.from(doc.querySelectorAll('[data-silex-href]'))
                    .forEach((tag) => {
                    const newEl = dom_2.setTagName(tag, 'A');
                    newEl.href = tag.getAttribute('data-silex-href');
                    newEl.removeAttribute('data-silex-href');
                });
                actions.push('Replaced old Silex links with standard HTML links.');
            }
            resolve(actions);
        });
    }
    to2_2_14(version, doc) {
        return new Promise((resolve, reject) => {
            const actions = [];
            if (this.hasToUpdate(version, [2, 2, 14])) {
                // do not fix this: remove w3c warning "The type attribute is unnecessary for JavaScript resources"
                //  because silex uses script type attr in WebsiteRouter
                //  instead we remove the type at publication time in DomPublisher
                // remove w3c warning "The type attribute for the style element is not needed and should be omitted."
                const styles = Array.from(doc.querySelectorAll('style[type="text/css"]'));
                if (styles.length) {
                    styles.forEach(el => el.removeAttribute('type'));
                    actions.push(`Fixed ${styles.length} w3c warning 'The type attribute for the style element is not needed and should be omitted.'`);
                }
                // This should not be useful (previous BC bug?)
                // Remove empty attributes
                // Sometimes we have style="", title=""...
                let numEmpty = 0;
                const attrs = [
                    'href',
                    'style',
                    'rel',
                    'target',
                    'type',
                    'title',
                ];
                attrs.forEach((attr) => {
                    Array.from(doc.querySelectorAll(`[${attr}]`))
                        .forEach(el => {
                        if (el.hasAttribute(attr) && el.getAttribute(attr) === '') {
                            el.removeAttribute(attr);
                            numEmpty++;
                        }
                    });
                });
                if (numEmpty)
                    actions.push(`Removed ${numEmpty} empty attributes (${attrs.join(', ')})`);
                // This should not be useful (previous BC bug?)
                // Remove the href attribute from non <a> tags
                // Sometimes we have href="null" on non a tags
                const tagsWithWrongHref = Array.from(doc.querySelectorAll('[href]:not(a, link, base)'));
                tagsWithWrongHref.forEach(el => {
                    el.removeAttribute('href');
                });
                if (tagsWithWrongHref.length)
                    actions.push(`Removed ${tagsWithWrongHref.length} href attributes on non links tags`);
            }
            resolve(actions);
        });
    }
}
exports.default = BackwardCompat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFja3dhcmRDb21wYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL3V0aWxzL0JhY2t3YXJkQ29tcGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7O0FBRUgsNkJBQTRCO0FBQzVCLHlCQUF3QjtBQUV4QiwrQ0FBMkM7QUFDM0MsNERBTXlDO0FBR3pDLG1FQU9nQztBQUNoQyx3REFBOEQ7QUFDOUQsZ0RBQW1EO0FBQ25ELGdEQUF1RDtBQUV2RDs7R0FFRztBQUNILFNBQVMsV0FBVyxDQUE0QixLQUFVO0lBQ3hELE9BQU8sS0FBSztTQUNULEdBQUcsQ0FBQyxDQUFDLElBQU8sRUFBRSxFQUFFO1FBQ2YsSUFBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3JDLGdCQUFnQjtZQUNoQixNQUFNLElBQUksR0FBUTtnQkFDaEIsR0FBRyxJQUFJLENBQUMsSUFBSTtnQkFDWixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFnQjtnQkFDcEMsSUFBSSxFQUFHLElBQUksQ0FBQyxJQUFZLENBQUMsS0FBSzthQUMvQixDQUFBO1lBQ0QsbUJBQW1CO1lBQ25CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQTtZQUNoQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUE7WUFDakIsNkJBQTZCO1lBQzdCLE9BQU87Z0JBQ0wsR0FBRyxJQUFJO2dCQUNQLElBQUk7YUFDTCxDQUFBO1NBQ0Y7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFBO1NBQ1o7SUFDSCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0saUJBQWlCLEdBQVcseUJBQXlCLENBQUE7QUFFM0QsTUFBcUIsY0FBYztJQUtqQyxZQUFvQixPQUFlLEVBQUUsUUFBUSxHQUFHLFNBQVMsR0FBRyxjQUFjO1FBQXRELFlBQU8s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