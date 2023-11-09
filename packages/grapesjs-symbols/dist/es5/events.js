"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolEvents = void 0;
var SymbolEvents;
(function (SymbolEvents) {
    SymbolEvents["CREATE"] = "symbols:create";
    SymbolEvents["REMOVE"] = "symbols:remove";
    SymbolEvents["LINK"] = "symbols:link";
    SymbolEvents["UNLINK"] = "symbols:unlink";
    SymbolEvents["CREATE_INSTANCE"] = "symbols:create:instance";
    SymbolEvents["DELETE_INSTANCE"] = "symbols:delete:instance";
})(SymbolEvents || (exports.SymbolEvents = SymbolEvents = {}));
