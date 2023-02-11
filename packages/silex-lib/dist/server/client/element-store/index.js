"use strict";
/**
 * @fileoverview this is the API used to interact with the store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeElements = exports.getElements = exports.updateElements = exports.deleteElements = exports.createElements = exports.initializeElements = exports.toElementData = exports.fromElementData = void 0;
const actions_1 = require("../store/actions");
const index_1 = require("../store/index");
const index_2 = require("../store/index");
const crud_store_1 = require("../store/crud-store");
const fromElementData = (elements) => crud_store_1.fromData(elements);
exports.fromElementData = fromElementData;
const toElementData = (elements) => crud_store_1.toData(elements);
exports.toElementData = toElementData;
const initializeElements = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.ElementAction.INITIALIZE,
    items,
});
exports.initializeElements = initializeElements;
const createElements = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.ElementAction.CREATE,
    items,
});
exports.createElements = createElements;
const deleteElements = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.ElementAction.DELETE,
    items,
});
exports.deleteElements = deleteElements;
const updateElements = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.ElementAction.UPDATE,
    items,
});
exports.updateElements = updateElements;
const getElements = () => index_1.store.getState().present.elements;
exports.getElements = getElements;
const subscribeElements = (cbk, subscribe = index_1.store.subscribe) => {
    return index_2.subscribeToCrud('elements', cbk, subscribe);
};
exports.subscribeElements = subscribeElements;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L2VsZW1lbnQtc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCw4Q0FBZ0Q7QUFDaEQsMENBQXNDO0FBQ3RDLDBDQUFnRDtBQUVoRCxvREFBc0Q7QUFFL0MsTUFBTSxlQUFlLEdBQUcsQ0FBQyxRQUF1QixFQUFrQixFQUFFLENBQUMscUJBQVEsQ0FBNEIsUUFBUSxDQUFDLENBQUE7QUFBNUcsUUFBQSxlQUFlLG1CQUE2RjtBQUNsSCxNQUFNLGFBQWEsR0FBRyxDQUFDLFFBQXdCLEVBQWlCLEVBQUUsQ0FBQyxtQkFBTSxDQUE0QixRQUFRLENBQUMsQ0FBQTtBQUF4RyxRQUFBLGFBQWEsaUJBQTJGO0FBRTlHLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUFxQixFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDL0YsSUFBSSxFQUFFLHVCQUFhLENBQUMsVUFBVTtJQUM5QixLQUFLO0NBQ04sQ0FBQyxDQUFBO0FBSFcsUUFBQSxrQkFBa0Isc0JBRzdCO0FBRUssTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFxQixFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDM0YsSUFBSSxFQUFFLHVCQUFhLENBQUMsTUFBTTtJQUMxQixLQUFLO0NBQ04sQ0FBQyxDQUFBO0FBSFcsUUFBQSxjQUFjLGtCQUd6QjtBQUVLLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBcUIsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQzNGLElBQUksRUFBRSx1QkFBYSxDQUFDLE1BQU07SUFDMUIsS0FBSztDQUNOLENBQUMsQ0FBQTtBQUhXLFFBQUEsY0FBYyxrQkFHekI7QUFFSyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQXFCLEVBQUUsUUFBUSxHQUFHLGFBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQztJQUMzRixJQUFJLEVBQUUsdUJBQWEsQ0FBQyxNQUFNO0lBQzFCLEtBQUs7Q0FDTixDQUFDLENBQUE7QUFIVyxRQUFBLGNBQWMsa0JBR3pCO0FBRUssTUFBTSxXQUFXLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUE7QUFBckQsUUFBQSxXQUFXLGVBQTBDO0FBRTNELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFtRSxFQUFFLFNBQVMsR0FBRyxhQUFLLENBQUMsU0FBUyxFQUFjLEVBQUU7SUFDaEosT0FBTyx1QkFBZSxDQUFlLFVBQVUsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDbEUsQ0FBQyxDQUFBO0FBRlksUUFBQSxpQkFBaUIscUJBRTdCIn0=