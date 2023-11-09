var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import Storage from './storage';
import { Symbols } from './model/Symbols';
import SymbolsView from './view/SymbolsView';
import initCommands, * as cmd from './SymbolsCommands';
import initTraits from './view/traits';
export var cmdAddSymbol = cmd.cmdAdd;
export var cmdRemoveSymbol = cmd.cmdRemove;
export var cmdUnlinkSymbol = cmd.cmdUnlink;
export var cmdCreateSymbol = cmd.cmdCreate;
export default (function (editor, opts) {
    if (opts === void 0) { opts = {}; }
    var options = __assign({
        appendTo: '#symbols',
        emptyText: 'No symbol yet.',
        primaryColor: '#b9a5a6',
        secondaryColor: '#463a3c',
        highlightColor: '#d97aa6',
    }, opts);
    // store the symbols data with the site
    Storage(editor);
    // keep track of symbols and changes
    editor.Symbols = new Symbols([], { options: options, editor: editor });
    editor.on('load', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Display symbols
        new SymbolsView(__assign(__assign({}, options), { editor: editor, model: editor.Symbols }));
        // Commands to create/delete symbols
        initCommands(editor, options);
        // Add traits like a plugin
        initTraits(editor, options);
    });
});
