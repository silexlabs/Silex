import { SymbolEditor } from './model/Symbols';
export declare const cmdAddSymbol = "symbols:add";
export declare const cmdRemoveSymbol = "symbols:remove";
export declare const cmdUnlinkSymbol = "symbols:unlink";
export declare const cmdCreateSymbol = "symbols:create";
export interface SymbolOptions {
    appendTo?: string;
    emptyText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    highlightColor?: string;
}
declare const _default: (editor: SymbolEditor, opts?: Partial<SymbolOptions>) => void;
export default _default;
