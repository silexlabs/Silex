import Backbone from 'backbone';
import Symbol from './Symbol';
import { Editor, Component, CssRule } from 'grapesjs';
export type SymbolEditor = Editor & {
    Symbols: Symbols;
};
export declare class Symbols extends Backbone.Collection<Symbol> {
    editor: Editor;
    options: any;
    updating: boolean;
    constructor(models: Symbol[], { editor, options, ...opts }: any);
    disableUndo(disable: any): void;
    preventUndo(cbk: any): Promise<void>;
    initEvents(): void;
    /**
     * Update sybols with existing components
     * This is used on load only
     * TODO: Use `storage:end:load`? But this event is fired after the components are loaded
     * TODO: Needs review
     * @private
     */
    updateComponents(components: Component[]): void;
    /**
     * Prevent drop on a symbol into itself or things similar
     */
    onDrag({ target, parent }: {
        target: any;
        parent: any;
    }): void;
    /**
     * Add a component to a symbol
     * This is useful only when loading new HTML content
     * When loading a new component which is a symbol,
     *   add a ref to the component in its symbol.get('instances')
     * Export this method for unit tests
     * TODO: Needs review
     * @private
     */
    onAdd(c: Component): void;
    /**
     * A component's components() has changed
     */
    onUpdateChildren(parent: Component, component: Component): Promise<void>;
    /**
     * A component's attributes has changed
     */
    onUpdateAttributes(c: Component): void;
    /**
     * A component's css classes have changed
     */
    onUpdateClasses(c: Component): Promise<void>;
    /**
     * A component's text content has changed
     */
    onUpdateContent(c: Component): void;
    /**
     * A component's style has changed
     * TODO: Needs review: isn't the style supposed to be just an attribute => we should not need to sync it, just attributes?
     */
    onStyleChanged(cssRule: CssRule): void;
}
