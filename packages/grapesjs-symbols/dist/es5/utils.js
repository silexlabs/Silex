"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDirty = setDirty;
exports.getAllComponentsFromEditor = getAllComponentsFromEditor;
exports.children = children;
exports.all = all;
exports.find = find;
exports.closestInstance = closestInstance;
exports.hasSymbolId = hasSymbolId;
exports.wait = wait;
exports.getNodePath = getNodePath;
exports.getNode = getNode;
exports.getCaret = getCaret;
exports.setCaret = setCaret;
exports.allowDrop = allowDrop;
var Symbol_1 = require("./model/Symbol");
/**
 * set editor as dirty
 */
function setDirty(editor) {
    try {
        var curr = editor.getDirtyCount() || 0;
        editor.getModel().set('changesCount', curr + 1);
    }
    catch (e) {
        // this occures in headless mode and UT
    }
}
/**
 * browse all pages and retrieve all website components
 */
function getAllComponentsFromEditor(editor) {
    var res = [];
    editor.Pages.getAll()
        .forEach(function (page) {
        page.getMainComponent()
            .onAll(function (c) { return res.push(c); });
    });
    return res;
}
/**
 * Get all the children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component's children
 */
function children(c) {
    var children = c.components().toArray();
    return children
        .flatMap(function (child) { return all(child); });
}
/**
 * Get an array of the component + its children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component itself and its children
 */
function all(c) {
    var children = c.components().toArray();
    return [c]
        .concat(children
        .flatMap(function (child) {
        if (hasSymbolId(child))
            return [child];
        return all(child);
    }));
}
/**
 * Find a component in a component's children, with a given symbolChildId or symbolId
 * @param {Component} c - the root component
 * @param {string} cid - the ID we are looking for
 * @returns {(Component|null)} the component itself or one of its children
 */
function find(c, symbolChildId) {
    if (c.get('symbolChildId') === symbolChildId) {
        return c;
    }
    else {
        // check the children components
        var found_1 = null;
        c.components()
            // Does not work properly, why? .find(comp => find(comp, symbolChildId))
            .forEach(function (comp) {
            if (!found_1)
                found_1 = find(comp, symbolChildId);
        });
        return found_1;
    }
}
/**
 * find the first symbol in the parents (or the element itself)
 * @private
 */
function closestInstance(c) {
    var ptr = c;
    while (ptr && !hasSymbolId(ptr)) {
        ptr = ptr.parent();
    }
    return ptr;
}
/**
 * @param {Component} c - a component
 * @return {Boolean} true if the component has a symbol id
 */
function hasSymbolId(c) {
    return !!c.get('symbolId');
}
function wait() {
    return __awaiter(this, arguments, void 0, function (ms) {
        if (ms === void 0) { ms = 0; }
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
function getNodePath(root, node) {
    var path = [];
    var pointer = node;
    while (pointer && pointer !== root) {
        var parent_1 = pointer.parentNode;
        var children_1 = Array.from(parent_1.childNodes);
        var nodeIndex = children_1.indexOf(pointer); // any because it should be a ChildNode but eslint does not know ChildNode
        path.push(nodeIndex);
        pointer = parent_1;
    }
    return path;
}
/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
function getNode(root, path) {
    var mutablePath = __spreadArray([], path, true);
    var result = root;
    while (result && mutablePath.length) {
        result = result.childNodes[mutablePath.pop()];
    }
    return result;
}
/**
 * Gets the caret position
 */
function getCaret(el) {
    var _a, _b;
    var win = el.ownerDocument.defaultView;
    var sel = win.getSelection();
    var range = sel.rangeCount ? sel.getRangeAt(0) : null;
    var pos = (_a = range === null || range === void 0 ? void 0 : range.startOffset) !== null && _a !== void 0 ? _a : 0;
    var caretEl = (_b = range === null || range === void 0 ? void 0 : range.commonAncestorContainer) !== null && _b !== void 0 ? _b : el;
    var path = getNodePath(el, caretEl);
    return { path: path, pos: pos };
}
/**
 * Sets the caret position
 */
function setCaret(el, _a) {
    var path = _a.path, pos = _a.pos;
    var textNode = getNode(el, path);
    if (textNode) {
        var win = el.ownerDocument.defaultView;
        var sel = win.getSelection();
        sel.removeAllRanges();
        var range = document.createRange();
        range.selectNodeContents(textNode);
        range.collapse(false);
        range.setStart(textNode, pos);
        range.setEnd(textNode, pos);
        sel.addRange(range);
    }
    else {
        console.error('Could not keep the caret position', { el: el, path: path });
    }
}
/**
 * find the all the symbols in the parents (or the element itself)
 * @private
 */
function allParentInstances(c, includeSelf) {
    var result = [];
    var ptr = includeSelf ? c : c.parent();
    while (ptr) {
        if (hasSymbolId(ptr))
            result.push(ptr);
        ptr = ptr.parent();
    }
    return result;
}
/**
 * find the all the symbols in the children (or the element itself)
 */
function allChildrenInstances(c, includeSelf) {
    var children = c.components().toArray();
    var result = [];
    if (includeSelf && hasSymbolId(c))
        result.push(c);
    return [c]
        .concat(children
        .flatMap(function (child) { return allChildrenInstances(child, true); }) // include self only for the subsequent levels
    );
}
/**
 * Find if a parent is also a child of the symbol
 */
function allowDrop(_a) {
    var target = _a.target, parent = _a.parent;
    var allParents = allParentInstances(parent, true);
    var allChildren = allChildrenInstances(target, false);
    return !allParents.find(function (p) { return allChildren.find(function (c) { return (0, Symbol_1.getSymbolId)(c) === (0, Symbol_1.getSymbolId)(p); }); });
}
