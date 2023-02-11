"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudStorage = void 0;
/**
 * @fileoverview Service used to interact with the unifile server.
 *     This class is a singleton.
 *
 */
const UiElements_1 = require("../ui-store/UiElements");
const Notification_1 = require("../components/Notification");
/**
 * the Silex CloudStorage service
 * load and save data to and from the cloud storage services
 * this is a singleton
 */
class CloudStorage {
    constructor() {
        /**
         * reference to the filepicker instance
         */
        this.ce = null;
    }
    static getInstance() {
        CloudStorage.instance = CloudStorage.instance || new CloudStorage();
        return CloudStorage.instance;
    }
    ready(cbk) {
        const uiElements = UiElements_1.getUiElements();
        // cloud explorer instance
        // tslint:disable:no-string-literal
        if (uiElements.fileExplorer.contentWindow['ce']) {
            this.ce = uiElements.fileExplorer.contentWindow['ce'];
            cbk();
        }
        else {
            if (this.cbks == null) {
                this.cbks = [];
                uiElements.fileExplorer.addEventListener('load', (e) => {
                    this.ce = uiElements.fileExplorer.contentWindow['ce'];
                    this.cbks.forEach((_) => _());
                    this.cbks = [];
                });
            }
            this.cbks.push(cbk);
        }
    }
    /**
     * save a file
     */
    write(fileInfo, html, data, cbk, opt_errCbk) {
        // // save the data
        // this.ce.write(new Blob([html], {type: 'text/plain'}), fileInfo)
        // .then(() => {
        //   cbk();
        // })
        // .catch(e => {
        //   console.error('Error: could not write file', fileInfo, e);
        //   if (opt_errCbk) opt_errCbk(/** @type {any} */ (e));
        // });
        const oReq = new XMLHttpRequest();
        oReq.onload = () => {
            if (oReq.status === 200) {
                cbk();
            }
            else {
                const err = new Event('error');
                const msg = this.getErrorMessage(oReq);
                if (opt_errCbk) {
                    opt_errCbk(err, msg, oReq.status);
                }
            }
        };
        const url = `/website/ce/${fileInfo.service}/put/${fileInfo.path}`;
        oReq.open('PUT', url);
        oReq.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
        oReq.send(JSON.stringify({ html, data }));
    }
    /**
     * get an error message out of a CloudExplorer's router error response
     * @return the error message
     */
    getErrorMessage(oReq) {
        let msg = '';
        try {
            const response = JSON.parse(oReq.responseText);
            if (response.message) {
                msg = response.message;
            }
        }
        catch (e) {
        }
        if (msg === '') {
            if (oReq.responseText !== '') {
                msg = oReq.responseText;
            }
            else {
                switch (oReq.status) {
                    case 404:
                        msg = 'File not found.';
                        break;
                    case 401:
                        msg =
                            'You are not connected to the cloud service you are trying to use.';
                        break;
                    default:
                        msg = 'Unknown error with HTTP status ' + oReq.status;
                }
            }
        }
        return msg === '' ? null : msg;
    }
    /**
     * load a website from the api
     */
    loadWebsite(absPath, cbk, opt_errCbk) {
        const url = '/website' + absPath;
        const oReq = new XMLHttpRequest();
        oReq.addEventListener('load', (e) => {
            // success of the request
            if (oReq.status === 200) {
                const json = JSON.parse(oReq.responseText);
                // warn the user
                if (json.message) {
                    Notification_1.Notification.alert('Website updated', json.message, () => { });
                }
                cbk(json.html, json.data);
            }
            else {
                const err = new Event('error');
                const msg = this.getErrorMessage(oReq);
                opt_errCbk(err, msg, oReq.status);
            }
        });
        oReq.addEventListener('error', (e) => {
            console.error('could not load website', absPath, 'from', url, e);
            if (opt_errCbk) {
                opt_errCbk(e, 'Network error, please check your internet connection or try again later.', oReq.status);
            }
        });
        oReq.open('GET', url);
        oReq.send();
    }
    getServices(cbk, opt_errCbk) {
        this.ce.getServices()
            .then((services) => {
            cbk(services);
        })
            .catch((e) => {
            console.error('Error: could not get the list of services', e);
            if (opt_errCbk) {
                opt_errCbk(e, 'Error: could not get the list of services');
            }
            else {
                cbk([]);
            }
        });
    }
}
exports.CloudStorage = CloudStorage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xvdWRTdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9pby9DbG91ZFN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7R0FJRztBQUNILHVEQUFzRDtBQUV0RCw2REFBeUQ7QUFpQnpEOzs7O0dBSUc7QUFDSCxNQUFhLFlBQVk7SUFBekI7UUFPRTs7V0FFRztRQUNILE9BQUUsR0FBa0IsSUFBSSxDQUFBO0lBNkkxQixDQUFDO0lBcEpDLE1BQU0sQ0FBQyxXQUFXO1FBQ2hCLFlBQVksQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFBO1FBQ25FLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQTtJQUM5QixDQUFDO0lBT0QsS0FBSyxDQUFDLEdBQWM7UUFDbEIsTUFBTSxVQUFVLEdBQUcsMEJBQWEsRUFBRSxDQUFBO1FBQ2xDLDBCQUEwQjtRQUMxQixtQ0FBbUM7UUFDbkMsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQyxJQUFJLENBQUMsRUFBRSxHQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBbUIsQ0FBQTtZQUN4RSxHQUFHLEVBQUUsQ0FBQTtTQUNOO2FBQU07WUFDTCxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO2dCQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtnQkFDZCxVQUFVLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUNyRCxJQUFJLENBQUMsRUFBRSxHQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBbUIsQ0FBQTtvQkFDeEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVB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