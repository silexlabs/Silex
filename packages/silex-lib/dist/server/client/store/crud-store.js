"use strict";
/**
 * @fileoverview Util methods for CRUD states/stores (Create Update Delete). Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCrudChange = exports.toData = exports.fromData = exports.withCrudReducer = exports.crudIdKey = void 0;
exports.crudIdKey = Symbol('crudId key');
function testCrud(items) {
    const withoutKey = items.filter((item) => !item[exports.crudIdKey]);
    if (withoutKey.length)
        throw new Error('The items need to have a key. The items you provide to update or deleted need to be retrieved from the store');
}
function withCrudReducer(options) {
    const { actionEnum, reducer } = options;
    return (state = [], action) => {
        if (action.type in Object.keys(actionEnum))
            testCrud(action.items);
        switch (action.type) {
            case actionEnum.INITIALIZE: return action.items;
            case actionEnum.CREATE: return action.items.length ? reducer(state.concat(action.items), action) : state;
            case actionEnum.DELETE: return action.items.length ? reducer(state.filter((item) => !action.items.find((i) => i[exports.crudIdKey] === item[exports.crudIdKey])), action) : state;
            case actionEnum.UPDATE:
                if (action.items.length === 0)
                    return state;
                return reducer(state.map((item) => {
                    const found = action.items.find((i) => i[exports.crudIdKey] === item[exports.crudIdKey]);
                    return found || item; // TODO: ?? operator should work
                }), action);
            default:
                return reducer(state, action);
        }
    };
}
exports.withCrudReducer = withCrudReducer;
// adds a crudIdKey symbole to all elements of an array
function fromData(items) {
    return items.map((item) => ({
        ...item,
        [exports.crudIdKey]: Symbol(),
    }));
}
exports.fromData = fromData;
// removes a crudIdKey symbole to all elements of an array
function toData(items) {
    return items.map((item) => {
        const { [exports.crudIdKey]: crudId, ...data } = item;
        return data;
    });
}
exports.toData = toData;
function onCrudChange({ onAdd, onDelete, onUpdate }) {
    return (prevState, currentState) => {
        // added items
        const added = currentState.filter((item) => !prevState || !prevState.find((p) => p[exports.crudIdKey] === item[exports.crudIdKey]));
        if (added.length)
            onAdd(added);
        if (prevState) {
            // removed
            const deleted = prevState.filter((item) => !currentState.find((p) => p[exports.crudIdKey] === item[exports.crudIdKey]));
            if (deleted.length)
                onDelete(deleted);
            // updated
            const updated = currentState
                .map((to) => {
                const from = prevState.find((p) => p[exports.crudIdKey] === to[exports.crudIdKey]);
                return {
                    from,
                    to,
                };
            })
                .filter(({ from, to }) => !!from && from !== to);
            if (updated.length)
                onUpdate(updated);
        }
    };
}
exports.onCrudChange = onCrudChange;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J1ZC1zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvc3RvcmUvY3J1ZC1zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFHVSxRQUFBLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7QUFTN0MsU0FBUyxRQUFRLENBQUMsS0FBa0I7SUFDbEMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQVMsQ0FBQyxDQUFDLENBQUE7SUFDM0QsSUFBSSxVQUFVLENBQUMsTUFBTTtRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsOEdBQThHLENBQUMsQ0FBQTtBQUN4SixDQUFDO0FBRUQsU0FBZ0IsZUFBZSxDQUEwQixPQUF3RztJQUMvSixNQUFNLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQTtJQUN2QyxPQUFPLENBQUMsUUFBaUIsRUFBRSxFQUFFLE1BQVcsRUFBRSxFQUFFO1FBQzFDLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN4QyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3hCLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRTtZQUNuQixLQUFLLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUE7WUFDL0MsS0FBSyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO1lBQzFI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