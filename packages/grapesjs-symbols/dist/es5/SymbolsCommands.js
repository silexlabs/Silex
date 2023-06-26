"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymbolInstance = exports.unlinkSymbolInstance = exports.removeSymbol = exports.addSymbol = exports.cmdCreate = exports.cmdUnlink = exports.cmdRemove = exports.cmdAdd = void 0;
var Symbol_1 = require("./model/Symbol");
var utils_1 = require("./utils");
exports.cmdAdd = 'symbols:add';
exports.cmdRemove = 'symbols:remove';
exports.cmdUnlink = 'symbols:unlink';
exports.cmdCreate = 'symbols:create';
function default_1(_a) {
    var editor = _a.editor, options = _a.options;
    editor.Commands.add(exports.cmdAdd, addSymbol);
    editor.Commands.add(exports.cmdRemove, removeSymbol);
    editor.Commands.add(exports.cmdUnlink, unlinkSymbolInstance);
    editor.Commands.add(exports.cmdCreate, createSymbolInstance);
}
exports.default = default_1;
// Symbol management functions
// These are exported for unit tests
/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
function addSymbol(editor, sender, _a) {
    var label = _a.label, icon = _a.icon, _b = _a.component, component = _b === void 0 ? editor.getSelected() : _b;
    if (component) {
        // add the symbol
        var s = editor.Symbols.add((0, Symbol_1.createSymbol)(component, { label: label, icon: icon }));
        (0, utils_1.setDirty)(editor);
        // return the symbol to the caller
        return s;
    }
    else {
        throw new Error('Can not create the symbol: missing param component');
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
            var s = editor.Symbols.remove(symbolId);
            // Unlink all instances
            s.unlinkAll();
            // notify the editor that a change occured
            (0, utils_1.setDirty)(editor);
            // return the symbol to the caller
            return s;
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
        // create the new component
        var c = (parent_1 ? parent_1.append([symbol.createInstance()], { at: pos.index }) : [])[0];
        // Select the new component
        // Break unit tests? editor.select(c, { scroll: true })
        return c;
    }
    else {
        throw new Error('Can not create the symbol: missing param symbol, pos or target');
    }
}
exports.createSymbolInstance = createSymbolInstance;
