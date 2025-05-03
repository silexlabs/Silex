import { Editor, PluginOptions } from 'grapesjs';
/**
 * Opens the Publish dialog and publishes the website.
 * @param editor The editor.
 */
declare function publish(editor: Editor): void;
/**
 * Escapes the current context in this order : modal, Publish dialog, left panel.
 * If none of these are open, it selects the body.
 * @param editor The editor.
 */
declare function escapeContext(editor: Editor): void;
export declare const cmdSelectBody = "select-body";
export declare let prefixKey: string;
export declare const defaultKms: {
    kmOpenSettings: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmOpenPublish: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmOpenFonts: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmPreviewMode: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmLayers: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmBlocks: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmNotifications: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmPages: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmSymbols: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmStyleManager: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmTraitsManager: {
        id: string;
        keys: string;
        handler: (editor: any) => void;
    };
    kmClosePanel: {
        id: string;
        keys: string;
        handler: typeof escapeContext;
    };
    kmSelectBody: {
        id: string;
        keys: string;
        handler: string;
    };
    kmDuplicateSelection: {
        id: string;
        keys: string;
        handler: string;
    };
    kmPublish: {
        id: string;
        keys: string;
        handler: typeof publish;
    };
    kmAddPage: {
        id: string;
        keys: string;
        handler: string;
    };
    kmRemovePage: {
        id: string;
        keys: string;
        handler: string;
    };
    kmClonePage: {
        id: string;
        keys: string;
        handler: string;
    };
    kmSelectNextPage: {
        id: string;
        keys: string;
        handler: string;
    };
    kmSelectPrevPage: {
        id: string;
        keys: string;
        handler: string;
    };
    kmSelectFirstPage: {
        id: string;
        keys: string;
        handler: string;
    };
};
export declare function keymapsPlugin(editor: Editor, opts: PluginOptions): void;
export {};
