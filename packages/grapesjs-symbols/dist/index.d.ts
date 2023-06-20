import Backbone from 'backbone';
import { Component, CssRule, Editor } from 'grapesjs';

declare class Symbol extends Backbone.Model {
	/**
	 * Default options passed to the constructor
	 */
	/**
	 * @param {{ label: ?string, icon: ?string }} attributes
	 * @param {Object} model - to be converted to Component and stored in attributes.model
	 * Notes:
	 * - `attributes.instances` will initially be empty until addInstance is called by the Symbols class (onAdd method)
	 * - `attributes.model` may initially be a Component (creation of a Symbol) or JSON data (loaded symbol from storage). It is always converted to a Component in `initialize`
	 *
	 */
	initialize(): void;
	/**
	 * Return a shallow copy of the model's attributes for JSON
	 * stringification.
	 * @return {Object}
	 * @private
	 */
	toJSON(opts?: {}): any;
	/**
	 * Get all instances as an Array, except the `excludeOne` one
	 * @param callback which receives the instances
	 * @param excludeOne - optionally exclude one component
	 * @param addOne - optionally add one component, typically pass the symbol's `model` attribute when needed
	 * @returns The symbol instances
	 * @private
	 */
	getAll(addOne: Component | null, excludeOne: Component | null): Component[];
	/**
	 * Browse all instances and their children matching the changed component
	 * Includes the `model` of this symbol
	 * Will not include the provided instance `srcInst` nor `srcChild` as they are the ones which changed
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 */
	browseInstancesAndModel(srcInst: Component, srcChildren: Component[], cbk: (dstChildren: Component[], dstInst: Component) => void): void;
	/**
	 * Apply css classes to all instances and their children according to changes of a component
	 * Also update the `model` attribute of this symbol
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 */
	applyClasses(srcInst: Component, srcChild: Component): void;
	getIndex(parent: Component, symbolChildId: string): number;
	/**
	 * Update attributes of all instances and their children according to changes of a component
	 * Also update the `model` attribute of this symbol
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 */
	applyChildren(srcInst: Component, srcChild: Component): void;
	/**
	 * Update attributes of all instances and their children according to changes of a component
	 * Also update the `model` attribute of this symbol
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 */
	applyAttributes(srcInst: Component, srcChild: Component): void;
	/**
	 * Update text content of all instances and their children according to changes of a component
	 * Also update the `model` attribute of this symbol
	 * Will not update the provided instance `inst` as it is the one which changed
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 */
	applyContent(srcInst: Component, srcChild: Component): void;
	/**
	 * Update styles of all instances and their children according to changes of a component
	 * Also update the `model` attribute of this symbol
	 * Will not update the provided instance `inst` as it is the one which changed
	 * @param srcInst - the instance of this symbol containing `child`
	 * @param srcChild - the child which has the changes
	 * @param changed - the changed styles
	 * @param removed - the removed styles
	 */
	applyStyle(srcInst: Component, srcChild: Component, changed: object, removed: string[]): void;
	/**
	 * Add a component to this symbol `instances`
	 * Called at init when editor triggers a 'components:add' event
	 * @param c
	 */
	addInstance(c: Component): void;
	/**
	 * @return {Component} The created instance, ready to be added to a component
	 */
	createInstance(): any;
	/**
	 * @param c - a component
	 * @return {Boolean} true if the component is a symbol
	 */
	isInstance(c: Component): any;
	/**
	 * unlink all instances of a symbol
	 */
	unlinkAll(): void;
	/**
	 * unlink an instance from a symbol
	 * - remove the symbol ID from the attributes
	 * - remove `symbolChildId` from all the children until they are symbols
	 * - remove the reference in instances
	 */
	unlink(c: Component): void;
}
export type SymbolEditor = Editor & {
	Symbols: Symbols;
};
declare class Symbols extends Backbone.Collection<Symbol> {
	editor: Editor;
	options: any;
	updating: boolean;
	constructor(models: Symbol[], { editor, options, ...opts }: any);
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
	onUpdateClasses(c: Component): void;
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
export declare const cmdAddSymbol = "symbols:add";
export declare const cmdRemoveSymbol = "symbols:remove";
export declare const cmdUnlinkSymbol = "symbols:unlink";
export declare const cmdCreateSymbol = "symbols:create";
declare const _default: (editor: SymbolEditor, opts?: any) => void;

export {
	_default as default,
};

export {};
