import { Editor, EditorConfig } from 'grapesjs';
import { ClientConfig } from '../config';
export declare const cmdToggleLayers = "open-layers";
export declare const cmdToggleBlocks = "open-blocks";
export declare const cmdToggleSymbols = "open-symbols";
export declare const cmdToggleNotifications = "open-notifications";
export declare function getEditorConfig(config: ClientConfig): EditorConfig;
export declare function initEditor(config: EditorConfig): Promise<Editor>;
export declare function getEditor(): Editor;
