import Backbone from 'backbone';
import { Component, Editor } from 'grapesjs';
import { StyleInfo } from 'lit/directives/style-map';

export interface NotificationOptions {
	message: string;
	timeout?: number;
	component?: string | Component;
	type: "info" | "warning" | "error" | "success";
	icons: {
		info: string;
		warning: string;
		error: string;
		success: string;
	};
}
export interface NotificationModel extends Backbone.Model<NotificationOptions> {
}
declare class Notification {
	protected editor: NotificationEditor;
	protected model: NotificationModel;
	component: Component | null;
	timeoutRef: NodeJS.Timeout | undefined;
	message: string;
	type: "info" | "warning" | "error" | "success";
	protected options: NotificationOptions;
	constructor(editor: NotificationEditor, model: NotificationModel);
	select(): void;
	remove(): void;
	getSvgIcon(type: string): string;
}
export interface NotificationEditor extends Editor {
	NotificationManager: NotificationManager;
}
export interface NotificationManagerOptions {
	style: Readonly<StyleInfo>;
	container: HTMLElement;
	maxNotifications?: number;
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
