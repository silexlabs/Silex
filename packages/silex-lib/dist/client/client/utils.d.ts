import { Component, Editor } from 'grapesjs';
export declare function onAll(editor: Editor, cbk: (c: Component) => void): void;
/**
 * SHA256 hash a string
 */
export declare function hashString(str: string): Promise<string>;
/**
 * Select the <body> element in the editor.
 * @param editor The GrapesJS editor.
 */
export declare function selectBody(editor: Editor): void;
/**
 * Checks if an element is a text or input field.
 * @param element The element to check.
 */
export declare function isTextOrInputField(element: HTMLElement): boolean;
/**
 * Makes every word in a string start with an uppercase letter.
 * @param str The string to title-case.
 * @param sep The separator between words.
 */
export declare function titleCase(str: string, sep?: string): string;
