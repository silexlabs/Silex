import { Editor } from 'grapesjs';
export declare const PROJECT_BAR_PANEL_ID = "project-bar-panel";
export declare const containerPanelId = "project-bar-container";
export interface PanelObject {
    command: string | ((editor: Editor) => void);
    text: string;
    className: string;
    name?: string;
    attributes: {
        title?: string;
        containerClassName?: string;
    };
    buttons?: {
        command: string;
        text: string;
        className: string;
    }[];
    onClick?: (editor: Editor) => void;
}
export declare const projectBarPlugin: (editor: any, opts: any) => void;
export declare function addButton(editor: Editor, panel: PanelObject): void;
