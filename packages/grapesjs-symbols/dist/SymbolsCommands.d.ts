import { Editor, Component } from 'grapesjs';
import Symbol from './model/Symbol';
import { SymbolEditor } from './model/Symbols';
export declare const cmdAdd = "symbols:add";
export declare const cmdRemove = "symbols:remove";
export declare const cmdUnlink = "symbols:unlink";
export declare const cmdCreate = "symbols:create";
export default function ({ editor, options }: {
    editor: Editor;
    options: any;
}): void;
/**
 * Create a new symbol
 * @param options.component - the component which will become the first instance of the symbol
 * @returns {Symbol}
 */
export declare function addSymbol(editor: SymbolEditor, sender: any, { label, icon, component }: {
    label: string;
    icon: string;
    component: Component | undefined;
}): Symbol;
/**
 * Delete a symbol
 * @param {symbolId: string} - object containing the symbolId
 */
export declare function removeSymbol(editor: SymbolEditor, sender: any, { symbolId }: {
    symbolId: string;
}): Symbol;
export declare function unlinkSymbolInstance(editor: SymbolEditor, sender: any, { component }: {
    component: Component;
}): void;
/**
 * @param {{index, indexEl, method}} pos Where to insert the component, as [defined by the Sorter](https://github.com/artf/grapesjs/blob/0842df7c2423300f772e9e6cdc88c6ae8141c732/src/utils/Sorter.js#L871)
 */
export declare function createSymbolInstance(editor: SymbolEditor, sender: any, { symbol, pos, target }: {
    symbol: Symbol;
    pos: any;
    target: HTMLElement;
}): Component;
