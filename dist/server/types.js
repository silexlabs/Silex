"use strict";
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
exports.defaultWebsiteData = {};
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
var ConnectorType;
(function (ConnectorType) {
    ConnectorType["STORAGE"] = "STORAGE";
    ConnectorType["HOSTING"] = "HOSTING";
})(ConnectorType || (exports.ConnectorType = ConnectorType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["SUCCESS"] = "SUCCESS";
    JobStatus["ERROR"] = "ERROR";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
