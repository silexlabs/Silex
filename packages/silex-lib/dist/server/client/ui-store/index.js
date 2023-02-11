"use strict";
/**
 * @fileoverview this is the API used to interact with the store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeUi = exports.getUi = exports.updateUi = exports.initializeUi = void 0;
const actions_1 = require("../store/actions");
const index_1 = require("../store/index");
const initializeUi = (data, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.UiAction.INITIALIZE,
    data,
});
exports.initializeUi = initializeUi;
const updateUi = (data, dispatch = index_1.store.dispatch) => dispatch({
    type: actions_1.UiAction.UPDATE,
    data,
});
exports.updateUi = updateUi;
const getUi = () => index_1.store.getState().present.ui;
exports.getUi = getUi;
const subscribeUi = (cbk, subscribe = index_1.store.subscribe) => {
    return index_1.subscribeTo('ui', cbk, subscribe);
};
exports.subscribeUi = subscribeUi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3VpLXN0b3JlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBR0gsOENBQTJDO0FBQzNDLDBDQUFtRDtBQUU1QyxNQUFNLFlBQVksR0FBRyxDQUFDLElBQWEsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ2pGLElBQUksRUFBRSxrQkFBUSxDQUFDLFVBQVU7SUFDekIsSUFBSTtDQUNMLENBQUMsQ0FBQTtBQUhXLFFBQUEsWUFBWSxnQkFHdkI7QUFFSyxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQWEsRUFBRSxRQUFRLEdBQUcsYUFBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQzdFLElBQUksRUFBRSxrQkFBUSxDQUFDLE1BQU07SUFDckIsSUFBSTtDQUNMLENBQUMsQ0FBQTtBQUhXLFFBQUEsUUFBUSxZQUduQjtBQUVLLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFBO0FBQXpDLFFBQUEsS0FBSyxTQUFvQztBQUUvQyxNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQXFELEVBQUUsU0FBUyxHQUFHLGFBQUssQ0FBQyxTQUFTLEVBQWMsRUFBRTtJQUM1SCxPQUFPLG1CQUFXLENBQVUsSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUNuRCxDQUFDLENBQUE7QUFGWSxRQUFBLFdBQVcsZUFFdkIifQ==