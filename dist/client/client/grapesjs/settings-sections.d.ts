import { TemplateResult } from 'lit-html';
import { WebsiteSettings } from '../../types';
export declare const idCodeWrapper = "settings-head-wrapper";
export declare function isSite(model: any): boolean;
export interface SettingsSection {
    id: string;
    label: string;
    render: (settings: WebsiteSettings, model: any) => TemplateResult;
}
/**
 * This is the settings dialog default sections
 * Each section has an entry in the sidebar
 * Each section render as part of the settings form
 * The form is submitted to save the settings with all FormData
 */
export declare const defaultSections: SettingsSection[];
