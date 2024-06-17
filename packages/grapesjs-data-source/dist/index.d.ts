import Backbone from 'backbone';
import { Button, Component, Editor, Page } from 'grapesjs';
import { LitElement, TemplateResult } from 'lit';

export interface ComponentExpression {
	expression: Expression;
	component: Component;
}
/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
	filters: Partial<Filter>[] | string;
	dataSources: IDataSource[];
}
export declare const STANDARD_TYPES: Type[];
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
	 * @throws Error if type is not found
	 * @param componentId is used for error messages
	 */
	getType(typeId: TypeId, dataSourceId: DataSourceId | null, componentId: string | null): Type;
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
	getValue(context: Context, expression: ComponentExpression): unknown;
	/**
	 * Get all expressions used in all pages
	 */
	getAllPagesExpressions(): {
		page: Page;
		expressions: ComponentExpression[];
	}[];
	/**
	 * Get all expressions used in a page
	 * This will be used to fetch data for the page
	 */
	getPageExpressions(page: Page): ComponentExpression[];
	/**
	 * Get all expressions used by a component and its children
	 */
	getComponentExpressionsRecursive(component: Component): ComponentExpression[];
	/**
	 * Get all expressions used by a component
	 */
	getComponentExpressions(component: Component): ComponentExpression[];
	/**
	 * Build a tree of expressions
	 */
	getTrees({ expression, component }: ComponentExpression, dataSourceId: DataSourceId): Tree[];
	/**
	 * Check if a property is relative to a type
	 * A type is "relative" if parent has a type which has a field of type tree.token
	 * FIXME: need a better way to check if a property is relative, e.g. have a "relative" flag on the property, set depending on <state-editor root-type
	 */
	isRelative(parent: Property, child: Property, dataSourceId: DataSourceId): boolean;
	/**
	 * From expressions to a tree
	 */
	toTrees(expressions: ComponentExpression[], dataSourceId: DataSourceId): Tree[];
	/**
	 * Recursively merge two trees
	 */
	protected mergeTrees(tree1: Tree, tree2: Tree): Tree;
	/**
	 * Get all expressions used by a component
	 * Resolves all states token as expressions recursively
	 * Resulting expressions contain properties and filters only, no states anymore
	 */
	resolveState(state: State, component: Component): Expression | null;
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
	protected dataSourceReadyBinded: (ds: IDataSource) => void;
	dataSourceReady(ds: IDataSource): void;
	/**
	 * Forward events from data sources to the editor
	 */
	protected dataSourceErrorBinded: (message: string, ds: IDataSource) => void;
	dataSourceError(message: string, ds: IDataSource): void;
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
	settingsEl?: HTMLElement | string | (() => HTMLElement);
	button?: Button | (() => Button);
	styles?: string;
	optionsStyles?: string;
	defaultFixed?: boolean;
	disableStates?: boolean;
	disableAttributes?: boolean;
	disableProperties?: boolean;
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
	hidden?: boolean;
	connect(): Promise<void>;
	isConnected(): boolean;
	getTypes(): Type[];
	getQueryables(): Field[];
	getQuery(trees: Tree[]): string;
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
	readonly?: boolean;
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
	optionsForm?: (selected: Component, input: Field | null, options: Options, stateName: string) => TemplateResult | null;
}
/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string;
export interface StoredFilter {
	type: "filter";
	id: FilterId;
	filterName?: FilterId;
	label: string;
	options: Options;
	quotedOptions?: string[];
	optionsKeys?: string[];
}
export interface Filter extends StoredFilter {
	optionsForm?: (selected: Component, input: Field | null, options: Options, stateName: string) => TemplateResult | null;
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
 * Properties of elements
 * What is not a property is an attribute or a state
 */
export declare enum Properties {
	innerHTML = "innerHTML",
	condition = "condition",
	condition2 = "condition2",
	__data = "__data"
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
export interface StoredStateWithId extends StoredState {
	id: StateId;
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
 * Find a component by its persistant ID in
 */
export declare function getChildByPersistantId(id: PersistantId, parent: Component): Component | null;
/**
 * Find a component by its persistant ID in the current page
 */
export declare function getParentByPersistentId(id: PersistantId, component: Component | undefined): Component | null;
/**
 * Get the display name of a state
 */
export declare function getStateDisplayName(child: Component, state: State): string;
export declare function onStateChange(callback: (state: StoredState | null, component: Component) => void): () => void;
/**
 * List all exported states
 */
export declare function getStateIds(component: Component, exported?: boolean, before?: StateId): StateId[];
/**
 * List all exported states
 */
export declare function getStates(component: Component, exported?: boolean): StoredState[];
/**
 * Get the name of a state variable
 * Useful to generate code
 */
export declare function getStateVariableName(componentId: string, stateId: StateId): string;
/**
 * Get a state
 */
export declare function getState(component: Component, id: StateId, exported?: boolean): StoredState | null;
/**
 * Set a state
 * The state will be updated or created at the end of the list
 * Note: index is not used in this project anymore (maybe in apps using this plugins)
 */
export declare function setState(component: Component, id: StateId, state: StoredState, exported?: boolean, index?: number): void;
/**
 * Remove a state
 */
export declare function removeState(component: Component, id: StateId, exported?: boolean): void;
/**
 * Add missing methonds to the filter
 * When filters are stored they lose their methods
 * @throws Error if the filter is not found
 */
export declare function getFilterFromToken(token: Filter, filters: Filter[]): Filter;
/**
 * Get the token from its stored form
 * @throws Error if the token type is not found
 */
export declare function fromStored<T extends Token = Token>(token: StoredToken, dataTree: DataTree, componentId: string | null): T;
/**
 * Get the type corresponding to a token
 */
export declare function tokenToField(token: Token, prev: Field | null, component: Component, dataTree: DataTree): Field | null;
/**
 * Get the type corresponding to a property
 * @throws Error if the type is not found
 */
export declare function propertyToField(property: Property, dataTree: DataTree, componentId: string | null): Field;
/**
 * Evaluate the types of each token in an expression
 */
export declare function expressionToFields(expression: Expression, component: Component, dataTree: DataTree): Field[];
/**
 * Evaluate an expression to a type
 * This is used to validate expressions and for autocompletion
 * @throws Error if the token type is not found
 */
export declare function getExpressionResultType(expression: Expression, component: Component, dataTree: DataTree): Field | null;
/**
 * Get the options of a token
 */
export declare function getTokenOptions(field: Field): {
	optionsForm: (selected: Component, input: Field | null, options: Options) => TemplateResult;
	options: Options;
} | null;
/**
 * Get the options of a token or a field
 */
export declare function optionsToOptionsForm(arr: {
	name: string;
	value: unknown;
}[]): (selected: Component, input: Field | null, options: Options) => TemplateResult;
/**
 * Utility function to shallow compare two objects
 * Used to compare options of tree items
 */
export declare function getOptionObject(option1: PropertyOptions | undefined, option2: PropertyOptions | undefined): {
	error: boolean;
	result: PropertyOptions | undefined;
};
export declare function buildArgs(options: PropertyOptions | undefined): string;
/**
 * Get the context of a component
 * This includes all parents states, data sources queryable values, values provided in the options
 */
export declare function getContext(component: Component, dataTree: DataTree, currentStateId?: StateId, hideLoopData?: boolean): Context;
/**
 * Create a property token from a field
 */
export declare function fieldToToken(field: Field): Property;
/**
 * Auto complete an expression
 * @returns a list of possible tokens to add to the expression
 */
export declare function getCompletion(options: {
	component: Component;
	expression: Expression;
	dataTree: DataTree;
	rootType?: TypeId;
	currentStateId?: StateId;
	hideLoopData?: boolean;
}): Context;
export declare const NOTIFICATION_GROUP = "Data source";
/**
 * Get the display name of a field
 */
export declare function cleanStateName(name: string | null): string | undefined;
export declare function getComponentDebug(component: Component): string;
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
 * @throws Error if the token type is not found
 */
export declare function fromString(editor: DataSourceEditor, id: string, componentId: string | null): Token;
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
 * @throws Error if the field has a token with an unknown type
 */
export declare function getFieldType(editor: DataSourceEditor, field: Field | null, key: string | undefined, componentId: string | null): Field | null;
/**
 * Generate a form to edit the options of a token
 * @throws Error if the field has a token with an unknown type
 */
export declare function optionsFormKeySelector(editor: DataSourceEditor, field: Field | null, options: Options, name: string): TemplateResult;
/**
 * Get a container element from an option
 * @throws Error if the option is not a string or an HTMLElement or a function
 * @throws Error if the element is not found
 */
export declare function getElementFromOption(option: HTMLElement | string | (() => HTMLElement) | undefined, optionNameForError: string): HTMLElement;
/**
 * Editor for a state of the selected element's properties
 *
 * Usage:
 *
 * ```
 * <properties-editor disabled>
 *   <style> / * Custom styles * / </style>
 * </properties-editor>
 * ```
 *
 */
export declare class StateEditor extends LitElement {
	disabled: boolean;
	name: string;
	hideLoopData: boolean;
	/**
	 * used in the expressions found in filters options
	 * This will be used to filter states which are not defined yet
	 */
	parentName: string;
	noFilters: boolean;
	rootType: string;
	defaultFixed: boolean;
	dismissCurrentComponentStates: boolean;
	private _selected;
	get selected(): Component | null;
	set selected(value: Component | null);
	/**
	 * Value string for for submissions
	 */
	get value(): string;
	set value(newValue: string);
	/**
	 * Form id
	 * This is the same API as input elements
	 */
	for: string;
	/**
	 * Binded listeners
	 */
	private onFormdata_;
	private renderBinded;
	connectedCallback(): void;
	disconnectedCallback(): void;
	/**
	 * Handle formdata event to add the current value to the form
	 */
	private onFormdata;
	/**
	 * Form setter
	 * Handle formdata event to add the current value to the form
	 */
	protected _form: HTMLFormElement | null;
	set form(newForm: HTMLFormElement | null);
	get form(): HTMLFormElement | null;
	/**
	 * Structured data
	 */
	private _data;
	get data(): Token[];
	set data(value: Token[] | string);
	private _editor;
	get editor(): DataSourceEditor | null;
	set editor(value: DataSourceEditor | null);
	private redrawing;
	private expressionInputRef;
	private popinsRef;
	render(): TemplateResult<1>;
	private onChangeValue;
	private onChangeOptions;
	private getOptions;
}
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
