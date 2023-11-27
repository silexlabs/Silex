import Backbone from 'backbone';
import { Button, Component, Editor, Page } from 'grapesjs';
import { LitElement } from 'lit';
import { Ref } from 'lit/directives/ref.js';

/**
 * @element steps-selector
 * Web component to select a sequence of steps
 *
 * It has these events:
 * - load
 * - change
 *
 * It has these properties:
 * - steps
 * - dirty
 *
 * It has these slots:
 * - placeholder
 * - dirty-icon
 *
 * User actions:
 * - add a next step at the end of the selection
 * - reset to default value
 * - copy value to clipboard
 * - paste value from clipboard
 */
export interface Step {
	name: string;
	icon: string;
	type: string;
	tags?: string[];
	helpText?: string;
	errorText?: string;
	options?: any;
	optionsForm?: string;
	meta?: any;
	category?: string;
}
declare class StepsSelector extends LitElement {
	static styles: import("lit").CSSResult;
	static getFixedValueStep(value: string): Step;
	get dirty(): boolean;
	steps: Step[];
	protected get _steps(): Step[];
	protected set _steps(value: Step[]);
	protected initialValue: Step[];
	completion: (steps: Step[]) => Step[];
	allowFixed: boolean;
	fixed: boolean;
	fixedType: "text" | "date" | "email" | "number" | "password" | "tel" | "time" | "url";
	placeholder: string;
	fixedPlaceholder: string;
	maxSteps: number | undefined;
	groupByCategory: boolean;
	render(): import("lit").TemplateResult<1>;
	group(completion: Step[]): Map<string, Step[]>;
	renderValues(completion: Step[], completionMap: Map<string, Step[]>, currentStep?: Step): import("lit").TemplateResult<1>;
	connectedCallback(): void;
	isFixedValue(): boolean;
	fixedValueChanged(value: string): void;
	/**
	 * Set the step at the given index
	 */
	setStepAt(at: number, step: Step | undefined): void;
	setOptionsAt(at: number, options: unknown, optionsForm: string): void;
	/**
	 * Delete the step at the given index and all the following steps
	 */
	deleteStepAt(at: number): void;
	/**
	 * Reset dirty flag and store the current value as initial value
	 */
	save(): void;
	/**
	 * Reset dirty flag and restore the initial value
	 */
	reset(): void;
}
export type PageId = string;
export interface Query {
	expression: Expression;
}
export type DataSourceId = string | number;
export interface IDataSource {
	id: DataSourceId;
	connect(): Promise<void>;
	getTypes(): Type[];
	getQueryables(): Field[];
	getQuery(expressions: Expression[]): string;
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
	optionsForm?: (input: Field | null, options: Options) => string | null;
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
}
export interface Filter extends StoredFilter {
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
declare class DataTree {
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
	fieldToToken(field: Field): Property;
	/**
	 * Evaluate an expression to a value
	 */
	getValue(context: Context, expression: Expression): unknown;
	findType(typeId: TypeId, dataSourceId?: DataSourceId): Type | null;
	/**
	 * Add missing methonds to the filter
	 * When filters are stored they lose their methods
	 */
	getFilterFromToken(token: Filter, filters: Filter[]): Filter;
	/**
	 * Get the token from its stored form
	 */
	fromStored<T extends Token = Token>(token: StoredToken): T;
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
	 * Resolves all states token as expressions recursively
	 * Resulting expressions contain properties and filters only, no states anymore
	 */
	resolveState(state: State, component: Component): Expression | null;
	/**
	 * Get all expressions used by a component
	 * Resolves all states token as expressions recursively
	 * Resulting expressions contain properties and filters only, no states anymore
	 */
	getComponentExpressions(component: Component): Expression[];
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
	getPageQuery(page: Page): Record<DataSourceId, string>;
}
/**
 *
 */
export interface ViewOptions {
	appendTo?: string | HTMLElement | (() => HTMLElement);
	button?: Button | (() => Button);
	styles?: string;
	optionsStyles?: string;
}
export declare function setOptionsFormStyles(styles: string): void;
/**
 * Create a "fixed" token
 * It is a hard coded content with which you can start an expression
 */
export declare function getFixedToken(value: string | number | boolean, typeId: TypeId): Token;
/**
 * Set the completion function of a steps selector
 */
export declare function setCompletion(dataTree: DataTree, component: Component, stepsSelector: StepsSelector): void;
/**
 * Handle the change event of a steps selector
 */
export declare function chagedStepsSelector(component: Component, name: string, label: string, stepsSelector: StepsSelector, exposed: boolean): void;
/**
 * Convert an expression to steps
 * This will resolve the types of filters
 */
export declare function toSteps(dataTree: DataTree, expression: Expression, component: Component): Step[];
/**
 * Render an expression with the steps-selector web component
 */
export declare function renderExpression(component: Component, dataTree: DataTree, stateId: StateId, label: string, allowFixed: boolean, reference: Ref<StepsSelector>, exposed: boolean, maxSteps?: number): import("lit-html").TemplateResult<1>;
/**
 * Convert a token to a step
 * This will resolve the types of filters
 * @param field can be null, this happens when token is a filter with output resolving to null
 */
export declare function toStep(dataTree: DataTree, field: Field | null, prev: Field | null, token: Token, component: Component): Step;
export declare function convertKind(field: Field | null, from: FieldKind, to: FieldKind): Field | null;
export declare function getFieldType(editor: DataSourceEditor, field: Field | null, key: string | undefined): Field | null;
export declare function optionsFormButtons(): string;
export declare function optionsFormKeySelector(editor: DataSourceEditor, field: Field | null, options: Options, name: string): string;
export declare function optionsFormStateSelector(editor: DataSourceEditor, options: Options, name: string): string;
/**
 * Types
 */
export interface StoredState {
	label?: string;
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
export declare function getStateLabel(component: Component | null | undefined, state: State): string;
/**
 * Find a component by its persistant ID in the current page
 */
export declare function getParentByPersistentId(id: PersistantId, component: Component | undefined): Component | null;
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
 * Add the DataSourceManager to the GrapesJs editor
 */
export interface DataSourceEditor extends Editor {
	DataSourceManager: DataSourceManager;
}
/**
 * Options for the DataSourceEditor plugin
 */
export interface DataSourceEditorOptions {
	dataSources: IDataSourceOptions[];
	view: ViewOptions;
	filters: Filter[] | string;
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
