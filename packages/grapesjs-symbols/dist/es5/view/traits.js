"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lit_html_1 = require("lit-html");
var events_1 = require("../events");
var Symbol_1 = require("../model/Symbol");
var SymbolsCommands_1 = require("../SymbolsCommands");
var SymbolsView_1 = require("./SymbolsView");
// Same signature as a grapesjs plugin
function default_1(editor, options) {
    function setSync(el, component, sync) {
        component.set(Symbol_1.SYMBOL_SYNC_ATTRIBUTE, sync);
        updateUi(el, component);
    }
    function unlink(component) {
        (0, SymbolsView_1.confirmDialog)({
            editor: editor,
            title: 'Unlink from symbol',
            content: "\n        <p>Are you sure you want to unlink this component from the symbol? This is a <em>definitive action<em></p>\n        <p>Unlinking this component <em>will not</em> delete the symbol, just disconnects it. Confirm to proceed or cancel to maintain the current link.</p>\n      ",
            primaryLabel: 'Unlink',
            cbk: function () {
                editor.runCommand(SymbolsCommands_1.cmdUnlink, { component: component });
            },
            lsKey: 'unlink-symbol',
        });
    }
    function updateUi(el, component) {
        var _a;
        var symbolId = component && (0, Symbol_1.getSymbolId)(component);
        if (symbolId) {
            var sync = component.get(Symbol_1.SYMBOL_SYNC_ATTRIBUTE) !== false;
            el.style.display = 'initial';
            (0, lit_html_1.render)((0, lit_html_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<fieldset class=\"gjs-trt-trait__wrp gjs-trt-trait__wrp-title\" style=\"\n        border-color: ", ";\n        padding: 10px;\n      \">\n        <legend class=\"fa fa-ban on fa-diamond\"> <em>", "</em></legend>\n        <div class=\"gjs-field\">\n          <button\n            class=\"gjs-btn-prim gjs-btn--full\"\n            style=\"\n              margin: 10px 0;\n              border: 1px solid ", ";\n            \"\n            @click=", ">Unlink</button>\n          <div class=\"gjs-radio-items\">\n            <label class=\"gjs-radio-item\">\n              <input type=\"radio\" name=\"sync\" value=\"on\" @click=", " ?checked=", "/>\n              <span class=\"gjs-radio-item-label\" style=\"color: ", "\">ON</span>\n            </label>\n            <label class=\"gjs-radio-item\">\n              <input type=\"radio\" name=\"sync\" value=\"off\" @click=", " ?checked=", "/>\n              <span class=\"gjs-radio-item-label\" style=\"color: ", "\">OFF</span>\n            </label>\n        </div>\n      </fieldset>"], ["<fieldset class=\"gjs-trt-trait__wrp gjs-trt-trait__wrp-title\" style=\"\n        border-color: ", ";\n        padding: 10px;\n      \">\n        <legend class=\"fa fa-ban on fa-diamond\"> <em>", "</em></legend>\n        <div class=\"gjs-field\">\n          <button\n            class=\"gjs-btn-prim gjs-btn--full\"\n            style=\"\n              margin: 10px 0;\n              border: 1px solid ", ";\n            \"\n            @click=", ">Unlink</button>\n          <div class=\"gjs-radio-items\">\n            <label class=\"gjs-radio-item\">\n              <input type=\"radio\" name=\"sync\" value=\"on\" @click=", " ?checked=", "/>\n              <span class=\"gjs-radio-item-label\" style=\"color: ", "\">ON</span>\n            </label>\n            <label class=\"gjs-radio-item\">\n              <input type=\"radio\" name=\"sync\" value=\"off\" @click=", " ?checked=", "/>\n              <span class=\"gjs-radio-item-label\" style=\"color: ", "\">OFF</span>\n            </label>\n        </div>\n      </fieldset>"])), options.primaryColor, (_a = editor.Symbols.get(symbolId)) === null || _a === void 0 ? void 0 : _a.get('label'), options.primaryColor, function () { return unlink(component); }, function () { return setSync(el, component, true); }, sync, sync ? options.highlightColor : options.primaryColor, function () { return setSync(el, component, false); }, !sync, sync ? options.primaryColor : options.highlightColor), el);
        }
        else {
            el.style.display = 'none';
        }
    }
    // Create a new trait type
    editor.TraitManager.addType('symbol-trait', {
        noLabel: true,
        createInput: function (_a) {
            var trait = _a.trait;
            // Create a new element container and add some content
            var el = document.createElement('div');
            // update the UI when a new symbol is selected or created/deleted etc
            Object.values(events_1.SymbolEvents).forEach(function (event) { return editor.on(event, function () { return updateUi(el); }); });
            // Initial ui update
            updateUi(el);
            // this will be the element passed to onEvent and onUpdate
            return el;
        },
        // Update the component based on UI changes
        // `elInput` is the result HTMLElement you get from `createInput`
        //onEvent({ elInput, component, event }) {
        //},
        // Update UI on the component change
        onUpdate: function (_a) {
            var elInput = _a.elInput, component = _a.component;
            updateUi(elInput, component);
        },
    });
    // Add trait to symbols when the user selects one
    editor.on('component:selected', function (component) {
        var symbolId = component && (0, Symbol_1.getSymbolId)(component);
        if (symbolId) {
            component.addTrait({
                type: 'symbol-trait',
                name: 'Symbol',
            });
        }
    });
    //// Add the new trait to all component types
    //editor.DomComponents.getTypes().forEach(type => {
    //  editor.DomComponents.addType(type.id, {
    //    //isComponent: el => isComponent(el),
    //    model: {
    //      defaults: {
    //        traits: [
    //          // Keep the type original traits
    //          ...editor.DomComponents.getType(type.id).model.prototype.defaults.traits,
    //          // Add the new trait
    //          {
    //            type: 'symbol-trait',
    //            name: 'Symbol',
    //          }
    //        ]
    //      }
    //    }
    //  })
    //})
}
exports.default = default_1;
var templateObject_1;
