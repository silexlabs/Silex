import { css } from 'lit';
export const inputChainStyles = css `
  ::part(header) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  label {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  .dirty {
    color: var(--steps-selector-dirty-color, red);
    cursor: pointer;
  }
  ::part(dirty-icon) {
    display: inline-block;
    width: 1rem;
  }
  ::part(property-container) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    overflow-x: auto;
    padding: 10px;
  }
  ::part(fixed-selector) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--steps-selector-dirty-border-color, #ccc);
    background-color: var(--steps-selector-dirty-background-color, #ccc);
    border-radius: var(--steps-selector-dirty-border-radius, 3px);
    padding: 3px;
  }
  ul[slot="tags"] {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* an arrow between elements */
  .steps-container__separator {
    display: inline;
  }
  .steps-container__separator::after {
    content: "▶";
    color: var(--steps-selector-separator-color, #333);
    font-size: var(--steps-selector-separator-font-size, 1.5em);
    margin: var(--steps-selector-separator-margin, 0);
    padding: var(--steps-selector-separator-padding, 0);
  }
  /* selector between fixed value (text input) and steps */
  .fixed-selector span {
    padding: 3px;
  }
  .fixed-selector span:not(.active):hover {
    color: var(--steps-selector-dirty-color, #0091ff);
  }
  .fixed-selector span:not(.active) {
    cursor: pointer;
  }
  .fixed-selector span:last-child {
    margin-left: 5px;
  }
  .fixed-selector span.active {
    border-radius: var(--steps-selector-active-border-radius, 3px);
    background-color: var(--steps-selector-active-background-color, #eee);
    color: var(--steps-selector-active-color, #333);
    cursor: default;
  }
  ul.values-ul {
    list-style: none;
    padding: var(--steps-selector-values-ul-padding, 0);
    margin: var(--steps-selector-values-ul-margin, 0);
    color: var(--steps-selector-values-ul-color, #000);
    background-color: var(--steps-selector-values-ul-background-color, transparent);
  }
  li.values-li {
    padding: var(--steps-selector-values-li-padding, 5px);
    margin: var(--steps-selector-values-li-margin, 0);
    background-color: var(--steps-selector-values-li-background-color, transparent);
    border-bottom: var(--steps-selector-values-li-border, 1px solid #ccc);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
  }
  li.values-li:last-child {
    border-bottom: none;
  }
  li.values-li:hover {
    background-color: var(--steps-selector-values-li-hover-background-color, #eee);
  }
  li.values-li.active {
    background-color: var(--steps-selector-values-li-active-background-color, #ccc);
    font-weight: var(--steps-selector-values-li-active-font-weight, bold);
  }
  li.values-li.values__title {
    /* Display this line as an array title */
    color: var(--steps-selector-values-li-title-color, #333);
    background-color: var(--steps-selector-values-li-background-color, #eee);
    text-transform: var(--steps-selector-values-li-title-text-transform, uppercase);
    cursor: default;
  }
  li.values-li.values__title .values__name {
    margin: var(--steps-selector-values-li-title-margin, auto);
  }
  li.values-li .values__icon {
    margin-right: var(--steps-selector-values-li-icon-margin-right, 5px);
  }
  li.values-li .values__name {
    margin-right: var(--steps-selector-values-li-name-margin-right, 25px);
  }
  li.values-li .values__type {
    color: var(--steps-selector-values-li-type-color, #999);
    width: max-content;
  }
  .placeholder > * {
    color: var(--steps-selector-placeholder-color, #999);
    font-style: var(--steps-selector-placeholder-font-style, italic);
    margin: var(--steps-selector-placeholder-margin, 10px 0);
  }
`;
export const stepsSelectorItemStyles = css `
  :host {
    display: inline-flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  :host header {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    border: solid 1px gray;
  }
  :host .value {
    display: flex;
    align-items: center;
  }
  :host .buttons {
    display: flex;
    align-items: center;
  }
  :host .button {
    border: none;
    background-color: transparent;
  }
  :host .svg-icon {
    border: var(--steps-selector-item-button-border, none);
    cursor: pointer;
    margin: var(--steps-selector-item-button-margin, 3px);
    padding: var(--steps-selector-item-button-padding, 3px);
    border-radius: var(--steps-selector-item-button-border-radius, 50%);
    width: var(--steps-selector-item-button-width, 20px);
    height: var(--steps-selector-item-button-height, 20px);
    background-color: var(--steps-selector-item-button-background-color, transparent);
  }
  /* button svg path white and size 10px
  */
  :host .svg-icon svg path {
    fill: var(--steps-selector-item-button-color, #333);
  }
  /*
  :host popin-form {
    position: absolute;
  }
  */
  slot[name="helpTitle"] {
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
  }
  slot[name="name"] {
    font-weight: bold;
    cursor: pointer;
  }
  ::slotted([slot="name"]), ::slotted([slot="type"]) {
    cursor: pointer;
    flex-shrink: 0;
  }
  ::slotted([slot="name"]) {
    font-weight: var(--steps-selector-item-name-font-weight, bold);
    font-size: var(--steps-selector-item-name-font-size, 1rem);
    padding: var(--steps-selector-item-name-padding, 5px);
  }
  ::slotted([slot="type"]), ::slotted([slot="type"]) {
    font-weight: var(--steps-selector-item-type-font-weight, normal);
    font-size: var(--steps-selector-item-type-font-size, 0.8rem);
    padding: var(--steps-selector-item-type-padding, 5px);
  }
  .with-arrow::after {
    content: "▼";
    float: right;
    padding: var(--steps-selector-item-arrow-padding, 5px);
  }
`;
export const popinStyles = css `
  :host {
    display: inline-block;
    position: fixed;
    max-width: 100vw;
    max-height: 80vh;
    box-sizing: border-box;
    z-index: 1000; /* Ensure it's on top of other content */
    border-radius: var(--popin-form-border-radius, 3px);
    overflow: hidden; /* To ensure border-radius applies to children elements */
    overflow-y: auto;
    outline: none;
    border: var(--popin-form-border, 1px solid #ccc);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: inline-flex;
    flex-direction: column;
    background-color: var(--popin-form-background, #fff);
    color: var(--popin-form-color, #000);
  }
  :host([hidden]) {
    display: none !important;
  }

  header {
    border-bottom: var(--popin-form-header-border-bottom, #f5f5f5);
    background-color: var(--popin-form-header-background, transparent);
    padding: var(--popin-form-header-padding, 0);
    color: var(--popin-form-header-color, #000);
  }

  footer {
    border-top: var(--popin-form-footer-border-top, 1px solid #f5f5f5);
    display: flex;
    justify-content: flex-end;
    background-color: var(--popin-form-footer-background, transparent);
    padding: var(--popin-form-footer-padding);
    color: var(--popin-form-footer-color, #000);
  }

  button {
    border: var(--popin-button-border, 1px solid #ccc);
    border-radius: var(--popin-button-border-radius, 3px);
    background-color: var(--popin-button-background, #f5f5f5);
    color: var(--popin-button-color, #000);
    padding: var(--popin-button-padding, 5px);
    margin: var(--popin-button-margin, 5px);
    cursor: pointer;
  }

  button:hover {
    background-color: var(--popin-button-hover-background, #eee);
    color: var(--popin-button-hover-color, #000);
    border: var(--popin-button-border, 1px solid #ccc);
    padding: var(--popin-button-hover-padding, 5px);
    margin: var(--popin-button-hover-margin, 5px);
  }

  button.secondary {
    background-color: var(--popin-button-background--secondary, transparent);
    color: var(--popin-button-color--secondary, #000);
    border: var(--popin-button-border--secondary, none);
    padding: var(--popin-button-padding--secondary, 5px);
    margin: var(--popin-button-margin--secondary, 5px);
  }

  button.secondary:hover {
    background-color: var(--popin-button-hover-background--secondary, #eee);
    color: var(--popin-button-hover-color--secondary, #000);
    border: var(--popin-button-hover-border--secondary, none);
    padding: var(--popin-button-hover-padding--secondary, 5px);
    margin: var(--popin-button-hover-margin--secondary, 5px);
  }

  main {
    background-color: var(--popin-form-body-background, transparent);
    padding: var(--popin-form-body-padding, 5px);
    color: var(--popin-form-body-color, #000);
    display: flex;
    flex-direction: column;
  }

  ::slotted([slot="header"]) {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ::slotted([slot="body"]) * {
    background: red !important;
  }
`;
//# sourceMappingURL=styles.js.map