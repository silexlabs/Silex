"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = exports.ConnectorType = exports.Initiator = exports.ClientSideFileType = exports.Unit = exports.defaultWebsiteData = exports.ApiError = void 0;
class ApiError extends Error {
    httpStatusCode;
    constructor(message, httpStatusCode) {
        super(message);
        this.httpStatusCode = httpStatusCode;
        console.info('API error', httpStatusCode, message);
    }
}
exports.ApiError = ApiError;
// **
// Website API
exports.defaultWebsiteData = {
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
var Unit;
(function (Unit) {
    Unit["PX"] = "px";
})(Unit || (exports.Unit = Unit = {}));
var ClientSideFileType;
(function (ClientSideFileType) {
    ClientSideFileType["HTML"] = "html";
    ClientSideFileType["ASSET"] = "asset";
    ClientSideFileType["CSS"] = "css";
    ClientSideFileType["OTHER"] = "other";
})(ClientSideFileType || (exports.ClientSideFileType = ClientSideFileType = {}));
var Initiator;
(function (Initiator) {
    Initiator["HTML"] = "html";
    Initiator["CSS"] = "css";
})(Initiator || (exports.Initiator = Initiator = {}));
/**
 * Enum to express if the connector is a storage or a hosting
 */
var ConnectorType;
(function (ConnectorType) {
    ConnectorType["STORAGE"] = "STORAGE";
    ConnectorType["HOSTING"] = "HOSTING";
})(ConnectorType || (exports.ConnectorType = ConnectorType = {}));
/**
 * Enum to express if the job is in progress or finished or errored
 */
var JobStatus;
(function (JobStatus) {
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["SUCCESS"] = "SUCCESS";
    JobStatus["ERROR"] = "ERROR";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHMvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7O0FBbUJILE1BQWEsUUFBUyxTQUFRLEtBQUs7SUFDWTtJQUE3QyxZQUFZLE9BQWUsRUFBa0IsY0FBc0I7UUFDakUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRDZCLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1FBRWpFLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNwRCxDQUFDO0NBQ0Y7QUFMRCw0QkFLQztBQWdERCxLQUFLO0FBQ0wsY0FBYztBQUNELFFBQUEsa0JBQWtCLEdBQWdCO0FBQzdDLFlBQVk7QUFDWixhQUFhO0FBQ2IsYUFBYTtBQUNiLGVBQWU7QUFDZixZQUFZO0FBQ1osY0FBYztBQUNkLGtCQUFrQjtDQUNKLENBQUE7QUF1RGhCLDBCQUEwQjtBQUMxQixvREFBb0Q7QUFDcEQsNEJBQTRCO0FBQzVCLEdBQUc7QUFDSCxFQUFFO0FBQ0YsOEJBQThCO0FBQzlCLGlCQUFpQjtBQUNqQixxQkFBcUI7QUFDckIsMENBQTBDO0FBQzFDLDRCQUE0QjtBQUM1QixHQUFHO0FBRUgsSUFBWSxJQUVYO0FBRkQsV0FBWSxJQUFJO0lBQ2QsaUJBQVMsQ0FBQTtBQUNYLENBQUMsRUFGVyxJQUFJLG9CQUFKLElBQUksUUFFZjtBQWtDRCxJQUFZLGtCQUtYO0FBTEQsV0FBWSxrQkFBa0I7SUFDNUIsbUNBQWEsQ0FBQTtJQUNiLHFDQUFlLENBQUE7SUFDZixpQ0FBVyxDQUFBO0lBQ1gscUNBQWUsQ0FBQTtBQUNqQixDQUFDLEVBTFcsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFLN0I7QUFFRCxJQUFZLFNBR1g7QUFIRCxXQUFZLFNBQVM7SUFDbkIsMEJBQWEsQ0FBQTtJQUNiLHdCQUFXLENBQUE7QUFDYixDQUFDLEVBSFcsU0FBUyx5QkFBVCxTQUFTLFFBR3BCO0FBMkNEOztHQUVHO0FBQ0gsSUFBWSxhQUdYO0FBSEQsV0FBWSxhQUFhO0lBQ3ZCLG9DQUFtQixDQUFBO0lBQ25CLG9DQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFIVyxhQUFhLDZCQUFiLGFBQWEsUUFHeEI7QUF1REQ7O0dBRUc7QUFDSCxJQUFZLFNBSVg7QUFKRCxXQUFZLFNBQVM7SUFDbkIsd0NBQTJCLENBQUE7SUFDM0IsZ0NBQW1CLENBQUE7SUFDbkIsNEJBQWUsQ0FBQTtBQUNqQixDQUFDLEVBSlcsU0FBUyx5QkFBVCxTQUFTLFFBSXBCIn0=