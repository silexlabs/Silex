/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
export class ApiError extends Error {
    httpStatusCode;
    constructor(message, httpStatusCode) {
        super(message);
        this.httpStatusCode = httpStatusCode;
        console.info('API error', httpStatusCode, message);
    }
}
// **
// Website API
export const defaultWebsiteData = {
//pages: [],
//assets: [],
//styles: [],
//settings: {},
//fonts: [],
//symbols: [],
//publication: {},
};
//export interface Frame {
//  component: { type: string, stylable: string[] },
//  components: Component[],
//}
//
//export interface Component {
//  type: string,
//  content?: string,
//  attributes: { [key: string]: string },
//  conponents: Component[],
//}
export var Unit;
(function (Unit) {
    Unit["PX"] = "px";
})(Unit || (Unit = {}));
export var ClientSideFileType;
(function (ClientSideFileType) {
    ClientSideFileType["HTML"] = "html";
    ClientSideFileType["ASSET"] = "asset";
    ClientSideFileType["CSS"] = "css";
    ClientSideFileType["OTHER"] = "other";
})(ClientSideFileType || (ClientSideFileType = {}));
export var Initiator;
(function (Initiator) {
    Initiator["HTML"] = "html";
    Initiator["CSS"] = "css";
})(Initiator || (Initiator = {}));
/**
 * Enum to express if the connector is a storage or a hosting
 */
export var ConnectorType;
(function (ConnectorType) {
    ConnectorType["STORAGE"] = "STORAGE";
    ConnectorType["HOSTING"] = "HOSTING";
})(ConnectorType || (ConnectorType = {}));
/**
 * Enum to express if the job is in progress or finished or errored
 */
export var JobStatus;
(function (JobStatus) {
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["SUCCESS"] = "SUCCESS";
    JobStatus["ERROR"] = "ERROR";
})(JobStatus || (JobStatus = {}));
//# sourceMappingURL=types.js.map