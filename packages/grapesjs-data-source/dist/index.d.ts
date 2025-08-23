import { Button, Component, Editor, Page } from 'grapesjs';
import { TemplateResult } from 'lit';

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
	previewActive: boolean;
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
	label: string;
	url: string;
	type: DataSourceType;
	method?: string;
	headers?: Record<string, string>;
	hidden?: boolean;
	readonly?: boolean;
	connect(): Promise<void>;
	isConnected(): boolean;
	getTypes(): Type[];
	getQueryables(): Field[];
	getQuery(trees: Tree[]): string;
	fetchValues(query: string): Promise<unknown>;
	on?(event: any, callback?: any, context?: any): any;
	off?(event?: any, callback?: any, context?: any): any;
	trigger?(event: any, ...args: unknown[]): any;
}
export declare const DATA_SOURCE_READY = "data-source:ready";
export declare const DATA_SOURCE_ERROR = "data-source:error";
export declare const DATA_SOURCE_CHANGED = "data-source:changed";
export declare const COMPONENT_STATE_CHANGED = "component:state:changed";
export declare const COMMAND_REFRESH = "data-source:refresh";
export declare const COMMAND_PREVIEW_ACTIVATE = "data-source:preview:activate";
export declare const COMMAND_PREVIEW_DEACTIVATE = "data-source:preview:deactivate";
export declare const COMMAND_PREVIEW_REFRESH = "data-source:preview:refresh";
export declare const DATA_SOURCE_DATA_LOAD_START = "data-source:data-load:start";
export declare const DATA_SOURCE_DATA_LOAD_END = "data-source:data-load:end";
export declare const DATA_SOURCE_DATA_LOAD_CANCEL = "data-source:data-load:cancel";
export type DataSourceType = "graphql";
export interface IDataSourceOptions {
	id: DataSourceId;
	label: string;
	type: DataSourceType;
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
	previewIndex?: number;
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
	previewIndex?: number;
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
	previewIndex?: number;
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
	previewIndex?: number;
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
export interface ComponentExpression {
	expression: Expression;
	component: Component;
}
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
 * @fileoverview GraphQL DataSource implementation
 */
/**
 * GraphQL Data source options
 */
export interface GraphQLQueryOptions {
	url: string;
	headers: Record<string, string>;
	method: "GET" | "POST";
	queryable?: TypeId[];
	readonly?: boolean;
}
/**
 * GraphQL Data source options with server to server options
 */
export interface GraphQLOptions extends GraphQLQueryOptions, IDataSourceOptions {
	serverToServer?: GraphQLQueryOptions;
	hidden?: boolean;
}
/**
 * Generate GraphQL query for a single page
 * Used by both preview and production (11ty site generation)
 *
 * @param page - The GrapesJS page to generate query for
 * @param editor - The GrapesJS editor instance
 * @returns Record of data source ID to GraphQL query string
 */
export declare function getPageQuery(page: Page, editor: Editor): Record<DataSourceId, string>;
/**
 * Generate queries for multiple pages
 * Useful for batch operations like static site generation
 *
 * @param pages - Array of GrapesJS pages
 * @param editor - The GrapesJS editor instance
 * @returns Record of page ID to data source queries
 */
export declare function buildPageQueries(pages: Page[], editor: Editor): Record<string, Record<DataSourceId, string>>;
/**
 * Get all data sources
 * @returns Array of all registered data sources
 */
export declare function getAllDataSources(): IDataSource[];
/**
 * Get a specific data source by ID
 * @param id - The data source ID
 * @returns The data source or undefined if not found
 */
export declare function getDataSource(id: DataSourceId): IDataSource | undefined;
/**
 * Add a new data source
 * @param dataSource - The data source to add
 */
export declare function addDataSource(dataSource: IDataSource): void;
/**
 * Remove a data source
 * @param dataSource - The data source to remove
 */
export declare function removeDataSource(dataSource: IDataSource): void;
/**
 * Refresh preview data from all data sources
 * Triggers data loading for the current page
 */
export declare function refreshDataSources(): void;
/**
 * Load preview data for the current page
 * @param forceRefresh - If true, bypass query comparison and force refresh
 * @returns Promise that resolves when data is loaded
 */
export declare function loadPreviewData(forceRefresh?: boolean): Promise<void>;
/**
 * Get current preview data
 * @returns Record of data source ID to preview data
 */
export declare function getPreviewData(): Record<DataSourceId, unknown>;
/**
 * Clear all preview data
 */
export declare function clearPreviewData(): void;
/**
 * Evaluate an expression with current preview data
 * @param expression - The expression to evaluate
 * @param component - The component context
 * @returns The evaluated result
 */
export declare function getValue(expression: Expression, component: Component, resolvePreviewIndex?: boolean): unknown;
/**
 * Get all expressions used by components on a page
 * @param page - The page to analyze
 * @returns Array of component expressions
 */
export declare function getPageExpressions(page: Page): ComponentExpression[];
/**
 * Get auto-completion options for expressions
 * @param options - Completion options including component, expression, etc.
 * @returns Context with available tokens for completion
 */
export declare function getCompletion(options: {
	component: Component;
	expression: Expression;
	rootType?: TypeId;
	currentStateId?: StateId;
	hideLoopData?: boolean;
}): Context;
/**
 * Convert a stored token to its full form with methods and properties
 * @param token - The stored token to convert
 * @param componentId - The component ID for context (can be null)
 * @returns The full token with all properties and methods
 */
export declare function fromStored<T extends Token = Token>(token: StoredToken, componentId: string | null): T;
/**
 * Get the result type of an expression
 * @param expression - The expression to analyze
 * @param component - The component context
 * @returns The field describing the result type, or null if invalid
 */
export declare function getExpressionResultType(expression: Expression, component: Component): Field | null;
/**
 * Get the persistent ID of a component
 * @param component - The component to get ID for
 * @returns The persistent ID or null if not set
 */
export declare function getPersistantId(component: Component): PersistantId | null;
/**
 * Get or create the persistent ID of a component
 * @param component - The component to get/create ID for
 * @returns The persistent ID
 */
export declare function getOrCreatePersistantId(component: Component): PersistantId;
/**
 * Get a state from a component
 * @param component - The component to get state from
 * @param id - The state ID
 * @param exported - Whether to get exported (public) or private state
 * @returns The state or null if not found
 */
export declare function getState(component: Component, id: StateId, exported?: boolean): StoredState | null;
/**
 * Get all state IDs from a component
 * @param component - The component to get state IDs from
 * @param exported - Whether to get exported (public) or private state IDs
 * @param before - Optional state ID to get IDs before
 * @returns Array of state IDs
 */
export declare function getStateIds(component: Component, exported?: boolean, before?: StateId): StateId[];
/**
 * Set a state on a component
 * @param component - The component to set state on
 * @param id - The state ID
 * @param state - The state to set
 * @param exported - Whether to set as exported (public) or private state
 * @param index - Optional index to insert at
 */
export declare function setState(component: Component, id: StateId, state: StoredState, exported?: boolean, index?: number): void;
/**
 * Remove a state from a component
 * @param component - The component to remove state from
 * @param id - The state ID to remove
 * @param exported - Whether to remove from exported (public) or private states
 */
export declare function removeState(component: Component, id: StateId, exported?: boolean): void;
/**
 * Get the variable name for a state
 * @param componentId - The component ID
 * @param stateId - The state ID
 * @returns The variable name
 */
export declare function getStateVariableName(componentId: string, stateId: StateId): string;
/**
 * Convert JSON or string to an Expression object
 * @param json - The JSON or string to convert
 * @returns The Expression object or null if invalid
 */
export declare function toExpression(json: unknown | string): Expression | null;
/**
 * Create a data source instance
 * @param options - The data source configuration
 * @returns The created data source
 */
export declare function createDataSource(opts?: Partial<GraphQLOptions>): IDataSource;
export declare function getLiquidFilters(editor: Editor): Filter[];
/**
 * Notification group name for data source notifications
 */
export declare const NOTIFICATION_GROUP = "Data source";
/**
 * Component name prefix for data source components
 */
export declare const COMPONENT_NAME_PREFIX = "nameForDataSource";
/**
 * Fixed token ID for hard-coded values
 */
export declare const FIXED_TOKEN_ID = "fixed";
declare const _default: (editor: Editor, opts?: Partial<DataSourceEditorOptions>) => void;
/**
 * Version of the plugin
 * This is replaced by the build script
 */
export declare const version = "__VERSION__";

export {
	_default as default,
};

export {};
