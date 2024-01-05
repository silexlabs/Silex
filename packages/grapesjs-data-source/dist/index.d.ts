import Backbone from 'backbone';
import { Button, Component, Editor, Page } from 'grapesjs';
import { TemplateResult } from 'lit';

/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
	filters: Partial<Filter>[] | string;
	dataSources: IDataSource[];
}
/**
 * Error thrown when a query cannot be built
 */
export interface BuildQueryErrorOptions {
	expression: Expression;
	component: Component;
	token: Token;
}
export declare class BuildQueryError extends Error {
	expression: Expression;
	component: Component;
	token: Token;
	constructor(message: string, options: BuildQueryErrorOptions);
}
export declare class DataTree {
	protected editor: DataSourceEditor;
	protected options: {
		dataSources: IDataSource[];
		filters: Filter[];
	};
	dataSources: IDataSource[];
	filters: Filter[];
	/**
	 * All types from all data sources
	 * Read only, updated when data sources are updated
	 */
	protected _allTypes: Type[];
	get allTypes(): Type[];
	/**
	 * All queryable fields from all data sources
	 */
	protected _queryables: Field[];
	get queryables(): Field[];
	constructor(editor: DataSourceEditor, options: {
		dataSources: IDataSource[];
		filters: Filter[];
	});
	/**
	 * Get type from typeId and dataSourceId
	 */
	getTypes(dataSourceId?: DataSourceId): Type[];
	/**
	 * Get type from typeId and dataSourceId
	 */
	getType(typeId: TypeId, dataSourceId?: DataSourceId): Type;
	/**
	 * Get all types from all data sources
	 */
	getAllTypes(): Type[];
	/**
	 * Get all queryable fields from all data sources
	 */
	getAllQueryables(): Field[];
	/**
	 * Evaluate an expression to a value
	 */
	getValue(context: Context, expression: Expression): unknown;
	/**
	 * Get all expressions used in all pages
	 */
	getAllPagesExpressions(): {
		page: Page;
		expressions: Expression[];
	}[];
	/**
	 * Get all expressions used in a page
	 * This will be used to fetch data for the page
	 */
	getPageExpressions(page: Page): Expression[];
	/**
	 * Get all expressions used by a component and its children
	 */
	getComponentExpressionsRecursive(component: Component): Expression[];
	/**
	 * Get all expressions used by a component
	 */
	getComponentExpressions(component: Component): Expression[];
	/**
	 * Build a tree of expressions
	 */
	getTrees(expression: Expression, dataSourceId: DataSourceId): Tree[];
	/**
	 * Check if a property is relative to a type
	 * A type is "relative" if next has a type which has a field of type tree.token
	 */
	isRelative(parent: Property, child: Property, dataSourceId: DataSourceId): boolean;
	/**
	 * From expressions to a tree
	 */
	toTree(expressions: Expression[], dataSourceId: DataSourceId): Tree | null;
	/**
	 * Recursively merge two trees
	 */
	protected mergeTrees(tree1: Tree, tree2: Tree): Tree;
}
/**
 * FIXME: Why sometimes the methods of the data source are in the attributes?
 * @return ds if it has the getTypes method or ds.attributes if it has the getTypes method
 */
export declare function getDataSourceClass(ds: IDataSource | {
	attributes: IDataSource;
}): IDataSource;
/**
 * GrapesJs plugin to manage data sources
 */
export declare class DataSourceManager extends Backbone.Collection<IDataSourceModel> {
	protected editor: DataSourceEditor;
	protected options: DataSourceEditorOptions;
	protected dataTree: DataTree;
	get filters(): Filter[];
	set filters(filters: Filter[]);
	constructor(models: IDataSourceModel[], editor: DataSourceEditor, options: DataSourceEditorOptions);
	/**
	 * Get all data sources
	 */
	getAll(): IDataSourceModel[];
	/**
	 * Forward events from data sources to the editor
	 */
	protected dataChangedBinded: (e?: CustomEvent) => void;
	dataChanged(e?: CustomEvent): void;
	/**
	 * Forward events from data sources to the editor
	 */
	protected dataSourceReadyBinded: (e?: CustomEvent) => void;
	dataSourceReady(e?: CustomEvent): void;
	/**
	 * Forward events from data sources to the editor
	 */
	protected dataSourceErrorBinded: (e?: CustomEvent) => void;
	dataSourceError(e?: CustomEvent): void;
	/**
	 * Listen to data source changes
	 */
	modelChanged(e?: CustomEvent): void;
	getDataTree(): DataTree;
	getPageQuery(page: Page): Record<DataSourceId, string>;
}
/**
 * Add the DataSourceManager to the GrapesJs editor
 */
export interface DataSourceEditor extends Editor {
	DataSourceManager: DataSourceManager;
}
export interface DataSourceEditorViewOptions {
	el?: HTMLElement | string | undefined | (() => HTMLElement);
	button?: Button | (() => Button);
	styles?: string;
	optionsStyles?: string;
}
/**
 * Options for the DataSourceEditor plugin
 */
export interface DataSourceEditorOptions {
	dataSources: IDataSourceOptions[];
	view: DataSourceEditorViewOptions;
	filters: Filter[] | string;
}
export type PageId = string;
export interface Query {
	expression: Expression;
}
/**
 * Tree structure for creating query from components states
 */
export interface Tree {
	token: Property;
	children: Tree[];
}
export type DataSourceId = string | number;
export interface IDataSource {
	id: DataSourceId;
	connect(): Promise<void>;
	getTypes(): Type[];
	getQueryables(): Field[];
	getQuery(tree: Tree): string;
}
export declare const DATA_SOURCE_READY = "data-source:ready";
export declare const DATA_SOURCE_ERROR = "data-source:error";
export declare const DATA_SOURCE_CHANGED = "data-source:changed";
export declare const COMPONENT_STATE_CHANGED = "component:state:changed";
export interface IDataSourceModel extends Backbone.Model, IDataSource {
}
export interface IDataSourceOptions extends Backbone.ModelSetOptions {
	id: DataSourceId;
	label: string;
	type: "graphql";
}
export type TypeId = string;
export type Type = {
	id: TypeId;
	label: string;
	fields: Field[];
	dataSourceId?: DataSourceId;
};
export declare const builtinTypeIds: string[];
export declare const builtinTypes: Type[];
export type FieldId = string;
export type FieldKind = "scalar" | "object" | "list" | "unknown";
export interface FieldArgument {
	name: string;
	typeId: TypeId;
	defaultValue?: unknown;
}
export interface Field {
	id: FieldId;
	label: string;
	typeIds: TypeId[];
	kind: FieldKind;
	dataSourceId?: DataSourceId;
	arguments?: FieldArgument[];
}
/**
 * A token can be a property or a filter
 */
export type Token = Property | Filter | State;
/**
 * Stored tokens are how the tokens are stored in the component as JSON
 * Use DataTree#fromStored to convert them back to tokens
 */
export type StoredToken = StoredProperty | StoredFilter | State;
export type Options = Record<string, unknown>;
/**
 * A property is used to make expressions and access data from the data source
 */
export interface BaseProperty {
	type: "property";
	propType: "field";
	dataSourceId?: DataSourceId;
}
export type PropertyOptions = Record<string, unknown>;
export interface StoredProperty extends BaseProperty {
	typeIds: TypeId[];
	fieldId: FieldId;
	label: string;
	kind: FieldKind;
	options?: PropertyOptions;
}
export interface Property extends StoredProperty {
	optionsForm?: (input: Field | null, options: Options) => TemplateResult | null;
}
/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string;
export interface StoredFilter {
	type: "filter";
	id: FilterId;
	label: string;
	options: Options;
	quotedOptions: string[];
}
export interface Filter extends StoredFilter {
	optionsForm?: (input: Field | null, options: Options) => TemplateResult | null;
	validate: (input: Field | null) => boolean;
	output: (input: Field | null, options: Options) => Field | null;
	apply: (input: unknown, options: Options) => unknown;
}
/**
 * A component state
 */
export type StateId = string;
export interface State {
	type: "state";
	storedStateId: StateId;
	label: string;
	componentId: string;
	exposed: boolean;
	forceKind?: FieldKind;
}
/**
 * A context is a list of available tokens for a component
 */
export type Context = Token[];
/**
 * An expression is a list of tokens which can be evaluated to a value
 * It is used to access data from the data source
 */
export type Expression = StoredToken[];
/**
 * Operators for condition in visibility property
 */
export declare enum UnariOperator {
	TRUTHY = "truthy",
	FALSY = "falsy",
	EMPTY_ARR = "empty array",
	NOT_EMPTY_ARR = "not empty array"
}
/**
 * Operators for condition in visibility property
 */
export declare enum BinariOperator {
	EQUAL = "==",
	NOT_EQUAL = "!=",
	GREATER_THAN = ">",
	LESS_THAN = "<",
	GREATER_THAN_OR_EQUAL = ">=",
	LESS_THAN_OR_EQUAL = "<="
}
/**
 * Override the prefix of state names
 */
export declare const COMPONENT_NAME_PREFIX = "nameForDataSource";
/**
 * Types
 */
export interface StoredState {
	label?: string;
	hidden?: boolean;
	expression: Expression;
}
export type PersistantId = string;
/**
 * Get the persistant ID of a component
 */
export declare function getPersistantId(component: Component): PersistantId | null;
/**
 * Get the persistant ID of a component and create it if it does not exist
 */
export declare function getOrCreatePersistantId(component: Component): PersistantId;
/**
 * Find a component by its persistant ID in the current page
 */
export declare function getComponentByPersistentId(id: PersistantId, editor: DataSourceEditor): Component | null;
/**
 * Find a component by its persistant ID in the current page
 */
export declare function getParentByPersistentId(id: PersistantId, component: Component | undefined): Component | null;
export declare function getStateDisplayName(child: Component, state: State): string;
export declare function onStateChange(callback: (state: StoredState | null, component: Component) => void): () => void;
/**
 * List all exported states
 */
export declare function getStateIds(component: Component, exported?: boolean): StateId[];
/**
 * Get the name of a state variable
 * Useful to generate code
 */
export declare function getStateVariableName(componentId: string, stateId: StateId): string;
/**
 * Get a state
 */
export declare function getState(component: Component, id: StateId, exported?: boolean): StoredState;
/**
 * Set a state
 */
export declare function setState(component: Component, id: StateId, state: StoredState, exported?: boolean): void;
/**
 * Remove a state
 */
export declare function removeState(component: Component, id: StateId, exported?: boolean): void;
/**
 * Get all expressions used by a component
 * Resolves all states token as expressions recursively
 * Resulting expressions contain properties and filters only, no states anymore
 */
export declare function resolveState(state: State, component: Component, dataTree: DataTree): Expression | null;
/**
 * Add missing methonds to the filter
 * When filters are stored they lose their methods
 */
export declare function getFilterFromToken(token: Filter, filters: Filter[]): Filter;
/**
 * Get the token from its stored form
 */
export declare function fromStored<T extends Token = Token>(token: StoredToken, dataTree: DataTree): T;
/**
 * Get the type corresponding to a token
 */
export declare function tokenToField(token: Token, prev: Field | null, component: Component, dataTree: DataTree): Field | null;
export declare function propertyToField(property: Property, dataTree: DataTree): Field;
/**
 * Evaluate the types of each token in an expression
 */
export declare function expressionToFields(expression: Expression, component: Component, dataTree: DataTree): Field[];
/**
 * Evaluate an expression to a type
 * This is used to validate expressions and for autocompletion
 */
export declare function getExpressionResultType(expression: Expression, component: Component, dataTree: DataTree): Field | null;
/**
 * Get the options of a token
 */
export declare function getTokenOptions(field: Field): {
	optionsForm: (input: Field | null, options: Options) => TemplateResult;
	options: Options;
} | null;
/**
 * Get the options of a token or a field
 */
export declare function optionsToOptionsForm(arr: {
	name: string;
	value: unknown;
}[]): (input: Field | null, options: Options) => TemplateResult;
/**
 * Utility function to shallow compare two objects
 * Used to compare options of tree items
 */
export declare function sameOptions(option1: PropertyOptions | undefined, option2: PropertyOptions | undefined): boolean;
export declare function buildArgs(options: PropertyOptions | undefined): string;
/**
 * Get the context of a component
 * This includes all parents states, data sources queryable values, values provided in the options
 */
export declare function getContext(component: Component, dataTree: DataTree): Context;
/**
 * Create a property token from a field
 */
export declare function fieldToToken(field: Field): Property;
/**
 * Auto complete an expression
 * @returns a list of possible tokens to add to the expression
 */
export declare function getCompletion(component: Component, expression: Expression, dataTree: DataTree, rootType?: TypeId): Context;
/**
 * Concatenate strings to get a desired length string as result
 * Exported for tests
 */
export declare function concatWithLength(desiredNumChars: number, ...strings: string[]): string;
/**
 * Get the label for a token
 * This is mostly about formatting a string for the dropdowns
 */
export declare function getTokenDisplayName(component: Component, token: Token): string;
/**
 * Group tokens by type
 * This is used to create the groups in dropdowns
 */
export declare function groupByType(editor: DataSourceEditor, component: Component, completion: Token[], expression: Expression): Record<string, Token[]>;
/**
 * Create a "fixed" token
 * It is a hard coded content with which you can start an expression
 */
export declare const FIXED_TOKEN_ID = "fixed";
export declare function getFixedToken(value: string): Token;
/**
 * Convert a token to a string
 * This is used to store the token in the component
 */
export declare function toValue(token: Token): string;
/**
 * Convert a token to an option's tag value (json string)
 */
export declare function toId(token: Token): string;
/**
 * Revert an option's tag value to a token
 */
export declare function fromString(editor: DataSourceEditor, id: string): Token;
/**
 * Check if a json is an expression, i.e. an array of tokens
 */
export declare function isExpression(json: unknown): boolean;
/**
 * Convert a json to an expression
 */
export declare function toExpression(json: unknown | string): Expression | null;
/**
 * Apply a kind to a field
 */
export declare function convertKind(field: Field | null, from: FieldKind, to: FieldKind): Field | null;
/**
 * Get the type of a field, as provided by the data source
 */
export declare function getFieldType(editor: DataSourceEditor, field: Field | null, key: string | undefined): Field | null;
/**
 * Generate a form to edit the options of a token
 */
export declare function optionsFormKeySelector(editor: DataSourceEditor, field: Field | null, options: Options, name: string): TemplateResult;
declare const _default: (editor: DataSourceEditor, opts?: Partial<DataSourceEditorOptions>) => void;
/**
 * Version of the plugin
 * This is replaced by the build script
 */
export declare const version = "__VERSION__";

export {
	_default as default,
};

export {};
