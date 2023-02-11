"use strict";
/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkType = exports.DomDirection = exports.Direction = exports.ElementType = void 0;
var ElementType;
(function (ElementType) {
    ElementType["CONTAINER"] = "container-element";
    ElementType["SECTION"] = "section-element";
    ElementType["IMAGE"] = "image-element";
    ElementType["TEXT"] = "text-element";
    ElementType["HTML"] = "html-element";
})(ElementType = exports.ElementType || (exports.ElementType = {}));
// move elements position
var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction = exports.Direction || (exports.Direction = {}));
// move elements in the dom
var DomDirection;
(function (DomDirection) {
    DomDirection["UP"] = "UP";
    DomDirection["DOWN"] = "DOWN";
    DomDirection["TOP"] = "TOP";
    DomDirection["BOTTOM"] = "BOTTOM";
})(DomDirection = exports.DomDirection || (exports.DomDirection = {}));
var LinkType;
(function (LinkType) {
    LinkType["PAGE"] = "LinkTypePage";
    LinkType["URL"] = "LinkTypeExternal";
    // TODO: ANCHOR, EMAIL...
})(LinkType = exports.LinkType || (exports.LinkType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L2VsZW1lbnQtc3RvcmUvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBV0gsSUFBWSxXQU1YO0FBTkQsV0FBWSxXQUFXO0lBQ3JCLDhDQUErQixDQUFBO0lBQy9CLDBDQUEyQixDQUFBO0lBQzNCLHNDQUF1QixDQUFBO0lBQ3ZCLG9DQUFxQixDQUFBO0lBQ3JCLG9DQUFxQixDQUFBO0FBQ3ZCLENBQUMsRUFOVyxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQU10QjtBQWlCRCx5QkFBeUI7QUFDekIsSUFBWSxTQUtYO0FBTEQsV0FBWSxTQUFTO0lBQ25CLHNCQUFTLENBQUE7SUFDVCwwQkFBYSxDQUFBO0lBQ2IsMEJBQWEsQ0FBQTtJQUNiLDRCQUFlLENBQUE7QUFDakIsQ0FBQyxFQUxXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBS3BCO0FBQ0QsMkJBQTJCO0FBQzNCLElBQVksWUFLWDtBQUxELFdBQVksWUFBWTtJQUN0Qix5QkFBUyxDQUFBO0lBQ1QsNkJBQWEsQ0FBQTtJQUNiLDJCQUFXLENBQUE7SUFDWCxpQ0FBaUIsQ0FBQTtBQUNuQixDQUFDLEVBTFcsWUFBWSxHQUFaLG9CQUFZLEtBQVosb0JBQVksUUFLdkI7QUFvQkQsSUFBWSxRQUlYO0FBSkQsV0FBWSxRQUFRO0lBQ2xCLGlDQUFxQixDQUFBO0lBQ3JCLG9DQUF1QixDQUFBO0lBQ3ZCLHlCQUF5QjtBQUMzQixDQUFDLEVBSlcsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUFJbkIifQ==