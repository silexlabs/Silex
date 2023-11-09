var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import Backbone from 'backbone';
import { allowDrop, closestInstance, wait } from '../utils';
import Symbol, { getSymbolId } from './Symbol';
var Symbols = /** @class */ (function (_super) {
    __extends(Symbols, _super);
    function Symbols(models, _a) {
        var _this = this;
        var editor = _a.editor, options = _a.options, opts = __rest(_a, ["editor", "options"]);
        _this = _super.call(this, models, opts) || this;
        _this.updating = false;
        _this.editor = editor;
        _this.options = options;
        if (!options.headless) {
            _this.initEvents();
        }
        // Make sure the symbol CRUD operations are undoable
        _this.editor.UndoManager.add(_this);
        return _this;
    }
    Symbols.prototype.disableUndo = function (disable) {
        if (disable)
            this.editor.UndoManager.stop();
        else
            this.editor.UndoManager.start();
    };
    Symbols.prototype.preventUndo = function (cbk) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.editor.UndoManager.stop();
                        return [4 /*yield*/, cbk()];
                    case 1:
                        _a.sent();
                        this.editor.UndoManager.start();
                        return [2 /*return*/];
                }
            });
        });
    };
    Symbols.prototype.initEvents = function () {
        var _this = this;
        this.editor.on('component:create', function (c) { return _this.onAdd(c); });
        this.editor.on('component:update:components', function (parent, comp) { return _this.onUpdateChildren(parent, comp); });
        this.editor.on('component:update:attributes', function (c) { return _this.onUpdateAttributes(c); });
        this.editor.on('component:update:classes', function (c) { return _this.onUpdateClasses(c); });
        this.editor.on('component:input', function (c) { return _this.onUpdateContent(c); });
        this.editor.on('styleable:change', function (cssRule) { return _this.onStyleChanged(cssRule); });
        this.editor.on('component:drag', function (_a) {
            var target = _a.target, parent = _a.parent;
            return _this.onDrag({ target: target, parent: parent });
        });
        //this.editor.on('undo', () => {
        //  this.updating = true
        //  setTimeout(() => {
        //    this.updating = false
        //  }, 1000)
        //})
    };
    /**
     * Update sybols with existing components
     * This is used on load only
     * TODO: Use `storage:end:load`? But this event is fired after the components are loaded
     * TODO: Needs review
     * @private
     */
    Symbols.prototype.updateComponents = function (components) {
        var _this = this;
        components.forEach(function (c) { return _this.onAdd(c); });
    };
    /**
     * Prevent drop on a symbol into itself or things similar
     */
    Symbols.prototype.onDrag = function (_a) {
        var target = _a.target, parent = _a.parent;
        if ((parent === null || parent === void 0 ? void 0 : parent.get('droppable')) && !allowDrop({ target: target, parent: parent })) {
            // Prevent drop
            parent.set('droppable', false);
            // Reset after drop
            this.editor.once('component:drag:end', function () {
                parent.set('droppable', true);
            });
        }
    };
    /**
     * Add a component to a symbol
     * This is useful only when loading new HTML content
     * When loading a new component which is a symbol,
     *   add a ref to the component in its symbol.get('instances')
     * Export this method for unit tests
     * TODO: Needs review
     * @private
     */
    Symbols.prototype.onAdd = function (c) {
        var symbolId = getSymbolId(c);
        if (symbolId) {
            var symbol = this.get(symbolId);
            if (symbol) {
                if (symbol.isInstance(c)) {
                    console.warn('Could not add instance', c, "It is already an instance of symbol with id ".concat(symbolId));
                }
                else {
                    // This is probably a duplication of a symbol
                    // Or we have just loaded the website
                    // Make it an instance
                    symbol.addInstance(c);
                }
            }
            else {
                console.warn('Could not add instance', c, "Could not find the symbol with id ".concat(symbolId, " (maybe later?)"));
            }
        }
    };
    /**
     * A component's components() has changed
     */
    Symbols.prototype.onUpdateChildren = function (parent, component) {
        return __awaiter(this, void 0, void 0, function () {
            var inst, symbolId, s_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.updating)
                            return [2 /*return*/];
                        inst = closestInstance(parent);
                        if (!inst) return [3 /*break*/, 4];
                        symbolId = getSymbolId(inst);
                        s_1 = this.get(symbolId);
                        if (!s_1) return [3 /*break*/, 3];
                        // wait for the component's children to be changed
                        // I couldn't find an event like `component:update:components:after`
                        // TODO: need review
                        return [4 /*yield*/, wait()];
                    case 1:
                        // wait for the component's children to be changed
                        // I couldn't find an event like `component:update:components:after`
                        // TODO: need review
                        _a.sent();
                        this.updating = true;
                        return [4 /*yield*/, this.preventUndo(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    s_1.applyChildren(inst, parent, component);
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        this.updating = false;
                        return [3 /*break*/, 4];
                    case 3:
                        console.warn('Could not update instance', component, ': could not find the symbol with id', symbolId);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * A component's attributes has changed
     */
    Symbols.prototype.onUpdateAttributes = function (c) {
        if (this.updating)
            return;
        var inst = closestInstance(c);
        if (inst) {
            var symbolId = getSymbolId(inst);
            var s = this.get(symbolId);
            if (s) {
                this.updating = true;
                s.applyAttributes(inst, c);
                this.updating = false;
            }
            else {
                console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId);
            }
        }
    };
    /**
     * A component's css classes have changed
     */
    Symbols.prototype.onUpdateClasses = function (c) {
        return __awaiter(this, void 0, void 0, function () {
            var inst, symbolId, s_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.updating)
                            return [2 /*return*/];
                        inst = closestInstance(c);
                        if (!inst) return [3 /*break*/, 3];
                        symbolId = getSymbolId(inst);
                        s_2 = this.get(symbolId);
                        if (!s_2) return [3 /*break*/, 2];
                        return [4 /*yield*/, wait()]; // Needed for undo to work
                    case 1:
                        _a.sent(); // Needed for undo to work
                        this.updating = true;
                        this.preventUndo(function () {
                            s_2.applyClasses(inst, c);
                        });
                        this.updating = false;
                        return [3 /*break*/, 3];
                    case 2:
                        console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * A component's text content has changed
     */
    Symbols.prototype.onUpdateContent = function (c) {
        if (this.updating)
            return;
        var inst = closestInstance(c);
        if (inst) {
            var symbolId = getSymbolId(inst);
            var s_3 = this.get(symbolId);
            if (s_3) {
                this.updating = true;
                this.preventUndo(function () {
                    s_3.applyContent(inst, c);
                });
                this.updating = false;
            }
            else {
                console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId);
            }
        }
    };
    /**
     * A component's style has changed
     * TODO: Needs review: isn't the style supposed to be just an attribute => we should not need to sync it, just attributes?
     */
    Symbols.prototype.onStyleChanged = function (cssRule) {
        if (this.updating)
            return;
        var c = cssRule.getComponent();
        var style = cssRule.changed.style;
        if (c && style) {
            var inst = closestInstance(c);
            if (inst) {
                var symbolId = getSymbolId(inst);
                var s = this.get(symbolId);
                if (s) {
                    // Keep only changed values
                    // TODO: Needs review - isn't cssRule.changed supposed to be only what changed?
                    var changed = Object.entries(style)
                        .filter(function (_a) {
                        var key = _a[0], value = _a[1];
                        return cssRule.previousAttributes().style[key] !== value || !cssRule.previousAttributes().style[key];
                    })
                        .reduce(function (result, _a) {
                        var _b;
                        var key = _a[0], value = _a[1];
                        return __assign(__assign({}, result), (_b = {}, _b[key] = value, _b));
                    }, {});
                    // Removed keys
                    var removed = Object.keys(cssRule.previousAttributes().style)
                        .filter(function (key) { return !style[key]; });
                    if (Object.values(changed).length > 0 || removed.length > 0) {
                        this.updating = true;
                        s.applyStyle(inst, c, changed, removed);
                        this.updating = false;
                    }
                }
                else {
                    console.warn('Could not update instance', c, ': could not find the symbol with id', symbolId);
                }
            }
        }
    };
    return Symbols;
}(Backbone.Collection));
export { Symbols };
// From https://stackoverflow.com/questions/19673089/how-to-properly-define-backbone-collection-using-typescript
Symbols.prototype.model = Symbol;
