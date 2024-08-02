import Backbone, { ViewOptions } from 'backbone';
import { SymbolEditor } from '../model/Symbols';
import { Position } from 'grapesjs';
export declare function confirmDialog({ editor, content: main, title, primaryLabel, secondaryLabel, cbk, lsKey, }: {
    editor: SymbolEditor;
    content: string;
    title: string;
    primaryLabel: string;
    secondaryLabel?: string;
    cbk: () => void;
    lsKey: string;
}): void;
export interface SymbolsViewOptions extends ViewOptions {
    editor: SymbolEditor;
    appendTo: string;
    highlightColor: string;
    emptyText: string;
}
export default class extends Backbone.View {
    protected options: SymbolsViewOptions;
    protected lastPos: Position | null;
    protected lastTarget: HTMLElement | null;
    constructor(options: SymbolsViewOptions);
    render(): this;
    onDrop(event: Event): void;
    onRemove({ target: deleteButton }: {
        target: any;
    }): void;
    onRemoveConfirm(target: HTMLElement): void;
}
