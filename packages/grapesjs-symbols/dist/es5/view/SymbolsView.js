"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDialog = confirmDialog;
var lit_html_1 = require("lit-html");
var unsafe_html_js_1 = require("lit-html/directives/unsafe-html.js");
var backbone_1 = __importDefault(require("backbone"));
function closestHtml(child, attr) {
    var ptr = child;
    while (ptr && !ptr.getAttribute(attr)) {
        ptr = ptr.parentElement;
    }
    return ptr;
}
function confirmDialog(_a) {
    var editor = _a.editor, main = _a.content, title = _a.title, primaryLabel = _a.primaryLabel, _b = _a.secondaryLabel, secondaryLabel = _b === void 0 ? 'Cancel' : _b, cbk = _a.cbk, lsKey = _a.lsKey;
    // Check if the user has already been asked
    if (localStorage.getItem(lsKey) === 'on') {
        cbk();
    }
    else {
        var content = document.createElement('div');
        editor.Modal.open({
            title: title,
            content: content,
        });
        var remember_1 = 'off';
        (0, lit_html_1.render)((0, lit_html_1.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<main>\n        ", "\n      </main><footer style=\"\n        display: flex;\n        justify-content: space-between;\n        margin-top: 30px;\n      \">\n        <div>\n          <label class=\"gjs-field gjs-field-checkbox\" style=\"\n            float: left;\n            margin-right: 10px;\n          \">\n            <input type=\"checkbox\" id=\"remember\" @click=", ">\n            <i class=\"gjs-chk-icon\"></i>\n          </label>\n          <label for=\"remember\">Don't ask me again</label>\n        </div>\n        <div>\n          <button\n            class=\"gjs-btn-prim\"\n            @click=", "\n            style=\"\n              margin-left: auto;\n              background: transparent;\n              margin-right: 10px;\n            \">", "</button>\n          <button class=\"gjs-btn-prim\" @click=", ">", "</button>\n        </div>\n      </footer>"], ["<main>\n        ", "\n      </main><footer style=\"\n        display: flex;\n        justify-content: space-between;\n        margin-top: 30px;\n      \">\n        <div>\n          <label class=\"gjs-field gjs-field-checkbox\" style=\"\n            float: left;\n            margin-right: 10px;\n          \">\n            <input type=\"checkbox\" id=\"remember\" @click=", ">\n            <i class=\"gjs-chk-icon\"></i>\n          </label>\n          <label for=\"remember\">Don't ask me again</label>\n        </div>\n        <div>\n          <button\n            class=\"gjs-btn-prim\"\n            @click=", "\n            style=\"\n              margin-left: auto;\n              background: transparent;\n              margin-right: 10px;\n            \">", "</button>\n          <button class=\"gjs-btn-prim\" @click=", ">", "</button>\n        </div>\n      </footer>"])), (0, unsafe_html_js_1.unsafeHTML)(main), function (_a) {
            var rememberCheckbox = _a.target;
            return remember_1 = rememberCheckbox.value;
        }, function () { return editor.Modal.close(); }, secondaryLabel, function () {
            cbk();
            localStorage.setItem(lsKey, remember_1);
            editor.Modal.close();
        }, primaryLabel), content);
    }
}
var default_1 = /** @class */ (function (_super) {
    __extends(default_1, _super);
    //initialize(model, { editor, options }) {
    // FIXME: why is editor in options?
    function default_1(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        _this.lastPos = null;
        _this.lastTarget = null;
        // listen to redraw UI
        if (!options.model)
            throw new Error('Could not create Symbol: model is required');
        options.model.on('add update remove', function () { return _this.render(); });
        options.editor.on('component:selected', function () { return _this.render(); });
        // listen to drag event in order to have access to the drop target
        options.editor.on('sorter:drag', function (event) {
            _this.lastPos = event.pos;
            _this.lastTarget = event.target;
        });
        // list wrapper
        _this.el = document.createElement('div');
        _this.el.classList.add('symbols__wrapper');
        document.querySelector(options.appendTo)
            .appendChild(_this.el);
        // first render
        _this.render();
        return _this;
    }
    default_1.prototype.render = function () {
        var _this = this;
        var symbols = this.model;
        var selected = this.options.editor.getSelected();
        (0, lit_html_1.render)((0, lit_html_1.html)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n    <style>\n      .symbols__symbol-selected {\n        border: 1px solid ", ";\n      }\n      .symbols__symbol {\n        position: relative;\n      }\n      .symbols__num {\n        font-size: xx-small;\n      }\n      .symbols__empty {\n        padding: 10px;\n        text-align: center;\n        width: 100%;\n      }\n      .symbols__remove {\n        position: absolute;\n        top: 0; right: 0;\n        width: 20px;\n        line-height: 1;\n        cursor: pointer;\n      }\n    </style>\n    <main class=\"symbols__list\" @dragend=", ">\n      <div class=\"gjs-blocks-c\">\n      ", "\n       ", "\n       </div>\n     </main>\n   "], ["\n    <style>\n      .symbols__symbol-selected {\n        border: 1px solid ", ";\n      }\n      .symbols__symbol {\n        position: relative;\n      }\n      .symbols__num {\n        font-size: xx-small;\n      }\n      .symbols__empty {\n        padding: 10px;\n        text-align: center;\n        width: 100%;\n      }\n      .symbols__remove {\n        position: absolute;\n        top: 0; right: 0;\n        width: 20px;\n        line-height: 1;\n        cursor: pointer;\n      }\n    </style>\n    <main class=\"symbols__list\" @dragend=", ">\n      <div class=\"gjs-blocks-c\">\n      "
            // keep the same structure as the layers panel
            , "\n       ", "\n       </div>\n     </main>\n   "])), this.options.highlightColor, function (event) { return _this.onDrop(event); }, 
        // keep the same structure as the layers panel
        symbols
            .map(function (s) { return (0, lit_html_1.html)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n          <div\n            class=\"gjs-block gjs-one-bg gjs-four-color-h symbols__symbol\n              ", "\n              fa ", "\n            \"\n            title=\"\" draggable=\"true\"\n            symbol-id=", ">\n            <div title=\"Unlink all instances and delete Symbol\" class=\"symbols__remove\" @click=", ">\n              <svg viewBox=\"0 0 24 24\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z\"></path></svg>\n            </div>\n            <div class=\"gjs-block-label\">\n              ", "\n              <div class=\"symbols__num\">\n                ", " instances\n              </div>\n            </div>\n          </div>\n         "], ["\n          <div\n            class=\"gjs-block gjs-one-bg gjs-four-color-h symbols__symbol\n              ", "\n              fa ", "\n            \"\n            title=\"\" draggable=\"true\"\n            symbol-id=", ">\n            <div title=\"Unlink all instances and delete Symbol\" class=\"symbols__remove\" @click=", ">\n              <svg viewBox=\"0 0 24 24\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z\"></path></svg>\n            </div>\n            <div class=\"gjs-block-label\">\n              ", "\n              <div class=\"symbols__num\">\n                ", " instances\n              </div>\n            </div>\n          </div>\n         "])), !!selected && s.get('instances').has(selected.cid) ? 'symbols__symbol-selected' : '', s.attributes.icon, s.cid, function (event) { return _this.onRemove(event); }, s.attributes.label, s.get('instances').size); }), symbols.length ? '' : (0, lit_html_1.html)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["<div class=\"symbols__empty\">\n        ", "\n       </div>"], ["<div class=\"symbols__empty\">\n        ", "\n       </div>"])), this.options.emptyText)), this.el);
        return this;
    };
    default_1.prototype.onDrop = function (event) {
        var symbolId = event.target.getAttribute('symbol-id');
        if (symbolId) {
            var symbol = this.options.editor.Symbols.get(symbolId);
            if (symbol) {
                var c = this.options.editor.runCommand('symbols:create', { symbol: symbol, pos: this.lastPos, target: this.lastTarget });
            }
            else {
                console.error("Could not create an instance of symbol ".concat(symbolId, ": symbol not found"));
            }
        }
        else {
            // not a symbol creation
        }
    };
    default_1.prototype.onRemove = function (_a) {
        var _this = this;
        var deleteButton = _a.target;
        // Warn the user
        confirmDialog({
            editor: this.options.editor,
            title: 'Delete Symbol',
            content: "\n          <p>Are you sure you want to delete this symbol?</p>\n          <p>Deleting this symbol <em>will not</em> delete its instances, just disconnects them. Confirm to proceed or cancel to maintain the current link.</p>\n        ",
            primaryLabel: 'Delete',
            cbk: function () {
                _this.onRemoveConfirm(deleteButton);
            },
            lsKey: 'delete-symbol',
        });
    };
    default_1.prototype.onRemoveConfirm = function (target) {
        var _a;
        var symbolId = (_a = closestHtml((target), 'symbol-id')) === null || _a === void 0 ? void 0 : _a.getAttribute('symbol-id');
        if (symbolId) {
            var c = this.options.editor.runCommand('symbols:remove', { symbolId: symbolId });
        }
        else {
            console.error('not a symbol', symbolId);
        }
    };
    return default_1;
}(backbone_1.default.View));
exports.default = default_1;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
