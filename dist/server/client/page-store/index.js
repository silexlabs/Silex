"use strict";
/**
 * @fileoverview this is the API used to interact with the store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribePages = exports.getPages = exports.movePage = exports.updatePages = exports.deletePages = exports.createPages = exports.initializePages = exports.toPageData = exports.fromPageData = void 0;
const index_1 = require("../store/index");
const actions_1 = require("../store/actions");
const crud_store_1 = require("../store/crud-store");
const fromPageData = (pages) => crud_store_1.fromData(pages);
exports.fromPageData = fromPageData;
const toPageData = (pages) => crud_store_1.toData(pages);
exports.toPageData = toPageData;
const initializePages = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.PageAction.INITIALIZE,
    items,
});
exports.initializePages = initializePages;
const createPages = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.PageAction.CREATE,
    items,
});
exports.createPages = createPages;
const deletePages = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.PageAction.DELETE,
    items,
});
exports.deletePages = deletePages;
const updatePages = (items, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.PageAction.UPDATE,
    items,
});
exports.updatePages = updatePages;
const movePage = ({ page, idx }, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.PageAction.MOVE,
    item: page,
    idx,
});
exports.movePage = movePage;
const getPages = () => index_1.store.getState().present.pages;
exports.getPages = getPages;
const subscribePages = (cbk, subscribe = index_1.store.subscribe) => {
    return index_1.subscribeToCrud('pages', cbk, subscribe);
};
exports.subscribePages = subscribePages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3BhZ2Utc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCwwQ0FBdUQ7QUFFdkQsOENBQTZDO0FBQzdDLG9EQUFzRDtBQUUvQyxNQUFNLFlBQVksR0FBRyxDQUFDLEtBQWlCLEVBQWUsRUFBRSxDQUFDLHFCQUFRLENBQXNCLEtBQUssQ0FBQyxDQUFBO0FBQXZGLFFBQUEsWUFBWSxnQkFBMkU7QUFDN0YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFrQixFQUFjLEVBQUUsQ0FBQyxtQkFBTSxDQUFzQixLQUFLLENBQUMsQ0FBQTtBQUFuRixRQUFBLFVBQVUsY0FBeUU7QUFFekYsTUFBTSxlQUFlLEdBQUcsQ0FBQyxLQUFrQixFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDekYsSUFBSSxFQUFFLG9CQUFVLENBQUMsVUFBVTtJQUMzQixLQUFLO0NBQ04sQ0FBQyxDQUFBO0FBSFcsUUFBQSxlQUFlLG1CQUcxQjtBQUVLLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBa0IsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ3JGLElBQUksRUFBRSxvQkFBVSxDQUFDLE1BQU07SUFDdkIsS0FBSztDQUNOLENBQUMsQ0FBQTtBQUhXLFFBQUEsV0FBVyxlQUd0QjtBQUVLLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBa0IsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ3JGLElBQUksRUFBRSxvQkFBVSxDQUFDLE1BQU07SUFDdkIsS0FBSztDQUNOLENBQUMsQ0FBQTtBQUhXLFFBQUEsV0FBVyxlQUd0QjtBQUVLLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBa0IsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ3JGLElBQUksRUFBRSxvQkFBVSxDQUFDLE1BQU07SUFDdkIsS0FBSztDQUNOLENBQUMsQ0FBQTtBQUhXLFFBQUEsV0FBVyxlQUd0QjtBQUVLLE1BQU0sUUFBUSxHQUFHLENBQUMsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFpQyxFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDM0csSUFBSSxFQUFFLG9CQUFVLENBQUMsSUFBSTtJQUNyQixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUc7Q0FDSixDQUFDLENBQUE7QUFKVyxRQUFBLFFBQVEsWUFJbkI7QUFFSyxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxhQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtBQUEvQyxRQUFBLFFBQVEsWUFBdUM7QUFFckQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUE2RCxFQUFFLFNBQVMsR0FBRyxhQUFLLENBQUMsU0FBUyxFQUFjLEVBQUU7SUFDdkksT0FBTyx1QkFBZSxDQUFZLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDNUQsQ0FBQyxDQUFBO0FBRlksUUFBQSxjQUFjLGtCQUUxQiJ9