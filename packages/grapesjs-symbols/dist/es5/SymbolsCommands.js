"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymbolInstance = exports.unlinkSymbolInstance = exports.removeSymbol = exports.addSymbol = exports.displayError = exports.cmdCreate = exports.cmdUnlink = exports.cmdRemove = exports.cmdAdd = void 0;
var lit_html_1 = require("lit-html");
var unsafe_html_js_1 = require("lit-html/directives/unsafe-html.js");
var Symbol_1 = require("./model/Symbol");
var utils_1 = require("./utils");
var events_1 = require("./events");
exports.cmdAdd = 'symbols:add';
exports.cmdRemove = 'symbols:remove';
exports.cmdUnlink = 'symbols:unlink';
exports.cmdCreate = 'symbols:create';
// Same signature as a grapesjs plugin
function default_1(editor, options) {
    if (options === void 0) { options = {}; }
    editor.Commands.add(exports.cmdAdd, addSymbol);
    editor.Commands.add(exports.cmdRemove, removeSymbol);
    editor.Commands.add(exports.cmdUnlink, unlinkSymbolInstance);
    editor.Commands.add(exports.cmdCreate, createSymbolInstance);
}
exports.default = default_1;
// Symbol management functions
// These are exported for unit tests
function displayError(editor, title, message) {
    var content = document.createElement('div');
    editor.Modal.open({
        title: title,
        content: content,
    });
    (0, lit_html_1.render)((0, lit_html_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<main>\n      <p>", "</p>\n    </main><footer style=\"\n      display: flex;\n      justify-content: space-between;\n      margin-top: 30px;\n    \">\n      <div></div>\n      <button class=\"gjs-btn-prim\" @click=", ">Close</button>\n    </footer>"], ["<main>\n      <p>", "</p>\n    </main><footer style=\"\n      display: flex;\n      justify-content: space-between;\n      margin-top: 30px;\n    \">\n      <div></div>\n      <button class=\"gjs-btn-prim\" @click=", ">Close</button>\n    </footer>"])), (0, unsafe_html_js_1.unsafeHTML)(message), function () { return editor.Modal.close(); }), content);
}
exports.displayError = displayError;
/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
function addSymbol(editor, sender, _a) {
    var label = _a.label, icon = _a.icon, _b = _a.component, component = _b === void 0 ? editor.getSelected() : _b;
    if (component && label && icon) {
        // add the symbol
        var s = editor.Symbols.add((0, Symbol_1.createSymbol)(editor, component, { label: label, icon: icon }));
        (0, utils_1.setDirty)(editor);
        // Notify plugins
        editor.trigger(events_1.SymbolEvents.CREATE, { symbol: s });
        // return the symbol to the caller
        return s;
    }
    else {
        console.error('Can not create the symbol: missing required param', { label: label, icon: icon, component: component });
        throw new Error('Can not create the symbol: missing required param');
    }
}
exports.addSymbol = addSymbol;
/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
function removeSymbol(editor, sender, _a) {
    var symbolId = _a.symbolId;
    if (symbolId) {
        if (editor.Symbols.has(symbolId)) {
            // remove the symbol
            var s_1 = editor.Symbols.remove(symbolId);
            var instances = s_1.get('instances');
            // Unlink all instances
            s_1.unlinkAll();
            // notify the editor that a change occured
            (0, utils_1.setDirty)(editor);
            // Notify the plugins
            instances.forEach(function (c) { return editor.trigger(events_1.SymbolEvents.UNLINK, { symbol: s_1, component: c }); });
            editor.trigger(events_1.SymbolEvents.REMOVE, { symbol: s_1 });
            // return the symbol to the caller
            return s_1;
        }
        else {
            throw new Error('Could not remove symbol: symbol not found');
        }
    }
    else {
        throw new Error('Could not remove symbol: missing param symbolId');
    }
}
exports.removeSymbol = removeSymbol;
function unlinkSymbolInstance(editor, sender, _a) {
    var component = _a.component;
    if (component) {
        var s = editor.Symbols.get((0, Symbol_1.getSymbolId)(component));
        if (s) {
            s.unlink(component);
            // notify the editor that a change occured
            (0, utils_1.setDirty)(editor);
            // Notify the plugins
            editor.trigger(events_1.SymbolEvents.UNLINK, { symbol: s, component: component });
        }
        else {
            console.warn('Can not unlink component', component, 'Symbol not found');
        }
    }
    else {
        throw new Error('Can not unlink the component: missing param component');
    }
}
exports.unlinkSymbolInstance = unlinkSymbolInstance;
/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
function createSymbolInstance(editor, sender, _a) {
    var symbol = _a.symbol, pos = _a.pos, target = _a.target;
    pos = pos || {};
    if (symbol && pos && target) {
        var parentId = target ? target.getAttribute('id') : undefined;
        if (!parentId)
            throw new Error('Can not create the symbol: missing param id');
        var parent_1 = target ? editor.Components.allById()[parentId] : undefined;
        // Check that it is a valid parent
        if (parent_1) {
            if (!(0, utils_1.allowDrop)({ target: symbol.get('model'), parent: parent_1 })) {
                // Cancel and notify the user
                displayError(editor, 'Error: can not create the symbol', '<p>One of the parent is in the symbol.</p><p>Please remove the parent from the symbol and try again.</p>');
                return null;
            }
            else {
                // create the new component
                var c = (parent_1 ? parent_1.append([symbol.createInstance()], { at: pos.index }) : [])[0];
                // Select the new component
                // Break unit tests? editor.select(c, { scroll: true })
                // Notify plugins
                editor.trigger(events_1.SymbolEvents.LINK, { symbol: symbol, component: c });
                editor.trigger(events_1.SymbolEvents.CREATE_INSTANCE, { symbol: symbol, component: c });
                return c;
            }
        }
        else {
            console.error('Can not create the symbol: parent not found');
            return null;
        }
    }
    else {
        throw new Error('Can not create the symbol: missing param symbol or pos or target');
    }
}
exports.createSymbolInstance = createSymbolInstance;
var templateObject_1;
