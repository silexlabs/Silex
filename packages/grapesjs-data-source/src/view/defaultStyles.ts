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
    border: 1px solid rgba(0,0,0,.15);
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
`
export const PROPERTY_STYLES = `
  :root {
    --ds-primary: #d278c9;
    --ds-secondary: #ddd;
    --ds-tertiary: #3d3d3d;
    --ds-highlight: #d278c9;
    --ds-button-color: #ddd;
    --ds-button-bg: rgba(255,255,255,.15);
    --ds-button-border: rgba(255,255,255,.15);

    --expression-input-dirty-background-color: rgba(0,0,0,.2);
    --expression-input-dirty-border-color: rgba(0,0,0,.2);
    --expression-input-dirty-color: #d278c9;
    --expression-input-active-color: #ddd;
    --expression-input-active-background-color: rgba(255,255,255,.15);
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
  expression-input {
    padding: 10px;
    display: block;
  }
  expression-input::part(separator__delete) {
    border-right: 1px solid var(--ds-button-border);
    height: 20px;
  }
  expression-input::part(add-button) {
    background-color: rgba(255,255,255,.15);
    border-radius: 2px;
    padding: 3px;
    margin: 0;
    border: 1px solid rgba(0,0,0,.15);
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
    background-color: rgba(0,0,0,.2);
    border-radius: 2px;
    box-sizing: border-box;
    padding: 5px;
    margin: 5px 0;
  }
  expression-input::part(scroll-container) {
    overflow: auto;
    box-sizing: border-box;

    /* inner shadow to make it visible when content is overflowing */
    box-shadow: inset 0 0 5px 0 rgba(0,0,0,.2);

  }
  expression-input::part(steps-container) {
    display: flex;
    align-items: center;
    background-color: rgba(0,0,0,.2);
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
  }
  expression-input::part(expression-input-item) {
    border: 1px solid rgba(0,0,0,.15);
    background-color: rgba(255,255,255,.15);
    border-radius: 2px;
    margin-right: 5px;
  }
  .ds-section details {
    margin: 10px;
    padding: 10px;
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    color: var(--ds-secondary);
    text-align: left;
  }
  .ds-section details summary {
    color: var(--ds-secondary);
    cursor: pointer;
  }
  .ds-section details a {
    color: var(--ds-link-color);
  }
  .ds-section .gjs-traits-label {
    background-color: var(--ds-tertiary);
  }
  .ds-section main {
    display: flex;
    flex-direction: column;
  }
  .ds-slot-fixed {
    width: 100%;
  }
  .ds-section select {
    width: 150px;
    flex: 0;
    margin: 5px;
    padding: 5px;
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    color: var(--ds-secondary);
    border: 1px solid rgba(0,0,0,.15);
    cursor: pointer;
  }
  .ds-section input.ds-expression-input__fixed {
    color: var(--ds-secondary);
    padding: 10px;
    border: none;
    background-color: transparent;
    width: 100%;
  }
  .ds-section .ds-expression-input__add {
    max-width: 40px;
    text-align: center;
    font-size: large;
    padding-right: 9px;
    -webkit-appearance: none;
    -moz-appearance: none;
    text-indent: 1px;
    text-overflow: '';
  }
  .ds-section .ds-expression-input__options-button {
    background-color: transparent;
    border: none;
    color: var(--ds-secondary);
    cursor: pointer;
    padding: 0;
    margin: 10px;
    margin-left: 0;
  }
  .ds-section label.ds-label {
    display: flex;
    align-items: center;
    padding: 10px;
    color: var(--ds-secondary);
  }
  .ds-section label.ds-label--disabled {
    justify-content: space-between;
  }
  .ds-section label.ds-label--disabled .ds-label__message {
    opacity: .5;
  }
  /* States CSS Styles */
  .ds-states {
    display: flex;
    flex-direction: column;
  }
  .ds-states__buttons {
    display: flex;
    flex-direction: row;
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
  }
  .ds-states__button--disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ds-states__remove-button {
    margin-left: 1em;
  }
  .ds-states__add-button {
    margin: 10px;
    margin-bottom: 30px;
  }
  .ds-states__sep {
    width: 100%;
    border: none;
    height: 1px;
    background: var(--ds-button-bg);
  }
`