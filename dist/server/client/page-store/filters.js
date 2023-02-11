"use strict";
/**
 * @fileoverview Useful filters used to retrieve items in the store
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPage = exports.getPageById = void 0;
const index_1 = require("./index");
const index_2 = require("../ui-store/index");
const getPageById = (id, pages = index_1.getPages()) => {
    return pages.find((p) => p.id === id);
};
exports.getPageById = getPageById;
const getCurrentPage = (ui = index_2.getUi(), pages = index_1.getPages()) => {
    return exports.getPageById(ui.currentPageId, pages);
};
exports.getCurrentPage = getCurrentPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvcGFnZS1zdG9yZS9maWx0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUdILG1DQUFrQztBQUNsQyw2Q0FBeUM7QUFFbEMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFVLEVBQUUsS0FBSyxHQUFHLGdCQUFRLEVBQUUsRUFBYSxFQUFFO0lBQ3ZFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtBQUN2QyxDQUFDLENBQUE7QUFGWSxRQUFBLFdBQVcsZUFFdkI7QUFFTSxNQUFNLGNBQWMsR0FBRyxDQUFDLEVBQUUsR0FBRyxhQUFLLEVBQUUsRUFBRSxLQUFLLEdBQUcsZ0JBQVEsRUFBRSxFQUFhLEVBQUU7SUFDNUUsT0FBTyxtQkFBVyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDN0MsQ0FBQyxDQUFBO0FBRlksUUFBQSxjQUFjLGtCQUUxQiJ9