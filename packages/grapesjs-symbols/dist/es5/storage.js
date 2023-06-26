"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
exports.default = (function (editor) {
    editor.on('storage:start:store', function (objectToStore) {
        objectToStore.symbols = editor.Symbols.toJSON();
    });
    editor.on('storage:end:load', function (resultObject) {
        if (resultObject.symbols) {
            editor.Symbols.reset();
            editor.Symbols.set(resultObject.symbols);
            // update sybols with existing components
            // call setSymbols on load because
            // the `storage:end:load` event is fired after the components are loaded
            editor.Symbols.updateComponents((0, utils_1.getAllComponentsFromEditor)(editor));
        }
    });
});
