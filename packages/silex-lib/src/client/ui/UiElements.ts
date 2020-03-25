
export interface UiElements {
  stage: HTMLIFrameElement;
  fileExplorer: HTMLIFrameElement;
  contextMenu: HTMLElement;
  menu: HTMLElement;
  breadCrumbs: HTMLElement;
  pageTool: HTMLElement;
  htmlEditor: HTMLElement;
  cssEditor: HTMLElement;
  jsEditor: HTMLElement;
  settingsDialog: HTMLElement;
  dashboard: HTMLElement;
  propertyTool: HTMLElement;
  textFormatBar: HTMLElement;
  workspace: HTMLElement;
  verticalSplitter: HTMLElement;
}

export function getSiteWindow() {
  return uiElements.stage.contentWindow
}

export function getSiteDocument() {
  return uiElements.stage.contentDocument
}

// keep references to ui elements
let uiElements: UiElements
export function getUiElements(): UiElements {
  uiElements = uiElements || {
    stage: document.querySelector('#silex-stage-iframe'),
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
  } as UiElements
  return uiElements
}
