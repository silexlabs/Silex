"use strict";
/**
 * @fileoverview Useful filters used to retrieve items in the store. Cross platform, it needs to run client and server side
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirstPagedParent = exports.getSelectedElementsNoSectionContent = exports.getSelectedElements = exports.noSectionContent = exports.getBody = exports.isBody = exports.getAllParents = exports.getParent = exports.getChildrenRecursive = exports.getChildren = exports.getElementByDomElement = exports.getElementById = void 0;
const index_1 = require("./index");
const dom_1 = require("./dom");
const getElementById = (id, elements = index_1.getElements()) => {
    const element = elements.find((el) => el.id === id);
    if (element)
        return element;
    // Element not found, this happens when we generate a new ID and want to check that it does not exist
    return null;
};
exports.getElementById = getElementById;
const getElementByDomElement = (doc, element, elements = index_1.getElements()) => elements.find((el) => element === dom_1.getDomElement(doc, el));
exports.getElementByDomElement = getElementByDomElement;
const getChildren = (element, elements = index_1.getElements()) => element.children.map((id) => exports.getElementById(id, elements));
exports.getChildren = getChildren;
const getChildrenRecursive = (element, elements = index_1.getElements()) => {
    return element.children
        .map((id) => exports.getElementById(id, elements))
        .filter((el) => !!el)
        .concat(element.children.reduce((prev, id) => {
        const el = exports.getElementById(id, elements);
        if (el)
            return prev.concat(exports.getChildrenRecursive(el, elements));
        return prev;
    }, []));
};
exports.getChildrenRecursive = getChildrenRecursive;
const getParent = (element, elements = index_1.getElements()) => elements.find((parent) => parent.children.includes(element.id));
exports.getParent = getParent;
const getAllParents = (element, elements = index_1.getElements()) => {
    const parent = exports.getParent(element, elements);
    return !!parent ? [parent, ...exports.getAllParents(parent, elements)] : [];
};
exports.getAllParents = getAllParents;
// FIXME: find a more relyable way to find the body, i.e. isBody or a type of element
const isBody = (el, elements = index_1.getElements()) => !exports.getParent(el, elements);
exports.isBody = isBody;
const getBody = (elements = index_1.getElements()) => elements.find((el) => exports.isBody(el, elements));
exports.getBody = getBody;
const noSectionContent = (element, elements = index_1.getElements()) => element.isSectionContent ? exports.getParent(element, elements) : element;
exports.noSectionContent = noSectionContent;
// const defaultSelection = (selected) => selected.length ? selected : [getBody()]
const getSelectedElements = (elements = index_1.getElements()) => elements
    .filter((el) => el.selected);
exports.getSelectedElements = getSelectedElements;
const getSelectedElementsNoSectionContent = (elements = index_1.getElements()) => elements
    .filter((el) => el.selected) // first get selection
    .map((el) => exports.noSectionContent(el, elements)); // then replace section contents with sections
exports.getSelectedElementsNoSectionContent = getSelectedElementsNoSectionContent;
/**
 * get the fist parent element which is "paged", i.e. not visible on all pages
 */
function getFirstPagedParent(element, elements = index_1.getElements()) {
    const parent = exports.getParent(element, elements);
    if (!!parent) {
        if (parent.pageNames.length) {
            return parent;
        }
        return getFirstPagedParent(parent, elements);
    }
    // body
    return null;
}
exports.getFirstPagedParent = getFirstPagedParent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvZWxlbWVudC1zdG9yZS9maWx0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUdILG1DQUFxQztBQUNyQywrQkFBcUM7QUFFOUIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxFQUFhLEVBQUUsUUFBUSxHQUFHLG1CQUFXLEVBQUUsRUFBZ0IsRUFBRTtJQUN0RixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQ25ELElBQUksT0FBTztRQUFFLE9BQU8sT0FBTyxDQUFBO0lBQzNCLHFHQUFxRztJQUNyRyxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMsQ0FBQTtBQUxZLFFBQUEsY0FBYyxrQkFLMUI7QUFDTSxNQUFNLHNCQUFzQixHQUFHLENBQUMsR0FBaUIsRUFBRSxPQUFvQixFQUFFLFFBQVEsR0FBRyxtQkFBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE9BQU8sS0FBSyxtQkFBYSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBQXpKLFFBQUEsc0JBQXNCLDBCQUFtSTtBQUUvSixNQUFNLFdBQVcsR0FBRyxDQUFDLE9BQXFCLEVBQUUsUUFBUSxHQUFHLG1CQUFXLEVBQUUsRUFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxzQkFBYyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQTdJLFFBQUEsV0FBVyxlQUFrSTtBQUVuSixNQUFNLG9CQUFvQixHQUFHLENBQUMsT0FBcUIsRUFBRSxRQUFRLEdBQUcs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