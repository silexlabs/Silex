"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirty = exports.resetDirty = exports.withDirtyDispatcher = void 0;
const index_1 = require("./store/index");
const index_2 = require("./ui-store/index");
function withDirtyDispatcher(reducer, options) {
    const { changeActions, resetActions } = options;
    return (state, action) => {
        const result = reducer(state, action);
        if (resetActions.includes(action.type)) {
            resetDirty_(result.present);
            return updateDirty(result);
        }
        if (changeActions.includes(action.type) && result !== state) {
            return updateDirty(result);
        }
        return result;
    };
}
exports.withDirtyDispatcher = withDirtyDispatcher;
function updateDirty(state) {
    const dirty = isDirty(state.present);
    if (dirty === state.present.ui.dirty) {
        return state;
    }
    return {
        ...state,
        present: {
            ...state.present,
            ui: {
                ...state.present.ui,
                dirty,
            },
        },
    };
}
// last saved state
let nonDirtyStates = {
    elements: null,
    pages: null,
    site: null,
};
function resetDirty_(state = index_1.getState()) {
    // store references to some parts of the state
    const { elements, pages, site } = state;
    nonDirtyStates = { elements, pages, site };
}
function resetDirty(state = index_1.getState()) {
    resetDirty_(state);
    index_2.updateUi({
        ...index_2.getUi(),
        dirty: false,
    });
}
exports.resetDirty = resetDirty;
function isDirty(state = index_1.getState()) {
    return state.elements !== nonDirtyStates.elements
        || state.pages !== nonDirtyStates.pages
        || state.site !== nonDirtyStates.site;
}
exports.isDirty = isDirty;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdHMvY2xpZW50L2RpcnR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLHlDQUF3QztBQUN4Qyw0Q0FBa0Q7QUFFbEQsU0FBZ0IsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQTBEO0lBQ3JHLE1BQU0sRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFBO0lBQy9DLE9BQU8sQ0FBQyxLQUFZLEVBQUUsTUFBVyxFQUFFLEVBQUU7UUFDbkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNyQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDM0IsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDM0I7UUFDRCxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7WUFDM0QsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDM0I7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUMsQ0FBQTtBQUNILENBQUM7QUFiRCxrREFhQztBQUVELFNBQVMsV0FBVyxDQUFDLEtBQThCO0lBQ2pELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDcEMsSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFO1FBQ3BDLE9BQU8sS0FBSyxDQUFBO0tBQ2I7SUFDRCxPQUFPO1FBQ0wsR0FBRyxLQUFLO1FBQ1IsT0FBTyxFQUFFO1lBQ1AsR0FBRyxLQUFLLENBQUMsT0FBTztZQUNoQixFQUFFLEVBQUU7Z0JBQ0YsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ25CLEtBQUs7YUFDTjtTQUNGO0tBQ0YsQ0FBQTtBQUNILENBQUM7QUFHRCxtQkFBbUI7QUFDbkIsSUFBSSxjQUFjLEdBQW1CO0lBQ25DLFFBQVEsRUFBRSxJQUFJO0lBQ2QsS0FBSyxFQUFFLElBQUk7SUFDWCxJQUFJLEVBQUUsSUFBSTtDQUNYLENBQUE7QUFFRCxTQUFTLFdBQVcsQ0FBQyxRQUFlLGdCQUFRLEVBQUU7SUFDNUMsOENBQThDO0lBQzlDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQTtJQUN2QyxjQUFjLEdBQUcsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFBO0FBQzVDLENBQUM7QUFFRCxTQUFnQixVQUFVLENBQUMsUUFBZSxnQkFBUSxFQUFFO0lBQ2xELFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsQixnQkFBUSxDQUFDO1FBQ1AsR0FBRyxhQUFLLEVBQUU7UUFDVixLQUFLLEVBQUUsS0FBSztLQUNiLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFORCxnQ0FNQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxRQUFlLGdCQUFRLEVBQUU7SUFDL0MsT0FBTyxLQUFLLENBQUMsUUFBUSxLQUFLLGNBQWMsQ0FBQyxRQUFRO1dBQzVDLEtBQUssQ0FBQyxLQUFLLEtBQUssY0FBYyxDQUFDLEtBQUs7V0FDcEMsS0FBSyxDQUFDLElBQUksS0FBSyxjQUFjLENBQUMsSUFBSSxDQUFBO0FBQ3pDLENBQUM7QUFKRCwwQkFJQyJ9