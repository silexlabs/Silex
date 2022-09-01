// this simply creates a file with the monaco editor code
// it should be included as es6 module in CodeEditorBase.ts but it doubles the compilation time
// and this is unacceptable so I moved it to a separate script
// we attache the monaco API to window object
// tslint:disable
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
window['monaco'] = monaco;

