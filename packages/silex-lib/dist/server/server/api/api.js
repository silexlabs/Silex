"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const Cache_1 = require("../../plugins/server/Cache");
const connectorApi_1 = __importDefault(require("./connectorApi"));
const websiteApi_1 = __importDefault(require("./websiteApi"));
const publicationApi_1 = __importDefault(require("./publicationApi"));
const constants_1 = require("../../constants");
function default_1(config) {
    const router = (0, express_1.Router)();
    router.use(Cache_1.noCache);
    router.use(constants_1.API_CONNECTOR_PATH, (0, connectorApi_1.default)(config));
    router.use(constants_1.API_WEBSITE_PATH, (0, websiteApi_1.default)(config));
    router.use(constants_1.API_PUBLICATION_PATH, (0, publicationApi_1.default)(config));
    return router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9hcGkvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBU0EsNEJBU0M7QUFsQkQscUNBQWdDO0FBRWhDLHNEQUFvRDtBQUVwRCxrRUFBeUM7QUFDekMsOERBQXFDO0FBQ3JDLHNFQUE2QztBQUM3QywrQ0FBNEY7QUFFNUYsbUJBQXdCLE1BQW9CO0lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0JBQU0sR0FBRSxDQUFBO0lBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBTyxDQUFDLENBQUE7SUFFbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyw4QkFBa0IsRUFBRSxJQUFBLHNCQUFZLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUNwRCxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUFnQixFQUFFLElBQUEsb0JBQVUsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0NBQW9CLEVBQUUsSUFBQSx3QkFBYyxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7SUFFeEQsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDIn0=