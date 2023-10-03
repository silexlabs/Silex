export const PROPERTY_STYLES = `
  :root {
    --ds-primary: #d278c9;
    --ds-secondary: #ddd;
    --ds-tertiary: #333;
    --ds-highlight: #d278c9;
    --ds-button-color: #ddd;
    --ds-button-bg: rgba(255,255,255,.15);
    --ds-button-border: rgba(255,255,255,.15);

    --steps-selector-dirty-background-color: rgba(0,0,0,.2);
    --steps-selector-dirty-border-color: rgba(0,0,0,.2);
    --steps-selector-dirty-color: #d278c9;
    --steps-selector-active-color: #ddd;
    --steps-selector-active-background-color: rgba(255,255,255,.15);
    --popin-dialog-background: #ddd;
    --popin-dialog-color: #333;
    --popin-dialog-header-background: transparent;
    --popin-dialog-body-background: transparent;
    --popin-dialog-footer-background: transparent;
    --steps-selector-placeholder-margin: 0 10px;
    --steps-selector-item-button-margin: 3px;
    --steps-selector-item-button-padding: 3px;
    --steps-selector-item-button-border-radius: 50%;
    --steps-selector-item-button-width: 20px;
    --steps-selector-item-button-height: 20px;
    --steps-selector-item-button-background-color: transparent;
    --steps-selector-item-button-color: var(--ds-button-color);
    --steps-selector-separator-color: var(--ds-button-color);
    /*
    --popin-dialog-header-color: #333;
    --popin-dialog-body-color: #666;
    --popin-dialog-footer-color: #333;
    --popin-dialog-header-border-bottom: none;
    --popin-dialog-footer-border-top: none;
    --popin-dialog-header-padding: 0;
    --popin-dialog-body-padding: 5px;
    --popin-dialog-footer-padding: 0;
    */
  }
  steps-selector {
    padding: 10px;
    display: block;
  }
  steps-selector::part(separator__delete) {
    border-right: 1px solid var(--ds-button-border);
    height: 30px;
  }
  steps-selector::part(delete-button) {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    color: var(--ds-button);
  }
  steps-selector::part(type) {
    font-weight: 200;
    font-size: smaller;
    padding: 0;
    color: var(--ds-secondary);
    padding: 10px;
  }
  steps-selector::part(steps-selector-item__add) {
    margin: 0 10px;
  }
  steps-selector::part(property-input) {
    padding: 5px;
    margin: 5px 0;
    border: medium;
    flex: 1 1 auto;
    background-color: rgba(0,0,0,.2);
    color: var(--ds-secondary);
  }
  steps-selector::part(steps-container) {
    display: flex;
    align-items: center;
    overflow: auto;
    padding: 10px 0px;
  }
  steps-selector::part(dirty-icon) {
    cursor: pointer;
    margin: 0 10px;
    color: var(--ds-highlight);
  }
  steps-selector::part(dirty-icon) {
    color: var(--ds-highlight);
    vertical-align: bottom;
    display: inline-flex;
    margin: 0;
  }
`