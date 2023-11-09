var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { createSymbol, getSymbolId } from './model/Symbol';
import { allowDrop, setDirty } from './utils';
import { SymbolEvents } from './events';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
export var cmdAdd = 'symbols:add';
export var cmdRemove = 'symbols:remove';
export var cmdUnlink = 'symbols:unlink';
export var cmdCreate = 'symbols:create';
//let html: any
//let render: any
//let unsafeHTML: any
//async function loadLitHtml() {
//  const litHtml = await import('lit-html')
//  html = litHtml.html
//  render = litHtml.render
//  const unsafeLitHTML = await import('lit-html/directives/unsafe-html.js')
//  unsafeHTML = unsafeLitHTML.unsafeHTML
//}
//loadLitHtml()
// Same signature as a grapesjs plugin
export default function (editor, options) {
    if (options === void 0) { options = {}; }
    editor.Commands.add(cmdAdd, addSymbol);
    editor.Commands.add(cmdRemove, removeSymbol);
    editor.Commands.add(cmdUnlink, unlinkSymbolInstance);
    editor.Commands.add(cmdCreate, createSymbolInstance);
}
// Symbol management functions
// These are exported for unit tests
export function displayError(editor, title, message) {
    var content = document.createElement('div');
    editor.Modal.open({
        title: title,
        content: content,
    });
    render(html(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<main>\n      <p>", "</p>\n    </main><footer style=\"\n      display: flex;\n      justify-content: space-between;\n      margin-top: 30px;\n    \">\n      <div></div>\n      <button class=\"gjs-btn-prim\" @click=", ">Close</button>\n    </footer>"], ["<main>\n      <p>", "</p>\n    </main><footer style=\"\n      display: flex;\n      justify-content: space-between;\n      margin-top: 30px;\n    \">\n      <div></div>\n      <button class=\"gjs-btn-prim\" @click=", ">Close</button>\n    </footer>"])), unsafeHTML(message), function () { return editor.Modal.close(); }), content);
}
/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
export function addSymbol(editor, sender, _a) {
    var label = _a.label, icon = _a.icon, _b = _a.component, component = _b === void 0 ? editor.getSelected() : _b;
    if (component && label && icon) {
        // add the symbol
        var s = editor.Symbols.add(createSymbol(editor, component, { label: label, icon: icon }));
        setDirty(editor);
        // Notify plugins
        editor.trigger(SymbolEvents.CREATE, { symbol: s });
        // return the symbol to the caller
        return s;
    }
    else {
        console.error('Can not create the symbol: missing required param', { label: label, icon: icon, component: component });
        throw new Error('Can not create the symbol: missing required param');
    }
}
/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export function removeSymbol(editor, sender, _a) {
    var symbolId = _a.symbolId;
    if (symbolId) {
        if (editor.Symbols.has(symbolId)) {
            // remove the symbol
            var s_1 = editor.Symbols.remove(symbolId);
            var instances = s_1.get('instances');
            // Unlink all instances
            s_1.unlinkAll();
            // notify the editor that a change occured
            setDirty(editor);
            // Notify the plugins
            instances.forEach(function (c) { return editor.trigger(SymbolEvents.UNLINK, { symbol: s_1, component: c }); });
            editor.trigger(SymbolEvents.REMOVE, { symbol: s_1 });
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
export function unlinkSymbolInstance(editor, sender, _a) {
    var component = _a.component;
    if (component) {
        var s = editor.Symbols.get(getSymbolId(component));
        if (s) {
            s.unlink(component);
            // notify the editor that a change occured
            setDirty(editor);
            // Notify the plugins
            editor.trigger(SymbolEvents.UNLINK, { symbol: s, component: component });
        }
        else {
            console.warn('Can not unlink component', component, 'Symbol not found');
        }
    }
    else {
        throw new Error('Can not unlink the component: missing param component');
    }
}
/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
export function createSymbolInstance(editor, sender, _a) {
    var symbol = _a.symbol, pos = _a.pos, target = _a.target;
    pos = pos || {};
    if (symbol && pos && target) {
        var parentId = target ? target.getAttribute('id') : undefined;
        if (!parentId)
            throw new Error('Can not create the symbol: missing param id');
        var parent_1 = target ? editor.Components.allById()[parentId] : undefined;
        // Check that it is a valid parent
        if (parent_1) {
            if (!allowDrop({ target: symbol.get('model'), parent: parent_1 })) {
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
                editor.trigger(SymbolEvents.LINK, { symbol: symbol, component: c });
                editor.trigger(SymbolEvents.CREATE_INSTANCE, { symbol: symbol, component: c });
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
var templateObject_1;
