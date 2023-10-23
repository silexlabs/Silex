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
    align-items: flex-start;
    padding: 5px;
    color: var(--ds-tertiary);
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

    --steps-selector-dirty-background-color: rgba(0,0,0,.2);
    --steps-selector-dirty-border-color: rgba(0,0,0,.2);
    --steps-selector-dirty-color: #d278c9;
    --steps-selector-active-color: #ddd;
    --steps-selector-active-background-color: rgba(255,255,255,.15);
    --popin-dialog-background: var(--ds-secondary);
    --popin-dialog-color: var(--ds-tertiary);
    --popin-dialog-header-background: transparent;
    --popin-dialog-body-background: transparent;
    --popin-dialog-footer-background: transparent;
    --steps-selector-placeholder-margin: 0 10px;
    --steps-selector-item-button-margin: 0;
    --steps-selector-item-button-padding: 2px;
    --steps-selector-item-button-border-radius: 50%;
    --steps-selector-item-button-width: 20px;
    --steps-selector-item-button-height: 20px;
    --steps-selector-item-button-background-color: transparent;
    --steps-selector-item-button-color: var(--ds-button-color);
    --steps-selector-separator-color: var(--ds-button-color);
    --steps-selector-separator-font-size: 0.7em;
    --steps-selector-separator-margin: 0;
    --steps-selector-separator-padding: 0 3px 0 1px;
    --steps-selector-item-arrow-padding: 5px 5px 0 5px;
    --steps-selector-values-li-icon-margin-right: 0;
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
    height: 20px;
  }
  steps-selector::part(add-button) {
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
  .test {
    display: flex;
    align-items: center;
    background: red !important;
  }
  steps-selector::part(delete-button) {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    color: var(--ds-button);
  }
  steps-selector::part(header) {
    border: none;
  }
  steps-selector::part(type) {
    padding-bottom: 0;
    padding-top: 4px;
    display: none;
  }
  steps-selector::part(name) {
    font-weight: normal;
    padding-bottom: 0;
    padding-top: 0;
    padding-left: 5px;
  }
  steps-selector::part(property-input) {
    padding: 4px;
    border: medium;
    flex: 1 1 auto;
    background-color: transparent;
    color: var(--ds-secondary);
  }
  steps-selector::part(property-container) {
    background-color: rgba(0,0,0,.2);
    border-radius: 2px;
    box-sizing: border-box;
    padding: 5px;
    margin: 5px 0;
  }
  steps-selector::part(scroll-container) {
    overflow: auto;
    box-sizing: border-box;

    /* inner shadow to make it visible when content is overflowing */
    box-shadow: inset 0 0 5px 0 rgba(0,0,0,.2);

  }
  steps-selector::part(steps-container) {
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
  steps-selector::part(steps-selector-item) {
    border: 1px solid rgba(0,0,0,.15);
    background-color: rgba(255,255,255,.15);
    border-radius: 2px;
    margin-right: 5px;
  }
  steps-selector::part(steps-selector-item__add) {
  }
  .ds-section .gjs-traits-label {
    background-color: var(--ds-tertiary);
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
`