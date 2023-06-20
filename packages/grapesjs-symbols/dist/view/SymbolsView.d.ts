import Backbone, { ViewOptions } from 'backbone';
import { SymbolEditor } from '../model/Symbols';
import { Position } from 'grapesjs';
export interface SymbolsViewOptions extends ViewOptions {
    editor: SymbolEditor;
    appendTo: string;
    selectColor: string;
    emptyText: string;
}
export default class extends Backbone.View {
    protected options: SymbolsViewOptions;
    protected lastPos: Position | null;
    protected lastTarget: HTMLElement | null;
    constructor(options: SymbolsViewOptions);
    render(): this;
    onDrop(event: Event): void;
    onRemove(event: Event): void;
}
