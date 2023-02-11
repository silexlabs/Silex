"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkType = exports.openLinkDialog = exports.LINK_ATTRIBUTES = void 0;
/**
 * @fileoverview The dialog to edit links
 *
 */
const constants_1 = require("../../../constants");
const types_1 = require("../../element-store/types");
const Notification_1 = require("../Notification");
const index_1 = require("../../page-store/index");
exports.LINK_ATTRIBUTES = ['href', 'rel', 'target', 'type', 'title', 'download'];
const DEFAULT_LINK_DATA = {
    href: '',
    target: '',
    title: '',
    rel: '',
    type: '',
    download: '',
};
///////////////////
// API for the outside world
let instance;
function initLinkDialog() {
    instance = instance || new LinkDialog();
    return instance;
}
function openLinkDialog(options) {
    initLinkDialog();
    return instance.open(options.data, options.cbk);
}
exports.openLinkDialog = openLinkDialog;
/**
 * external link data
 * TODO: handle hash, for now this is treated as URL, not page link: `#!page-home#test` - see also TextFormatBar.ts comment
 */
function getLinkType(url) {
    const isPage = url.startsWith(constants_1.Constants.PAGE_NAME_PREFIX)
        && url.split('#').length <= 2; // this excludes links like `#!page-home#test`
    return isPage ? types_1.LinkType.PAGE : types_1.LinkType.URL;
}
exports.getLinkType = getLinkType;
/**
 * TODO: make this only methods and write tests
 */
class LinkDialog {
    constructor() { }
    open(linkDataArg, cbk) {
        // default values for new link
        const linkData = Object.assign({}, DEFAULT_LINK_DATA, linkDataArg || {});
        Notification_1.Notification.prompt(`
      Link editor <a class="link-editor-help-button fa fa-question-circle" target="_blank" href="https://github.com/silexlabs/Silex/wiki/Editor-UI#link-editor"> Help</a>
    `, 'unused', 'unused', 'unused', (accept, unused) => {
            if (accept) {
                // get new values
                const newData = exports.LINK_ATTRIBUTES.reduce((acc, attr) => {
                    const el = dialogBody.querySelector('.' + attr);
                    if (!el) {
                        console.error('could not get data from for attribute', attr);
                    }
                    else {
                        acc[attr] = el.value;
                    }
                    return acc;
                }, {});
                // internal link info
                const newIsExternal = dialogBody.querySelector('#link-editor-external').checked;
                const page = dialogBody.querySelector('.page').value;
                const options = {
                    href: newIsExternal ? newData.href : page,
                    linkType: newIsExternal ? types_1.LinkType.URL : types_1.LinkType.PAGE,
                };
                if (newData.target !== '') {
                    options.target = newData.target;
                }
                if (newData.rel !== '') {
                    options.rel = newData.rel;
                }
                if (newData.title !== '') {
                    options.title = newData.title;
                }
                if (newData.type !== '') {
                    options.type = newData.type;
                }
                if (newData.download !== '') {
                    options.download = newData.download;
                }
                cbk(options);
            }
            else {
                cbk(linkDataArg);
            }
        });
        // add a remove link button
        const fragmentButtons = document.createElement('fragment');
        fragmentButtons.innerHTML = `
      <button class="alertify-button alertify-button-cancel alertify-button-remove">remove link</button>
    `;
        fragmentButtons.querySelector('.alertify-button-remove').onclick = (e) => {
            Notification_1.Notification.close();
            cbk(null);
        };
        Notification_1.Notification.addButton(fragmentButtons);
        // add info about the link
        const dialogBody = document.createElement('div');
        dialogBody.insertAdjacentHTML('afterbegin', this.getDialogHtml({
            linkType: getLinkType(linkData.href),
            linkData,
        }));
        Array.from(dialogBody.querySelectorAll('.link-editor-tab-label'))
            .forEach((el) => {
            el.onclick = (_) => {
                Array
                    .from(dialogBody.querySelectorAll('.link-editor-tab-label.checked'))
                    .forEach((selected) => selected.classList.remove('checked'));
                el.classList.add('checked');
            };
        });
        Notification_1.Notification.setContent(dialogBody);
    }
    getDialogHtml({ linkType, linkData }) {
        return `
      <section class="link-editor">
        <div class="labels">
          <label for="link-editor-external" title="External Link" class="link-editor-tab-label first-button fa fa-lg fa-link${linkType === types_1.LinkType.URL ? ' checked ' : ''}"></label>
          <label for="link-editor-internal" title="Link to a page" class="link-editor-tab-label last-button fa fa-lg fa-file${linkType === types_1.LinkType.PAGE ? ' checked ' : ''}"></label>
          <div class="space"></div>
        </div>
        <div class="link-editor-body">
        <input autocomplete="nope" id="link-editor-external" class="link-editor-radio" type="radio" name="link-editor-tab-group"${linkType === types_1.LinkType.URL ? ' checked ' : ''}/>
        <div class="link-editor-tab link-editor-tab-external">
          <div class="link-editor-tab-container">
            <label for="link-editor-href">External link</label>
            <div class="flex">
              <input autocomplete="nope" spellcheck="false" id="link-editor-href" class="big alertify-text href tabbed" type="url" value="${linkType === types_1.LinkType.URL ? linkData.href : ''}">
              <select autocomplete="nope" id="link-editor-target" class="alertify-text target">
                <option${linkData.target === '' ? ' selected ' : ''} value=""></option>
                <option${linkData.target === '_self' ? ' selected ' : ''} value="_self">_self</option>
                <option${linkData.target === '_blank' ? ' selected ' : ''} value="_blank">_blank</option>
                <option${linkData.target === '_parent' ? ' selected ' : ''} value="_parent">_parent</option>
                <option${linkData.target === '_top' ? ' selected ' : ''} value="_top">_top</option>
              </select>
            </div>
          </div>
        </div>
        <input autocomplete="nope" id="link-editor-internal" class="link-editor-radio" type="radio" name="link-editor-tab-group"${linkType === types_1.LinkType.PAGE ? ' checked ' : ''}/>
        <div class="link-editor-tab link-editor-tab-internal">
          <div class="link-editor-tab-container">
            <label for="link-editor-page">Page</label>
            <select autocomplete="nope" class="tabbed alertify-text page big" id="link-editor-page">
              <option value=""${linkType === types_1.LinkType.URL ? ' selected ' : ''}></option>
              ${index_1.getPages().map((page) => `<option value="${constants_1.Constants.PAGE_NAME_PREFIX + page.id}"${linkType === types_1.LinkType.PAGE && constants_1.Constants.PAGE_NAME_PREFIX + page.id === linkData.href ? ' selected ' : ''} >
                ${page.displayName}
              </option>`)}
            </select>
          </div>
        </div>
        <div class="link-editor-tab-container">
          <div class="link-editor-2col">
            <label for="link-editor-title">Title</label>
            <input autocomplete="nope" id="link-editor-title" class="alertify-text title big" type="text" value="${linkData.title}">
          </div>
        </div>
        <hr>
        <div class="link-editor-advanced-container">
          <input autocomplete="nope" id="link-editor-show-advanced" type="checkbox">
          <label for="link-editor-show-advanced">Advanced params</label>
          <div class="link-editor-advanced">
            <label for="link-editor-rel">The "rel" attribute. Describes the relationship between the current document and the destination.</label>
            <input autocomplete="nope" id="link-editor-rel" class="alertify-text rel" type="text" value="${linkData.rel}">
            <label for="link-editor-type">The "type" attribute. Specifies the MIME type of the linked resource.</label>
            <input autocomplete="nope" id="link-editor-type" class="alertify-text type" type="text" value="${linkData.type}">
            <label for="link-editor-download">The "download" attribute. Indicates that the link is to be used for downloading a resource (such as a file). The author can specify a default file name by providing a value.</label>
            <input autocomplete="nope" id="link-editor-download" class="alertify-text download" type="text" value="${linkData.download}">
          </div>
        </div>
        </div>
      </section>
    `;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua0RpYWxvZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvY29tcG9uZW50cy9kaWFsb2cvTGlua0RpYWxvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7O0dBR0c7QUFDSCxrREFBOEM7QUFDOUMscURBQTBEO0FBQzFELGtEQUE0QztBQUM1QyxrREFBaUQ7QUFFcEMsUUFBQSxlQUFlLEdBQ3hCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQTtBQUMxRCxNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLElBQUksRUFBRSxFQUFFO0lBQ1IsTUFBTSxFQUFFLEVBQUU7SUFDVixLQUFLLEVBQUUsRUFBRTtJQUNULEdBQUcsRUFBRSxFQUFFO0lBQ1AsSUFBSSxFQUFFLEVBQUU7SUFDUixRQUFRLEVBQUUsRUFBRTtDQUNiLENBQUE7QUFFRCxtQkFBbUI7QUFDbkIsNEJBQTRCO0FBQzVCLElBQUksUUFBb0IsQ0FBQTtBQUN4QixTQUFTLGNBQWM7SUFDckIsUUFBUSxHQUFHLFFBQVEsSUFBSSxJQUFJLFVBQVUsRUFBRSxDQUFBO0lBQ3ZDLE9BQU8sUUFBUSxDQUFBO0FBQ2pCLENBQUM7QUFDRCxTQUFnQixjQUFjLENBQUMsT0FBNkM7SUFDMUUsY0FBYyxFQUFFLENBQUE7SUFDaEIsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2pELENBQUM7QUFIRCx3Q0FHQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxHQUFXO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztXQUNwRCxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFB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