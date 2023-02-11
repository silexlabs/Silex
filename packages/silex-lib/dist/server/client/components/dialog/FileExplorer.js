"use strict";
/**
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileExplorer = void 0;
const ModalDialog_1 = require("../../components/ModalDialog");
const CloudStorage_1 = require("../../io/CloudStorage");
const Notification_1 = require("../Notification");
const UiElements_1 = require("../../ui-store/UiElements");
/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
class FileExplorer {
    constructor() {
        /**
         * reference to the filepicker instance
         */
        this.ce = null;
        const element = UiElements_1.getUiElements().fileExplorer;
        // cloud explorer instance
        CloudStorage_1.CloudStorage.getInstance().ready(() => {
            this.ce = CloudStorage_1.CloudStorage.getInstance().ce;
        });
        this.modalDialog = new ModalDialog_1.ModalDialog({ name: 'File explorer', element, onOpen: (args) => { }, onClose: () => { } });
    }
    static get IMAGE_EXTENSIONS() {
        return ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    }
    static get HTML_EXTENSIONS() {
        return ['.html', '.zip'];
    }
    // singleton pattern
    // FIXME: refactor it as a function and use import
    static getInstance() {
        FileExplorer.instance = FileExplorer.instance || new FileExplorer();
        return FileExplorer.instance;
    }
    /**
     * method passed to then in order to add the desired path format everywhere in
     * silex
     */
    addAbsPath(fileInfo) {
        if (fileInfo) {
            const absPath = fileInfo.service ? `/ce/${fileInfo.service}/get/${fileInfo.path}` : fileInfo.absPath;
            return {
                ...fileInfo,
                absPath,
            };
        }
    }
    /**
     * pick file
     * @param opt_extensions optional array of file extensions, e.g.
     *                           ['.jpg'] to show *.jpg and *.JPG
     *                           null to show all the files and folders
     *                           [] to show only folders
     */
    async openFile(opt_extensions) {
        this.open();
        const fileInfo = await this.ce.openFile(opt_extensions);
        if (fileInfo) {
            if (fileInfo.urls && fileInfo.urls.big && fileInfo.urls.small) {
                const absPath = await this.promptAttributionAndGetSize(fileInfo.attribution, fileInfo.urls);
                this.close();
                return {
                    ...fileInfo,
                    absPath,
                };
            }
            this.close();
            return this.addAbsPath(fileInfo);
        }
        this.close();
        return null;
    }
    async promptAttributionAndGetSize(attribution, urls) {
        return new Promise((resolve, reject) => {
            const attributionText = attribution ? `
        <h3>About this image and the author</h3>
        <p>
          ${attribution.message}
        </p><br/>
        <code>
          ${attribution.content}
        </code>
        <button class="copy-btn">Copy</button>
      ` : '';
            const sizeText = `
        <h3>Image size</h3>
        <p>You need to choose an image size to continue</p>
        <ul>
          <li>Open the <a target="_blank" href="${urls.big}">big version</a> in a new tab</li>
          <li>Or the <a target="_blank" href="${urls.small}">small version</a></li>
        </ul>
      `;
            const form = document.createElement('div');
            form.innerHTML = attributionText + sizeText;
            const copyBtn = form.querySelector('.copy-btn');
            copyBtn.onclick = () => this.copy(attribution.content);
            Notification_1.Notification.confirm('Insert image', '', (ok) => {
                if (ok) {
                    resolve(urls.big);
                }
                else {
                    resolve(urls.small);
                }
            }, 'Big size', 'Small size');
            Notification_1.Notification.setContent(form, false);
        });
    }
    copy(text) {
        const copyText = document.createElement('div');
        document.body.appendChild(copyText);
        try {
            copyText.innerHTML = text;
            const range = document.createRange();
            range.selectNode(copyText);
            window.getSelection().addRange(range);
            const success = document.execCommand('copy');
            if (success) {
                Notification_1.Notification.notifySuccess('Attribution copied to clipboard');
            }
            else {
                Notification_1.Notification.notifyError('Attribution has not been copied to clipboard');
                console.error('Could not copy to clipboard', text);
            }
        }
        catch (err) {
            Notification_1.Notification.notifyError('Attribution has not been copied to clipboard');
            console.error('Could not copy to clipboard', err, text);
        }
        document.body.removeChild(copyText);
    }
    /**
     * pick multiple files
     * @param opt_extensions optional array of file extensions, e.g.
     *                           ['.jpg'] to show *.jpg and *.JPG
     *                           null to show all the files and folders
     *                           [] to show only folders
     */
    async openFiles(opt_extensions) {
        this.open();
        const fileInfo = await this.ce.openFiles(opt_extensions);
        const fileInfo_2 = this.addAbsPath(fileInfo);
        this.close();
        return fileInfo_2;
    }
    /**
     * pick a folder
     */
    async openFolder() {
        this.open();
        const fileInfo = await this.ce.openFolder();
        const fileInfo_2 = this.addAbsPath(fileInfo);
        this.close();
        return fileInfo_2;
    }
    /**
     * choose a name for the file
     * @param opt_extensions optional array of file extensions, e.g.
     *                           ['.jpg'] to show *.jpg and *.JPG
     *                           null to show all the files and folders
     *                           [] to show only folders
     */
    async saveAs(defaultName, opt_extensions) {
        this.open();
        const fileInfo = await this.ce.saveAs(defaultName, opt_extensions);
        const fileInfo_2 = this.addAbsPath(fileInfo);
        this.close();
        return fileInfo_2;
    }
    /**
     * Open the editor
     */
    open() {
        this.modalDialog.open();
    }
    /**
     * Close the editor
     */
    close() {
        this.modalDialog.close();
    }
}
exports.FileExplorer = FileExplorer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZUV4cGxvcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9jb21wb25lbnRzL2RpYWxvZy9GaWxlRXhwbG9yZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsOERBQTBEO0FBRTFELHdEQUE4RDtBQUM5RCxrREFBOEM7QUFDOUMsMERBQXlEO0FBRXpEOzs7R0FHRztBQUNILE1BQWEsWUFBWTtJQXdCdkI7UUFSQTs7V0FFRztRQUNILE9BQUUsR0FBa0IsSUFBSSxDQUFBO1FBTXRCLE1BQU0sT0FBTyxHQUFHLDBCQUFhLEVBQUUsQ0FBQyxZQUFZLENBQUE7UUFFNUMsMEJBQTBCO1FBQzFCLDJCQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNwQyxJQUFJLENBQUMsRUFBRSxHQUFHLDJCQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFBO1FBQ3pDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsRUFBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQTtJQUMvRyxDQUFDO0lBL0JELE1BQU0sS0FBSyxnQkFBZ0I7UUFDekIsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUNsRCxDQUFDO0lBQ0QsTUFBTSxLQUFLLGVBQWU7UUFDeEIsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLGtEQUFrRDtJQUNsRCxNQUFNLENBQUMsV0FBVztRQUNoQixZQUFZLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQyxRQUFRLElBQUksSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUNuRSxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUE7SUFDOUIsQ0FBQztJQXFCRDs7O09BR0c7SUFDSCxVQUFVLENBQUMsUUFBa0I7UUFDM0IsSUFBSSxRQUFRLEVBQUU7WUFDWixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQyxPQUFPLFFBQVEsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFBO1lBQ3BHLE9BQU87Z0JBQ0wsR0FBRyxRQUFRO2dCQUNYLE9BQU87YUFDUixDQUFBO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUF5QjtRQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDWCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQ3ZELElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUM3RCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDM0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO2dCQUNaLE9BQU87b0JBQ0wsR0FBRyxRQUFRO29CQUNYLE9BQU87aUJBQ1IsQ0FBQTthQUNGO1lBQ0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1NBQ2pDO1FBQ0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ1osT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsS0FBSyxDQUFDLDJCQUEyQixDQUFDLFdBQVcsRUFBRSxJQUFJO1FBQ2pELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQzs7O1lBR2hDLFdBQVcsQ0FBQyxPQUFPOzs7WUFHbkIsV0FBVyxDQUFDLE9BQU87OztPQUd4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7WUFDTixNQUFNLFFBQVEsR0FBRzs7OztrREFJMkIsSUFBSSxDQUFDLEdBQUc7Z0RBQ1YsSUFBSSxDQUFDLEtBQUs7O09BRW5ELENBQUE7WUFDRCxNQUFNLElBQUksR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUN2RCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUE7WUFDM0MsTUFBTSxPQUFPLEdBQXNCLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDbEUsT0FBTyxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN0RCwyQkFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQzlDLElBQUksRUFBRSxFQUFFO29CQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7aUJBQ2xCO3FCQUFNO29CQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7aUJBQ3BCO1lBQ0gsQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUM1QiwyQkFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVk7UUFDZixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUk7WUFDRixRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtZQUN6QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7WUFDcEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUMxQixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUMsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsMkJBQVksQ0FBQyxhQUFhLENBQUMsaUNBQWlDLENBQUMsQ0FBQTthQUM5RDtpQkFBTTtnQkFDTCwyQkFBWSxDQUFDLFdBQVcsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFBO2dCQUN4RSxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxDQUFBO2FBQ25EO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLDJCQUFZLENBQUMsV0FBVyxDQUFDLDhDQUE4QyxDQUFDLENBQUE7WUFDeEUsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDeEQ7UUFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUNyQyxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUF5QjtRQUN2QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDWCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDNUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ1osT0FBTyxVQUFVLENBQUE7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDWCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUE7UUFDM0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM1QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDWixPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFtQixFQUFFLGNBQXlCO1FBRXpELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNYLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDNUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ1osT0FBTyxVQUFVLENBQUE7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSTtRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSztRQUNILElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDMUIsQ0FBQztDQUNGO0FBMUxELG9DQTBMQyJ9