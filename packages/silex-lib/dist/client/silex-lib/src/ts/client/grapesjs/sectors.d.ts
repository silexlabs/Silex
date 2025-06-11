import { Component, Editor } from 'grapesjs';
/**
 * @fileoverview
 *
 */
export type SectorConfig = {
    name: string;
    props: any[];
    shouldShow: (comp: Component) => boolean;
};
export declare function registerSector(editor: Editor, config: SectorConfig, at?: number): void;
