"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiAction = exports.SiteAction = exports.PageAction = exports.ElementAction = void 0;
var ElementAction;
(function (ElementAction) {
    ElementAction["INITIALIZE"] = "ELEMENT_INITIALISE";
    ElementAction["CREATE"] = "ELEMENT_CREATE";
    ElementAction["DELETE"] = "ELEMENT_DELETE";
    ElementAction["UPDATE"] = "ELEMENT_UPDATE";
    // MOVE = 'ELEMENT_MOVE',
})(ElementAction = exports.ElementAction || (exports.ElementAction = {}));
var PageAction;
(function (PageAction) {
    PageAction["INITIALIZE"] = "PAGE_INITIALIZE";
    PageAction["CREATE"] = "PAGE_CREATE";
    PageAction["DELETE"] = "PAGE_DELETE";
    PageAction["UPDATE"] = "PAGE_UPDATE";
    PageAction["MOVE"] = "PAGE_MOVE";
})(PageAction = exports.PageAction || (exports.PageAction = {}));
var SiteAction;
(function (SiteAction) {
    SiteAction["INITIALIZE"] = "SITE_INITIALIZE";
    SiteAction["UPDATE"] = "SITE_UPDATE";
})(SiteAction = exports.SiteAction || (exports.SiteAction = {}));
var UiAction;
(function (UiAction) {
    UiAction["INITIALIZE"] = "UI_INITIALIZE";
    UiAction["UPDATE"] = "UI_UPDATE";
})(UiAction = exports.UiAction || (exports.UiAction = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvc3RvcmUvYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxJQUFZLGFBTVg7QUFORCxXQUFZLGFBQWE7SUFDdkIsa0RBQWlDLENBQUE7SUFDakMsMENBQXlCLENBQUE7SUFDekIsMENBQXlCLENBQUE7SUFDekIsMENBQXlCLENBQUE7SUFDekIseUJBQXlCO0FBQzNCLENBQUMsRUFOVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQU14QjtBQUVELElBQVksVUFNWDtBQU5ELFdBQVksVUFBVTtJQUNwQiw0Q0FBOEIsQ0FBQTtJQUM5QixvQ0FBc0IsQ0FBQTtJQUN0QixvQ0FBc0IsQ0FBQTtJQUN0QixvQ0FBc0IsQ0FBQTtJQUN0QixnQ0FBa0IsQ0FBQTtBQUNwQixDQUFDLEVBTlcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFNckI7QUFFRCxJQUFZLFVBR1g7QUFIRCxXQUFZLFVBQVU7SUFDcEIsNENBQThCLENBQUE7SUFDOUIsb0NBQXNCLENBQUE7QUFDeEIsQ0FBQyxFQUhXLFVBQVUsR0FBVixrQkFBVSxLQUFWLGtCQUFVLFFBR3JCO0FBRUQsSUFBWSxRQUdYO0FBSEQsV0FBWSxRQUFRO0lBQ2xCLHdDQUE0QixDQUFBO0lBQzVCLGdDQUFvQixDQUFBO0FBQ3RCLENBQUMsRUFIVyxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQUduQiJ9