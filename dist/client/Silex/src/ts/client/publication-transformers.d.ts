import { Component, CssRule, StyleProps, Editor } from 'grapesjs';
import { ClientSideFile, ClientSideFileType, Initiator, PublicationData } from '../types';
/**
 * Interface for publication transformers
 * They are added to the config object with config.addPublicationTransformer()
 */
export interface PublicationTransformer {
    renderComponent?(component: Component, toHtml: () => string): string | undefined;
    renderCssRule?(rule: CssRule, initialRule: () => StyleProps): StyleProps | undefined;
    transformFile?(file: ClientSideFile): ClientSideFile;
    transformPermalink?(link: string, type: ClientSideFileType, initiator: Initiator): string;
    transformPath?(path: string, type: ClientSideFileType): string;
}
export declare const publicationTransformerDefault: PublicationTransformer;
export declare function validatePublicationTransformer(transformer: PublicationTransformer): void;
/**
 * Alter the components rendering
 * Exported for unit tests
 */
export declare function renderComponents(editor: Editor): void;
/**
 * Alter the styles rendering
 * Exported for unit tests
 */
export declare function renderCssRules(editor: Editor): void;
/**
 * Transform background image url according to the transformed path of assets
 */
export declare function transformBgImage(editor: Editor, style: StyleProps): StyleProps;
/**
 * Transform files
 * Exported for unit tests
 */
export declare function transformFiles(editor: Editor, data: PublicationData): void;
/**
 * Transform files paths
 * Exported for unit tests
 */
export declare function transformPermalink(editor: Editor, path: string, type: ClientSideFileType, initiator: Initiator): string;
export declare function transformPath(editor: Editor, path: string, type: ClientSideFileType): string;
export declare function resetRenderComponents(editor: Editor): void;
export declare function resetRenderCssRules(editor: Editor): void;
