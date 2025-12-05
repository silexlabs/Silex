/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export const OPTIONS_STYLES = `
  form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 5px;
    color: var(--ds-tertiary);
    min-width: 300px;
  }
  form label {
    text-align: left;
    margin-top: 5px;
  }
  form .buttons {
    display: flex;
    justify-content: flex-end;
    margin: 5px 0;
    width: 100%;
  }
  form input {
    padding: 4px;
    background-color: transparent;
    border-radius: 2px;
    color: var(--ds-tertiary);
    border: 1px solid var(--ds-tertiary);
  }
  form .buttons input {
    margin-left: 5px;
    cursor: pointer;
    padding: 4px 10px;
    background-color: var(--ds-button-bg);
  }
  form .buttons input[type="reset"] {
    border-color: transparent;
  }
  form .buttons input:hover {
    color: var(--ds-primary);
  }
  form input.ds-expression-input__fixed {
    color: black;
  }
`
export const PROPERTY_STYLES = `
  :root {
    --ds-primary: #8873FE;
    --ds-secondary: #E5E5E5;
    --ds-tertiary: #1D1D1D;
    --ds-highlight: #8873FE;
    --ds-lowlight: #252525;
    --ds-button-color: #E5E5E5;
    --ds-button-bg: #252525;
    --ds-button-border: var(--ds-button-bg);

    --expression-input-dirty-background-color: var(--ds-button-bg);
    --expression-input-dirty-border-color: var(--ds-tertiary);
    --expression-input-dirty-color: var(--ds-highlight);
    --expression-input-active-color: var(--ds-tertiary);
    --expression-input-active-background-color: var(--ds-secondary);
    --popin-dialog-background: var(--ds-secondary);
    --popin-dialog-color: var(--ds-tertiary);
    --popin-dialog-header-background: transparent;
    --popin-dialog-body-background: transparent;
    --popin-dialog-footer-background: transparent;
    --expression-input-placeholder-margin: 0 10px;
    --expression-input-item-button-margin: 0;
    --expression-input-item-button-padding: 2px;
    --expression-input-item-button-border-radius: 50%;
    --expression-input-item-button-width: 20px;
    --expression-input-item-button-height: 20px;
    --expression-input-item-button-background-color: transparent;
    --expression-input-item-button-color: var(--ds-button-color);
    --expression-input-separator-color: var(--ds-button-color);
    --expression-input-separator-font-size: 0.7em;
    --expression-input-separator-margin: 0;
    --expression-input-separator-padding: 0 3px 0 1px;
    --expression-input-item-arrow-padding: 5px 5px 0 5px;
    --expression-input-values-li-icon-margin-right: 0;
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
  .ds-state-editor__options {
    --ds-secondary: #1A1A1A;
    --ds-tertiary: #F5F5F5;
    --ds-lowlight: #E0E0E0;
    --ds-button-color: #1A1A1A;
    --ds-button-bg: #FFFFFF;
    --expression-input-dirty-background-color: var(--ds-button-bg);
    --expression-input-dirty-border-color: var(--ds-tertiary);
    --expression-input-dirty-color: var(--ds-highlight);
    --expression-input-active-color: var(--ds-tertiary);
    --expression-input-active-background-color: var(--ds-secondary);
  }
  .gjs-traits-label {
    font-family: "Ubuntu", sans-serif;
    font-size: 0.85rem;
    padding: 9px 10px 9px 20px;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  expression-input {
    padding: 10px;
    display: block;
  }
  expression-input::part(separator__delete) {
    border-right: 1px solid var(--ds-button-border);
    height: 20px;
  }
  expression-input::part(add-button) {
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    padding: 3px;
    margin: 0;
    border: 1px solid var(--ds-tertiary);
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    cursor: pointer;
  }
  expression-input::part(delete-button) {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    color: var(--ds-button);
  }
  expression-input::part(header) {
    border: none;
  }
  expression-input::part(type) {
    padding-bottom: 0;
    padding-top: 4px;
    display: none;
  }
  expression-input::part(name) {
    font-weight: normal;
    padding-bottom: 0;
    padding-top: 0;
    padding-left: 5px;
  }
  expression-input::part(property-input) {
    padding: 4px;
    border: medium;
    flex: 1 1 auto;
    background-color: transparent;
    color: var(--ds-secondary);
  }
  expression-input::part(property-container) {
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    box-sizing: border-box;
    padding: 5px;
    margin: 5px 0;
  }
  expression-input::part(scroll-container) {
    overflow: auto;
    box-sizing: border-box;

    /* inner shadow to make it visible when content is overflowing */
    box-shadow: inset 0 0 5px 0 rgba(0,0,0,.3);

  }
  expression-input::part(steps-container) {
    display: flex;
    align-items: center;
    background-color: var(--ds-button-bg);
    border-radius: 2px;
    padding: 5px;
    margin: 5px 0;
    width: max-content;
    min-width: 100%;
    box-sizing: border-box;
  }
  expression-input::part(dirty-icon) {
    cursor: pointer;
    margin: 0 10px;
    color: var(--ds-highlight);
  }
  expression-input::part(dirty-icon) {
    color: var(--ds-highlight);
    vertical-align: bottom;
    display: inline-flex;
    margin: 0;
    margin-left: 20px;
  }
  expression-input::part(expression-input-item) {
    border: 1px solid var(--ds-tertiary);
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    margin-right: 5px;
  }
  .ds-section {
    &:last-child {
      margin-bottom: 100px;
    }
    details {
      margin: 2px;
      padding: 10px;
      padding-top: 0;
      background-color: transparent;
      border-radius: 2px;
      color: var(--ds-secondary);
      text-align: left;
    }
    details[open] {
      background-color: var(--ds-tertiary);
    }
    details summary {
      color: var(--ds-secondary);
      cursor: pointer;
      padding: 10px 0;
    }
    details a {
      color: var(--ds-link-color);
    }
    details .ds-states__help-link {
      display: block;
    }
    .gjs-traits-label {
      background-color: var(--ds-tertiary);
    }
    main {
      display: flex;
      flex-direction: column;
    }
    .ds-slot-fixed {
      width: 100%;
    }
    select {
      width: 150px;
      flex: 0;
      margin: 5px;
      padding: 5px;
      background-color: var(--ds-button-bg);
      border-radius: 2px;
      color: var(--ds-secondary);
      border: 1px solid var(--ds-tertiary);
      cursor: pointer;
      font-size: medium;
    }
    input.ds-expression-input__fixed {
      color: var(--ds-secondary);
      padding: 10px;
      border: none;
      background-color: transparent;
      width: 100%;
      box-sizing: border-box;
    }
    .ds-expression-input__add {
      max-width: 40px;
      text-align: center;
      font-size: large;
      padding-right: 9px;
      -webkit-appearance: none;
      -moz-appearance: none;
      text-indent: 1px;
      text-overflow: '';
    }
    .ds-expression-input__add option {
      font-size: medium;
    }
    .ds-expression-input__options-button {
      background-color: transparent;
      border: none;
      color: var(--ds-secondary);
      cursor: pointer;
      padding: 0;
      margin: 10px;
      margin-left: 0;
    }
    label.ds-label {
      display: flex;
      align-items: center;
      padding: 10px;
      color: var(--ds-secondary);
    }
    label.ds-label--disabled {
      justify-content: space-between;
    }
    label.ds-label--disabled .ds-label__message {
      opacity: .5;
    }
    select.ds-visibility__condition-operator {
      margin: 10px;
    }
  }
  /* States CSS Styles */
  .ds-states {
    display: flex;
    flex-direction: column;
  }
    .ds-states__buttons {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin: 0 5px;
    }
    .ds-states__button {
      cursor: pointer;
      border: 1px solid var(--ds-button-border);
      border-radius: 2px;
      padding: 5px;
      background: var(--ds-button-bg);
      color: var(--ds-button-color);
      flex: 1;
      margin: 5px;
      max-width: 40px;
    }
    .ds-states__button--disabled {
      opacity: 0.5;
      cursor: default;
    }
    .ds-states__remove-button {
      margin-left: 1em;
    }
    .ds-states__sep {
      width: 100%;
      border: none;
      height: 1px;
      background: var(--ds-button-bg);
    }
  /* real data */
  .ds-real-data {
    code {
      overflow: hidden;
      text-wrap: nowrap;
      display: block;
      padding: 0 10px;
      text-overflow: ellipsis;
      margin-top: -5px;
      margin-bottom: 10px;
      text-align: right;
    }
  }
`
