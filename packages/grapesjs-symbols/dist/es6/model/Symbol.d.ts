import Backbone from 'backbone';
import { Component, ComponentProperties } from 'grapesjs';
import { SymbolEditor } from './Symbols';
export declare const SYMBOL_ID_ATTRIBUTE = "symbolId";
export declare const SYMBOL_CHILD_ID_ATTRIBUTE = "symbolChildId";
export declare const SYMBOL_SYNC_ATTRIBUTE = "symbolSync";
/**
 * A Symbol class holds the data about a symbol: label, icon
 * The `model` attribute is a grapesjs Component used to create new instances
 * The `instances` attribute is a Map of grapesjs Components kept in sync with the model
 * The model is kept up to date by calling the apply* methods
 *
 * @member {string} attributes.label
 * @member {string} attributes.icon
 * @member {Component} attributes.model
 * @member {Map.<string, Component>} attributes.instances
 *
 * @class
 */
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
    getAll(addOne?: Component | null, excludeOne?: Component | null): Component[];
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
     * @param parent - the element whose children have changed
     * @param srcChild - the child which has the changes
     */
    applyChildren(srcInst: Component, parent: Component, srcChild: Component): void;
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
/**
 * @param c - a component, supposedly an instance of a symbol
 * @return the symbol ID if the component is a symbol
 */
export declare function getSymbolId(c: Component): string;
/**
 * remove symbols IDs from an instance
 */
export declare function cleanup(c: Component): void;
/**
 * Init a component to be this symbol's `model`
 * Also init the component's children
 * @param {Component} c
 */
export declare function initModel(c: Component, { icon, label, symbolId }: ComponentProperties): void;
/**
 * Init a component to be this symbol's `model`'s child
 * @param {Component} c
 */
export declare function initSymbolChild(c: Component, force?: boolean): void;
/**
 * create a new symbol ou of a component
 * the component and its children will be init
 * the component will be cloned and stored as the model
 * @return {Symbol}
 */
export declare function createSymbol(editor: SymbolEditor, c: Component, attributes: ComponentProperties): Symbol;
export default Symbol;
