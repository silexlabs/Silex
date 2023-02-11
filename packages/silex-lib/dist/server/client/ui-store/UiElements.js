"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUiElements = void 0;
// keep references to ui elements
let uiElements;
function getUiElements() {
    uiElements = uiElements || {
        fileExplorer: document.querySelector('#silex-file-explorer'),
        contextMenu: document.querySelector('.silex-context-menu'),
        menu: document.querySelector('.silex-menu'),
        breadCrumbs: document.querySelector('.silex-bread-crumbs'),
        pageTool: document.querySelector('.silex-page-tool'),
        htmlEditor: document.querySelector('.silex-html-editor'),
        cssEditor: document.querySelector('.silex-css-editor'),
        jsEditor: document.querySelector('.silex-js-editor'),
        settingsDialog: document.querySelector('.silex-settings-dialog'),
        dashboard: document.querySelector('.silex-dashboard'),
        propertyTool: document.querySelector('.silex-property-tool'),
        textFormatBar: document.querySelector('.silex-text-format-bar'),
        workspace: document.querySelector('.silex-workspace'),
        verticalSplitter: document.querySelector('.vertical-splitter'),
    };
    return uiElements;
}
exports.getUiElements = getUiElements;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVWlFbGVtZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90cy9jbGllbnQvdWktc3RvcmUvVWlFbGVtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFrQkEsaUNBQWlDO0FBQ2pDLElBQUksVUFBc0IsQ0FBQTtBQUMxQixTQUFnQixhQUFhO0lBQzNCLFVBQVUsR0FBRyxVQUFVLElBQUk7UUFDekIsWUFBWSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUM7UUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUM7UUFDMUQsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzNDLFdBQVcsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDO1FBQzFELFFBQVEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDO1FBQ3BELFVBQVUsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDO1FBQ3hELFNBQVMsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDO1FBQ3RELFFBQVEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDO1FBQ3BELGNBQWMsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDO1FBQ2hFLFNBQVMsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDO1FBQ3JELFlBQVksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDO1FBQzVELGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDO1FBQy9ELFNBQVMsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDO1FBQ3JELGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUM7S0FDakQsQ0FBQTtJQUNmLE9BQU8sVUFBVSxDQUFBO0FBQ25CLENBQUM7QUFsQkQsc0NBa0JDIn0=