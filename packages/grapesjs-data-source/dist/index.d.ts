import Backbone from 'backbone';
import { Button, Component, Editor } from 'grapesjs';

export type DataSourceId = string | number;
export interface IDataSource {
	id: DataSourceId;
	connect(): Promise<void>;
	getTypes(): Type[];
	getQueryables(): Field[];
}
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
export type FieldId = string;
export type FieldKind = "scalar" | "object" | "list";
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
export type Options = Record<string, unknown>;
/**
 * A property is used to make expressions and access data from the data source
 */
export type Property = FieldProperty;
export interface BaseProperty {
	type: "property";
	propType: "field";
	dataSourceId?: DataSourceId;
}
export interface FieldProperty extends BaseProperty {
	propType: "field";
	typeIds: TypeId[];
	fieldId: FieldId;
	label: string;
	kind: FieldKind;
	options?: Record<string, unknown>;
	optionsForm?: (input: Field | null, options: Options) => string | null;
}
/**
 * A filter is used to alter data in an expression
 * It is provided in the options
 */
export type FilterId = string;
export interface Filter {
	type: "filter";
	id: FilterId;
	label: string;
	options: Options;
	optionsForm?: (input: Field | null, options: Options) => string | null;
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
	id: StateId;
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
export type Expression = Token[];
/**
 * Options of the data tree
 * They can be set on the instance too
 */
export interface DataTreeOptions {
	filters: Partial<Filter>[];
	dataSources: IDataSource[];
}
declare class DataTree {
	protected editor: DataSourceEditor;
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
	constructor(editor: DataSourceEditor, options: DataTreeOptions);
	/**
	 * Get all types from all data sources
	 */
	getAllTypes(): Type[];
	/**
	 * Get all queryable fields from all data sources
	 */
	getAllQueryables(): Field[];
	/**
	 * Get the options of a token
	 */
	getTokenOptions(field: Field): {
		optionsForm: (input: Field | null, options: Options) => string;
		options: Options;
	} | null;
	/**
	 * Get the context of a component
	 * This includes all parents states, data sources queryable values, values provided in the options
	 */
	getContext(component?: Component | undefined): Context;
	/**
	 * Create a property token from a field
	 */
	fieldToToken(field: Field): FieldProperty;
	/**
	 * Evaluate an expression to a value
	 */
	getValue(context: Context, expression: Expression): unknown;
	findType(typeId: TypeId, dataSourceId?: DataSourceId): Type | null;
	/**
	 * Get the type corresponding to a token
	 */
	tokenToField(token: Token, prev: Field | null, component: Component): Field | null;
	/**
	 * Evaluate the types of each token in an expression
	 */
	expressionToFields(expression: Expression, component: Component): Field[];
	/**
	 * Evaluate an expression to a type
	 * This is used to validate expressions and for autocompletion
	 */
	getExpressionResultType(expression: Expression, component: Component): Field | null;
	/**
	 * Auto complete an expression
	 * @returns a list of possible tokens to add to the expression
	 */
	getCompletion(component: Component, expression: Expression): Context;
}
declare class DataSourceManager extends Backbone.Collection<IDataSourceModel> {
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
}
export interface ViewOptions {
	appendTo?: string | HTMLElement | (() => HTMLElement);
	button?: Button | (() => Button);
	styles?: string;
	optionsStyles?: string;
}
export interface DataSourceEditor extends Editor {
	DataSourceManager: DataSourceManager;
}
export interface DataSourceEditorOptions {
	dataSources: IDataSourceOptions[];
	properties: ViewOptions;
	filters: Filter[];
}
declare const _default: (editor: DataSourceEditor, opts?: Partial<DataSourceEditorOptions>) => void;
export declare const version = "__VERSION__";

export {
	_default as default,
};

export {};
