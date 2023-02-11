"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiReducer = exports.siteReducer = exports.pageReducer = exports.elementReducer = void 0;
const types_1 = require("../ui-store/types");
const actions_1 = require("./actions");
const elementReducer = (state = [], action) => {
    switch (action.type) {
        default: return state;
    }
};
exports.elementReducer = elementReducer;
const pageReducer = (state = [], action) => {
    switch (action.type) {
        case actions_1.PageAction.MOVE:
            // remove the item
            const idx = state.findIndex((item) => item === action.item);
            const withoutItem = [...state.slice(0, idx), ...state.slice(idx + 1)];
            // put it back
            return [...withoutItem.slice(0, action.idx), action.item, ...withoutItem.slice(action.idx)];
        default: return state;
    }
};
exports.pageReducer = pageReducer;
const siteReducer = (state = {
    description: '',
    enableMobile: true,
    isTemplate: false,
    title: '',
    publicationPath: null,
    websiteUrl: '',
    faviconPath: '',
    thumbnailSocialPath: '',
    descriptionSocial: '',
    titleSocial: '',
    lang: '',
    width: -1,
    headStyle: '',
    headScript: '',
    headUser: '',
    hostingProvider: '',
    twitterSocial: '',
    dataSources: {},
    fonts: [],
    styles: {},
    file: null,
    prodotypeDependencies: {},
    data: {},
}, action) => {
    switch (action.type) {
        case actions_1.SiteAction.INITIALIZE: return {
            ...action.data,
        };
        case actions_1.SiteAction.UPDATE: return {
            ...state,
            ...action.data,
        };
        default: return state;
    }
};
exports.siteReducer = siteReducer;
const uiReducer = (state = {
    loading: types_1.LOADING.SILEX,
    dirty: false,
    mobileEditor: false,
    currentPageId: null,
    dialogs: [{
            id: 'design',
            type: 'properties',
            visible: true,
        }, {
            id: 'style',
            type: 'properties',
            visible: false,
        }, {
            id: 'params',
            type: 'properties',
            visible: false,
        }],
    clipboard: null,
    components: {},
}, action) => {
    switch (action.type) {
        case actions_1.UiAction.INITIALIZE: return {
            ...action.data,
        };
        case actions_1.UiAction.UPDATE: return {
            ...state,
            ...action.data,
        };
        default: return state;
    }
};
exports.uiReducer = uiReducer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3N0b3JlL3JlZHVjZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDZDQUFvRDtBQUNwRCx1Q0FBNEQ7QUFJckQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUF3QixFQUFFLEVBQUUsTUFBVyxFQUFPLEVBQUU7SUFDN0UsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFBO0tBQ3RCO0FBQ0gsQ0FBQyxDQUFBO0FBSlksUUFBQSxjQUFjLGtCQUkxQjtBQUVNLE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBcUIsRUFBRSxFQUFFLE1BQVcsRUFBZSxFQUFFO0lBQy9FLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRTtRQUNuQixLQUFLLG9CQUFVLENBQUMsSUFBSTtZQUNsQixrQkFBa0I7WUFDbEIsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUMzRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3JFLGNBQWM7WUFDZCxPQUFPLENBQUMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFN0YsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUE7S0FDdEI7QUFDSCxDQUFDLENB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