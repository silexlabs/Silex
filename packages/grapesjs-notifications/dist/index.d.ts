import Backbone from 'backbone';
import { Editor } from 'grapesjs';
import { StyleInfo } from 'lit/directives/style-map';

export interface NotificationOptions {
	message: string;
	group?: string;
	timeout?: number;
	componentId?: string;
	type: "info" | "warning" | "error" | "success";
	icons: {
		info: string;
		warning: string;
		error: string;
		success: string;
	};
}
declare class NotificationModel extends Backbone.Model<any, Backbone.ModelSetOptions, any> {
}
declare class Notification {
	protected editor: NotificationEditor;
	protected model: NotificationModel;
	componentId: string | null;
	group: string | null;
	timeoutRef: NodeJS.Timeout | undefined;
	message: string;
	type: "info" | "warning" | "error" | "success";
	protected options: NotificationOptions;
	constructor(editor: NotificationEditor, model: NotificationModel);
	select(): void;
	remove(): void;
	getSvgIcon(type: string): string;
	private getDefaultOptions;
	/**
	 * Get all components in the editor
	 * This is a heavy operation
	 */
	private getAllComponents;
	private getAllComponentInPage;
	private getAllChildrenComponent;
}
export interface NotificationEditor extends Editor {
	NotificationManager: NotificationManager;
}
export interface NotificationManagerOptions {
	style: Readonly<StyleInfo>;
	container: HTMLElement;
	maxNotifications?: number;
	reverse?: boolean;
	timeout?: number;
	storeKey?: string;
	icons?: {
		info?: string;
		warning?: string;
		error?: string;
		success?: string;
	};
}
declare class NotificationManager extends Backbone.Collection<NotificationModel> {
	protected editor: NotificationEditor;
	protected options: NotificationManagerOptions;
	constructor(models: Notification[], editor: NotificationEditor, options: NotificationManagerOptions);
	/**
	 * Get all models
	 */
	getAll(): Notification[];
	/**
	 * Listen to model changes
	 */
	modelChanged(e?: CustomEvent): void;
	/**
	 * Listen to model individual changes
	 */
	modelInit(): void;
}
declare const _default: (editor: NotificationEditor, opts?: Partial<NotificationManagerOptions>) => void;

export {
	_default as default,
};

export {};
