import { Component } from 'grapesjs';
import { SymbolEditor } from './model/Symbols';
/**
 * set editor as dirty
 */
export declare function setDirty(editor: SymbolEditor): void;
/**
 * browse all pages and retrieve all website components
 */
export declare function getAllComponentsFromEditor(editor: SymbolEditor): Component[];
/**
 * Get all the children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component's children
 */
export declare function children(c: Component): Component[];
/**
 * Get an array of the component + its children excluding symbols children
 * @param {Component} c - the root component
 * @returns {(Component|null)} the root component itself and its children
 */
export declare function all(c: Component): Component[];
/**
 * Find a component in a component's children, with a given symbolChildId or symbolId
 * @param {Component} c - the root component
 * @param {string} cid - the ID we are looking for
 * @returns {(Component|null)} the component itself or one of its children
 */
export declare function find(c: Component, symbolChildId: string): Component | null;
/**
 * find the first symbol in the parents (or the element itself)
 * @private
 */
export declare function closestInstance(c: Component): Component | undefined;
/**
 * @param {Component} c - a component
 * @return {Boolean} true if the component has a symbol id
 */
export declare function hasSymbolId(c: Component): boolean;
export declare function wait(ms?: number): Promise<unknown>;
/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export declare function getNodePath(root: Node, node: Node): any[];
/**
 * Get an array of the indexes of the node in its parent nodes
 * @example <div><div></div><div><div id="test"/> => returns [1, 0] for #test
 */
export declare function getNode(root: Node, path: number[]): Node | null;
/**
 * Gets the caret position
 */
export declare function getCaret(el: HTMLElement): {
    path: number[];
    pos: number;
};
/**
 * Sets the caret position
 */
export declare function setCaret(el: HTMLElement, { path, pos }: {
    path: number[];
    pos: number;
}): void;
/**
 * Find if a parent is also a child of the symbol
 */
export declare function allowDrop({ target, parent }: {
    target: any;
    parent: any;
}): boolean;
