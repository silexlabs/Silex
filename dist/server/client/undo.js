"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUndoDispatcher = exports.hasRedo = exports.hasUndo = exports.redo = exports.undo = exports.resetUndo = void 0;
const redux_undo_1 = require("redux-undo");
const index_1 = require("./store/index");
function getResetUndo(state) {
    // store.dispatch(ActionCreators.clearHistory())
    return {
        ...state,
        past: [],
        future: [],
    };
}
function resetUndo() {
    index_1.store.dispatch(redux_undo_1.ActionCreators.clearHistory());
}
exports.resetUndo = resetUndo;
function undo() {
    index_1.store.dispatch(redux_undo_1.ActionCreators.undo());
}
exports.undo = undo;
function redo() {
    index_1.store.dispatch(redux_undo_1.ActionCreators.redo());
}
exports.redo = redo;
function hasUndo() {
    return index_1.store.getState().past.length > 0;
}
exports.hasUndo = hasUndo;
function hasRedo() {
    return index_1.store.getState().future.length > 0;
}
exports.hasRedo = hasRedo;
function withUndoDispatcher(reducer, options) {
    const { resetActions } = options;
    return (state, action) => {
        const result = reducer(state, action);
        if (resetActions.includes(action.type)) {
            return getResetUndo(result);
        }
        return result;
    };
}
exports.withUndoDispatcher = withUndoDispatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cy9jbGllbnQvdW5kby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBNkQ7QUFHN0QseUNBQXFDO0FBRXJDLFNBQVMsWUFBWSxDQUFDLEtBQThCO0lBQ2xELGdEQUFnRDtJQUNoRCxPQUFPO1FBQ0wsR0FBRyxLQUFLO1FBQ1IsSUFBSSxFQUFFLEVBQUU7UUFDUixNQUFNLEVBQUUsRUFBRTtLQUNYLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBZ0IsU0FBUztJQUN2QixhQUFLLENBQUMsUUFBUSxDQUFDLDJCQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQTtBQUMvQyxDQUFDO0FBRkQsOEJBRUM7QUFFRCxTQUFnQixJQUFJO0lBQ2xCLGFBQUssQ0FBQyxRQUFRLENBQUMsMkJBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQ3ZDLENBQUM7QUFGRCxvQkFFQztBQUVELFNBQWdCLElBQUk7SUFDbEIsYUFBSyxDQUFDLFFBQVEsQ0FBQywyQkFBYyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7QUFDdkMsQ0FBQztBQUZELG9CQUVDO0FBRUQsU0FBZ0IsT0FBTztJQUNyQixPQUFPLGFBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBRkQsMEJBRUM7QUFFRCxTQUFnQixPQUFPO0lBQ3JCLE9BQU8sYUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0FBQzNDLENBQUM7QUFGRCwwQkFFQztBQUVELFNBQWdCLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFpQztJQUMzRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFBO0lBQ2hDLE9BQU8sQ0FBQyxLQUFZLEVBQUUsTUFBVyxFQUFFLEVBQUU7UUFDbkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNyQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQzVCO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDLENBQUE7QUFDSCxDQUFDO0FBVEQsZ0RBU0MifQ==