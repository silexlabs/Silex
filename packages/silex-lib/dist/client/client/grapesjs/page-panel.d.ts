import { Editor } from 'grapesjs';
export declare const cmdTogglePages = "pages:open-panel";
export declare const cmdAddPage = "pages:add";
export declare const cmdRemovePage = "pages:remove";
export declare const cmdClonePage = "pages:clone";
export declare const cmdSelectNextPage = "pages:select-next";
export declare const cmdSelectPrevPage = "pages:select-prev";
export declare const cmdSelectFirstPage = "pages:select-first";
export declare const pagePanelPlugin: (editor: Editor, opts: any) => void;
