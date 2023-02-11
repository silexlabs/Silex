"use strict";
/**
 * @fileoverview Helper class for common tasks
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
class Notification {
    constructor() {
        throw new Error('this is a static class and it canot be instanciated');
    }
    static get isActive() {
        return !!Notification.currentDialog && !document.querySelector('.alerts').classList.contains('closed');
    }
    /**
     * flag to indicate wether a modal dialog is opened
     */
    static get currentDialog() {
        return document.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}`);
    }
    /**
     * close (cancel) the current notification
     */
    static close(isOk = false, e = null) {
        if (Notification.currentDialog) {
            // hide dialogs
            const container = document.querySelector('.alerts');
            container.classList.add('closed');
            // cleanup
            const cbk = isOk ? Notification.cbkOk : Notification.cbkCancel;
            Notification.currentDialog.remove();
            Notification.cbkCancel = null;
            Notification.cbkOk = null;
            // all done, we can open another one or do something
            cbk();
            // prevent propagation of the event
            if (e)
                e.preventDefault();
            if (e)
                e.stopPropagation();
            return false;
        }
    }
    /**
     * display a message
     */
    static alert(title, content, ok, labelOk = 'ok') {
        Notification.close();
        Notification.create(Notification.getMarkup({
            labelOk,
            title,
            content,
        }));
        Notification.cbkCancel = Notification.cbkOk = () => ok();
        Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`).onclick = (e) => Notification.close(false, e);
    }
    /**
     * ask for a text
     */
    static prompt(title, content, defaultValue, placeholder, cbk, labelOk = 'ok', labelCancel = 'cancel') {
        Notification.close();
        Notification.create(Notification.getMarkup({
            labelOk,
            labelCancel,
            defaultValue,
            title,
            content,
            placeholder,
        }));
        const input = Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_value`);
        Notification.cbkOk = () => {
            cbk(true, input.value);
        };
        Notification.cbkCancel = () => {
            cbk(false, null);
        };
        Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`).onclick = (e) => Notification.close(true, e);
        Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_cancel`).onclick = (e) => Notification.close(false, e);
    }
    /**
     * ask for confirmation
     */
    static confirm(title, content, cbk, labelOk = 'ok', labelCancel = 'cancel') {
        Notification.close();
        Notification.create(Notification.getMarkup({
            labelOk,
            labelCancel,
            title,
            content,
        }));
        Notification.cbkOk = () => cbk(true);
        Notification.cbkCancel = () => cbk(false);
        Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_ok`).onclick = (e) => Notification.close(true, e);
        Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_cancel`).onclick = (e) => Notification.close(false, e);
    }
    /**
     * notify the user with success formatting
     * this is non-modal
     * @param opt_close callback for close button, defaults to "no close button"
     * @return the created element
     */
    static lightDialog(content, opt_close) {
        const container = document.querySelector('.light-dialog');
        const el = document.createElement('p');
        el.classList.add('light-dialog__content');
        el.innerHTML = `
      ${opt_close ? `<div class="light-dialog__close">X</div>` : ''}
      ${content}
    `;
        container.appendChild(el);
        setTimeout(() => el.classList.add('light-dialog__content--open'), 100);
        if (opt_close) {
            const closeBtn = el.querySelector('.light-dialog__close');
            closeBtn.onclick = (e) => {
                opt_close();
                el.remove();
            };
        }
        return el;
    }
    /**
     * notify the user with success formatting
     * this is non-modal
     */
    static notifySuccess(message) {
        const container = document.querySelector('.alerts-notify');
        const el = document.createElement('p');
        el.innerHTML = message;
        container.appendChild(el);
        const id = setTimeout(() => {
            el.remove();
        }, Notification.NOTIFICATION_DURATION_MS);
        el.onclick = (e) => {
            clearTimeout(id);
            el.remove();
        };
    }
    /**
     * notify the user with success formatting
     * this is non-modal
     */
    static notifyError(message) {
        console.error(message);
        Notification.notifySuccess(message);
    }
    /**
     * change the text of the current notification
     */
    static setContent(el, keepExisiting = false) {
        if (Notification.currentDialog) {
            const container = Notification.currentDialog.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}_content`);
            if (!keepExisiting) {
                container.innerHTML = '';
            }
            container.appendChild(el);
            Notification.updateFocus();
        }
    }
    /**
     * change the text of the current notification
     */
    static setText(text) {
        if (Notification.currentDialog) {
            const el = document.createElement('div');
            el.insertAdjacentHTML('afterbegin', `<p>${text}</p>`);
            Notification.setContent(el);
        }
    }
    /**
     * add a button to the button bar
     */
    static addButton(el) {
        if (Notification.currentDialog) {
            const buttonBar = Notification.currentDialog.querySelector(`.${Notification.NOTIFICATION_CSS_CLASS}_buttons`);
            buttonBar.appendChild(el);
            Notification.updateFocus();
        }
    }
    /**
     * add an HTML panel with info of type "while you wait, here is an info"
     */
    static setInfoPanel(element) {
        if (Notification.currentDialog) {
            let infoPanel = Notification.currentDialog.querySelector(`#${Notification.NOTIFICATION_CSS_CLASS}_info`);
            if (!infoPanel) {
                infoPanel = document.createElement('div');
                infoPanel.insertAdjacentHTML('afterbegin', `<p class="${Notification.NOTIFICATION_CSS_CLASS}_info"></p>`);
                Notification.setContent(infoPanel, true);
            }
            // limit height so that small screens still see the close button
            infoPanel.style.maxHeight = Math.round(window.innerHeight * 2 / 3) + 'px';
            Notification.currentDialog.insertBefore(infoPanel, Notification.currentDialog.childNodes[Notification.currentDialog.childNodes.length - 1]);
            infoPanel.innerHTML = '';
            infoPanel.appendChild(element);
        }
    }
    static getMarkup(options) {
        return `
      <section class="${Notification.NOTIFICATION_CSS_CLASS}">
        <h2>${options.title}</h2>
        <p class="${Notification.NOTIFICATION_CSS_CLASS}_content">
          ${options.content}
          ${typeof options.defaultValue !== 'undefined' ? `
              <input
                autofocus
                id="${Notification.NOTIFICATION_CSS_CLASS}_value"
                ${options.placeholder ? `placeholder="${options.placeholder}"` : ''}
                class="block-dialog" type="text" value="${options.defaultValue}"
              >`
            : ''}
        </p>
        <div class="${Notification.NOTIFICATION_CSS_CLASS}_buttons">
          ${options.labelCancel ? `<input id="${Notification.NOTIFICATION_CSS_CLASS}_cancel" type="button" value="${options.labelCancel}">` : ''}
          ${options.labelOk ? `<input id="${Notification.NOTIFICATION_CSS_CLASS}_ok" type="button" value="${options.labelOk}">` : ''}
        </div>
      </section>
    `;
    }
    static create(markup) {
        const container = document.querySelector('.alerts');
        container.insertAdjacentHTML('afterbegin', markup);
        container.classList.remove('closed');
        Notification.updateFocus();
    }
    static updateFocus() {
        const input = Notification.currentDialog.querySelector('[autofocus]');
        if (input) {
            input.focus();
        }
    }
}
exports.Notification = Notification;
Notification.NOTIFICATION_DURATION_MS = 30000;
Notification.NOTIFICATION_CSS_CLASS = 'notification-dialog';
// else {
// Notifications are not supported or denied
// }
// Desktop notifications disabled because it disturbs more than it serves
// FIXME: remove all calls to nativeNotification since it is not useful anymore
// Notification.activateNative();
// :facepalm:
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9jb21wb25lbnRzL05vdGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFZSCxNQUFhLFlBQVk7SUFtUHZCO1FBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFBO0lBQ3hFLENBQUM7SUFuUEQsTUFBTSxLQUFLLFFBQVE7UUFDakIsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUN4RyxDQUFDO0lBRUQ7O09BRUc7SUFDSyxNQUFNLEtBQUssYUFBYTtRQUM5QixPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxZQUFZLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFBO0lBQzFFLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssRUFBRSxJQUFXLElBQUk7UUFDeEMsSUFBSSxZQUFZLENBQUMsYUFBYSxFQUFFO1lBQzlCLGVBQWU7WUFDZixNQUFNLFNBQVMsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUNoRSxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUVqQyxVQUFVO1lBQ1YsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFBO1lBQzlELFlBQVksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUE7WUFDbkMsWUFBWSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7WUFDN0IsWUFBWSxDQUFD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