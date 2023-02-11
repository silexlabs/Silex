"use strict";
/**
 * @fileoverview this is the API used to interact with the store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeSite = exports.getSite = exports.updateSite = exports.initializeSite = void 0;
const index_1 = require("../store/index");
const actions_1 = require("../store/actions");
const initializeSite = (data, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.SiteAction.INITIALIZE,
    data,
});
exports.initializeSite = initializeSite;
const updateSite = (data, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.SiteAction.UPDATE,
    data,
});
exports.updateSite = updateSite;
const getSite = () => index_1.store.getState().present.site;
exports.getSite = getSite;
const subscribeSite = (cbk, subscribe = index_1.store.subscribe) => {
    return index_1.subscribeTo('site', cbk, subscribe);
};
exports.subscribeSite = subscribeSite;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3NpdGUtc3RvcmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCwwQ0FBbUQ7QUFFbkQsOENBQTZDO0FBRXRDLE1BQU0sY0FBYyxHQUFHLENBQUMsSUFBZSxFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDckYsSUFBSSxFQUFFLG9CQUFVLENBQUMsVUFBVTtJQUMzQixJQUFJO0NBQ0wsQ0FBQyxDQUFBO0FBSFcsUUFBQSxjQUFjLGtCQUd6QjtBQUVLLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBZSxFQUFFLFFBQVEsR0FBRyxhQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDakYsSUFBSSxFQUFFLG9CQUFVLENBQUMsTUFBTTtJQUN2QixJQUFJO0NBQ0wsQ0FBQyxDQUFBO0FBSFcsUUFBQSxVQUFVLGNBR3JCO0FBRUssTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUE7QUFBN0MsUUFBQSxPQUFPLFdBQXNDO0FBRW5ELE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBeUQsRUFBRSxTQUFTLEdBQUcsYUFBSyxDQUFDLFNBQVMsRUFBYyxFQUFFO0lBQ2xJLE9BQU8sbUJBQVcsQ0FBWSxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZELENBQUMsQ0FBQTtBQUZZLFFBQUEsYUFBYSxpQkFFekIifQ==