"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getState = exports.subscribeTo = exports.subscribeToCrud = exports.store = void 0;
const redux_1 = require("redux");
const redux_undo_1 = require("redux-undo");
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const crud_store_1 = require("../store/crud-store");
const dirty_1 = require("../dirty");
const undo_1 = require("../undo");
const RESET_ACTIONS = [
    actions_1.ElementAction.INITIALIZE,
    actions_1.PageAction.INITIALIZE,
    actions_1.SiteAction.INITIALIZE,
];
const CHANGE_ACTIONS = [
    ...Object.values(actions_1.ElementAction).filter((a) => a !== actions_1.ElementAction.INITIALIZE),
    ...Object.values(actions_1.PageAction).filter((a) => a !== actions_1.PageAction.INITIALIZE),
    ...Object.values(actions_1.SiteAction).filter((a) => a !== actions_1.SiteAction.INITIALIZE),
];
// create the main store
const reducers = redux_1.combineReducers({
    pages: crud_store_1.withCrudReducer({
        actionEnum: actions_1.PageAction,
        reducer: reducers_1.pageReducer,
        label: 'Pages',
    }),
    elements: crud_store_1.withCrudReducer({
        actionEnum: actions_1.ElementAction,
        reducer: reducers_1.elementReducer,
        label: 'Elements',
    }),
    site: reducers_1.siteReducer,
    ui: reducers_1.uiReducer,
});
let lastActionTime = 0;
exports.store = redux_1.createStore(dirty_1.withDirtyDispatcher(undo_1.withUndoDispatcher(redux_undo_1.default(reducers, {
    filter: redux_undo_1.includeAction(CHANGE_ACTIONS),
    groupBy: () => {
        const time = Math.floor(Date.now() / 1000);
        const elapsed = time - lastActionTime;
        lastActionTime = time;
        return elapsed;
    },
}), {
    resetActions: RESET_ACTIONS,
}), {
    changeActions: CHANGE_ACTIONS,
    resetActions: RESET_ACTIONS,
}));
// update previous and current states before other listeners fire
let curState = exports.store.getState().present;
let prevState = null;
exports.store.subscribe(() => {
    prevState = curState;
    curState = exports.store.getState().present;
});
/**
 * special subscribe for CRUD states, i.e. elements and pages
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
function subscribeToCrud(name, cbk, subscribe = exports.store.subscribe) {
    return subscribe(() => {
        const state = exports.store.getState();
        if (!prevState || state.present[name] !== prevState[name]) {
            cbk(prevState ? prevState[name] : null, state.present[name]);
        }
    });
}
exports.subscribeToCrud = subscribeToCrud;
/**
 * special subscribe for states, i.e. site and ui
 * provides the listener with prev and next state
 * only the states piece relevant to the CRUD state
 */
function subscribeTo(name, cbk, subscribe = exports.store.subscribe) {
    return subscribe(() => {
        const state = exports.store.getState();
        if (!prevState || state.present[name] !== prevState[name]) {
            cbk(prevState ? prevState[name] : null, state.present[name]);
        }
    });
}
exports.subscribeTo = subscribeTo;
/**
 * get the whole state object
 * used to save the state for example
 */
const getState = () => exports.store.getState().present;
exports.getState = getState;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3N0b3JlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFvRDtBQUNwRCwyQ0FBb0Q7QUFFcEQsdUNBQWlFO0FBSWpFLHlDQUFnRjtBQUNoRixvREFBZ0U7QUFDaEUsb0NBQThDO0FBQzlDLGtDQUE0QztBQUU1QyxNQUFNLGFBQWEsR0FBRztJQUNwQix1QkFBYSxDQUFDLFVBQVU7SUFDeEIsb0JBQVUsQ0FBQyxVQUFVO0lBQ3JCLG9CQUFVLENBQUMsVUFBVTtDQUN0QixDQUFBO0FBRUQsTUFBTSxjQUFjLEdBQUc7SUFDckIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUFhLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyx1QkFBYSxDQUFDLFVBQVUsQ0FBQztJQUM3RSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLG9CQUFVLENBQUMsVUFBVSxDQUFDO0lBQ3ZFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssb0JBQVUsQ0FBQyxVQUFVLENBQUM7Q0FDeEUsQ0FBQTtBQUVELHdCQUF3QjtBQUN4QixNQUFNLFFBQVEsR0FBRyx1QkFBZSxDQUFDO0lBQy9CLEtBQUssRUFBRSw0QkFBZSxDQUFZO1FBQ2hDLFVBQVUsRUFBRSxvQkFBVTtRQUN0QixPQUFPLEVBQUUsc0JBQVc7UUFDcEIsS0FBSyxFQUFFLE9BQU87S0FDZixDQUFDO0lBQ0YsUUFBUSxFQUFFLDRCQUFlLENBQWU7UUFDdEMsVUFBVSxFQUFFLHVCQUFhO1FBQ3pCLE9BQU8sRUFBRSx5QkFB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